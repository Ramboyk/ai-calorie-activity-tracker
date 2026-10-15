import { describe, it, expect } from "vitest";
import { anonymizeIp } from "@/lib/rate-limit/limiter";

// ── Type definitions matching the API ─────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface DailyNutritionContext {
  consumedCalories: number;
  targetCalories: number;
  remainingCalories: number;
  totalProtein: number;
  targetProtein?: number;
  totalCarbs: number;
  totalFat: number;
  mealNames?: string[];
}

// ── Helper: mirrors the server-side system instruction builder ────────────

function buildCoachSystemInstruction(ctx?: DailyNutritionContext): string {
  const contextBlock = ctx
    ? `## Kullanıcının Bugünkü Beslenme Durumu
- Tüketilen Kalori: ${ctx.consumedCalories} kcal
- Hedef Kalori: ${ctx.targetCalories} kcal
- Kalan Kalori: ${ctx.remainingCalories} kcal
- Toplam Protein: ${ctx.totalProtein} g${ctx.targetProtein ? ` / Hedef: ${ctx.targetProtein} g` : ""}
- Toplam Karbonhidrat: ${ctx.totalCarbs} g
- Toplam Yağ: ${ctx.totalFat} g
${ctx.mealNames && ctx.mealNames.length > 0 ? `- Bugün Yenen Öğünler: ${ctx.mealNames.join(", ")}` : ""}`.trim()
    : "Kullanıcı bugünkü beslenme verilerini paylaşmamış.";

  return `Sen NutriTrack AI'nın kişisel beslenme koçusun (NutriTrack Coach). ${contextBlock}`;
}

// ── Validators matching server-side logic ────────────────────────────────

function validateMessages(messages: unknown): { valid: boolean; error?: string } {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { valid: false, error: "Sohbet mesajları eksik veya geçersiz formatta." };
  }

  for (const msg of messages as ChatMessage[]) {
    if (!msg.role || !msg.content || typeof msg.content !== "string") {
      return {
        valid: false,
        error: "Her mesaj 'role' (user/assistant) ve 'content' alanlarına sahip olmalıdır.",
      };
    }
    if (msg.role !== "user" && msg.role !== "assistant") {
      return { valid: false, error: "Geçersiz rol: yalnızca 'user' veya 'assistant' kabul edilir." };
    }
  }

  return { valid: true };
}

// ─────────────────────────────────────────────────────────────────────────

