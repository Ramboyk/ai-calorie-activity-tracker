"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Container,
  Header,
  BottomNav,
} from "@/components";
import { useTracker } from "@/context";
import { cn } from "@/lib/utils/cn";
import {
  Bot,
  Sparkles,
  Send,
  Trash2,
  ArrowLeft,
  RefreshCw,
  KeyRound,
  ChevronDown,
  Zap,
  Salad,
  Smile,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface DailyContext {
  consumedCalories: number;
  targetCalories: number;
  remainingCalories: number;
  totalProtein: number;
  targetProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealNames: string[];
}

// ─── Constants ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "nutritrack_coach_messages_v1";
const MAX_STORED_MESSAGES = 50;

const QUICK_CHIPS = [
  {
    icon: Zap,
    label: "Kalan proteinimi nasıl tamamlarım?",
    color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25 hover:bg-amber-500/20",
  },
  {
    icon: Salad,
    label: "Akşam için hafif ve pratik bir tarif öner",
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/20",
  },
  {
    icon: Smile,
    label: "Tatlı krizini düşük kaloriyle nasıl aşarım?",
    color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25 hover:bg-rose-500/20",
  },
  {
    icon: BarChart3,
    label: "Bugünkü beslenmemi genel olarak değerlendir",
    color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/25 hover:bg-sky-500/20",
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function loadMessagesFromStorage(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_STORED_MESSAGES) : [];
  } catch {
    return [];
  }
}

function saveMessagesToStorage(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
  } catch {
    // Silently fail if localStorage is full
  }
}

function loadApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("nutritrack_custom_gemini_key") || "";
}

// Render assistant message with basic markdown (bold, bullet, code)
function renderMarkdown(text: string): string {
  return text
    // Bold: **text** → <strong>
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic: *text* → <em>
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code: `code` → <code>
    .replace(/`([^`]+)`/g, '<code class="bg-surface-container px-1 py-0.5 rounded text-[11px] font-mono">$1</code>')
    // Numbered list items: 1. item
    .replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Bullet list items: - item or • item
    .replace(/^[-•]\s+(.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Wrap consecutive <li> items
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul class="space-y-1 my-2">${match}</ul>`)
    // Line breaks: double newline → paragraph break
    .replace(/\n\n/g, "</p><p class=\"mt-2\">")
    // Single newline → <br>
    .replace(/\n/g, "<br>");
}

// ─── Main Page Component ────────────────────────────────────────────────────

