/**
 * Core Energy Balance & Calorie Formulas for NutriTrack AI.
 *
 * Mathematical specifications:
 * - Consumed = sum of all logged meal calories
 * - Burned = sum of exercise calories + round(steps * 0.04)
 * - Net = Consumed - Burned
 * - Remaining = max(0, Goal - Net)
 */

export interface EnergyBalanceInput {
  calorieGoal: number;
  consumedCalories: number;
  exerciseBurned?: number;
  steps?: number;
}

export interface EnergyBalanceResult {
  calorieGoal: number;
  consumedCalories: number;
  burnedCalories: number;
  stepBurned: number;
  exerciseBurned: number;
  netCalories: number;
  remainingCalories: number;
  isExceeded: boolean;
}

/**
 * Calculates burned calories from daily steps.
 * Empirical formula: ~0.04 kcal burned per step for average adult.
 * Returns 0 if steps is negative or NaN.
 */
export function calculateStepBurn(steps: number): number {
  if (!Number.isFinite(steps) || steps <= 0) {
    return 0;
  }
  return Math.round(steps * 0.04);
}

/**
 * Calculates total burned calories from exercise and steps.
 */
export function calculateTotalBurned(exerciseBurned: number, steps: number): number {
  const safeExercise = Number.isFinite(exerciseBurned) && exerciseBurned > 0 ? exerciseBurned : 0;
  const stepBurn = calculateStepBurn(steps);
  return safeExercise + stepBurn;
}

/**
 * Calculates net calorie balance: Consumed - Burned.
 */
export function calculateNetCalories(consumed: number, burned: number): number {
  const safeConsumed = Number.isFinite(consumed) && consumed > 0 ? consumed : 0;
  const safeBurned = Number.isFinite(burned) && burned > 0 ? burned : 0;
  return safeConsumed - safeBurned;
}

/**
 * Calculates remaining calories to reach or stay within target goal.
 * Clamps to 0 if net calories exceed the goal or if goal is non-positive.
 */
export function calculateRemainingCalories(goal: number, net: number): number {
  const safeGoal = Number.isFinite(goal) && goal > 0 ? goal : 0;
  return Math.max(0, safeGoal - net);
}

/**
 * Derives the complete energy balance profile with safety guards.
 */
export function calculateEnergyBalance(input: EnergyBalanceInput): EnergyBalanceResult {
  const safeGoal = Number.isFinite(input.calorieGoal) && input.calorieGoal > 0 ? input.calorieGoal : 0;
  const safeConsumed = Number.isFinite(input.consumedCalories) && input.consumedCalories > 0 ? input.consumedCalories : 0;
  const safeExercise = Number.isFinite(input.exerciseBurned) && (input.exerciseBurned ?? 0) > 0 ? (input.exerciseBurned ?? 0) : 0;
  const safeSteps = Number.isFinite(input.steps) && (input.steps ?? 0) > 0 ? (input.steps ?? 0) : 0;

  const stepBurned = calculateStepBurn(safeSteps);
  const burnedCalories = safeExercise + stepBurned;
  const netCalories = safeConsumed - burnedCalories;
  const remainingCalories = calculateRemainingCalories(safeGoal, netCalories);
  const isExceeded = netCalories > safeGoal;

  return {
    calorieGoal: safeGoal,
    consumedCalories: safeConsumed,
    burnedCalories,
    stepBurned,
    exerciseBurned: safeExercise,
    netCalories,
    remainingCalories,
    isExceeded,
  };
}
