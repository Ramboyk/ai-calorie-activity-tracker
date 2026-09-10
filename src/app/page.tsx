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
import type { StepsData, WaterLog } from "@/types/activity";



export default function DashboardPage() {
  const router = useRouter();
  const {
    selectedDate,
    getMealsForDate,
    getDailyNutrition,
    deleteMeal,
    calorieGoal,
    macroGoals,
    getDailyLog,
    addWater,
    updateCalorieGoal,
    getActivitiesForDate,
    getTotalBurnedCalories,
  } = useTracker();

  const [notification, setNotification] = useState<string | null>(null);

  const currentMeals = getMealsForDate(selectedDate);
  const nutrition = getDailyNutrition(selectedDate);
  const dayLog = getDailyLog(selectedDate);
  const dayExercises = getActivitiesForDate(selectedDate);
  const totalBurnedCalories = getTotalBurnedCalories(selectedDate);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddWater = (amountMl: number) => {
    addWater(amountMl, selectedDate);
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

  const handleAddActivityClick = () => {
    router.push("/activity");
  };

  // Convert dayLog to StepsData and WaterLog for QuickMetrics
  const stepsData: StepsData = {
    date: selectedDate,
    count: dayLog.steps,
    goal: dayLog.stepGoal,
    distanceKm: dayLog.distanceKm || Math.round(dayLog.steps * 0.00072 * 10) / 10,
    activeMinutes: dayLog.activeMinutes || Math.round(dayLog.steps / 114),
    caloriesBurned: Math.round(dayLog.steps * 0.04),
    syncSource: "apple_health",
  };

  const waterData: WaterLog = {
    date: selectedDate,
    currentMl: dayLog.waterMl,
    goalMl: dayLog.waterGoalMl,
    entries: [],
  };

  const handleUpdateCalorieGoal = (newGoal: number) => {
    updateCalorieGoal(newGoal, selectedDate);
    showNotification(`Yeni kalori hedefi kaydedildi: ${newGoal.toLocaleString("tr-TR")} kcal`);
  };

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
                calorieGoal={nutrition.calorieGoal || calorieGoal}
                caloriesConsumed={nutrition.consumedCalories}
                caloriesBurned={totalBurnedCalories}
                dateLabel={formatDisplayDate(selectedDate)}
                onUpdateGoal={handleUpdateCalorieGoal}
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
                steps={stepsData}
                water={waterData}
                onAddWater={handleAddWater}
                onStepClick={handleAddActivityClick}
              />

              {/* Activity & Exercises Summary Card */}
              <ActivitySummaryCard
                exercises={dayExercises}
                totalBurnedCalories={totalBurnedCalories}
                onAddActivityClick={handleAddActivityClick}
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
