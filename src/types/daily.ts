import type { Meal } from './meal';
import type { ExerciseLog, StepsData, WaterLog } from './activity';

export interface MacroSummary {
  consumedGrams: number;
  goalGrams: number;
  percentage: number;
}

export interface DailyMacros {
  protein: MacroSummary;
  carbs: MacroSummary;
  fat: MacroSummary;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  userId: string;
  calorieGoal: number;
  caloriesConsumed: number;
  caloriesBurned: number;
  netCalories: number;
  remainingCalories: number;
  macros: DailyMacros;
  steps: StepsData;
  water: WaterLog;
  meals: Meal[];
  exercises: ExerciseLog[];
}

export interface WeeklyDayStat {
  date: string; // YYYY-MM-DD
  dayLabel: string; // Pzt, Sal, Çar, Per, Cum, Cmt, Paz
  consumedCalories: number;
  burnedCalories: number;
  netCalories: number;
  calorieGoal: number;
  steps: number;
  stepGoal: number;
  waterMl: number;
  waterGoalMl: number;
  activeMinutes: number;
}

export interface WeeklyStats {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  weekRangeLabel: string; // örn: "4 Eyl – 10 Eyl"
  weekNumber: number;
  days: WeeklyDayStat[];
  averages: {
    avgConsumedCalories: number;
    avgNetCalories: number;
    avgBurnedCalories: number;
    avgSteps: number;
    avgWaterLiters: number;
    activeDaysCount: number;
    totalActiveMinutes: number;
  };
}

