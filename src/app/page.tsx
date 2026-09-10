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
import type { DailySummary } from "@/types/daily";
import type { Meal } from "@/types/meal";

const initialMockDailyData: DailySummary = {
  date: "2026-09-10",
  userId: "user_demo_1",
  calorieGoal: 2000,
  caloriesConsumed: 1420,
  caloriesBurned: 320,
  netCalories: 1100,
  remainingCalories: 580,
  macros: {
    protein: {
      consumedGrams: 92,
      goalGrams: 120,
      percentage: 76.6,
    },
    carbs: {
      consumedGrams: 145,
      goalGrams: 220,
      percentage: 65.9,
    },
    fat: {
      consumedGrams: 48,
      goalGrams: 65,
      percentage: 73.8,
    },
  },
  steps: {
    date: "2026-09-10",
    count: 8420,
    goal: 10000,
    distanceKm: 6.2,
    activeMinutes: 55,
    caloriesBurned: 245,
    syncSource: "apple_health",
  },
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
  },
  meals: [
    {
      id: "meal_1",
      userId: "user_demo_1",
      date: "2026-09-10",
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
      createdAt: "2026-09-10T08:32:00Z",
      items: [
        {
          id: "item_1_1",
          name: "Ekşi Mayalı Ekmek",
          portion: 2,
          portionUnit: "slice",
          calories: 160,
          protein: 6,
          carbs: 30,
          fat: 1.5,
        },
        {
          id: "item_1_2",
          name: "Poşe Yumurta",
          portion: 2,
          portionUnit: "piece",
          calories: 140,
          protein: 12,
          carbs: 1,
          fat: 10,
        },
        {
          id: "item_1_3",
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
      id: "meal_2",
      userId: "user_demo_1",
      date: "2026-09-10",
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
      createdAt: "2026-09-10T13:12:00Z",
      items: [
        {
          id: "item_2_1",
          name: "Izgara Tavuk Göğsü",
          portion: 180,
          portionUnit: "g",
          calories: 290,
          protein: 44,
          carbs: 0,
          fat: 6,
        },
        {
          id: "item_2_2",
          name: "Yasemin Pirinci",
          portion: 150,
          portionUnit: "g",
          calories: 210,
          protein: 4,
          carbs: 48,
          fat: 1,
        },
        {
          id: "item_2_3",
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
      id: "meal_3",
      userId: "user_demo_1",
      date: "2026-09-10",
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
      createdAt: "2026-09-10T16:22:00Z",
      items: [
        {
          id: "item_3_1",
          name: "Süzme Yoğurt (%2 Yağ)",
          portion: 200,
          portionUnit: "g",
          calories: 140,
          protein: 18,
          carbs: 8,
          fat: 4,
        },
        {
          id: "item_3_2",
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
  ],
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
  ],
};

export default function DashboardPage() {
  const router = useRouter();
  const [dailyData, setDailyData] = useState<DailySummary>(initialMockDailyData);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddWater = (amountMl: number) => {
    setDailyData((prev) => ({
      ...prev,
      water: {
        ...prev.water,
        currentMl: prev.water.currentMl + amountMl,
      },
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
    showNotification(`${meal.name} seçildi (Öğün detay ekranı)`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-app-text-main antialiased selection:bg-primary-light selection:text-primary">
      {/* Top Sticky Header */}
      <Header
        currentDateText="10 Eylül, Çarşamba"
        onPrevDay={() => showNotification("Önceki günün verileri")}
        onNextDay={() => showNotification("Sonraki günün verileri")}
      />

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
              {/* Hero Calorie Balance Card */}
              <CalorieHeroCard
                calorieGoal={dailyData.calorieGoal}
                caloriesConsumed={dailyData.caloriesConsumed}
                caloriesBurned={dailyData.caloriesBurned}
                dateLabel="10 Eylül, Çarşamba"
              />

              {/* Today's Meals Section */}
              <MealSection
                meals={dailyData.meals}
                onAddMealClick={handleAddMealClick}
                onMealClick={handleMealClick}
              />
            </div>

            {/* Right / Sidebar Column (Macros + Steps & Water + Activity) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6">
              {/* Macro Distribution Card */}
              <MacroDistribution macros={dailyData.macros} />

              {/* Steps & Water Quick Metrics Grid */}
              <QuickMetrics
                steps={dailyData.steps}
                water={dailyData.water}
                onAddWater={handleAddWater}
              />

              {/* Activity & Exercises Summary Card */}
              <ActivitySummaryCard
                exercises={dailyData.exercises}
                totalBurnedCalories={dailyData.caloriesBurned}
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
