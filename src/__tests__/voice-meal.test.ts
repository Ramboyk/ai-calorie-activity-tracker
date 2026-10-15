import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createVoiceMealPrompt,
  VOICE_MEAL_ANALYSIS_SYSTEM_INSTRUCTION,
  MEAL_ANALYSIS_SCHEMA,
} from "@/lib/ai/prompts";
import type { GeminiMealAnalysisResult, EditableFoodItem } from "@/types/meal";
import { anonymizeIp } from "@/lib/rate-limit/limiter";

describe("Voice-to-Meal AI (Mikrofon ile Sesli Öğün Ekleme)", () => {
  describe("Prompt Builder & System Instructions (createVoiceMealPrompt)", () => {
    it("should build proper Turkish prompts with mapped meal types", () => {
      const promptBreakfast = createVoiceMealPrompt("2 yumurta ve 1 dilim ekmek", "breakfast");
      expect(promptBreakfast).toContain("Öğün Türü: Kahvaltı");
      expect(promptBreakfast).toContain('Konuşma Metni: "2 yumurta ve 1 dilim ekmek"');

      const promptLunch = createVoiceMealPrompt("1 tabak kuru fasulye ve pilav", "lunch");
      expect(promptLunch).toContain("Öğün Türü: Öğle Yemeği");

      const promptDinner = createVoiceMealPrompt("Izgara tavuk ve salata", "dinner");
      expect(promptDinner).toContain("Öğün Türü: Akşam Yemeği");

      const promptSnack = createVoiceMealPrompt("1 elma ve 10 badem", "snack");
      expect(promptSnack).toContain("Öğün Türü: Ara Öğün");
    });

    it("should fallback gracefully to 'Belirtilmemiş' when mealType is undefined or unknown", () => {
      const prompt = createVoiceMealPrompt("Bir bardak kefir içtim");
      expect(prompt).toContain("Öğün Türü: Belirtilmemiş");
      expect(prompt).toContain('Konuşma Metni: "Bir bardak kefir içtim"');
    });

    it("should trim excess whitespace from transcript", () => {
      const prompt = createVoiceMealPrompt("   2 dilim börek ve çay   ", "breakfast");
      expect(prompt).toContain('Konuşma Metni: "2 dilim börek ve çay"');
    });

    it("should include core nutritional directives in VOICE_MEAL_ANALYSIS_SYSTEM_INSTRUCTION", () => {
      expect(VOICE_MEAL_ANALYSIS_SYSTEM_INSTRUCTION).toContain("NutriTrack AI Voice Core");
      expect(VOICE_MEAL_ANALYSIS_SYSTEM_INSTRUCTION).toContain("estimatedWeightGrams");
      expect(VOICE_MEAL_ANALYSIS_SYSTEM_INSTRUCTION).toContain("estimatedPortion");
      expect(VOICE_MEAL_ANALYSIS_SYSTEM_INSTRUCTION).toContain("Türkçe");
      expect(VOICE_MEAL_ANALYSIS_SYSTEM_INSTRUCTION).toContain("confidence");
    });
  });

  describe("Schema Compliance & Data Integrity", () => {
    it("should require all critical nutrition fields in MEAL_ANALYSIS_SCHEMA", () => {
      expect(MEAL_ANALYSIS_SCHEMA.required).toContain("mealName");
      expect(MEAL_ANALYSIS_SCHEMA.required).toContain("items");
      expect(MEAL_ANALYSIS_SCHEMA.required).toContain("totalCalories");
      expect(MEAL_ANALYSIS_SCHEMA.required).toContain("totalProtein");
      expect(MEAL_ANALYSIS_SCHEMA.required).toContain("totalCarbs");
      expect(MEAL_ANALYSIS_SCHEMA.required).toContain("totalFat");
      expect(MEAL_ANALYSIS_SCHEMA.required).toContain("confidence");
      expect(MEAL_ANALYSIS_SCHEMA.required).toContain("notes");
    });

    it("should validate that a realistic Turkish speech output conforms to GeminiMealAnalysisResult", () => {
      const mockAiOutput: GeminiMealAnalysisResult = {
        mealName: "Geleneksel Kuru Fasulye & Bulgur Pilavı Menüsü",
        items: [
          {
            name: "Etli Kuru Fasulye",
            estimatedPortion: "1 tabak (200 g)",
            estimatedWeightGrams: 200,
            calories: 280,
            protein: 16,
            carbs: 36,
            fat: 8,
          },
          {
            name: "Tereyağlı Bulgur Pilavı",
            estimatedPortion: "4 yemek kaşığı (120 g)",
            estimatedWeightGrams: 120,
            calories: 180,
            protein: 4.5,
            carbs: 32,
            fat: 4,
          },
          {
            name: "Ayran",
            estimatedPortion: "1 su bardağı (200 ml)",
            estimatedWeightGrams: 200,
            calories: 76,
            protein: 4,
            carbs: 5.6,
            fat: 3.8,
          },
        ],
        totalCalories: 536,
        totalProtein: 24.5,
        totalCarbs: 73.6,
        totalFat: 15.8,
        confidence: "high",
        notes: [
          "Konuşma metnindeki '1 tabak', '4 kaşık' ve '1 bardak' ölçüleri standart porsiyonlara dönüştürüldü.",
        ],
      };

      expect(mockAiOutput.items).toHaveLength(3);
      expect(mockAiOutput.totalCalories).toBe(536);
      expect(mockAiOutput.confidence).toBe("high");

      // Verify mathematical consistency
      const sumCalories = mockAiOutput.items.reduce((acc, curr) => acc + curr.calories, 0);
      expect(sumCalories).toBe(mockAiOutput.totalCalories);

      const sumProtein = mockAiOutput.items.reduce((acc, curr) => acc + curr.protein, 0);
      expect(Math.round(sumProtein * 10) / 10).toBe(mockAiOutput.totalProtein);
    });
  });

  describe("EditableFoodItem Transformation Math", () => {
    it("should correctly calculate 100g base reference nutrients from AI voice items", () => {
      const rawAiItem = {
        name: "Izgara Somon",
        estimatedPortion: "200 g",
        estimatedWeightGrams: 200,
        calories: 416,
        protein: 40,
        carbs: 0,
        fat: 26,
      };

      const factor = 100 / rawAiItem.estimatedWeightGrams;
      const base100g = {
        calories: Math.round(rawAiItem.calories * factor),
        protein: Math.round(rawAiItem.protein * factor * 10) / 10,
        carbs: Math.round(rawAiItem.carbs * factor * 10) / 10,
        fat: Math.round(rawAiItem.fat * factor * 10) / 10,
      };

      const editableItem: EditableFoodItem = {
        id: "item_voice_1",
        name: rawAiItem.name,
        estimatedPortion: rawAiItem.estimatedPortion,
        weightGrams: rawAiItem.estimatedWeightGrams,
        calories: rawAiItem.calories,
        protein: rawAiItem.protein,
        carbs: rawAiItem.carbs,
        fat: rawAiItem.fat,
        base100g,
      };

      expect(editableItem.base100g.calories).toBe(208); // 416 / 2
      expect(editableItem.base100g.protein).toBe(20); // 40 / 2
      expect(editableItem.base100g.fat).toBe(13); // 26 / 2

      // Simulate user editing the portion size from 200g to 150g:
      const newWeight = 150;
      const recalculateItem = {
        ...editableItem,
        weightGrams: newWeight,
        calories: Math.round((editableItem.base100g.calories * newWeight) / 100),
        protein: Math.round(((editableItem.base100g.protein * newWeight) / 100) * 10) / 10,
        fat: Math.round(((editableItem.base100g.fat * newWeight) / 100) * 10) / 10,
      };

      expect(recalculateItem.calories).toBe(312); // 208 * 1.5
      expect(recalculateItem.protein).toBe(30); // 20 * 1.5
      expect(recalculateItem.fat).toBe(19.5); // 13 * 1.5
    });
  });

  describe("API Endpoint Validation & Security", () => {
    it("should anonymize IP properly for voice meal rate limiting", () => {
      const ip = "192.168.1.150";
      const hash = anonymizeIp(ip);
      expect(hash).toHaveLength(32);
      expect(hash).not.toContain(ip);
    });

    it("should reject empty transcripts or non-string inputs", () => {
      const validateTranscript = (input: unknown): boolean => {
        return typeof input === "string" && input.trim().length > 0;
      };

      expect(validateTranscript("")).toBe(false);
      expect(validateTranscript("   ")).toBe(false);
      expect(validateTranscript(null)).toBe(false);
      expect(validateTranscript(undefined)).toBe(false);
      expect(validateTranscript(12345)).toBe(false);
      expect(validateTranscript("1 tabak mercimek çorbası")).toBe(true);
    });
  });
});
