"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Target,
  Sparkles,
  Flame,
  Scale,
  Dumbbell,
  Check,
  Info,
  ChevronRight,
  Calculator,
} from "lucide-react";
import {
  calculatePersonalizedMacros,
  type Gender,
  type ActivityLevel,
  type GoalType,
  type UserPhysicalProfile,
  type MacroDistributionSummary,
} from "@/lib/nutrition/macro-calculator";
import { cn } from "@/lib/utils/cn";

export interface MacroCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (summary: MacroDistributionSummary) => void;
  initialWeightKg?: number;
}

const PROFILE_STORAGE_KEY = "nutritrack_user_profile_v1";

const DEFAULT_PROFILE: UserPhysicalProfile = {
  gender: "male",
  age: 28,
  heightCm: 178,
  weightKg: 75,
  activityLevel: "moderate",
  goal: "weight_loss",
};

export function MacroCalculatorModal({
  isOpen,
  onClose,
  onApply,
  initialWeightKg,
}: MacroCalculatorModalProps) {
  const [profile, setProfile] = useState<UserPhysicalProfile>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            ...DEFAULT_PROFILE,
            ...parsed,
            ...(initialWeightKg ? { weightKg: initialWeightKg } : {}),
          };
        }
      } catch {
        // Fallback to default
      }
    }
    return {
      ...DEFAULT_PROFILE,
      ...(initialWeightKg ? { weightKg: initialWeightKg } : {}),
    };
  });

  // Keep state updated if initialWeightKg changes
  useEffect(() => {
    if (initialWeightKg && initialWeightKg > 0) {
      setProfile((prev) => ({ ...prev, weightKg: initialWeightKg }));
    }
  }, [initialWeightKg]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Realtime Live Macro Calculation
  const result = useMemo<MacroDistributionSummary>(() => {
    return calculatePersonalizedMacros(profile);
  }, [profile]);

  if (!isOpen) return null;

  const handleApply = () => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore storage error
    }
    onApply(result);
    onClose();
  };

  const activityOptions: Array<{
    id: ActivityLevel;
    title: string;
    description: string;
    multiplierText: string;
    emoji: string;
  }> = [
    {
      id: "sedentary",
      title: "Masa Başı / Hareketsiz",
      description: "Ofis çalışanı, gün içinde çok az hareket",
      multiplierText: "x1.20",
      emoji: "🛋️",
    },
    {
      id: "light",
      title: "Hafif Hareketli",
      description: "Haftada 1-3 gün spor veya düzenli yürüyüş",
      multiplierText: "x1.375",
      emoji: "🚶",
    },
    {
      id: "moderate",
      title: "Orta Hareketli",
      description: "Haftada 3-5 gün düzenli egzersiz / spor",
      multiplierText: "x1.55",
      emoji: "🏃",
    },
    {
      id: "active",
      title: "Çok Hareketli",
      description: "Haftada 6-7 gün yoğun spor veya fiziksel iş",
      multiplierText: "x1.725",
      emoji: "⚡",
    },
  ];

  const goalOptions: Array<{
    id: GoalType;
    title: string;
    description: string;
    badge: string;
    icon: typeof Flame;
    color: string;
    borderActive: string;
  }> = [
    {
      id: "weight_loss",
      title: "Kilo Ver & Yağ Yak",
      description: "TDEE - 400 kcal, yüksek protein ile kas kütlesi korunur",
      badge: "-400 kcal",
      icon: Flame,
      color: "text-rose-500 bg-rose-500/10",
      borderActive: "border-rose-500 ring-2 ring-rose-500/20",
    },
    {
      id: "maintain",
      title: "Kilonu Koru",
      description: "TDEE dengesi, formunu ve enerjini sabit tutar",
      badge: "Dengeli",
      icon: Scale,
      color: "text-primary bg-primary-soft",
      borderActive: "border-primary ring-2 ring-primary/20",
    },
    {
      id: "muscle_gain",
      title: "Kas Kazan & Hacim",
      description: "TDEE + 300 kcal, hipertrofi ve güç artışı sağlar",
      badge: "+300 kcal",
      icon: Dumbbell,
      color: "text-amber-500 bg-amber-500/10",
      borderActive: "border-amber-500 ring-2 ring-amber-500/20",
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calculator-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-surface-container-lowest rounded-3xl shadow-2xl border border-surface-container overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-container bg-surface-container-low/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary-soft text-primary flex items-center justify-center font-bold shadow-xs">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 id="calculator-title" className="text-base sm:text-lg font-bold text-app-text-main flex items-center gap-1.5">
                Akıllı Hedef Hesaplama Sihirbazı
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h2>
              <p className="text-xs text-app-text-muted">
                BMR (Mifflin-St Jeor) ve TDEE ile kişiye özel kalori & makro
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="w-9 h-9 rounded-full flex items-center justify-center text-app-text-muted hover:text-app-text-main hover:bg-surface-container transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5" style={{ scrollbarWidth: "thin" }}>
          {/* 1. Cinsiyet Seçimi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-app-text-main uppercase tracking-wider block">
              1. Cinsiyet
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setProfile((p) => ({ ...p, gender: "male" }))}
                className={cn(
                  "p-3 rounded-2xl border text-left font-bold text-xs flex items-center justify-between transition-all active:scale-[0.98]",
                  profile.gender === "male"
                    ? "bg-primary-soft/90 border-primary text-primary shadow-xs ring-2 ring-primary/20"
                    : "bg-surface-container-low border-surface-container text-app-text-muted hover:text-app-text-main"
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">👨</span>
                  <span>Erkek</span>
                </span>
                {profile.gender === "male" && <Check className="w-4 h-4 text-primary" />}
              </button>

              <button
                type="button"
                onClick={() => setProfile((p) => ({ ...p, gender: "female" }))}
                className={cn(
                  "p-3 rounded-2xl border text-left font-bold text-xs flex items-center justify-between transition-all active:scale-[0.98]",
                  profile.gender === "female"
                    ? "bg-primary-soft/90 border-primary text-primary shadow-xs ring-2 ring-primary/20"
                    : "bg-surface-container-low border-surface-container text-app-text-muted hover:text-app-text-main"
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">👩</span>
                  <span>Kadın</span>
                </span>
                {profile.gender === "female" && <Check className="w-4 h-4 text-primary" />}
              </button>
            </div>
          </div>

          {/* 2. Fiziksel Ölçüler: Yaş, Boy, Kilo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-app-text-main uppercase tracking-wider block">
              2. Fiziksel Ölçüler
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Yaş */}
              <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container focus-within:border-primary transition-all">
                <span className="text-[11px] font-semibold text-app-text-muted block mb-1">
                  Yaş
                </span>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    min="14"
                    max="100"
                    value={profile.age || ""}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, age: Math.max(1, Number(e.target.value)) }))
                    }
                    className="w-full bg-transparent font-extrabold text-base sm:text-lg text-app-text-main outline-none tabular-nums"
                  />
                  <span className="text-xs font-semibold text-app-text-muted">yıl</span>
                </div>
              </div>

              {/* Boy */}
              <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container focus-within:border-primary transition-all">
                <span className="text-[11px] font-semibold text-app-text-muted block mb-1">
                  Boy
                </span>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    min="100"
                    max="240"
                    value={profile.heightCm || ""}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, heightCm: Math.max(1, Number(e.target.value)) }))
                    }
                    className="w-full bg-transparent font-extrabold text-base sm:text-lg text-app-text-main outline-none tabular-nums"
                  />
                  <span className="text-xs font-semibold text-app-text-muted">cm</span>
                </div>
              </div>

              {/* Kilo */}
              <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container focus-within:border-primary transition-all">
                <span className="text-[11px] font-semibold text-app-text-muted block mb-1">
                  Kilo
                </span>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    min="30"
                    max="250"
                    step="0.5"
                    value={profile.weightKg || ""}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, weightKg: Math.max(1, Number(e.target.value)) }))
                    }
                    className="w-full bg-transparent font-extrabold text-base sm:text-lg text-app-text-main outline-none tabular-nums"
                  />
                  <span className="text-xs font-semibold text-app-text-muted">kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Günlük Aktivite Düzeyi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-app-text-main uppercase tracking-wider block">
              3. Günlük Aktivite Seviyesi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activityOptions.map((opt) => {
                const isSelected = profile.activityLevel === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setProfile((p) => ({ ...p, activityLevel: opt.id }))}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all active:scale-[0.98] flex items-start gap-2.5",
                      isSelected
                        ? "bg-primary-soft/80 border-primary ring-2 ring-primary/20 shadow-xs"
                        : "bg-surface-container-low border-surface-container hover:bg-surface-container"
                    )}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{opt.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn("text-xs font-bold truncate", isSelected ? "text-primary" : "text-app-text-main")}>
                          {opt.title}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-surface-container text-app-text-muted">
                          {opt.multiplierText}
                        </span>
                      </div>
                      <p className="text-[11px] text-app-text-muted leading-tight mt-0.5 line-clamp-2">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Birincil Hedef */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-app-text-main uppercase tracking-wider block">
              4. Birincil Hedef
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {goalOptions.map((opt) => {
                const isSelected = profile.goal === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setProfile((p) => ({ ...p, goal: opt.id }))}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all active:scale-[0.98] flex flex-col justify-between",
                      isSelected
                        ? opt.borderActive
                        : "bg-surface-container-low border-surface-container hover:bg-surface-container"
                    )}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className={cn("p-1.5 rounded-xl", opt.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-surface-container text-app-text-muted">
                        {opt.badge}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-app-text-main">
                        {opt.title}
                      </p>
                      <p className="text-[10px] text-app-text-muted leading-tight mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Canlı Dinamik Sonuç & Önizleme Kartı */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-primary-soft/90 via-surface-container-low to-emerald-500/10 border border-primary/20 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                <Target className="w-3.5 h-3.5" />
                Önerilen Kişisel Hedefin
              </span>
              <div className="flex items-center gap-2 text-[11px] text-app-text-muted">
                <span>BMR: <strong className="text-app-text-main">{result.bmr}</strong></span>
                <span>•</span>
                <span>TDEE: <strong className="text-app-text-main">{result.tdee}</strong> kcal</span>
              </div>
            </div>

            {/* Büyük Kalori Başlığı */}
            <div className="flex items-baseline justify-between pt-0.5">
              <div>
                <span className="text-3xl sm:text-4xl font-extrabold text-app-text-main tracking-tight tabular-nums">
                  {result.targetCalories.toLocaleString("tr-TR")}
                </span>
                <span className="text-sm font-bold text-app-text-muted ml-1.5">kcal / gün</span>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary text-white shadow-xs">
                {result.calorieDelta > 0
                  ? `+${result.calorieDelta} kcal Fazlalık`
                  : result.calorieDelta < 0
                  ? `${result.calorieDelta} kcal Açık`
                  : "Denge Seviyesi"}
              </span>
            </div>

            {/* 3 Makro Hapları */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {/* Protein */}
              <div className="p-2.5 rounded-2xl bg-surface-container-lowest/90 border border-surface-container text-center">
                <span className="text-[10px] font-semibold text-primary block">🥩 Protein</span>
                <span className="text-sm sm:text-base font-extrabold text-app-text-main tabular-nums">
                  {result.protein}g
                </span>
                <span className="text-[10px] text-app-text-muted block">%{result.proteinPercentage}</span>
              </div>

              {/* Karb */}
              <div className="p-2.5 rounded-2xl bg-surface-container-lowest/90 border border-surface-container text-center">
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 block">🌾 Karbonhidrat</span>
                <span className="text-sm sm:text-base font-extrabold text-app-text-main tabular-nums">
                  {result.carbs}g
                </span>
                <span className="text-[10px] text-app-text-muted block">%{result.carbsPercentage}</span>
              </div>

              {/* Yağ */}
              <div className="p-2.5 rounded-2xl bg-surface-container-lowest/90 border border-surface-container text-center">
                <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 block">🥑 Yağ</span>
                <span className="text-sm sm:text-base font-extrabold text-app-text-main tabular-nums">
                  {result.fat}g
                </span>
                <span className="text-[10px] text-app-text-muted block">%{result.fatPercentage}</span>
              </div>
            </div>

            {/* Oran Barı */}
            <div className="h-2 rounded-full overflow-hidden flex bg-surface-container">
              <div className="bg-primary h-full transition-all duration-300" style={{ width: `${result.proteinPercentage}%` }} />
              <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${result.carbsPercentage}%` }} />
              <div className="bg-sky-500 h-full transition-all duration-300" style={{ width: `${result.fatPercentage}%` }} />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-surface-container bg-surface-container-low/70 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-surface-container text-app-text-muted hover:text-app-text-main text-xs font-semibold transition-colors active:scale-95"
          >
            Vazgeç
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/25 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Check className="w-4 h-4" />
            <span>Bu Hedefleri Uygula ({result.targetCalories} kcal)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default MacroCalculatorModal;
