"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Volume2,
  Edit3,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { MealType, GeminiMealAnalysisResult } from "@/types/meal";
import { cn } from "@/lib/utils/cn";

export interface VoiceMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType;
  customApiKey?: string;
  onSuccess: (result: GeminiMealAnalysisResult, transcript: string) => void;
}

// Browser Web Speech API SpeechRecognition interface types
interface IWindowSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

const SAMPLE_VOICE_PHRASES = [
  "1 tabak kuru fasulye, 4 kaşık bulgur pilavı ve bir bardak ayran",
  "Sabah 2 haşlanmış yumurta, 5 zeytin, 1 dilim peynir ve 2 dilim kepek ekmeği",
  "1 porsiyon ızgara tavuk göğsü, çoban salatası ve bir şişe maden suyu",
  "1 kase mercimek çorbası ve 1 dilim tam buğday ekmeği",
];

export function VoiceMealModal({
  isOpen,
  onClose,
  mealType,
  customApiKey,
  onSuccess,
}: VoiceMealModalProps) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [interimText, setInterimText] = useState<string>("");
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");

  // Keep transcriptRef synchronized with transcript state
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Check Web Speech API support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as unknown as IWindowSpeech;
      const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechClass));
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Recognition might already be stopped
      }
    }
    setIsListening(false);
    setInterimText("");
  }, []);

  // Cleanup on modal unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setTranscript("");
      setInterimText("");
      setErrorMessage(null);
      setPermissionDenied(false);
      setIsAnalyzing(false);
    }
  }, [isOpen, stopListening]);

  const startListening = () => {
    if (typeof window === "undefined") return;
    const win = window as unknown as IWindowSpeech;
    const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechClass) {
      setIsSupported(false);
      return;
    }

    setErrorMessage(null);
    setPermissionDenied(false);

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "tr-TR";

      recognition.onstart = () => {
        setIsListening(true);
        setPermissionDenied(false);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = "";
        let finalChunk = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalChunk += item[0].transcript + " ";
          } else {
            currentInterim += item[0].transcript;
          }
        }

        if (finalChunk) {
          setTranscript((prev) => (prev ? `${prev.trim()} ${finalChunk.trim()}` : finalChunk.trim()));
        }
        setInterimText(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn("[NutriTrack AI] Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setPermissionDenied(true);
          setErrorMessage(
            "Mikrofon erişimi engellendi. Lütfen tarayıcı adres çubuğundaki kilit simgesinden mikrofon iznini etkinleştirin veya metni doğrudan elle yazın."
          );
        } else if (event.error === "no-speech") {
          // Normal timeout when user is silent; no need to panic
        } else if (event.error !== "aborted") {
          setErrorMessage(`Ses tanıma uyarısı: ${event.error}. Dilerseniz elle yazarak devam edebilirsiniz.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText("");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: unknown) {
      console.error("[NutriTrack AI] Speech recognition start error:", err);
      setIsListening(false);
      setErrorMessage(
        "Ses tanıma servisi başlatılamadı. Lütfen metni doğrudan kutucuğa yazınız."
      );
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleAnalyze = async () => {
    const combined = `${transcript} ${interimText}`.trim();
    if (!combined) {
      setErrorMessage("Lütfen önce ne yediğinizi konuşun veya metin kutusuna yazın.");
      return;
    }

    if (isListening) {
      stopListening();
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (customApiKey?.trim()) {
        headers["x-gemini-key"] = customApiKey.trim();
      }

      const res = await fetch("/api/analyze-voice-meal", {
        method: "POST",
        headers,
        body: JSON.stringify({
          transcript: combined,
          mealType,
        }),
      });

      const resJson = await res.json();

      if (!res.ok || !resJson.success) {
        const msg =
          resJson.error?.message ||
          "Yapay zekâ sesli öğünü çözümleyemedi. Lütfen tekrar deneyin.";
        setErrorMessage(msg);
        return;
      }

      onSuccess(resJson.data, combined);
      onClose();
    } catch (err: unknown) {
      console.error("[NutriTrack AI] Voice analyze error:", err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Sunucuya bağlanırken bir hata oluştu. Lütfen bağlantınızı kontrol edin."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectSamplePhrase = (phrase: string) => {
    setTranscript(phrase);
    setInterimText("");
    setErrorMessage(null);
  };

  const handleClearTranscript = () => {
    setTranscript("");
    setInterimText("");
    setErrorMessage(null);
  };

  if (!isOpen) return null;

  const currentDisplay = (
    transcript + (interimText ? (transcript ? ` ${interimText}` : interimText) : "")
  ).trim();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-meal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-surface-container-lowest border border-surface-container shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-surface-container flex items-center justify-between bg-surface-container-low/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="voice-meal-modal-title"
                className="text-sm sm:text-base font-extrabold text-app-text-main flex items-center gap-2"
              >
                <span>Sesle Anlat (Voice-to-Meal AI)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-soft text-primary border border-primary/20">
                  Gemini 3.6 Flash
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-app-text-muted">
                Türkçe konuşarak yediklerinizi anlatın, yapay zekâ porsiyon ve kalorileri çıkarsın.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-app-text-muted hover:text-app-text-main hover:bg-surface-container transition-colors"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Permission Denied Alert Banner */}
          {permissionDenied && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-900 dark:text-amber-200 text-xs space-y-1.5 animate-fade-in"
            >
              <div className="flex items-start gap-2.5 font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>Mikrofon İzni Gerekli</span>
              </div>
              <p className="text-[11px] leading-relaxed text-app-text-muted">
                Tarayıcınızın adres çubuğundaki kilit simgesine tıklayıp mikrofona <strong>&quot;İzin Ver&quot;</strong> seçeneğini seçebilirsiniz. Dilerseniz konuşmak yerine yediklerinizi aşağıdaki kutucuğa doğrudan yazarak da analiz ettirebilirsiniz.
              </p>
            </div>
          )}

          {/* Web Speech Unsupported Alert Banner */}
          {!isSupported && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-900 dark:text-sky-200 text-xs space-y-1 animate-fade-in"
            >
              <div className="flex items-start gap-2 font-bold">
                <Volume2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <span>Metinle Yazma Modu Devrede</span>
              </div>
              <p className="text-[11px] text-app-text-muted leading-relaxed">
                Kullandığınız tarayıcı doğrudan ses tanımayı desteklemiyor. Yediklerinizi aşağıdaki metin kutusuna yazarak yapay zekâ ile anında çözümleyebilirsiniz.
              </p>
            </div>
          )}

          {/* General Error Banner */}
          {errorMessage && !permissionDenied && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-app-error text-xs flex items-start gap-2.5 animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 text-app-error shrink-0 mt-0.5" />
              <div className="flex-1 space-y-0.5">
                <p className="font-bold">İşlem Tamamlanamadı</p>
                <p className="text-[11px] leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Animated Waveform & Center Microphone Section */}
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            {/* Microphone Circle with Concentric Rings */}
            <div className="relative flex items-center justify-center">
              {/* Pulsing ambient rings when listening */}
              {isListening && (
                <>
                  <div className="absolute w-36 h-36 rounded-full bg-emerald-500/15 animate-ping" />
                  <div className="absolute w-28 h-28 rounded-full bg-emerald-500/25 animate-pulse" />
                </>
              )}

              <button
                type="button"
                onClick={handleToggleListening}
                disabled={!isSupported || isAnalyzing}
                className={cn(
                  "relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 cursor-pointer",
                  isListening
                    ? "bg-gradient-to-tr from-rose-500 to-rose-600 text-white scale-105 shadow-rose-500/40 ring-4 ring-rose-400/30 animate-pulse"
                    : isSupported
                    ? "bg-gradient-to-tr from-emerald-600 via-primary to-teal-600 text-white hover:scale-105 shadow-primary/30"
                    : "bg-surface-container text-app-text-muted cursor-not-allowed"
                )}
                title={
                  isListening
                    ? "Dinlemeyi Durdur"
                    : isSupported
                    ? "Dinlemeyi Başlat (Konuşun)"
                    : "Ses tanıma bu tarayıcıda desteklenmiyor"
                }
              >
                {isListening ? (
                  <MicOff className="w-8 h-8 sm:w-10 sm:h-10 transition-transform active:scale-95" />
                ) : (
                  <Mic className="w-8 h-8 sm:w-10 sm:h-10 transition-transform active:scale-95" />
                )}
              </button>
            </div>

            {/* Pulsing Sound Waves Visualizer */}
            {isListening ? (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-1.5 h-10 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 animate-fade-in"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping mr-1" />
                <span className="text-xs font-bold">Canlı Dinleniyor (tr-TR):</span>
                {/* 7 Animated Waveform bars */}
                <div className="flex items-end gap-1 h-6">
                  <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_0.8s_ease-in-out_infinite] h-3" />
                  <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_0.6s_ease-in-out_infinite_0.1s] h-5" />
                  <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_0.9s_ease-in-out_infinite_0.2s] h-4" />
                  <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_0.7s_ease-in-out_infinite_0.3s] h-6" />
                  <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_0.8s_ease-in-out_infinite_0.15s] h-4" />
                  <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_0.6s_ease-in-out_infinite_0.25s] h-5" />
                  <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_0.9s_ease-in-out_infinite_0.05s] h-3" />
                </div>
              </div>
            ) : (
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-app-text-main">
                  {isSupported
                    ? "Butona dokunarak konuşmaya başlayın"
                    : "Yediklerinizi metin olarak yazın"}
                </p>
                <p className="text-[11px] text-app-text-muted">
                  Örnek: &quot;Bir tabak kuru fasulye, 4 kaşık bulgur pilavı ve bir bardak ayran&quot;
                </p>
              </div>
            )}
          </div>

          {/* Real-time Transcription & Editable Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="voice-transcript-input"
                className="text-xs font-bold text-app-text-main flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-primary" />
                <span>Konuşulan / Düzenlenebilir Metin:</span>
              </label>

              {currentDisplay && (
                <button
                  type="button"
                  onClick={handleClearTranscript}
                  className="inline-flex items-center gap-1 text-[11px] text-app-text-muted hover:text-app-error transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Temizle</span>
                </button>
              )}
            </div>

            <div className="relative">
              <textarea
                id="voice-transcript-input"
                rows={3}
                value={currentDisplay}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  setInterimText("");
                }}
                placeholder={
                  isListening
                    ? "Konuşmanız buraya gerçek zamanlı dökülüyor..."
                    : "Konuşulan metin buraya dökülecek veya klavyenizle doğrudan yazabilirsiniz..."
                }
                className="w-full p-3.5 rounded-2xl bg-surface-container-low border border-surface-container text-xs sm:text-sm text-app-text-main placeholder:text-app-text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none font-medium leading-relaxed"
              />
              {interimText && (
                <span className="absolute bottom-2.5 right-3 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                  Alınıyor...
                </span>
              )}
            </div>
          </div>

          {/* Quick Turkish Inspiration Pills */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-app-text-muted block">
              Hızlı Örnek Seç veya Test Et:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_VOICE_PHRASES.map((phrase, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSamplePhrase(phrase)}
                  className="px-2.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-app-text-muted hover:text-app-text-main text-[11px] font-medium transition-colors text-left truncate max-w-full"
                >
                  &quot;{phrase}&quot;
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 sm:p-5 border-t border-surface-container bg-surface-container-low/30 flex flex-col sm:flex-row items-center gap-2.5">
          {/* Toggle Listening Button */}
          {isSupported && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleToggleListening}
              disabled={isAnalyzing}
              leftIcon={
                isListening ? (
                  <MicOff className="w-4 h-4 text-rose-500" />
                ) : (
                  <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )
              }
              className={cn(
                "w-full sm:w-auto font-bold text-xs",
                isListening
                  ? "border-rose-400 text-rose-600 hover:bg-rose-50"
                  : "bg-surface-container hover:bg-surface-container-high text-app-text-main"
              )}
            >
              {isListening ? "Dinlemeyi Durdur" : "Dinlemeyi Başlat"}
            </Button>
          )}

          {/* Submit / Analyze with Gemini Button */}
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleAnalyze}
            isLoading={isAnalyzing}
            disabled={!currentDisplay.trim() || isAnalyzing}
            leftIcon={<Sparkles className="w-4 h-4" />}
            className="w-full sm:flex-1 shadow-md shadow-primary/25 font-bold text-xs sm:text-sm"
          >
            {isAnalyzing ? "Yapay Zekâ Çözümlüyor..." : "Yapay Zekâ ile Çözümle"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default VoiceMealModal;
