"use client";

import React, { useState } from "react";
import {
  Container,
  Header,
  BottomNav,
  DisclaimerBanner,
} from "@/components";
import { WeeklyStatCards } from "@/components/weekly/WeeklyStatCards";
import { CalorieTrendChart } from "@/components/weekly/CalorieTrendChart";
import { ActivityTrendChart } from "@/components/weekly/ActivityTrendChart";
import { WaterTrendChart } from "@/components/weekly/WaterTrendChart";
import { useTracker } from "@/context";
import { ChevronLeft, ChevronRight, BarChart3, Flame, Footprints, Droplets } from "lucide-react";

type WeeklyTab = "all" | "calories" | "steps" | "water";

export default function WeeklyPage() {
  const { getWeeklyStats, calorieGoal } = useTracker();
  const [activeTab, setActiveTab] = useState<WeeklyTab>("all");

  const weeklyStats = getWeeklyStats();

  const tabs: { id: WeeklyTab; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: "Tüm Grafikler", icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: "calories", label: "Kalori Dengesi", icon: <Flame className="w-3.5 h-3.5" /> },
    { id: "steps", label: "Adım Trendi", icon: <Footprints className="w-3.5 h-3.5" /> },
    { id: "water", label: "Su Tüketimi", icon: <Droplets className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface text-app-text-main antialiased selection:bg-primary-light selection:text-primary">
      {/* Top Header */}
      <Header />

      <main className="flex-1 w-full pt-4 sm:pt-6 pb-28 md:pb-12">
        <Container className="space-y-6 max-w-4xl">
          {/* Week Range Navigator Banner */}
          <div className="flex items-center justify-between bg-surface-container-low p-3 sm:p-4 rounded-2xl border border-surface-container/60 shadow-xs">
            <button
              type="button"
              aria-label="Önceki Hafta"
              title="Önceki Hafta"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-high active:scale-95 text-app-text-main transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-app-text-main tracking-tight">
                  {weeklyStats.weekRangeLabel}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-primary-soft text-primary text-[10px] font-extrabold uppercase tracking-wide">
                  Bu Hafta
                </span>
              </div>
              <span className="text-xs text-app-text-muted mt-0.5">
                {weeklyStats.weekNumber}. Hafta Performans İncelemesi
              </span>
            </div>

            <button
              type="button"
              aria-label="Sonraki Hafta (Gelecek hafta henüz başlamadı)"
              title="Sonraki Hafta"
              disabled
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center bg-surface-container text-app-text-muted/40 cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* 4-Stat Averages Grid */}
          <section>
            <WeeklyStatCards stats={weeklyStats} />
          </section>

          {/* Filter Tabs */}
          <div role="tablist" aria-label="Grafik Görünüm Filtresi" className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  activeTab === tab.id
                    ? "bg-white text-app-text-main shadow-xs font-bold"
                    : "text-app-text-muted hover:text-app-text-main"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Charts Section */}
          <div className="space-y-6">
            {(activeTab === "all" || activeTab === "calories") && (
              <CalorieTrendChart days={weeklyStats.days} targetCalorie={calorieGoal} />
            )}

            {(activeTab === "all" || activeTab === "steps") && (
              <div className={activeTab === "all" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : ""}>
                <ActivityTrendChart days={weeklyStats.days} targetSteps={10000} />
                {activeTab === "all" && (
                  <WaterTrendChart days={weeklyStats.days} targetWaterMl={2500} />
                )}
              </div>
            )}

            {activeTab === "water" && (
              <WaterTrendChart days={weeklyStats.days} targetWaterMl={2500} />
            )}
          </div>

          {/* Footer Disclaimer */}
          <footer className="pt-2">
            <DisclaimerBanner />
          </footer>
        </Container>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
