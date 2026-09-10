"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { Meal } from "@/types/meal";
import type { DailyLog, ExerciseLog } from "@/types/activity";
import type { WeeklyStats, WeeklyDayStat } from "@/types/daily";
import {
  getTodayDateString,
  addDays,
  getDayShortLabel,
  getWeekRangeLabel,
  getWeekNumber,
} from "@/lib/utils/date";
import {
  saveMealToFirestore,
  deleteMealFromFirestore,
  saveDailyLogToFirestore,
  saveActivityToFirestore,
  deleteActivityFromFirestore,
  fetchUserDataFromFirestore,
} from "@/lib/firebase/firestore";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { ToastContainer, type ToastItem, type ToastType } from "@/components/ui/Toast";

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
  burnedCalories: number;
}

export type SyncStatus = "local" | "synced" | "syncing" | "error";

export interface TrackerContextType {
  selectedDate: string;
  isHydrated: boolean;
  syncStatus: SyncStatus;
  calorieGoal: number;
  macroGoals: MacroGoals;
  meals: Meal[];
  activities: ExerciseLog[];
  dailyLogs: Record<string, DailyLog>;
  // Meal Actions
  addMeal: (mealData: Omit<Meal, "id" | "createdAt"> | Meal) => Meal;
  deleteMeal: (mealId: string) => void;
  // Date Navigators
  setSelectedDate: (dateStr: string) => void;
  goToPrevDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
  // Selectors
  getMealsForDate: (dateStr: string) => Meal[];
  getDailyNutrition: (dateStr: string) => DailyNutritionSummary;
  // Water & Steps Actions
  addWater: (amountMl: number, dateStr?: string) => void;
  resetWater: (dateStr?: string) => void;
  setWater: (ml: number, dateStr?: string) => void;
  updateSteps: (steps: number, dateStr?: string) => void;
  updateStepGoal: (goal: number, dateStr?: string) => void;
  updateCalorieGoal: (goal: number, dateStr?: string) => void;
  getDailyLog: (dateStr: string) => DailyLog;
  // Activity Actions
  addActivity: (activityData: Omit<ExerciseLog, "id" | "createdAt">) => ExerciseLog;
  deleteActivity: (activityId: string) => void;
  getActivitiesForDate: (dateStr: string) => ExerciseLog[];
  getTotalBurnedCalories: (dateStr: string) => number;
  // Weekly Insights Selector
  getWeeklyStats: () => WeeklyStats;
  // Cloud Sync
  refreshFromCloud: () => Promise<void>;
  // Toast Notification
  showToast: (message: string, type?: ToastType) => void;
}

const LOCAL_STORAGE_MEALS_KEY = "nutritrack_meals_v1";
const LOCAL_STORAGE_ACTIVITIES_KEY = "nutritrack_activities_v1";
const LOCAL_STORAGE_DAILY_LOGS_KEY = "nutritrack_daily_logs_v1";

const DEFAULT_CALORIE_GOAL = 2000;

const DEFAULT_STEP_GOAL = 10000;
const DEFAULT_WATER_GOAL = 2500;

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
        name: "Böğürtlen & Yaban Mersini",
        portion: 80,
        portionUnit: "g",
        calories: 45,
        protein: 0.5,
        carbs: 11,
        fat: 0,
      },
      {
        id: "seed_item_3_3",
        name: "Çiğ Badem İçi",
        portion: 10,
        portionUnit: "g",
        calories: 60,
        protein: 2,
        carbs: 2,
        fat: 5,
      },
    ],
  },
];

// Seed activities matching Stitch UI
const getInitialSeedActivities = (todayStr: string): ExerciseLog[] => [
  {
    id: "seed_act_1",
    userId: "user_demo_1",
    date: todayStr,
    time: "09:15",
    type: "walking",
    title: "Yürüyüş",
    durationMinutes: 30,
    caloriesBurned: 130,
    createdAt: `${todayStr}T09:45:00Z`,
  },
  {
    id: "seed_act_2",
    userId: "user_demo_1",
    date: todayStr,
    time: "18:00",
    type: "fitness",
    title: "Fitness & Kuvvet",
    durationMinutes: 20,
    caloriesBurned: 190,
    createdAt: `${todayStr}T18:25:00Z`,
  },
];

