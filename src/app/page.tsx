"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Header,
  BottomNav,
  CalorieHeroCard,
  MacroDistribution,
  QuickMetrics,
  MealSection,
  ActivitySummaryCard,
  DisclaimerBanner,
} from "@/components";
import { useTracker } from "@/context";
import { formatDisplayDate } from "@/lib/utils/date";
import type { Meal } from "@/types/meal";
import type { StepsData, WaterLog, ExerciseLog } from "@/types/activity";

// Static mock activity data for items not yet migrated to context
const mockActivityState = {
  steps: {
    date: "2026-09-10",
    count: 8420,
    goal: 10000,
    distanceKm: 6.2,
    activeMinutes: 55,
    caloriesBurned: 245,
    syncSource: "apple_health" as const,
  } satisfies StepsData,
  water: {
    date: "2026-09-10",
    currentMl: 1750,
    goalMl: 2500,
    entries: [
      { id: "w_1", time: "08:15", amountMl: 500 },
      { id: "w_2", time: "11:30", amountMl: 500 },
      { id: "w_3", time: "14:20", amountMl: 500 },
      { id: "w_4", time: "16:45", amountMl: 250 },
    ],
  } satisfies WaterLog,
  exercises: [
    {
      id: "ex_1",
      userId: "user_demo_1",
      date: "2026-09-10",
      time: "07:30",
      type: "walking",
      title: "Tempolu Sabah Yürüyüşü",
      durationMinutes: 30,
      caloriesBurned: 145,
      createdAt: "2026-09-10T08:05:00Z",
    },
    {
      id: "ex_2",
      userId: "user_demo_1",
      date: "2026-09-10",
      time: "17:45",
      type: "fitness",
      title: "Kuvvet Antrenmanı & Core",
      durationMinutes: 25,
      caloriesBurned: 175,
      createdAt: "2026-09-10T18:15:00Z",
    },
  ] satisfies ExerciseLog[],
};

export default function DashboardPage() {
  const router = useRouter();
  const {
    selectedDate,
    getMealsForDate,
    getDailyNutrition,
    deleteMeal,
    calorieGoal,
    macroGoals,
  } = useTracker();

  const [waterState, setWaterState] = useState<WaterLog>(mockActivityState.water);
  const [notification, setNotification] = useState<string | null>(null);

  const currentMeals = getMealsForDate(selectedDate);
  const nutrition = getDailyNutrition(selectedDate);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddWater = (amountMl: number) => {
    setWaterState((prev) => ({
      ...prev,
      currentMl: prev.currentMl + amountMl,
    }));
    showNotification(`+${amountMl} ml su başarıyla kaydedildi!`);
  };

  const handleCaptureClick = () => {
    router.push("/analyze");
  };

  const handleAddMealClick = () => {
    router.push("/analyze");
  };

  const handleMealClick = (meal: Meal) => {
    showNotification(`${meal.name} seçildi (${meal.totalCalories} kcal)`);
  };

  const handleDeleteMeal = (mealId: string) => {
    deleteMeal(mealId);
    showNotification("Öğün başarıyla silindi");
  };

  // Fixed burned calories for demo
  const totalBurnedCalories = mockActivityState.exercises.reduce(
    (acc, ex) => acc + ex.caloriesBurned,
    0
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface text-app-text-main antialiased selection:bg-primary-light selection:text-primary">
      {/* Top Sticky Header bound to TrackerContext */}
      <Header />

      {/* Main Responsive Grid Container */}
      <main className="flex-1 w-full pt-4 sm:pt-6 pb-28 md:pb-12">
        <Container className="space-y-6">
          {/* Notification Toast */}
          {notification && (
            <div className="fixed top-20 right-4 sm:right-8 z-50 bg-app-text-dark text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-lg border border-white/10 animate-fade-in flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-light animate-ping" />
              <span>{notification}</span>
            </div>
          )}

          {/* Desktop & Mobile Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left / Primary Column (Hero Calorie + Meal Section) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              {/* Dynamic Hero Calorie Balance Card */}
              <CalorieHeroCard
                calorieGoal={calorieGoal}
                caloriesConsumed={nutrition.consumedCalories}
                caloriesBurned={totalBurnedCalories}
                dateLabel={formatDisplayDate(selectedDate)}
              />

              {/* Dynamic Today's Meals Section */}
              <MealSection
                meals={currentMeals}
                onAddMealClick={handleAddMealClick}
                onMealClick={handleMealClick}
                onDeleteMeal={handleDeleteMeal}
              />
            </div>

            {/* Right / Sidebar Column (Macros + Steps & Water + Activity) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6">
              {/* Dynamic Macro Distribution Card */}
              <MacroDistribution
                macros={{
                  protein: {
                    consumedGrams: nutrition.totalProtein,
                    goalGrams: macroGoals.protein,
                    percentage:
                      macroGoals.protein > 0
                        ? Math.round((nutrition.totalProtein / macroGoals.protein) * 100)
                        : 0,
                  },
                  carbs: {
                    consumedGrams: nutrition.totalCarbs,
                    goalGrams: macroGoals.carbs,
                    percentage:
                      macroGoals.carbs > 0
                        ? Math.round((nutrition.totalCarbs / macroGoals.carbs) * 100)
                        : 0,
                  },
                  fat: {
                    consumedGrams: nutrition.totalFat,
                    goalGrams: macroGoals.fat,
                    percentage:
                      macroGoals.fat > 0
                        ? Math.round((nutrition.totalFat / macroGoals.fat) * 100)
                        : 0,
                  },
                }}
              />

              {/* Steps & Water Quick Metrics Grid */}
              <QuickMetrics
                steps={mockActivityState.steps}
                water={waterState}
                onAddWater={handleAddWater}
              />

              {/* Activity & Exercises Summary Card */}
              <ActivitySummaryCard
                exercises={mockActivityState.exercises}
                totalBurnedCalories={totalBurnedCalories}
              />
            </div>
          </div>

          {/* Medical & AI Disclaimer Banner */}
          <footer className="pt-2">
            <DisclaimerBanner />
          </footer>
        </Container>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar with Center Elevated FAB */}
      <BottomNav onCaptureClick={handleCaptureClick} />
    </div>
  );
}
