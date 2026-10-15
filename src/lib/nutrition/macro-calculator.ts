/**
 * Scientific BMR & TDEE Nutrition Calculation Module
 * Based on the Mifflin-St Jeor formula and evidence-based macro distribution models.
 */

export type Gender = "male" | "female";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";

export type GoalType = "weight_loss" | "maintain" | "muscle_gain";

export interface UserPhysicalProfile {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: GoalType;
}

export interface MacroDistributionSummary {
  bmr: number;
  tdee: number;
  targetCalories: number;
  protein: number; // in grams
  carbs: number;   // in grams
  fat: number;     // in grams
  calorieDelta: number; // -400, 0, +300
  proteinPercentage: number;
  carbsPercentage: number;
  fatPercentage: number;
}

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,    // Masa başı / Hareketsiz
  light: 1.375,      // Hafif Hareketli (Haftada 1-3 gün spor)
  moderate: 1.55,    // Orta Hareketli (Haftada 3-5 gün spor)
  active: 1.725,     // Çok Hareketli (Haftada 6-7 gün spor)
};

export const GOAL_CALORIE_DELTAS: Record<GoalType, number> = {
  weight_loss: -400, // Kilo Verme (Yağ Yakımı)
  maintain: 0,       // Kilonu Koru (Sağlıklı Yaşam)
  muscle_gain: 300,  // Kas Kazanma (Hacim / Bulk)
};

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation.
 *
 * Male:   (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5
 * Female: (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161
 */
export function calculateBmr(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  const safeWeight = Math.max(20, Math.min(300, weightKg));
  const safeHeight = Math.max(80, Math.min(250, heightCm));
  const safeAge = Math.max(10, Math.min(120, age));

  const base = 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge;

  if (gender === "male") {
    return Math.round(base + 5);
  }
  return Math.round(base - 161);
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 * TDEE = BMR * Activity Multiplier
 */
export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
}

/**
 * Calculates personalized daily target calories and macro nutrients
 * based on user's profile, BMR, TDEE, and fitness goal.
 */
export function calculatePersonalizedMacros(
  profile: UserPhysicalProfile
): MacroDistributionSummary {
  const bmr = calculateBmr(profile.gender, profile.weightKg, profile.heightCm, profile.age);
  const tdee = calculateTdee(bmr, profile.activityLevel);

  const delta = GOAL_CALORIE_DELTAS[profile.goal] ?? 0;
  // Floor at safe minimum calories (e.g. 1200 kcal)
  const targetCalories = Math.max(1200, Math.round(tdee + delta));

  let proteinGrams = 0;
  let fatGrams = 0;
  let carbsGrams = 0;

  const safeWeight = Math.max(20, profile.weightKg);

  if (profile.goal === "weight_loss") {
    // Kilo Verme (Yağ Yakımı): Yüksek protein (2.0 g/kg) kas kaybını önler
    proteinGrams = Math.round(safeWeight * 2.0);
    // Yağ: Kalorinin %25'i
    fatGrams = Math.round((targetCalories * 0.25) / 9);
    // Kalan kalori karbonhidrattan gelir
    const remainingCalories = targetCalories - proteinGrams * 4 - fatGrams * 9;
    carbsGrams = Math.max(25, Math.round(remainingCalories / 4));
  } else if (profile.goal === "muscle_gain") {
    // Kas Kazanma (Hacim / Bulk): 2.0 g/kg protein + glikojen deposu için yeterli karb
    proteinGrams = Math.round(safeWeight * 2.0);
    // Yağ: Kalorinin %25'i
    fatGrams = Math.round((targetCalories * 0.25) / 9);
    // Kalan kalori karbonhidrattan gelir
    const remainingCalories = targetCalories - proteinGrams * 4 - fatGrams * 9;
    carbsGrams = Math.max(50, Math.round(remainingCalories / 4));
  } else {
    // Kilonu Koru (Sağlıklı Yaşam): Dengeli dağılım
    // Protein: ~1.6 g/kg
    proteinGrams = Math.round(safeWeight * 1.6);
    // Yağ: Kalorinin %28'i
    fatGrams = Math.round((targetCalories * 0.28) / 9);
    // Kalan kalori karbonhidrattan gelir
    const remainingCalories = targetCalories - proteinGrams * 4 - fatGrams * 9;
    carbsGrams = Math.max(40, Math.round(remainingCalories / 4));
  }

  // Calculate actual energy percentages
  const totalMacroCalories = proteinGrams * 4 + carbsGrams * 4 + fatGrams * 9;
  const safeMacroCalories = totalMacroCalories > 0 ? totalMacroCalories : targetCalories;

  const proteinPercentage = Math.round(((proteinGrams * 4) / safeMacroCalories) * 100);
  const carbsPercentage = Math.round(((carbsGrams * 4) / safeMacroCalories) * 100);
  const fatPercentage = Math.max(0, 100 - proteinPercentage - carbsPercentage);

  return {
    bmr,
    tdee,
    targetCalories,
    protein: proteinGrams,
    carbs: carbsGrams,
    fat: fatGrams,
    calorieDelta: delta,
    proteinPercentage,
    carbsPercentage,
    fatPercentage,
  };
}
