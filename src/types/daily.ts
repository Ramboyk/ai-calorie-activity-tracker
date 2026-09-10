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

export interface WeeklyAverage {
  caloriesConsumed: number;
  caloriesBurned: number;
  steps: number;
  waterLiters: number;
  activeDaysCount: number;
  totalActiveDurationMinutes: number;
}

export interface WeeklyDayBarData {
  dayLabel: string; // Pzt, Sal, Çar, etc.
  date: string; // YYYY-MM-DD
  value: number;
  target: number;
  percentage: number;
}

export interface WeeklyTrend {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  weekNumber: number;
  days: DailySummary[];
  averages: WeeklyAverage;
  calorieBars: WeeklyDayBarData[];
  stepBars: WeeklyDayBarData[];
  waterBars: WeeklyDayBarData[];
}
