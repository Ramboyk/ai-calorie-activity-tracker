"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Flame, Activity, TrendingUp, CheckCircle2 } from "lucide-react";

export interface CalorieHeroCardProps {
  calorieGoal: number;
  caloriesConsumed: number;
  caloriesBurned: number;
  dateLabel?: string;
}

export function CalorieHeroCard({
  calorieGoal = 2000,
  caloriesConsumed = 1420,
  caloriesBurned = 320,
  dateLabel = "Günlük Rapor",
}: CalorieHeroCardProps) {
  const netCalories = Math.max(0, caloriesConsumed - caloriesBurned);
  const remainingCalories = Math.max(0, calorieGoal - netCalories);

  // SVG circular ring calculations
  // Circle radius r = 66, circumference = 2 * PI * 66 ≈ 414.69
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = Math.min(100, Math.round((netCalories / calorieGoal) * 100));
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  return (
    <Card variant="hero" className="w-full relative overflow-hidden">
      {/* Soft radial glow in corner */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary-light/25 via-primary-soft/10 to-transparent rounded-bl-full pointer-events-none" />

      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle as="h2">Enerji Dengesi</CardTitle>
          <CardDescription>{dateLabel} • Hedef ve kalori yakım durumu</CardDescription>
        </div>
        <Badge variant="primary" showDot leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}>
          Hedefinde
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
        {/* Ring Chart Centerpiece */}
        <div className="flex flex-col items-center justify-center py-2 relative">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              {/* Background Ring */}
              <circle
                cx="80"
                cy="80"
                fill="transparent"
                r={radius}
                stroke="#eaedff"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="80"
                cy="80"
                fill="transparent"
                r={radius}
                stroke="#006948"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-app-text-muted">
                Kalan Kalori
              </span>
              <div className="flex items-baseline space-x-0.5">
                <span className="text-4xl font-extrabold text-app-text-main tabular-nums tracking-tight">
                  {remainingCalories.toLocaleString("tr-TR")}
                </span>
                <span className="text-xs font-semibold text-app-text-muted">kcal</span>
              </div>
              <span className="text-xs font-semibold text-primary tabular-nums mt-0.5">
                {netCalories.toLocaleString("tr-TR")} / {calorieGoal.toLocaleString("tr-TR")} kcal
              </span>
            </div>
          </div>
        </div>

        {/* 3-Part Metric Breakdown Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-surface-container">
          {/* Consumed */}
          <div className="flex flex-col items-center text-center p-2.5 sm:p-3 rounded-2xl bg-surface-container-low">
            <span className="text-[11px] font-medium text-app-text-muted flex items-center gap-1">
              <Flame className="w-3 h-3 text-app-text-muted" />
              Alınan
            </span>
            <span className="text-base sm:text-lg font-bold text-app-text-main tabular-nums mt-0.5">
              {caloriesConsumed.toLocaleString("tr-TR")}
            </span>
            <span className="text-[10px] text-app-text-muted tabular-nums">kcal</span>
          </div>

          {/* Burned */}
          <div className="flex flex-col items-center text-center p-2.5 sm:p-3 rounded-2xl bg-surface-container-low">
            <span className="text-[11px] font-medium text-app-text-muted flex items-center gap-1">
              <Activity className="w-3 h-3 text-calorie" />
              Yakılan
            </span>
            <span className="text-base sm:text-lg font-bold text-calorie tabular-nums mt-0.5">
              {caloriesBurned.toLocaleString("tr-TR")}
            </span>
            <span className="text-[10px] text-app-text-muted tabular-nums">kcal</span>
          </div>

          {/* Net */}
          <div className="flex flex-col items-center text-center p-2.5 sm:p-3 rounded-2xl bg-primary-soft/80 border border-primary/10">
            <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-primary" />
              Net
            </span>
            <span className="text-base sm:text-lg font-extrabold text-primary tabular-nums mt-0.5">
              {netCalories.toLocaleString("tr-TR")}
            </span>
            <span className="text-[10px] text-primary/80 tabular-nums">kcal</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CalorieHeroCard;
