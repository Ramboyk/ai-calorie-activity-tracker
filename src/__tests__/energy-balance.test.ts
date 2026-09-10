import { describe, it, expect } from "vitest";
import {
  calculateStepBurn,
  calculateTotalBurned,
  calculateNetCalories,
  calculateRemainingCalories,
  calculateEnergyBalance,
} from "@/lib/utils/energy-calculator";

describe("Energy Balance & Calorie Mathematics", () => {
  describe("Step Burn Estimation (Adım × 0.04)", () => {
    it("should calculate 400 kcal burned for 10,000 steps", () => {
      expect(calculateStepBurn(10000)).toBe(400);
    });

    it("should calculate 300 kcal burned for 7,500 steps", () => {
      expect(calculateStepBurn(7500)).toBe(300);
    });

    it("should correctly round non-integer step calorie outputs", () => {
      // 1234 * 0.04 = 49.36 -> 49
      expect(calculateStepBurn(1234)).toBe(49);
      // 1260 * 0.04 = 50.4 -> 50
      expect(calculateStepBurn(1260)).toBe(50);
      // 1275 * 0.04 = 51.0 -> 51
      expect(calculateStepBurn(1275)).toBe(51);
    });

    it("should return 0 burned calories for zero, negative, or invalid steps", () => {
      expect(calculateStepBurn(0)).toBe(0);
      expect(calculateStepBurn(-500)).toBe(0);
      expect(calculateStepBurn(NaN)).toBe(0);
    });
  });

  describe("Total Burned Calories (Exercises + Steps)", () => {
    it("should sum multiple exercise burns and step burns accurately", () => {
      const exerciseCalories = 350; // e.g. 45 min Running
      const steps = 8000; // 8000 * 0.04 = 320
      const total = calculateTotalBurned(exerciseCalories, steps);
      expect(total).toBe(670);
    });

    it("should handle 0 exercises and only step burns", () => {
      expect(calculateTotalBurned(0, 5000)).toBe(200);
    });

    it("should handle 0 steps and only exercise burns", () => {
      expect(calculateTotalBurned(450, 0)).toBe(450);
    });

    it("should safely guard negative inputs", () => {
      expect(calculateTotalBurned(-100, -500)).toBe(0);
    });
  });

  describe("Net Calorie Calculation (Alınan - Yakılan)", () => {
    it("should calculate positive net balance when intake exceeds burn", () => {
      const consumed = 2200;
      const burned = 600;
      expect(calculateNetCalories(consumed, burned)).toBe(1600);
    });

    it("should calculate negative net balance when burn exceeds intake (deficit)", () => {
      const consumed = 1200;
      const burned = 1500;
      expect(calculateNetCalories(consumed, burned)).toBe(-300);
    });

    it("should return 0 net balance when intake equals burn", () => {
      expect(calculateNetCalories(1800, 1800)).toBe(0);
    });
  });

  describe("Remaining Calorie Calculation (max(0, Hedef - Net))", () => {
    it("should return correct remaining calories when under target", () => {
      const goal = 2000;
      const net = 1400;
      expect(calculateRemainingCalories(goal, net)).toBe(600);
    });

    it("should clamp remaining calories to 0 when net equals goal", () => {
      const goal = 2000;
      const net = 2000;
      expect(calculateRemainingCalories(goal, net)).toBe(0);
    });

    it("should clamp remaining calories to 0 when net exceeds goal (no negative calories)", () => {
      const goal = 2000;
      const net = 2450;
      expect(calculateRemainingCalories(goal, net)).toBe(0);
    });

    it("should guard against negative or zero calorie goals", () => {
      expect(calculateRemainingCalories(0, 500)).toBe(0);
      expect(calculateRemainingCalories(-1000, 500)).toBe(0);
    });
  });

  describe("Comprehensive Daily Energy Balance Suite", () => {
    it("should compute a complete daily energy balance report accurately", () => {
      // Scenario: Goal 2000, Breakfast (500) + Lunch (700) + Dinner (600) = 1800 consumed
      // Cycling (300) + 10,000 steps (400) = 700 burned
      // Net = 1800 - 700 = 1100
      // Remaining = 2000 - 1100 = 900
      const balance = calculateEnergyBalance({
        calorieGoal: 2000,
        consumedCalories: 1800,
        exerciseBurned: 300,
        steps: 10000,
      });

      expect(balance.consumedCalories).toBe(1800);
      expect(balance.stepBurned).toBe(400);
      expect(balance.exerciseBurned).toBe(300);
      expect(balance.burnedCalories).toBe(700);
      expect(balance.netCalories).toBe(1100);
      expect(balance.remainingCalories).toBe(900);
      expect(balance.isExceeded).toBe(false);
    });

    it("should correctly mark isExceeded when net calories exceed daily goal", () => {
      const balance = calculateEnergyBalance({
        calorieGoal: 1800,
        consumedCalories: 2600,
        exerciseBurned: 200,
        steps: 5000, // 200 kcal
      });

      // Burned = 400. Net = 2600 - 400 = 2200. Goal = 1800.
      expect(balance.netCalories).toBe(2200);
      expect(balance.remainingCalories).toBe(0);
      expect(balance.isExceeded).toBe(true);
    });
  });
});
