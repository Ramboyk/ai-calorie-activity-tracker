import type { FoodItem, AiConfidenceLevel } from './meal';

export interface ApiResponseSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiResponseError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError;

export interface DetectedVisualAnchor {
  label: string;
  xPercent: number;
  yPercent: number;
  macroGroup: 'protein' | 'carbs' | 'fat' | 'veg';
}

export interface AiFoodDetectionResult {
  dishName: string;
  confidenceScore: number; // 0 - 100
  confidenceLevel: AiConfidenceLevel;
  modelVersion: string;
  processingTimeSeconds: number;
  detectedItems: FoodItem[];
  detectedAnchors?: DetectedVisualAnchor[];
  totalCalories: number;
  totalMacros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  macroCaloriePercentages: {
    proteinPercent: number;
    carbsPercent: number;
    fatPercent: number;
  };
  disclaimer: string;
}

export interface RateLimitStatus {
  dailyRemaining: number;
  dailyLimit: number;
  globalRemaining: number;
  globalLimit: number;
  resetAt: string; // ISO timestamp
}
