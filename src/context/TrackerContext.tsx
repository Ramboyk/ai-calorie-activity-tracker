"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { Meal } from "@/types/meal";
import { getTodayDateString, addDays } from "@/lib/utils/date";

export interface MacroGoals {
  protein: number;
  carbs: number;
  fat: number;
}

export interface DailyNutritionSummary {
  consumedCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  calorieGoal: number;
  remainingCalories: number;
  netCalories: number;
}

export interface TrackerContextType {
  selectedDate: string;
  isHydrated: boolean;
  calorieGoal: number;
  macroGoals: MacroGoals;
  meals: Meal[];
  addMeal: (mealData: Omit<Meal, "id" | "createdAt"> | Meal) => Meal;
  deleteMeal: (mealId: string) => void;
  setSelectedDate: (dateStr: string) => void;
  goToPrevDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
  getMealsForDate: (dateStr: string) => Meal[];
  getDailyNutrition: (dateStr: string) => DailyNutritionSummary;
}

const LOCAL_STORAGE_MEALS_KEY = "nutritrack_meals_v1";

const DEFAULT_CALORIE_GOAL = 2000;
const DEFAULT_MACRO_GOALS: MacroGoals = {
  protein: 120,
  carbs: 220,
  fat: 65,
};

// Stitch realistic sample meals for initial seeding
const getInitialSeedMeals = (todayStr: string): Meal[] => [
  {
    id: "seed_meal_1",
    userId: "user_demo_1",
    date: todayStr,
    time: "08:30",
    type: "breakfast",
    name: "Avokadolu Poşe Yumurtalı Tost",
    totalCalories: 420,
    totalProtein: 22,
    totalCarbs: 38,
    totalFat: 20,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCStMLE1P0r0z1IRwK-_4zi9YemSoXyHewC_gpqn7uFbU2hICAaE26OxH3vwQ3EfU9iWHipLTMAPiuZSi9lmy2ImW9Pl1e1K3IBdY32SxltvDMUdJJNj1V6HMzJ6Mg5HfOBaF5yjklPT1Or607xX7_VQqmatUxXgalHSusGeRQpaEhqI-SSAe4LXL1Kh99lbnZRGqqAg3ps1MOtJcLOrhIh7rU0DNLj1dOVBts9cLnWhmJ4UB58_Og",
    aiConfidence: {
      score: 94,
      level: "high",
      modelVersion: "Gemini-2.5-Flash-Vision",
    },
    createdAt: `${todayStr}T08:32:00Z`,
    items: [
      {
        id: "seed_item_1_1",
        name: "Ekşi Mayalı Ekmek",
        portion: 2,
        portionUnit: "slice",
        calories: 160,
        protein: 6,
        carbs: 30,
        fat: 1.5,
      },
      {
        id: "seed_item_1_2",
        name: "Poşe Yumurta",
        portion: 2,
        portionUnit: "piece",
        calories: 140,
        protein: 12,
        carbs: 1,
        fat: 10,
      },
      {
        id: "seed_item_1_3",
        name: "Avokado Dilimleri",
        portion: 50,
        portionUnit: "g",
        calories: 120,
        protein: 4,
        carbs: 7,
        fat: 8.5,
      },
    ],
  },
  {
    id: "seed_meal_2",
    userId: "user_demo_1",
    date: todayStr,
    time: "13:10",
    type: "lunch",
    name: "Izgara Tavuklu Pirinç Kasesi",
    totalCalories: 560,
    totalProtein: 50,
    totalCarbs: 62,
    totalFat: 13,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCaO6Xi9ZYE0WXZUHPhu2D8JlO5MML1yzHPtjzTRhzL_7ZETxKyYauju4D37R0Cwb5ByKbrrW6Sj-DEdmd0ihV1AK2atdibd0x6stKMsn4Cfm5zO1qmlXWhrLqG4DgWacpIVckZVJeCm2UXE6HerP80wvHaOWjeCWzPgSrgLIvRujcYS0Wt96fOQEExRZZznUEIx0jjCUVYfrJ1qe3x6go72TjAIxM14dAZClPSdlqnUAW1AMICShc",
    aiConfidence: {
      score: 91,
      level: "high",
      modelVersion: "Gemini-2.5-Flash-Vision",
    },
    createdAt: `${todayStr}T13:12:00Z`,
    items: [
      {
        id: "seed_item_2_1",
        name: "Izgara Tavuk Göğsü",
        portion: 180,
        portionUnit: "g",
        calories: 290,
        protein: 44,
        carbs: 0,
        fat: 6,
      },
      {
        id: "seed_item_2_2",
        name: "Yasemin Pirinci",
        portion: 150,
        portionUnit: "g",
        calories: 210,
        protein: 4,
        carbs: 48,
        fat: 1,
      },
      {
        id: "seed_item_2_3",
        name: "Buharda Brokoli & Havuç",
        portion: 100,
        portionUnit: "g",
        calories: 60,
        protein: 2,
        carbs: 14,
        fat: 6,
      },
    ],
  },
  {
    id: "seed_meal_3",
    userId: "user_demo_1",
    date: todayStr,
    time: "16:20",
    type: "snack",
    name: "Orman Meyveli Süzme Yoğurt",
    totalCalories: 210,
    totalProtein: 20,
    totalCarbs: 24,
    totalFat: 4,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAk1E0wvIA1ZPv_OrvwLNwDCiXdNqTLBZdDQpn3HvyBmg6eCLbXCg6ZFlKVcPVV4h1Yim9L85L8TJkTHzgvDyL2pAxNMMcU6eH3PFSKl0DqHy4lQbxO62DOIEXPloxD2DD5EQt9GVGo2FrfqmQ-97ysv2G5A9jLg2MAIEpRDdjZ6yTF1HlGHZqRJA2KJXmPr5_NeboFMfRsKXmhlpDq3R4vCgzPqLP8F95nRG4Z_xU_ku81h3RS7Yg",
    aiConfidence: {
      score: 88,
      level: "medium",
      modelVersion: "Gemini-2.5-Flash-Vision",
    },
    createdAt: `${todayStr}T16:22:00Z`,
    items: [
      {
        id: "seed_item_3_1",
        name: "Süzme Yoğurt (%2 Yağ)",
        portion: 200,
        portionUnit: "g",
        calories: 140,
        protein: 18,
        carbs: 8,
        fat: 4,
      },
      {
        id: "seed_item_3_2",
        name: "Taze Yaban Mersini & Ahududu",
        portion: 80,
        portionUnit: "g",
        calories: 70,
        protein: 2,
        carbs: 16,
        fat: 0,
      },
    ],
  },
];

