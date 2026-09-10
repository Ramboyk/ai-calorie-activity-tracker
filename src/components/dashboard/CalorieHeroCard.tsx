"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Flame, Activity, TrendingUp, CheckCircle2, Edit2, AlertCircle, Check, X } from "lucide-react";

export interface CalorieHeroCardProps {
  calorieGoal: number;
  caloriesConsumed: number;
  caloriesBurned: number;
  dateLabel?: string;
  onUpdateGoal?: (newGoal: number) => void;
}

export function CalorieHeroCard({
  calorieGoal = 2000,
  caloriesConsumed = 0,
  caloriesBurned = 0,
  dateLabel = "Günlük Rapor",
  onUpdateGoal,
}: CalorieHeroCardProps) {
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [goalInput, setGoalInput] = useState<string>(String(calorieGoal));

  // Safe division & energy balance formulas
  const safeGoal = Math.max(1000, calorieGoal || 2000);
  const netCalories = caloriesConsumed - caloriesBurned;
  const remainingCalories = Math.max(0, safeGoal - netCalories);

  // SVG circular ring calculations
  // Circle radius r = 66, circumference = 2 * PI * 66 ≈ 414.69
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  // Progress percentage (can exceed 100 for color trigger)
  const exactPercent = (netCalories / safeGoal) * 100;
  const isExceeded = netCalories > safeGoal;
  const isNearGoal = exactPercent >= 85 && !isExceeded;

  const clampedProgressPercent = Math.min(100, Math.max(0, exactPercent));
  const strokeDashoffset = circumference - (circumference * clampedProgressPercent) / 100;

  // Ring stroke color based on status
  const ringStrokeColor = isExceeded
    ? "#ba1a1a" // error red
    : isNearGoal
    ? "#00855d" // vibrant primary
    : "#006948"; // default deep emerald

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(goalInput, 10);
    if (val && val >= 1000 && val <= 6000 && onUpdateGoal) {
      onUpdateGoal(val);
      setIsEditingGoal(false);
    }
  };

  return (
    <Card variant="hero" className="w-full relative overflow-hidden">
      {/* Soft radial glow in corner */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary-light/25 via-primary-soft/10 to-transparent rounded-bl-full pointer-events-none" />

      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle as="h2">Enerji Dengesi</CardTitle>
          <CardDescription>{dateLabel} • Net kalori ve hedef dengesi</CardDescription>
        </div>

        <div className="flex items-center gap-2">
          {isExceeded ? (
            <Badge variant="calorie" showDot leftIcon={<AlertCircle className="w-3.5 h-3.5" />}>
              Hedef Aşıldı
            </Badge>
          ) : (
            <Badge variant="primary" showDot leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}>
              Hedefinde
            </Badge>
          )}

          {onUpdateGoal && (
            <button
              type="button"
              onClick={() => {
                setGoalInput(String(calorieGoal));
                setIsEditingGoal(!isEditingGoal);
              }}
              title="Kalori Hedefini Düzenle"
              aria-label="Günlük Kalori Hedefini Düzenle"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-app-text-muted hover:text-primary hover:bg-surface-container transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-1">
        {/* Inline Goal Editor Drawer */}
        {isEditingGoal && (
          <form
            onSubmit={handleSaveGoal}
            className="p-3.5 bg-surface-container-low rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 border border-surface-container animate-fade-in"
          >
            <div className="flex-1">
              <label htmlFor="hero-goal-input" className="text-[11px] font-semibold text-app-text-muted block mb-1">
                Günlük Kalori Hedefi (1,000 - 6,000 kcal)
              </label>
              <input
                id="hero-goal-input"
                type="number"
                min="1000"
                max="6000"
                step="50"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-white border border-surface-container focus:border-primary text-app-text-main text-sm font-bold outline-none tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                aria-label="Hedefi Kaydet"
                className="h-11 min-h-[44px] min-w-[44px] px-4 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-primary-hover active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Check className="w-4 h-4" />
                <span>Kaydet</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingGoal(false)}
                aria-label="Düzenlemeyi İptal Et"
                className="h-11 min-h-[44px] min-w-[44px] px-3.5 rounded-xl border border-surface-container text-app-text-muted hover:text-app-text-main text-xs font-medium transition-colors active:scale-95 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

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
                stroke={ringStrokeColor}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-app-text-muted">
                {isExceeded ? "Aşılan Miktar" : "Kalan Kalori"}
              </span>
              <div className="flex items-baseline space-x-0.5">
                <span
                  className={`text-4xl font-extrabold tabular-nums tracking-tight ${
                    isExceeded ? "text-error" : "text-app-text-main"
                  }`}
                >
                  {isExceeded
                    ? `+${(netCalories - safeGoal).toLocaleString("tr-TR")}`
                    : remainingCalories.toLocaleString("tr-TR")}
                </span>
                <span className="text-xs font-semibold text-app-text-muted">kcal</span>
              </div>
              <span className="text-xs font-semibold text-primary tabular-nums mt-0.5">
                Net: {netCalories.toLocaleString("tr-TR")} / {safeGoal.toLocaleString("tr-TR")} kcal
              </span>
            </div>
          </div>
        </div>

        {/* 3-Part Metric Breakdown Grid (Alınan / Yakılan / Net) */}
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
          <div
            className={`flex flex-col items-center text-center p-2.5 sm:p-3 rounded-2xl border transition-colors ${
              isExceeded
                ? "bg-error/10 border-error/20 text-error"
                : "bg-primary-soft/80 border-primary/10 text-primary"
            }`}
          >
            <span className="text-[11px] font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Net
            </span>
            <span className="text-base sm:text-lg font-extrabold tabular-nums mt-0.5">
              {netCalories.toLocaleString("tr-TR")}
            </span>
            <span className="text-[10px] opacity-80 tabular-nums">kcal</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CalorieHeroCard;