// Seed daily log (steps & water) matching Stitch UI
const getInitialSeedDailyLogs = (todayStr: string): Record<string, DailyLog> => ({
  [todayStr]: {
    date: todayStr,
    steps: 8420,
    stepGoal: 10000,
    waterMl: 1750,
    waterGoalMl: 2500,
    distanceKm: 6.1,
    activeMinutes: 74,
  },
});

const TrackerContext = createContext<TrackerContextType | null>(null);

export function TrackerProvider({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [activities, setActivities] = useState<ExerciseLog[]>([]);
  const [dailyLogs, setDailyLogs] = useState<Record<string, DailyLog>>({});
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    isFirebaseConfigured() ? "synced" : "local"
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { id, message, type };
    setToasts((prev) => [...prev.slice(-3), newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // Sync to LocalStorage helpers
  const persistMeals = useCallback((newMeals: Meal[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_MEALS_KEY, JSON.stringify(newMeals));
    } catch (err) {
      console.error("[NutriTrack AI] localStorage yazma hatası (meals):", err);
    }
  }, []);

  const persistActivities = useCallback((newActs: ExerciseLog[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ACTIVITIES_KEY, JSON.stringify(newActs));
    } catch (err) {
      console.error("[NutriTrack AI] localStorage yazma hatası (activities):", err);
    }
  }, []);

  const persistDailyLogs = useCallback((newLogs: Record<string, DailyLog>) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_DAILY_LOGS_KEY, JSON.stringify(newLogs));
    } catch (err) {
      console.error("[NutriTrack AI] localStorage yazma hatası (dailyLogs):", err);
    }
  }, []);

  // Background Cloud Sync helpers
  const syncDailyLogInBackground = useCallback((log: DailyLog) => {
    if (isFirebaseConfigured()) {
      setSyncStatus("syncing");
      saveDailyLogToFirestore(log)
        .then(() => setSyncStatus("synced"))
        .catch((err) => {
          console.warn("[NutriTrack AI] Firestore saveDailyLog error:", err);
          setSyncStatus("error");
        });
    }
  }, []);

  const refreshFromCloud = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      setSyncStatus("local");
      return;
    }

    try {
      setSyncStatus("syncing");
      const cloudData = await fetchUserDataFromFirestore();
      if (cloudData) {
        if (cloudData.meals && cloudData.meals.length > 0) {
          setMeals(cloudData.meals);
          persistMeals(cloudData.meals);
        }
        if (cloudData.activities && cloudData.activities.length > 0) {
          setActivities(cloudData.activities);
          persistActivities(cloudData.activities);
        }
        if (cloudData.dailyLogs && Object.keys(cloudData.dailyLogs).length > 0) {
          setDailyLogs((prev) => {
            const merged = { ...prev, ...cloudData.dailyLogs };
            persistDailyLogs(merged);
            return merged;
          });
        }
      }
      setSyncStatus("synced");
    } catch (err) {
      console.warn("[NutriTrack AI] Firestore senkronizasyon hatası:", err);
      setSyncStatus("error");
    }
  }, [persistMeals, persistActivities, persistDailyLogs]);

  // Read LocalStorage on Client Mount (SSR-Safe) & Background Cloud Hydration
  useEffect(() => {
    queueMicrotask(() => {
      const todayStr = getTodayDateString();

      // Hydrate Meals
      try {
        const storedMeals = localStorage.getItem(LOCAL_STORAGE_MEALS_KEY);
        if (storedMeals) {
          const parsed = JSON.parse(storedMeals) as Meal[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMeals(parsed);
          } else {
            const initialSeed = getInitialSeedMeals(todayStr);
            setMeals(initialSeed);
            localStorage.setItem(LOCAL_STORAGE_MEALS_KEY, JSON.stringify(initialSeed));
          }
        } else {
          const initialSeed = getInitialSeedMeals(todayStr);
          setMeals(initialSeed);
          localStorage.setItem(LOCAL_STORAGE_MEALS_KEY, JSON.stringify(initialSeed));
        }
      } catch (err) {
        console.error("[NutriTrack AI] meals localStorage okuma hatası:", err);
        setMeals(getInitialSeedMeals(todayStr));
      }

      // Hydrate Activities
      try {
        const storedActs = localStorage.getItem(LOCAL_STORAGE_ACTIVITIES_KEY);
        if (storedActs) {
          const parsed = JSON.parse(storedActs) as ExerciseLog[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setActivities(parsed);
          } else {
            const initialActs = getInitialSeedActivities(todayStr);
            setActivities(initialActs);
            localStorage.setItem(LOCAL_STORAGE_ACTIVITIES_KEY, JSON.stringify(initialActs));
          }
        } else {
          const initialActs = getInitialSeedActivities(todayStr);
          setActivities(initialActs);
          localStorage.setItem(LOCAL_STORAGE_ACTIVITIES_KEY, JSON.stringify(initialActs));
        }
      } catch (err) {
        console.error("[NutriTrack AI] activities localStorage okuma hatası:", err);
        setActivities(getInitialSeedActivities(todayStr));
      }

      // Hydrate Daily Logs (Steps & Water)
      try {
        const storedLogs = localStorage.getItem(LOCAL_STORAGE_DAILY_LOGS_KEY);
        if (storedLogs) {
          const parsed = JSON.parse(storedLogs) as Record<string, DailyLog>;
          if (parsed && typeof parsed === "object") {
            setDailyLogs(parsed);
          } else {
            const initialLogs = getInitialSeedDailyLogs(todayStr);
            setDailyLogs(initialLogs);
            localStorage.setItem(LOCAL_STORAGE_DAILY_LOGS_KEY, JSON.stringify(initialLogs));
          }
        } else {
          const initialLogs = getInitialSeedDailyLogs(todayStr);
          setDailyLogs(initialLogs);
          localStorage.setItem(LOCAL_STORAGE_DAILY_LOGS_KEY, JSON.stringify(initialLogs));
        }
      } catch (err) {
        console.error("[NutriTrack AI] dailyLogs localStorage okuma hatası:", err);
        setDailyLogs(getInitialSeedDailyLogs(todayStr));
      } finally {
        setIsHydrated(true);
      }

      // Silent cloud synchronization after local hydration
      if (isFirebaseConfigured()) {
        void refreshFromCloud();
      }
    });
  }, [refreshFromCloud]);

  // Meal Actions
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

      if (isFirebaseConfigured()) {
        setSyncStatus("syncing");
        saveMealToFirestore(newMeal)
          .then(() => setSyncStatus("synced"))
          .catch((err) => {
            console.warn("[NutriTrack AI] Firestore addMeal error:", err);
            setSyncStatus("error");
          });
      }

      showToast("Öğün günlüğe kaydedildi 🥑", "success");
      return newMeal;
    },
    [selectedDate, persistMeals, showToast]
  );

  const deleteMeal = useCallback(
    (mealId: string) => {
      setMeals((prev) => {
        const updated = prev.filter((m) => m.id !== mealId);
        persistMeals(updated);
        return updated;
      });

      if (isFirebaseConfigured()) {
        setSyncStatus("syncing");
        deleteMealFromFirestore(mealId)
          .then(() => setSyncStatus("synced"))
          .catch((err) => {
            console.warn("[NutriTrack AI] Firestore deleteMeal error:", err);
            setSyncStatus("error");
          });
      }

      showToast("Öğün listeden silindi 🗑️", "info");
    },
    [persistMeals, showToast]
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

  // DailyLog selector
  const getDailyLog = useCallback(
    (dateStr: string): DailyLog => {
      if (dailyLogs[dateStr]) {
        return dailyLogs[dateStr];
      }
      return {
        date: dateStr,
        steps: 0,
        stepGoal: DEFAULT_STEP_GOAL,
        waterMl: 0,
        waterGoalMl: DEFAULT_WATER_GOAL,
        distanceKm: 0,
        activeMinutes: 0,
      };
    },
    [dailyLogs]
  );

  // Water Actions
  const addWater = useCallback(
    (amountMl: number, targetDate?: string) => {
      const dateKey = targetDate || selectedDate;
      const validAmount = Math.max(0, amountMl);
      setDailyLogs((prev) => {
        const current = prev[dateKey] || {
          date: dateKey,
          steps: 0,
          stepGoal: DEFAULT_STEP_GOAL,
          waterMl: 0,
          waterGoalMl: DEFAULT_WATER_GOAL,
          distanceKm: 0,
          activeMinutes: 0,
        };
        const updatedLog: DailyLog = {
          ...current,
          waterMl: Math.min(10000, current.waterMl + validAmount),
        };
        const updated = { ...prev, [dateKey]: updatedLog };
        persistDailyLogs(updated);
        syncDailyLogInBackground(updatedLog);
        return updated;
      });
      showToast(`+${validAmount} ml su kaydedildi 💧`, "success");
    },
    [selectedDate, persistDailyLogs, syncDailyLogInBackground, showToast]
  );

  const resetWater = useCallback(
    (targetDate?: string) => {
      const dateKey = targetDate || selectedDate;
      setDailyLogs((prev) => {
        const current = prev[dateKey] || {
          date: dateKey,
          steps: 0,
          stepGoal: DEFAULT_STEP_GOAL,
          waterMl: 0,
          waterGoalMl: DEFAULT_WATER_GOAL,
          distanceKm: 0,
          activeMinutes: 0,
        };
        const updatedLog: DailyLog = {
          ...current,
          waterMl: 0,
        };
        const updated = { ...prev, [dateKey]: updatedLog };
        persistDailyLogs(updated);
        syncDailyLogInBackground(updatedLog);
        return updated;
      });
    },
    [selectedDate, persistDailyLogs, syncDailyLogInBackground]
  );

  const setWater = useCallback(
    (ml: number, targetDate?: string) => {
      const dateKey = targetDate || selectedDate;
      const validMl = Math.max(0, ml);
      setDailyLogs((prev) => {
        const current = prev[dateKey] || {
          date: dateKey,
          steps: 0,
          stepGoal: DEFAULT_STEP_GOAL,
          waterMl: 0,
          waterGoalMl: DEFAULT_WATER_GOAL,
          distanceKm: 0,
          activeMinutes: 0,
        };
        const updatedLog: DailyLog = {
          ...current,
          waterMl: validMl,
        };
        const updated = { ...prev, [dateKey]: updatedLog };
        persistDailyLogs(updated);
        syncDailyLogInBackground(updatedLog);
        return updated;
      });
    },
    [selectedDate, persistDailyLogs, syncDailyLogInBackground]
  );

  // Steps Actions
  const updateSteps = useCallback(
    (steps: number, targetDate?: string) => {
      const dateKey = targetDate || selectedDate;
      const validSteps = Math.max(0, steps);
      // Rough distance: ~0.72m per step -> 1388 steps per km
      const distanceKm = Math.round((validSteps * 0.00072) * 10) / 10;
      // Rough active minutes: ~110 steps/min
      const activeMinutes = Math.round(validSteps / 114);

      setDailyLogs((prev) => {
        const current = prev[dateKey] || {
          date: dateKey,
          steps: 0,
          stepGoal: DEFAULT_STEP_GOAL,
          waterMl: 0,
          waterGoalMl: DEFAULT_WATER_GOAL,
          distanceKm: 0,
          activeMinutes: 0,
        };
        const updatedLog: DailyLog = {
          ...current,
          steps: validSteps,
          distanceKm,
          activeMinutes,
        };
        const updated = { ...prev, [dateKey]: updatedLog };
        persistDailyLogs(updated);
        syncDailyLogInBackground(updatedLog);
        return updated;
      });
    },
    [selectedDate, persistDailyLogs, syncDailyLogInBackground]
  );

  // Calorie Goal Actions
  const updateCalorieGoal = useCallback(
    (goal: number, targetDate?: string) => {
      const dateKey = targetDate || selectedDate;
      const validGoal = Math.min(6000, Math.max(1000, goal));
      setDailyLogs((prev) => {
        const current = prev[dateKey] || {
          date: dateKey,
          steps: 0,
          stepGoal: DEFAULT_STEP_GOAL,
          waterMl: 0,
          waterGoalMl: DEFAULT_WATER_GOAL,
          distanceKm: 0,
          activeMinutes: 0,
        };
        const updatedLog: DailyLog = {
          ...current,
          calorieGoal: validGoal,
        };
        const updated = { ...prev, [dateKey]: updatedLog };
        persistDailyLogs(updated);
        syncDailyLogInBackground(updatedLog);
        return updated;
      });
    },
    [selectedDate, persistDailyLogs, syncDailyLogInBackground]
  );

  const updateStepGoal = useCallback(
    (goal: number, targetDate?: string) => {
      const dateKey = targetDate || selectedDate;
      const validGoal = Math.max(500, goal);
      setDailyLogs((prev) => {
        const current = prev[dateKey] || {
          date: dateKey,
          steps: 0,
          stepGoal: DEFAULT_STEP_GOAL,
          waterMl: 0,
          waterGoalMl: DEFAULT_WATER_GOAL,
          distanceKm: 0,
          activeMinutes: 0,
        };
        const updatedLog: DailyLog = {
          ...current,
          stepGoal: validGoal,
        };
        const updated = { ...prev, [dateKey]: updatedLog };
        persistDailyLogs(updated);
        syncDailyLogInBackground(updatedLog);
        return updated;
      });
    },
    [selectedDate, persistDailyLogs, syncDailyLogInBackground]
  );

  // Activity Actions
  const addActivity = useCallback(
    (activityData: Omit<ExerciseLog, "id" | "createdAt">): ExerciseLog => {
      const now = new Date();
      const timeStr =
        activityData.time ||
        String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");

      const newAct: ExerciseLog = {
        ...activityData,
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        date: activityData.date || selectedDate,
        time: timeStr,
        createdAt: new Date().toISOString(),
      };

      setActivities((prev) => {
        const updated = [newAct, ...prev];
        persistActivities(updated);
        return updated;
      });

      if (isFirebaseConfigured()) {
        setSyncStatus("syncing");
        saveActivityToFirestore(newAct)
          .then(() => setSyncStatus("synced"))
          .catch((err) => {
            console.warn("[NutriTrack AI] Firestore saveActivity error:", err);
            setSyncStatus("error");
          });
      }

      showToast("Egzersiz eklendi 🏃", "success");
      return newAct;
    },
    [selectedDate, persistActivities, showToast]
  );

  const deleteActivity = useCallback(
    (activityId: string) => {
      setActivities((prev) => {
        const updated = prev.filter((a) => a.id !== activityId);
        persistActivities(updated);
        return updated;
      });

      if (isFirebaseConfigured()) {
        setSyncStatus("syncing");
        deleteActivityFromFirestore(activityId)
          .then(() => setSyncStatus("synced"))
          .catch((err) => {
            console.warn("[NutriTrack AI] Firestore deleteActivity error:", err);
            setSyncStatus("error");
          });
      }

      showToast("Egzersiz silindi 🗑️", "info");
    },
    [persistActivities, showToast]
  );

  const getActivitiesForDate = useCallback(
    (dateStr: string): ExerciseLog[] => {
      return activities.filter((act) => act.date === dateStr);
    },
    [activities]
  );

  const getTotalBurnedCalories = useCallback(
    (dateStr: string): number => {
      const dayActs = activities.filter((act) => act.date === dateStr);
      const exerciseBurned = dayActs.reduce((acc, act) => acc + (act.caloriesBurned || 0), 0);
      const dayLog = dailyLogs[dateStr];
      // Step burn estimate: ~0.04 kcal per step
      const stepBurned = dayLog ? Math.round(dayLog.steps * 0.04) : 0;
      return exerciseBurned + stepBurned;
    },
    [activities, dailyLogs]
  );

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
      const dayLog = dailyLogs[dateStr];
      const targetCalorieGoal = dayLog?.calorieGoal || DEFAULT_CALORIE_GOAL;

      const consumedCalories = dayMeals.reduce((acc, m) => acc + (m.totalCalories || 0), 0);
      const totalProtein = Math.round(dayMeals.reduce((acc, m) => acc + (m.totalProtein || 0), 0) * 10) / 10;
      const totalCarbs = Math.round(dayMeals.reduce((acc, m) => acc + (m.totalCarbs || 0), 0) * 10) / 10;
      const totalFat = Math.round(dayMeals.reduce((acc, m) => acc + (m.totalFat || 0), 0) * 10) / 10;

      const burnedCalories = getTotalBurnedCalories(dateStr);
      const netCalories = consumedCalories - burnedCalories;
      const remainingCalories = Math.max(0, targetCalorieGoal - netCalories);

      return {
        consumedCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        calorieGoal: targetCalorieGoal,
        remainingCalories,
        netCalories,
        burnedCalories,
      };
    },
    [meals, dailyLogs, getTotalBurnedCalories]
  );

  // Dynamically derive current date's calorieGoal and balanced macro goals (25% protein, 50% carb, 25% fat)
  const currentDailyLog = dailyLogs[selectedDate];
  const activeCalorieGoal = currentDailyLog?.calorieGoal || DEFAULT_CALORIE_GOAL;

  const dynamicMacroGoals: MacroGoals = useMemo(() => {
    // 1g Protein = 4 kcal, 1g Carbs = 4 kcal, 1g Fat = 9 kcal
    const proteinGrams = Math.round((activeCalorieGoal * 0.25) / 4);
    const carbsGrams = Math.round((activeCalorieGoal * 0.50) / 4);
    const fatGrams = Math.round((activeCalorieGoal * 0.25) / 9);

    return {
      protein: proteinGrams,
      carbs: carbsGrams,
      fat: fatGrams,
    };
  }, [activeCalorieGoal]);

  // Weekly Stats Selector: computes last 7 days metrics
  const getWeeklyStats = useCallback((): WeeklyStats => {
    const todayStr = getTodayDateString();
    const days: WeeklyDayStat[] = [];

    // Past 7 days: 6 days ago -> today
    for (let i = 6; i >= 0; i--) {
      const dateStr = addDays(todayStr, -i);
      const dayMeals = meals.filter((m) => m.date === dateStr);
      const dayActs = activities.filter((a) => a.date === dateStr);
      const dayLog = dailyLogs[dateStr];

      // If user has real entries for this day, calculate from state;
      // otherwise, if it's an earlier day with no data, provide realistic Stitch baseline trend data
      const hasRealData = dayMeals.length > 0 || dayActs.length > 0 || !!dayLog;

      let consumed = dayMeals.reduce((acc, m) => acc + (m.totalCalories || 0), 0);
      let actBurned = dayActs.reduce((acc, a) => acc + (a.caloriesBurned || 0), 0);
      let actMinutes = dayActs.reduce((acc, a) => acc + (a.durationMinutes || 0), 0);
      let steps = dayLog?.steps || 0;
      let waterMl = dayLog?.waterMl || 0;
      const stepGoal = dayLog?.stepGoal || DEFAULT_STEP_GOAL;
      const waterGoalMl = dayLog?.waterGoalMl || DEFAULT_WATER_GOAL;
      const calorieGoal = dayLog?.calorieGoal || DEFAULT_CALORIE_GOAL;

      if (!hasRealData && i > 0) {
        // Stitch baseline mock trend numbers for past days
        const mockPattern = [
          { c: 1880, b: 340, s: 8900, w: 2250, m: 45 },
          { c: 2050, b: 410, s: 10400, w: 2500, m: 50 },
          { c: 1760, b: 290, s: 8100, w: 2000, m: 35 },
          { c: 1980, b: 350, s: 9400, w: 2400, m: 40 },
          { c: 1820, b: 320, s: 8800, w: 2100, m: 45 },
          { c: 2150, b: 450, s: 11200, w: 2600, m: 60 },
        ];
        const pattern = mockPattern[(6 - i) % mockPattern.length];
        consumed = pattern.c;
        actBurned = pattern.b;
        steps = pattern.s;
        waterMl = pattern.w;
        actMinutes = pattern.m;
      }

      const stepBurned = Math.round(steps * 0.04);
      const totalBurned = actBurned + stepBurned;
      const net = consumed - totalBurned;

      days.push({
        date: dateStr,
        dayLabel: getDayShortLabel(dateStr),
        consumedCalories: consumed,
        burnedCalories: totalBurned,
        netCalories: net,
        calorieGoal,
        steps,
        stepGoal,
        waterMl,
        waterGoalMl,
        activeMinutes: actMinutes,
      });
    }

    const startDateStr = days[0].date;
    const endDateStr = days[days.length - 1].date;

    const activeDaysCount = days.filter(
      (d) => d.consumedCalories > 0 || d.burnedCalories > 0 || d.steps > 0
    ).length;

    const sumConsumed = days.reduce((acc, d) => acc + d.consumedCalories, 0);
    const sumNet = days.reduce((acc, d) => acc + d.netCalories, 0);
    const sumBurned = days.reduce((acc, d) => acc + d.burnedCalories, 0);
    const sumSteps = days.reduce((acc, d) => acc + d.steps, 0);
    const sumWaterMl = days.reduce((acc, d) => acc + d.waterMl, 0);
    const sumActiveMinutes = days.reduce((acc, d) => acc + d.activeMinutes, 0);

    const count = days.length || 7;

    return {
      weekStart: startDateStr,
      weekEnd: endDateStr,
      weekRangeLabel: getWeekRangeLabel(startDateStr, endDateStr),
      weekNumber: getWeekNumber(endDateStr),
      days,
      averages: {
        avgConsumedCalories: Math.round(sumConsumed / count),
        avgNetCalories: Math.round(sumNet / count),
        avgBurnedCalories: Math.round(sumBurned / count),
        avgSteps: Math.round(sumSteps / count),
        avgWaterLiters: Math.round((sumWaterMl / count / 1000) * 10) / 10,
        activeDaysCount,
        totalActiveMinutes: sumActiveMinutes,
      },
    };
  }, [meals, activities, dailyLogs]);

  const value = useMemo<TrackerContextType>(
    () => ({
      selectedDate,
      isHydrated,
      syncStatus,
      calorieGoal: activeCalorieGoal,
      macroGoals: dynamicMacroGoals,
      meals,
      activities,
      dailyLogs,
      addMeal,
      deleteMeal,
      setSelectedDate,
      goToPrevDay,
      goToNextDay,
      goToToday,
      getMealsForDate,
      getDailyNutrition,
      addWater,
      resetWater,
      setWater,
      updateSteps,
      updateStepGoal,
      updateCalorieGoal,
      getDailyLog,
      addActivity,
      deleteActivity,
      getActivitiesForDate,
      getTotalBurnedCalories,
      getWeeklyStats,
      refreshFromCloud,
      showToast,
    }),
    [
      selectedDate,
      isHydrated,
      syncStatus,
      activeCalorieGoal,
      dynamicMacroGoals,
      meals,
      activities,
      dailyLogs,
      addMeal,
      deleteMeal,
      goToPrevDay,
      goToNextDay,
      goToToday,
      getMealsForDate,
      getDailyNutrition,
      addWater,
      resetWater,
      setWater,
      updateSteps,
      updateStepGoal,
      updateCalorieGoal,
      getDailyLog,
      addActivity,
      deleteActivity,
      getActivitiesForDate,
      getTotalBurnedCalories,
      getWeeklyStats,
      refreshFromCloud,
      showToast,
    ]
  );

  return (
    <TrackerContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </TrackerContext.Provider>
  );
}

export function useTracker(): TrackerContextType {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error("useTracker must be used within a TrackerProvider");
  }
  return context;
}
