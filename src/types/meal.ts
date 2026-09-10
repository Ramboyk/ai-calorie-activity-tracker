export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type AiConfidenceLevel = 'high' | 'medium' | 'low';

export interface FoodItem {
  id: string;
  name: string;
  portion: number;
  portionUnit: 'g' | 'ml' | 'portion' | 'slice' | 'piece';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: MealType;
  name: string;
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  imageUrl?: string;
  aiConfidence?: {
    score: number; // 0-100
    level: AiConfidenceLevel;
    modelVersion?: string;
  };
  createdAt: string; // ISO timestamp
  updatedAt?: string;
}