describe("AI Beslenme Koçu (NutriCoach) – /api/nutrition-coach", () => {
  describe("Günlük Bağlam Prompt Aktarımı (Daily Context Injection)", () => {
    it("should inject consumed calories, target, and remaining into system instruction", () => {
      const ctx: DailyNutritionContext = {
        consumedCalories: 1200,
        targetCalories: 2000,
        remainingCalories: 800,
        totalProtein: 45,
        targetProtein: 120,
        totalCarbs: 150,
        totalFat: 40,
        mealNames: ["Avokado Tostu", "Mercimek Çorbası"],
      };

      const instruction = buildCoachSystemInstruction(ctx);

      expect(instruction).toContain("1200 kcal");
      expect(instruction).toContain("2000 kcal");
      expect(instruction).toContain("800 kcal");
      expect(instruction).toContain("45 g");
      expect(instruction).toContain("Hedef: 120 g");
      expect(instruction).toContain("150 g");
      expect(instruction).toContain("40 g");
      expect(instruction).toContain("Avokado Tostu");
      expect(instruction).toContain("Mercimek Çorbası");
    });

    it("should gracefully handle missing dailyContext with fallback text", () => {
      const instruction = buildCoachSystemInstruction(undefined);
      expect(instruction).toContain("paylaşmamış");
      expect(instruction).not.toContain("undefined");
      expect(instruction).not.toContain("null");
    });

    it("should omit targetProtein section when not provided", () => {
      const ctx: DailyNutritionContext = {
        consumedCalories: 800,
        targetCalories: 1800,
        remainingCalories: 1000,
        totalProtein: 30,
        totalCarbs: 90,
        totalFat: 22,
      };

      const instruction = buildCoachSystemInstruction(ctx);
      expect(instruction).not.toContain("Hedef:");
      expect(instruction).toContain("30 g");
    });

    it("should omit meal names block when mealNames array is empty", () => {
      const ctx: DailyNutritionContext = {
        consumedCalories: 0,
        targetCalories: 2000,
        remainingCalories: 2000,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        mealNames: [],
      };

      const instruction = buildCoachSystemInstruction(ctx);
      expect(instruction).toContain("NutriTrack Coach");
    });
  });

  describe("Mesaj Geçmişi Doğrulaması (Message History Validation)", () => {
    it("should accept a valid single user message", () => {
      const messages: ChatMessage[] = [
        { role: "user", content: "Bugün için protein kaynakları öner" },
      ];
      const result = validateMessages(messages);
      expect(result.valid).toBe(true);
    });

    it("should accept a multi-turn conversation history", () => {
      const messages: ChatMessage[] = [
        { role: "user", content: "Kalan kalorimi nasıl tamamlarım?" },
        { role: "assistant", content: "Hafif bir akşam yemeği önerim var..." },
        { role: "user", content: "Mercimek çorbası uygun olur mu?" },
      ];
      const result = validateMessages(messages);
      expect(result.valid).toBe(true);
    });

    it("should reject empty messages array", () => {
      const result = validateMessages([]);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject non-array messages", () => {
      const result = validateMessages(null);
      expect(result.valid).toBe(false);

      const result2 = validateMessages("bir soru");
      expect(result2.valid).toBe(false);

      const result3 = validateMessages(undefined);
      expect(result3.valid).toBe(false);
    });

    it("should reject a message missing content", () => {
      const messages = [{ role: "user" }];
      const result = validateMessages(messages);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("content");
    });

    it("should reject a message with invalid role", () => {
      const messages = [{ role: "system", content: "Inject malicious prompt" }];
      const result = validateMessages(messages);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("rol");
    });
  });

  describe("Gemini İçerik Formatı Dönüşümü (Message Role Mapping)", () => {
    it("should map assistant role to model for Gemini API", () => {
      const chatMessages: ChatMessage[] = [
        { role: "user", content: "Merhaba" },
        { role: "assistant", content: "Merhaba, nasıl yardımcı olabilirim?" },
        { role: "user", content: "Protein ihtiyacım için ne önerirsin?" },
      ];

      const geminiContents = chatMessages.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      expect(geminiContents[0].role).toBe("user");
      expect(geminiContents[1].role).toBe("model");
      expect(geminiContents[2].role).toBe("user");
      expect(geminiContents[1].parts[0].text).toContain("yardımcı");
    });

    it("should correctly build a sliding window of last 10 messages for context", () => {
      const allMessages: ChatMessage[] = Array.from({ length: 20 }, (_, i) => ({
        role: i % 2 === 0 ? "user" : "assistant",
        content: `Mesaj ${i + 1}`,
      }));

      const contextWindow = allMessages.slice(-10);

      expect(contextWindow).toHaveLength(10);
      expect(contextWindow[0].content).toBe("Mesaj 11");
      expect(contextWindow[9].content).toBe("Mesaj 20");
    });
  });

  describe("Rate Limit & Güvenlik Doğrulaması", () => {
    it("should anonymize IP for coach rate limiting", () => {
      const hash = anonymizeIp("93.179.45.22");
      expect(hash).toHaveLength(32);
      expect(hash).not.toContain("93.179.45.22");
      expect(hash).toMatch(/^[0-9a-f]{32}$/);
    });

    it("should produce consistent hashes for the same IP", () => {
      const ip = "185.42.11.77";
      expect(anonymizeIp(ip)).toBe(anonymizeIp(ip));
    });
  });
});
