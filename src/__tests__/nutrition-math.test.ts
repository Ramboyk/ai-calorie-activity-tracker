import { describe, it, expect } from "vitest";
import { scaleNutrientsFrom100g, type NutritionBase100g } from "@/lib/utils/nutrition-calculator";

describe("100g Base Nutrition Scaling Mathematics", () => {
  // Baseline test food: Grilled Chicken Breast per 100g
  // 165 kcal, 31g protein, 0g carbs, 3.6g fat
  const chickenBase: NutritionBase100g = {
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
  };

  // Mixed composite food: Granola Bowl per 100g
  // 420 kcal, 11.5g protein, 64.2g carbs, 14.8g fat
  const granolaBase: NutritionBase100g = {
    calories: 420,
    protein: 11.5,
    carbs: 64.2,
    fat: 14.8,
  };

  describe("Exact 100g Identity Verification", () => {
    it("should return exact base values when weight is exactly 100g", () => {
      const scaled = scaleNutrientsFrom100g(chickenBase, 100);
      expect(scaled.weightGrams).toBe(100);
      expect(scaled.calories).toBe(165);
      expect(scaled.protein).toBe(31);
      expect(scaled.carbs).toBe(0);
      expect(scaled.fat).toBe(3.6);
    });
  });

  describe("Scaling Down (100g → 50g)", () => {
    it("should halve all calories and macros with exact precision", () => {
      const scaled = scaleNutrientsFrom100g(chickenBase, 50);
      // factor = 0.5
      // calories: round(165 * 0.5) = round(82.5) = 83 (or 82 depending on rounding)
      expect(scaled.weightGrams).toBe(50);
      expect(scaled.calories).toBe(Math.round(165 * 0.5));
      // protein: round(31 * 0.5 * 10) / 10 = 15.5
      expect(scaled.protein).toBe(15.5);
      expect(scaled.carbs).toBe(0);
      // fat: round(3.6 * 0.5 * 10) / 10 = 1.8
      expect(scaled.fat).toBe(1.8);
    });

    it("should accurately scale down complex floating point macros", () => {
      const scaled = scaleNutrientsFrom100g(granolaBase, 50);
      expect(scaled.weightGrams).toBe(50);
      expect(scaled.calories).toBe(210); // 420 * 0.5
      expect(scaled.protein).toBe(5.8); // 11.5 * 0.5 = 5.75 -> 5.8
      expect(scaled.carbs).toBe(32.1); // 64.2 * 0.5 = 32.1
      expect(scaled.fat).toBe(7.4); // 14.8 * 0.5 = 7.4
    });
  });

  describe("Scaling Up (150g → 200g)", () => {
    it("should scale from 150g to 200g linearly", () => {
      // 150g evaluation
      const at150g = scaleNutrientsFrom100g(chickenBase, 150);
      expect(at150g.weightGrams).toBe(150);
      expect(at150g.calories).toBe(Math.round(165 * 1.5)); // 248
      expect(at150g.protein).toBe(46.5); // 31 * 1.5
      expect(at150g.fat).toBe(5.4); // 3.6 * 1.5

      // 200g evaluation (double of 100g)
      const at200g = scaleNutrientsFrom100g(chickenBase, 200);
      expect(at200g.weightGrams).toBe(200);
      expect(at200g.calories).toBe(330); // 165 * 2
      expect(at200g.protein).toBe(62); // 31 * 2
      expect(at200g.carbs).toBe(0);
      expect(at200g.fat).toBe(7.2); // 3.6 * 2
    });
  });

  describe("Decimal Precision and Currency-Accurate Rounding", () => {
    it("should prevent floating-point precision leaks (e.g. 0.30000000000000004)", () => {
      // Test with an odd weight like 73g
      const scaled = scaleNutrientsFrom100g(granolaBase, 73);
      // factor = 0.73
      // Check that all decimal fields have at most 1 decimal place
      const proteinStr = scaled.protein.toString();
      const carbsStr = scaled.carbs.toString();
      const fatStr = scaled.fat.toString();

      const proteinDecimals = proteinStr.includes(".") ? proteinStr.split(".")[1].length : 0;
      const carbsDecimals = carbsStr.includes(".") ? carbsStr.split(".")[1].length : 0;
      const fatDecimals = fatStr.includes(".") ? fatStr.split(".")[1].length : 0;

      expect(proteinDecimals).toBeLessThanOrEqual(1);
      expect(carbsDecimals).toBeLessThanOrEqual(1);
      expect(fatDecimals).toBeLessThanOrEqual(1);
    });
  });

  describe("Boundary Guards & Edge Cases", () => {
    it("should safely return 0 for all nutrients when weight is 0g", () => {
      const scaled = scaleNutrientsFrom100g(chickenBase, 0);
      expect(scaled.weightGrams).toBe(0);
      expect(scaled.calories).toBe(0);
      expect(scaled.protein).toBe(0);
      expect(scaled.carbs).toBe(0);
      expect(scaled.fat).toBe(0);
    });

    it("should guard against negative weights and return 0", () => {
      const scaled = scaleNutrientsFrom100g(chickenBase, -75);
      expect(scaled.weightGrams).toBe(0);
      expect(scaled.calories).toBe(0);
      expect(scaled.protein).toBe(0);
      expect(scaled.carbs).toBe(0);
      expect(scaled.fat).toBe(0);
    });

    it("should guard against NaN or non-finite weights", () => {
      const scaled = scaleNutrientsFrom100g(chickenBase, NaN);
      expect(scaled.weightGrams).toBe(0);
      expect(scaled.calories).toBe(0);
    });

    it("should clamp unrealistically large portions to maximum limit (2000g)", () => {
      const scaled = scaleNutrientsFrom100g(chickenBase, 5000);
      expect(scaled.weightGrams).toBe(2000);
      expect(scaled.calories).toBe(3300); // 165 * 20
      expect(scaled.protein).toBe(620); // 31 * 20
    });
  });
});
