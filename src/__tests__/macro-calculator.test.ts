import { describe, it, expect } from "vitest";
import {
  calculateBmr,
  calculateTdee,
  calculatePersonalizedMacros,
  ACTIVITY_MULTIPLIERS,
  GOAL_CALORIE_DELTAS,
  type UserPhysicalProfile,
} from "@/lib/nutrition/macro-calculator";

describe("Akıllı Hedef Hesaplayıcı (BMR & TDEE Macro Calculator)", () => {
  describe("Mifflin-St Jeor BMR Hesaplamaları (Basal Metabolic Rate)", () => {
    it("should calculate exact BMR for adult male", () => {
      // Erkek: 10 * 80 + 6.25 * 180 - 5 * 30 + 5
      // 800 + 1125 - 150 + 5 = 1780 kcal
      const bmr = calculateBmr("male", 80, 180, 30);
      expect(bmr).toBe(1780);
    });

    it("should calculate exact BMR for young adult male with decimal height", () => {
      // Erkek: 10 * 70 + 6.25 * 175 - 5 * 25 + 5
      // 700 + 1093.75 - 125 + 5 = 1673.75 -> round to 1674
      const bmr = calculateBmr("male", 70, 175, 25);
      expect(bmr).toBe(1674);
    });

    it("should calculate exact BMR for adult female", () => {
      // Kadın: 10 * 60 + 6.25 * 165 - 5 * 28 - 161
      // 600 + 1031.25 - 140 - 161 = 1330.25 -> round to 1330
      const bmr = calculateBmr("female", 60, 165, 28);
      expect(bmr).toBe(1330);
    });

    it("should calculate exact BMR for female with different age/weight", () => {
      // Kadın: 10 * 55 + 6.25 * 160 - 5 * 35 - 161
      // 550 + 1000 - 175 - 161 = 1214 kcal
      const bmr = calculateBmr("female", 55, 160, 35);
      expect(bmr).toBe(1214);
    });

    it("should clamp extreme out-of-range values to prevent negative or infinite BMR", () => {
      const bmrLow = calculateBmr("male", 5, 20, 2);
      expect(bmrLow).toBeGreaterThan(0);

      const bmrHigh = calculateBmr("female", 600, 350, 200);
      expect(bmrHigh).toBeLessThan(10000);
    });
  });

  describe("TDEE ve Aktivite Çarpanları (Total Daily Energy Expenditure)", () => {
    const baseBmr = 1600;

    it("should apply sedentary multiplier (x1.2)", () => {
      expect(ACTIVITY_MULTIPLIERS.sedentary).toBe(1.2);
      const tdee = calculateTdee(baseBmr, "sedentary");
      expect(tdee).toBe(1920); // 1600 * 1.2
    });

    it("should apply light activity multiplier (x1.375)", () => {
      expect(ACTIVITY_MULTIPLIERS.light).toBe(1.375);
      const tdee = calculateTdee(baseBmr, "light");
      expect(tdee).toBe(2200); // 1600 * 1.375
    });

    it("should apply moderate activity multiplier (x1.55)", () => {
      expect(ACTIVITY_MULTIPLIERS.moderate).toBe(1.55);
      const tdee = calculateTdee(baseBmr, "moderate");
      expect(tdee).toBe(2480); // 1600 * 1.55
    });

    it("should apply active multiplier (x1.725)", () => {
      expect(ACTIVITY_MULTIPLIERS.active).toBe(1.725);
      const tdee = calculateTdee(baseBmr, "active");
      expect(tdee).toBe(2760); // 1600 * 1.725
    });
  });

  describe("Hedefe Göre Kalori ve Makro Dağılımı (Personalized Goals)", () => {
    it("should calculate weight loss goals with -400 kcal deficit and high protein", () => {
      const profile: UserPhysicalProfile = {
        gender: "male",
        weightKg: 80,
        heightCm: 180,
        age: 30,
        activityLevel: "moderate", // BMR 1780 * 1.55 = TDEE 2759
        goal: "weight_loss",
      };

      const result = calculatePersonalizedMacros(profile);

      expect(result.bmr).toBe(1780);
      expect(result.tdee).toBe(2759);
      expect(result.calorieDelta).toBe(-400);
      expect(result.targetCalories).toBe(2759 - 400); // 2359 kcal

      // Yüksek protein: 2.0g/kg * 80kg = 160g protein
      expect(result.protein).toBe(160);
      expect(result.protein * 4).toBe(640);

      // Yağ: ~%25 of 2359 kcal = 589.75 / 9 = ~66g
      expect(result.fat).toBe(Math.round((2359 * 0.25) / 9));

      // Karb: kalan kalori
      expect(result.carbs).toBeGreaterThan(100);

      // Toplam makro kalorisi hedef kaloriye çok yakın olmalı (yuvarlama toleransı +- 15 kcal)
      const sumCalories = result.protein * 4 + result.carbs * 4 + result.fat * 9;
      expect(Math.abs(sumCalories - result.targetCalories)).toBeLessThanOrEqual(15);
    });

    it("should calculate maintenance goals with TDEE balance", () => {
      const profile: UserPhysicalProfile = {
        gender: "female",
        weightKg: 60,
        heightCm: 165,
        age: 28,
        activityLevel: "light", // BMR 1330 * 1.375 = 1829
        goal: "maintain",
      };

      const result = calculatePersonalizedMacros(profile);

      expect(result.bmr).toBe(1330);
      expect(result.tdee).toBe(1829);
      expect(result.calorieDelta).toBe(0);
      expect(result.targetCalories).toBe(1829);

      // Protein ~1.6g/kg * 60kg = 96g
      expect(result.protein).toBe(96);
      expect(result.fat).toBe(Math.round((1829 * 0.28) / 9));
      expect(result.carbs).toBeGreaterThan(150);

      const sumCalories = result.protein * 4 + result.carbs * 4 + result.fat * 9;
      expect(Math.abs(sumCalories - result.targetCalories)).toBeLessThanOrEqual(15);
    });

    it("should calculate muscle gain goals with +300 kcal surplus", () => {
      const profile: UserPhysicalProfile = {
        gender: "male",
        weightKg: 75,
        heightCm: 178,
        age: 24,
        activityLevel: "active",
        goal: "muscle_gain",
      };

      const result = calculatePersonalizedMacros(profile);

      expect(result.calorieDelta).toBe(300);
      expect(result.targetCalories).toBe(result.tdee + 300);
      expect(result.protein).toBe(150); // 75kg * 2.0g/kg
      expect(result.carbs).toBeGreaterThan(200); // Karb enerjisi kas gelişimi için yüksek

      const sumCalories = result.protein * 4 + result.carbs * 4 + result.fat * 9;
      expect(Math.abs(sumCalories - result.targetCalories)).toBeLessThanOrEqual(15);
    });

    it("should maintain safe minimum 1200 kcal floor even on aggressive deficit", () => {
      const profile: UserPhysicalProfile = {
        gender: "female",
        weightKg: 42,
        heightCm: 145,
        age: 60,
        activityLevel: "sedentary",
        goal: "weight_loss",
      };

      const result = calculatePersonalizedMacros(profile);
      expect(result.targetCalories).toBeGreaterThanOrEqual(1200);
    });

    it("should calculate macro percentages that sum up to 100%", () => {
      const profile: UserPhysicalProfile = {
        gender: "male",
        weightKg: 75,
        heightCm: 178,
        age: 28,
        activityLevel: "moderate",
        goal: "weight_loss",
      };

      const result = calculatePersonalizedMacros(profile);
      const totalPercent =
        result.proteinPercentage + result.carbsPercentage + result.fatPercentage;
      expect(totalPercent).toBe(100);
    });
  });

  describe("Goal Calorie Deltas Mapping", () => {
    it("should match standard deltas for all three goals", () => {
      expect(GOAL_CALORIE_DELTAS.weight_loss).toBe(-400);
      expect(GOAL_CALORIE_DELTAS.maintain).toBe(0);
      expect(GOAL_CALORIE_DELTAS.muscle_gain).toBe(300);
    });
  });
});
