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
  MacroCalculatorModal,
  WeightTrackerCard,
  ExportReportModal,
  StreakBadgeCard,
} from "@/components";
import { FileText } from "lucide-react";
import { useTracker } from "@/context";
import { formatDisplayDate } from "@/lib/utils/date";
import type { Meal } from "@/types/meal";
import type { StepsData, WaterLog } from "@/types/activity";
import type { MacroDistributionSummary } from "@/lib/nutrition/macro-calculator";



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
    updateMacroGoals,
    getActivitiesForDate,
    getTotalBurnedCalories,
    showToast,
    gamification,
    openBadgesModal,
  } = useTracker();

  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  const currentMeals = getMealsForDate(selectedDate);
  const nutrition = getDailyNutrition(selectedDate);
  const dayLog = getDailyLog(selectedDate);
  const dayExercises = getActivitiesForDate(selectedDate);
  const totalBurnedCalories = getTotalBurnedCalories(selectedDate);

  const handleAddWater = (amountMl: number) => {
    addWater(amountMl, selectedDate);
  };

  const handleCaptureClick = () => {
    router.push("/analyze");
  };

  const handleAddMealClick = () => {
    router.push("/analyze");
  };

  const handleMealClick = (meal: Meal) => {
    showToast(`${meal.name} seçildi (${meal.totalCalories} kcal)`, "info");
  };

  const handleDeleteMeal = (mealId: string) => {
    deleteMeal(mealId);
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
    showToast(`Yeni kalori hedefi kaydedildi: ${newGoal.toLocaleString("tr-TR")} kcal`, "success");
  };

  const handleApplyMacroGoals = (summary: MacroDistributionSummary) => {
    updateMacroGoals(
      {
        protein: summary.protein,
        carbs: summary.carbs,
        fat: summary.fat,
      },
      summary.targetCalories,
      selectedDate
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-app-text-main antialiased selection:bg-primary-light selection:text-primary">
      {/* Top Sticky Header bound to TrackerContext */}
      <Header />

      {/* Main Responsive Grid Container */}
      <main className="flex-1 w-full pt-4 sm:pt-6 pb-28 md:pb-12">
        <Container className="space-y-6">

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
                onOpenCalculator={() => setIsCalculatorOpen(true)}
              />

              {/* Dynamic Today's Meals Section */}
              <MealSection
                meals={currentMeals}
                onAddMealClick={handleAddMealClick}
                onMealClick={handleMealClick}
                onDeleteMeal={handleDeleteMeal}
              />
            </div>

            {/* Right / Sidebar Column (Streak + Macros + Weight + Activity) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6">
              {/* Dynamic Gamification Streak & Badges Card */}
              <StreakBadgeCard
                gamification={gamification}
                onOpenBadgesModal={openBadgesModal}
              />

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
                onOpenCalculator={() => setIsCalculatorOpen(true)}
              />

              {/* Dynamic Weight Tracker Card with Recharts Trend */}
              <WeightTrackerCard />

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

          {/* Dietitian Report Download Action Bar */}
          <section className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-primary-soft via-surface-container-low to-surface-container border border-primary/20 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-app-text-main">
                  Diyetisyen & Sağlık Raporu
                </p>
                <p className="text-[11px] text-app-text-muted">
                  Klinik A4 PDF çıktısı veya Excel/Google Sheets uyumlu CSV formatında indir
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover active:scale-95 transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Rapor İndir (PDF / CSV)</span>
            </button>
          </section>

          {/* Medical & AI Disclaimer Banner */}
          <footer className="pt-1">
            <DisclaimerBanner />
          </footer>
        </Container>

        {/* Akıllı Hedef Hesaplama Sihirbazı Modalı */}
        <MacroCalculatorModal
          isOpen={isCalculatorOpen}
          onClose={() => setIsCalculatorOpen(false)}
          onApply={handleApplyMacroGoals}
        />

        {/* Diyetisyen & Beslenme Raporu Dışa Aktarma Modalı */}
        <ExportReportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
        />
      </main>

      {/* Mobile Fixed Bottom Navigation Bar with Center Elevated FAB */}
      <BottomNav onCaptureClick={handleCaptureClick} />
    </div>
  );
}
