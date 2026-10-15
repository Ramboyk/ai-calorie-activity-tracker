import { describe, it, expect } from "vitest";
import {
  getInitialSeedWeightLogs,
  getSortedWeightLogs,
  getLatestWeightLog,
  calculateWeightProgress,
  type WeightLog,
} from "@/lib/storage/weight-tracker";

describe("Kilo Takip Modülü (Weight Tracker Storage & Calculations)", () => {
  describe("Seed Verisi Doğrulaması", () => {
    it("should generate a list of 5 seed weight logs with valid dates and values", () => {
      const seeds = getInitialSeedWeightLogs("2026-10-15");
      expect(seeds).toHaveLength(5);
      seeds.forEach((seed) => {
        expect(seed.id).toBeDefined();
        expect(seed.weightKg).toBeGreaterThan(30);
        expect(seed.weightKg).toBeLessThan(150);
        expect(seed.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  describe("Tarih Sıralama (getSortedWeightLogs)", () => {
    const unsortedLogs: WeightLog[] = [
      { id: "1", date: "2026-10-10", weightKg: 75.0, createdAt: "2026-10-10T08:00:00Z" },
      { id: "2", date: "2026-10-01", weightKg: 77.0, createdAt: "2026-10-01T08:00:00Z" },
      { id: "3", date: "2026-10-15", weightKg: 74.2, createdAt: "2026-10-15T08:00:00Z" },
    ];

    it("should sort logs chronologically ascending (oldest first)", () => {
      const sorted = getSortedWeightLogs(unsortedLogs, "asc");
      expect(sorted[0].date).toBe("2026-10-01");
      expect(sorted[1].date).toBe("2026-10-10");
      expect(sorted[2].date).toBe("2026-10-15");
    });

    it("should sort logs chronologically descending (newest first)", () => {
      const sorted = getSortedWeightLogs(unsortedLogs, "desc");
      expect(sorted[0].date).toBe("2026-10-15");
      expect(sorted[1].date).toBe("2026-10-10");
      expect(sorted[2].date).toBe("2026-10-01");
    });

    it("should handle empty or null logs gracefully", () => {
      expect(getSortedWeightLogs([])).toEqual([]);
      // @ts-expect-error test invalid input
      expect(getSortedWeightLogs(null)).toEqual([]);
    });
  });

  describe("En Son Tartım Seçicisi (getLatestWeightLog)", () => {
    it("should return the latest entry based on date", () => {
      const logs: WeightLog[] = [
        { id: "w1", date: "2026-10-01", weightKg: 80.0, createdAt: "2026-10-01T08:00:00Z" },
        { id: "w2", date: "2026-10-14", weightKg: 78.5, createdAt: "2026-10-14T08:00:00Z" },
        { id: "w3", date: "2026-10-07", weightKg: 79.2, createdAt: "2026-10-07T08:00:00Z" },
      ];

      const latest = getLatestWeightLog(logs);
      expect(latest).not.toBeNull();
      expect(latest?.id).toBe("w2");
      expect(latest?.weightKg).toBe(78.5);
    });

    it("should return null when log list is empty", () => {
      expect(getLatestWeightLog([])).toBeNull();
    });
  });

  describe("Kilo Değişim İlerlemesi (calculateWeightProgress)", () => {
    it("should correctly compute weight loss with negative diffKg and percentage", () => {
      const logs: WeightLog[] = [
        { id: "1", date: "2026-09-01", weightKg: 80.0, createdAt: "" },
        { id: "2", date: "2026-09-15", weightKg: 78.5, createdAt: "" },
        { id: "3", date: "2026-10-01", weightKg: 77.0, createdAt: "" },
      ];

      const progress = calculateWeightProgress(logs);
      expect(progress).not.toBeNull();
      expect(progress?.initialWeight).toBe(80.0);
      expect(progress?.currentWeight).toBe(77.0);
      expect(progress?.diffKg).toBe(-3.0);
      // (77 - 80) / 80 = -3/80 = -3.75% -> JS Math.round(-37.5)/10 = -3.7%
      expect(progress?.percentage).toBe(-3.7);
      expect(progress?.isLoss).toBe(true);
      expect(progress?.isGain).toBe(false);
      expect(progress?.direction).toBe("loss");
      expect(progress?.totalLogsCount).toBe(3);
    });

    it("should correctly compute weight gain (bulk phase)", () => {
      const logs: WeightLog[] = [
        { id: "1", date: "2026-09-01", weightKg: 70.0, createdAt: "" },
        { id: "2", date: "2026-10-01", weightKg: 72.8, createdAt: "" },
      ];

      const progress = calculateWeightProgress(logs);
      expect(progress?.diffKg).toBe(2.8);
      expect(progress?.percentage).toBe(4.0); // 2.8 / 70 = 4%
      expect(progress?.isGain).toBe(true);
      expect(progress?.isLoss).toBe(false);
      expect(progress?.direction).toBe("gain");
    });

    it("should handle single entry as neutral zero change", () => {
      const logs: WeightLog[] = [
        { id: "1", date: "2026-10-01", weightKg: 75.0, createdAt: "" },
      ];

      const progress = calculateWeightProgress(logs);
      expect(progress?.diffKg).toBe(0);
      expect(progress?.percentage).toBe(0);
      expect(progress?.isLoss).toBe(false);
      expect(progress?.isGain).toBe(false);
      expect(progress?.direction).toBe("neutral");
    });

    it("should return null for empty logs", () => {
      expect(calculateWeightProgress([])).toBeNull();
    });
  });
});
