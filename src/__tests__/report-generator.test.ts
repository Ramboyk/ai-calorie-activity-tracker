import { describe, it, expect, vi } from "vitest";
import {
  filterReportData,
  exportToCsv,
  buildCsvContent,
  type ReportDataset,
} from "@/lib/export/report-generator";
import type { Meal } from "@/types/meal";
import type { DailyLog, ExerciseLog } from "@/types/activity";
import type { WeightLog } from "@/lib/storage/weight-tracker";
import { getTodayDateString, addDays } from "@/lib/utils/date";

describe("Diyetisyen Rapor Üretici Modülü (Report Generator)", () => {
  const today = getTodayDateString();

  const mockMeals: Meal[] = [
    {
      id: "m1",
      userId: "u1",
      date: today,
      time: "08:30",
      type: "breakfast",
      name: "Yulaf Lapası & Muz",
      totalCalories: 350,
      totalProtein: 14,
      totalCarbs: 58,
      totalFat: 6,
      createdAt: `${today}T08:30:00Z`,
      items: [],
    },
    {
      id: "m2",
      userId: "u1",
      date: addDays(today, -2),
      time: "13:00",
      type: "lunch",
      name: "Tavuklu Kinoa Salatası",
      totalCalories: 480,
      totalProtein: 38,
      totalCarbs: 45,
      totalFat: 12,
      createdAt: `${addDays(today, -2)}T13:00:00Z`,
      items: [],
    },
    {
      id: "m3",
      userId: "u1",
      date: addDays(today, -15),
      time: "19:00",
      type: "dinner",
      name: "Somon & Kuşkonmaz",
      totalCalories: 520,
      totalProtein: 42,
      totalCarbs: 10,
      totalFat: 26,
      createdAt: `${addDays(today, -15)}T19:00:00Z`,
      items: [],
    },
  ];

  const mockDailyLogs: Record<string, DailyLog> = {
    [today]: {
      date: today,
      steps: 8500,
      stepGoal: 10000,
      waterMl: 2200,
      waterGoalMl: 2500,
    },
    [addDays(today, -2)]: {
      date: addDays(today, -2),
      steps: 10200,
      stepGoal: 10000,
      waterMl: 2600,
      waterGoalMl: 2500,
    },
  };

  const mockActivities: ExerciseLog[] = [
    {
      id: "a1",
      userId: "u1",
      date: today,
      time: "17:00",
      type: "running",
      title: "Tempolu Koşu",
      durationMinutes: 30,
      caloriesBurned: 280,
      createdAt: `${today}T17:00:00Z`,
    },
  ];

  const mockWeights: WeightLog[] = [
    { id: "w1", date: addDays(today, -20), weightKg: 76.5, createdAt: "" },
    { id: "w2", date: today, weightKg: 74.5, createdAt: "" },
  ];

  const baseDataset: ReportDataset = {
    range: "7days",
    meals: mockMeals,
    dailyLogs: mockDailyLogs,
    activities: mockActivities,
    weightLogs: mockWeights,
    calorieGoal: 2000,
    macroGoals: { protein: 140, carbs: 200, fat: 55 },
  };

  describe("Tarih Aralığı Filtreleme (filterReportData)", () => {
    it("should filter meals to the last 7 days only", () => {
      const filtered = filterReportData({ ...baseDataset, range: "7days" });

      expect(filtered.rangeLabel).toContain("7 Günlük");
      // m1 (today) and m2 (-2 days) are in 7 days; m3 (-15 days) is excluded
      expect(filtered.filteredMeals).toHaveLength(2);
      expect(filtered.filteredMeals.some((m) => m.id === "m1")).toBe(true);
      expect(filtered.filteredMeals.some((m) => m.id === "m2")).toBe(true);
      expect(filtered.filteredMeals.some((m) => m.id === "m3")).toBe(false);

      expect(filtered.totalCalories).toBe(350 + 480);
      expect(filtered.avgCalories).toBeGreaterThan(0);
    });

    it("should include meals from last 30 days when range is 30days", () => {
      const filtered = filterReportData({ ...baseDataset, range: "30days" });

      expect(filtered.rangeLabel).toContain("30 Günlük");
      // All 3 meals should be included
      expect(filtered.filteredMeals).toHaveLength(3);
      expect(filtered.totalCalories).toBe(350 + 480 + 520);
    });

    it("should correctly compute weight change text", () => {
      const filtered = filterReportData(baseDataset);
      // 76.5 -> 74.5 = -2.0 kg
      expect(filtered.weightChangeText).toContain("-2 kg");
      expect(filtered.weightChangeText).toContain("76.5kg → 74.5kg");
    });

    it("should handle single or missing weight logs gracefully", () => {
      const filtered = filterReportData({
        ...baseDataset,
        weightLogs: [{ id: "w1", date: today, weightKg: 75.0, createdAt: "" }],
      });
      expect(filtered.weightChangeText).toBe("Mevcut: 75 kg");

      const filteredEmpty = filterReportData({
        ...baseDataset,
        weightLogs: [],
      });
      expect(filteredEmpty.weightChangeText).toBe("Kilo kaydı yok");
    });
  });

  describe("CSV Dışa Aktarma Formatı (buildCsvContent & exportToCsv)", () => {
    it("should construct valid Excel-compatible CSV string with UTF-8 BOM and Turkish characters", () => {
      const csv = buildCsvContent(baseDataset);

      // Verify UTF-8 BOM (\uFEFF)
      expect(csv.startsWith("\uFEFF")).toBe(true);

      // Verify semicolons and headers
      expect(csv).toContain('"Tarih";"Öğün Türü";"Yemek / Menü Adı";"Kalori (kcal)"');
      expect(csv).toContain('"Protein (g)";"Karbonhidrat (g)";"Yağ (g)";"Su (ml)";"Adım Sayısı";"Tartım (kg)"');

      // Verify meal row content
      expect(csv).toContain("Yulaf Lapası & Muz");
      expect(csv).toContain('"350"');
      expect(csv).toContain('"Kahvaltı"');
      expect(csv).toContain("Tavuklu Kinoa Salatası");
      expect(csv).toContain('"Öğle Yemeği"');

      // Verify daily log metrics (steps, water)
      expect(csv).toContain('"2200"'); // waterMl
      expect(csv).toContain('"8500"'); // steps
    });

    it("should safely return without crashing on SSR / Node headless environments", () => {
      expect(() => exportToCsv(baseDataset)).not.toThrow();
    });
  });
});