const TrackerContext = createContext<TrackerContextType | null>(null);

export function TrackerProvider({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Read LocalStorage on Client Mount (SSR-Safe)
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const todayStr = getTodayDateString();
        const stored = localStorage.getItem(LOCAL_STORAGE_MEALS_KEY);

        if (stored) {
          const parsed = JSON.parse(stored) as Meal[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMeals(parsed);
          } else {
            // Seed with Stitch defaults if empty array
            const initialSeed = getInitialSeedMeals(todayStr);
            setMeals(initialSeed);
            localStorage.setItem(LOCAL_STORAGE_MEALS_KEY, JSON.stringify(initialSeed));
          }
        } else {
          // Seed on first load
          const initialSeed = getInitialSeedMeals(todayStr);
          setMeals(initialSeed);
          localStorage.setItem(LOCAL_STORAGE_MEALS_KEY, JSON.stringify(initialSeed));
        }
      } catch (err) {
        console.error("[NutriTrack AI] localStorage okuma hatası:", err);
        const initialSeed = getInitialSeedMeals(getTodayDateString());
        setMeals(initialSeed);
      } finally {
        setIsHydrated(true);
      }
    });
  }, []);

  // Sync to LocalStorage whenever meals change (after hydration)
  const persistMeals = useCallback((newMeals: Meal[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_MEALS_KEY, JSON.stringify(newMeals));
    } catch (err) {
      console.error("[NutriTrack AI] localStorage yazma hatası:", err);
    }
  }, []);

  // Actions
  const addMeal = useCallback(
    (mealData: Omit<Meal, "id" | "createdAt"> | Meal): Meal => {
      const newMeal: Meal = {
        ...mealData,
        id: "id" in mealData && mealData.id ? mealData.id : `meal_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        createdAt: "createdAt" in mealData && mealData.createdAt ? mealData.createdAt : new Date().toISOString(),
        date: mealData.date || selectedDate,
      };

      setMeals((prev) => {
        const updated = [newMeal, ...prev];
        persistMeals(updated);
        return updated;
      });

      return newMeal;
    },
    [selectedDate, persistMeals]
  );

  const deleteMeal = useCallback(
    (mealId: string) => {
      setMeals((prev) => {
        const updated = prev.filter((m) => m.id !== mealId);
        persistMeals(updated);
        return updated;
      });
    },
    [persistMeals]
  );

  // Date Navigators
  const goToPrevDay = useCallback(() => {
    setSelectedDate((prev) => addDays(prev, -1));
  }, []);

  const goToNextDay = useCallback(() => {
    setSelectedDate((prev) => addDays(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    setSelectedDate(getTodayDateString());
  }, []);

  // Selectors
  const getMealsForDate = useCallback(
    (dateStr: string): Meal[] => {
      return meals.filter((meal) => meal.date === dateStr);
    },
    [meals]
  );

  const getDailyNutrition = useCallback(
    (dateStr: string): DailyNutritionSummary => {
      const dayMeals = meals.filter((m) => m.date === dateStr);

      const consumedCalories = dayMeals.reduce((acc, m) => acc + (m.totalCalories || 0), 0);
      const totalProtein = Math.round(dayMeals.reduce((acc, m) => acc + (m.totalProtein || 0), 0) * 10) / 10;
      const totalCarbs = Math.round(dayMeals.reduce((acc, m) => acc + (m.totalCarbs || 0), 0) * 10) / 10;
      const totalFat = Math.round(dayMeals.reduce((acc, m) => acc + (m.totalFat || 0), 0) * 10) / 10;

      const remainingCalories = Math.max(0, DEFAULT_CALORIE_GOAL - consumedCalories);
      const netCalories = consumedCalories; // In Phase 6, burned will be expanded in Phase 7

      return {
        consumedCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        calorieGoal: DEFAULT_CALORIE_GOAL,
        remainingCalories,
        netCalories,
      };
    },
    [meals]
  );

  const value = useMemo<TrackerContextType>(
    () => ({
      selectedDate,
      isHydrated,
      calorieGoal: DEFAULT_CALORIE_GOAL,
      macroGoals: DEFAULT_MACRO_GOALS,
      meals,
      addMeal,
      deleteMeal,
      setSelectedDate,
      goToPrevDay,
      goToNextDay,
      goToToday,
      getMealsForDate,
      getDailyNutrition,
    }),
    [
      selectedDate,
      isHydrated,
      meals,
      addMeal,
      deleteMeal,
      goToPrevDay,
      goToNextDay,
      goToToday,
      getMealsForDate,
      getDailyNutrition,
    ]
  );

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

export function useTracker(): TrackerContextType {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error("useTracker must be used within a TrackerProvider");
  }
  return context;
}