export default function CoachPage() {
  const tracker = useTracker();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isScrolledUp, setIsScrolledUp] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Build daily context from TrackerContext ──
  const dailyContext: DailyContext = (() => {
    const nutrition = tracker.getDailyNutrition(tracker.selectedDate);
    const meals = tracker.getMealsForDate(tracker.selectedDate);

    return {
      consumedCalories: nutrition.consumedCalories,
      targetCalories: nutrition.calorieGoal,
      remainingCalories: Math.max(0, nutrition.remainingCalories),
      totalProtein: nutrition.totalProtein,
      targetProtein: tracker.macroGoals.protein,
      totalCarbs: nutrition.totalCarbs,
      totalFat: nutrition.totalFat,
      mealNames: meals.map((m) => m.name).filter(Boolean),
    };
  })();

  // ── Load persisted messages on mount ──
  useEffect(() => {
    const stored = loadMessagesFromStorage();
    if (stored.length > 0) {
      setMessages(stored);
    } else {
      // Welcome message from the coach
      const welcome: ChatMessage = {
        id: `coach_welcome_${Date.now()}`,
        role: "assistant",
        content:
          "Merhaba! 👋 Ben **NutriCoach**, kişisel AI beslenme koçun.\n\nBugünkü beslenme verilerine bakıyorum... Sana özel tarifler, makro tamamlama stratejileri ve pratik tüyolar sunabilirim.\n\nNe hakkında konuşmak istersin? Aşağıdaki hızlı seçeneklerden birini kullanabilir veya dilediğin soruyu yazabilirsin! 🌟",
        timestamp: Date.now(),
      };
      setMessages([welcome]);
    }
    setCustomApiKey(loadApiKey());
  }, []);

  // ── Persist messages to localStorage on change ──
  useEffect(() => {
    if (messages.length > 0) {
      saveMessagesToStorage(messages);
    }
  }, [messages]);

  // ── Auto-scroll to bottom ──
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    if (!isScrolledUp) {
      scrollToBottom();
    }
  }, [messages, isLoading, isScrolledUp, scrollToBottom]);

  // ── Scroll detection for "scroll to bottom" button ──
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsScrolledUp(distFromBottom > 100);
  }, []);

  // ── Auto-resize textarea ──
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  // ── Copy message content ──
  const handleCopy = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard not available
    }
  };

  // ── Clear conversation ──
  const handleClearChat = () => {
    const welcome: ChatMessage = {
      id: `coach_welcome_${Date.now()}`,
      role: "assistant",
      content:
        "Sohbet temizlendi. 🌟 Yeni bir konuşmaya başlamak için hazırım! Ne öğrenmek veya planlamak istersin?",
      timestamp: Date.now(),
    };
    setMessages([welcome]);
    localStorage.removeItem(STORAGE_KEY);
    setError(null);
  };

  // ── Send message to API ──
  const sendMessage = useCallback(
    async (userText: string) => {
      const trimmed = userText.trim();
      if (!trimmed || isLoading) return;

      setError(null);

      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInputValue("");
      setIsLoading(true);
      setIsScrolledUp(false);

      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (customApiKey?.trim()) {
          headers["x-gemini-key"] = customApiKey.trim();
        }

        // Build payload: include last 10 messages for context window
        const recentMessages = updatedMessages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/nutrition-coach", {
          method: "POST",
          headers,
          body: JSON.stringify({
            messages: recentMessages,
            dailyContext,
          }),
        });

        const resJson = await res.json();

        if (!res.ok || !resJson.success) {
          const msg =
            resJson.error?.message || "Koçunuz şu anda yanıt veremiyor. Lütfen tekrar deneyin.";
          setError(msg);
          return;
        }

        const assistantMsg: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: resJson.data.reply,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Sunucuya bağlanırken bir hata oluştu. İnternet bağlantınızı kontrol edin.";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, customApiKey, dailyContext]
  );

  const handleSend = () => sendMessage(inputValue);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChipClick = (label: string) => {
    sendMessage(label);
  };

  // ── Calorie badge shorthand ──
  const proteinGap = Math.max(0, dailyContext.targetProtein - dailyContext.totalProtein);

  return (
    <div className="min-h-screen flex flex-col bg-surface text-app-text-main antialiased selection:bg-primary-light selection:text-primary">
      <Header />

      <main className="flex-1 w-full flex flex-col pt-0 pb-20 md:pb-6 overflow-hidden">
        <Container className="max-w-3xl flex-1 flex flex-col h-full min-h-0">

          {/* ── Page Header ── */}
          <div className="flex items-center justify-between py-4 sm:py-5 shrink-0">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-app-text-muted hover:text-app-text-main transition-colors px-2 py-1 rounded-lg hover:bg-surface-container"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary-soft to-emerald-500/15 text-primary flex items-center justify-center shadow-xs border border-primary/15">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-extrabold text-app-text-main leading-tight">
                    NutriCoach AI
                  </h1>
                  <p className="text-[11px] text-app-text-muted">
                    Kişisel Beslenme Koçun • Gemini 3.6 Flash
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* API Key Status */}
              <Link
                href="/analyze"
                title="API Anahtarı Ayarları için Analiz Sayfasına Git"
                className={cn(
                  "hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-bold transition-all",
                  customApiKey
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                )}
              >
                <KeyRound className="w-3 h-3" />
                <span>{customApiKey ? "API Aktif" : "API Ekle"}</span>
              </Link>

              {/* Clear Chat */}
              <button
                type="button"
                onClick={handleClearChat}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-surface-container bg-surface-container-low hover:bg-surface-container text-app-text-muted hover:text-app-error text-[11px] font-semibold transition-all"
                title="Sohbeti Temizle"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Temizle</span>
              </button>
            </div>
          </div>

          {/* ── Daily Context Status Badge ── */}
          <div className="shrink-0 mb-3">
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-primary-soft via-surface-container-low to-surface-container border border-primary/15 shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bugün:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest border border-surface-container text-[11px] font-semibold text-app-text-main">
                  🔥 {dailyContext.consumedCalories.toLocaleString("tr-TR")} / {dailyContext.targetCalories.toLocaleString("tr-TR")} kcal
                </span>
                <span className={cn(
                  "px-2.5 py-1 rounded-full border text-[11px] font-semibold",
                  dailyContext.remainingCalories > 0
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-400"
                )}>
                  {dailyContext.remainingCalories > 0
                    ? `✅ Kalan: ${dailyContext.remainingCalories} kcal`
                    : `⚠️ Aşım: ${Math.abs(dailyContext.remainingCalories)} kcal`}
                </span>
                {proteinGap > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-[11px] font-semibold">
                    💪 Eksik Protein: {proteinGap.toFixed(0)}g
                  </span>
                )}
                {dailyContext.mealNames.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-700 dark:text-sky-400 text-[11px] font-semibold">
                    🍽️ {dailyContext.mealNames.length} öğün
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Messages Container ── */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-0.5 scroll-smooth"
            style={{ scrollbarWidth: "thin" }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex animate-fade-in",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {/* Assistant avatar */}
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-soft to-emerald-500/15 border border-primary/15 text-primary flex items-center justify-center shrink-0 mr-2 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={cn("group max-w-[82%] sm:max-w-[75%]")}>
                  <div
                    className={cn(
                      "px-4 py-3 rounded-3xl text-sm leading-relaxed shadow-xs",
                      msg.role === "user"
                        ? "bg-primary text-white rounded-br-lg font-medium"
                        : "bg-surface-container-lowest border border-surface-container text-app-text-main rounded-bl-lg"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <p
                        className="leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: `<p>${renderMarkdown(msg.content)}</p>`,
                        }}
                      />
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>

                  {/* Actions row */}
                  <div className={cn(
                    "flex items-center gap-1.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
                    msg.role === "user" ? "justify-end" : "justify-start pl-1"
                  )}>
                    <span className="text-[10px] text-app-text-muted tabular-nums">
                      {new Date(msg.timestamp).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {msg.role === "assistant" && (
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-app-text-muted hover:text-app-text-main hover:bg-surface-container transition-colors"
                        title="Kopyala"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-primary" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-soft to-emerald-500/15 border border-primary/15 text-primary flex items-center justify-center shrink-0 mr-2 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="bg-surface-container-lowest border border-surface-container rounded-3xl rounded-bl-lg px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "300ms" }} />
                    <span className="text-[11px] text-app-text-muted ml-1 font-medium">NutriCoach düşünüyor...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 text-app-error text-xs animate-fade-in"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Yanıt Alınamadı</p>
                  <p className="text-[11px] leading-relaxed">{error}</p>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="text-[11px] font-bold underline underline-offset-2 hover:no-underline mt-1"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom floating button */}
          {isScrolledUp && (
            <div className="flex justify-center shrink-0 -mb-2">
              <button
                type="button"
                onClick={() => { scrollToBottom(); setIsScrolledUp(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold shadow-md shadow-primary/30 hover:bg-primary-hover transition-all active:scale-95"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Aşağı kaydır</span>
              </button>
            </div>
          )}

          {/* ── Quick Chips ── */}
          <div className="shrink-0 mt-3 mb-2">
            <div className="flex flex-wrap gap-2">
              {QUICK_CHIPS.map((chip) => {
                const Icon = chip.icon;
                return (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleChipClick(chip.label)}
                    disabled={isLoading}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-[11px] sm:text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
                      chip.color
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Input Area ── */}
          <div className="shrink-0 mt-1">
            <div className="flex items-end gap-2 p-2 sm:p-3 rounded-3xl bg-surface-container-lowest border border-surface-container shadow-card focus-within:border-primary/40 focus-within:shadow-md transition-all">
              <textarea
                ref={inputRef}
                id="coach-message-input"
                rows={1}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Bugün için bir sorum var... (Enter ile gönder, Shift+Enter yeni satır)"
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm text-app-text-main placeholder:text-app-text-muted/60 focus:outline-none resize-none leading-relaxed py-1 px-1 min-h-[36px] max-h-[140px] disabled:opacity-60"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                aria-label="Mesaj Gönder"
                className={cn(
                  "w-10 h-10 min-w-[40px] rounded-2xl flex items-center justify-center transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0",
                  inputValue.trim() && !isLoading
                    ? "bg-primary text-white shadow-sm shadow-primary/30 hover:bg-primary-hover"
                    : "bg-surface-container text-app-text-muted cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-app-text-muted/70 text-center mt-1.5">
              NutriCoach tahmini bilgiler sunar • Sağlık kararları için doktorunuza danışın
            </p>
          </div>
        </Container>
      </main>

      <BottomNav />
    </div>
  );
}
