export type ExerciseType =
  | 'walking'
  | 'running'
  | 'cycling'
  | 'fitness'
  | 'swimming'
  | 'hiking'
  | 'other';

export interface ExerciseLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: ExerciseType;
  title: string;
  durationMinutes: number;
  caloriesBurned: number;
  notes?: string;
  createdAt: string; // ISO timestamp
}

export interface StepsData {
  date: string; // YYYY-MM-DD
  count: number;
  goal: number;
  distanceKm: number;
  activeMinutes: number;
  caloriesBurned: number;
  syncSource?: 'manual' | 'apple_health' | 'google_fit';
}

export interface WaterEntry {
  id: string;
  time: string; // HH:mm
  amountMl: number;
}

export interface WaterLog {
  date: string; // YYYY-MM-DD
  currentMl: number;
  goalMl: number;
  entries: WaterEntry[];
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  steps: number;
  stepGoal: number;
  waterMl: number;
  waterGoalMl: number;
  distanceKm?: number;
  activeMinutes?: number;
}

