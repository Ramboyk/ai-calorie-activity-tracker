/**
 * Core 100g-base nutrient scaling mathematics for NutriTrack AI.
 *
 * Formulas:
 * - factor = weightGrams / 100
 * - calories = round(base100g.calories * factor)
 * - protein = round(base100g.protein * factor * 10) / 10
 * - carbs = round(base100g.carbs * factor * 10) / 10
 * - fat = round(base100g.fat * factor * 10) / 10
 */

export interface NutritionBase100g {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ScaledNutrition {
  weightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Recalculates nutritional macros for a custom gram weight given standard 100g base values.
 * Guards against negative, NaN, or zero weight by returning zero nutrients.
 * Clamps maximum realistic single-portion weight to 2000g.
 */
export function scaleNutrientsFrom100g(
  base100g: NutritionBase100g,
  weightGrams: number,
  maxAllowedWeight: number = 2000
): ScaledNutrition {
  if (!Number.isFinite(weightGrams) || weightGrams <= 0) {
    return {
      weightGrams: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };
  }

  const clampedWeight = Math.min(maxAllowedWeight, Math.max(0, weightGrams));
  const factor = clampedWeight / 100;

  const calories = Math.round(Math.max(0, base100g.calories) * factor);
  const protein = Math.round(Math.max(0, base100g.protein) * factor * 10) / 10;
  const carbs = Math.round(Math.max(0, base100g.carbs) * factor * 10) / 10;
  const fat = Math.round(Math.max(0, base100g.fat) * factor * 10) / 10;

  return {
    weightGrams: clampedWeight,
    calories,
    protein,
    carbs,
    fat,
  };
}
