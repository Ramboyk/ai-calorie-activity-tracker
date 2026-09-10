import React from "react";
import { Badge } from "@/components/ui/Badge";
import type { AIConfidenceLevel } from "@/components/ui/Badge";
import { Calculator, Sparkles, Check } from "lucide-react";

export interface NutritionSummaryCardProps {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  confidence?: AIConfidenceLevel;
  notes?: string[];
  className?: string;
}

export function NutritionSummaryCard({
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFat,
  confidence = "high",
  notes,
  className = "",
}: NutritionSummaryCardProps) {
  const totalMacroGrams = totalProtein + totalCarbs + totalFat;

  const proteinPercent =
    totalMacroGrams > 0 ? Math.min(100, Math.round((totalProtein / totalMacroGrams) * 100)) : 0;
  const carbsPercent =
    totalMacroGrams > 0 ? Math.min(100, Math.round((totalCarbs / totalMacroGrams) * 100)) : 0;
  const fatPercent =
    totalMacroGrams > 0 ? Math.min(100, Math.round((totalFat / totalMacroGrams) * 100)) : 0;

  return (
    <div
      className={`bg-gradient-to-br from-surface-container-lowest to-surface-container-low rounded-3xl p-5 sm:p-6 border border-surface-container shadow-sm space-y-5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-app-text-main">
              Toplam Besin Değerleri
            </h3>
            <span className="text-[11px] text-app-text-muted">Öğün toplam özeti</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge confidence={confidence} />
          <span className="inline-flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-full text-[10px] font-semibold text-primary">
            <Check className="w-3 h-3" />
            Otomatik hesaplandı
          </span>
        </div>
      </div>

      {/* Main Calorie Metric */}
      <div className="flex items-baseline gap-2 pt-1 border-t border-surface-container">
        <span className="text-3xl sm:text-4xl font-extrabold text-primary tabular-nums tracking-tight">
          {totalCalories.toLocaleString("tr-TR")}
        </span>
        <span className="text-sm font-semibold text-app-text-muted uppercase">kcal</span>
      </div>

      {/* 3-Macro Distribution Mini Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Protein */}
        <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-2xl border border-surface-container/60 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-bold text-app-text-muted uppercase">Protein</span>
            <span className="font-bold text-primary tabular-nums">{totalProtein}g</span>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
          <span className="text-[9px] text-app-text-muted block tabular-nums">
            %{proteinPercent} oran
          </span>
        </div>

        {/* Karbonhidrat */}
        <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-2xl border border-surface-container/60 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-bold text-app-text-muted uppercase">Karb</span>
            <span className="font-bold text-calorie tabular-nums">{totalCarbs}g</span>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div
              className="bg-calorie h-full rounded-full transition-all duration-300"
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
          <span className="text-[9px] text-app-text-muted block tabular-nums">
            %{carbsPercent} oran
          </span>
        </div>

        {/* Yağ */}
        <div className="bg-surface-container-lowest p-2.5 sm:p-3 rounded-2xl border border-surface-container/60 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-bold text-app-text-muted uppercase">Yağ</span>
            <span className="font-bold text-water tabular-nums">{totalFat}g</span>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div
              className="bg-water h-full rounded-full transition-all duration-300"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
          <span className="text-[9px] text-app-text-muted block tabular-nums">
            %{fatPercent} oran
          </span>
        </div>
      </div>

      {/* AI Notes if present */}
      {notes && notes.length > 0 && (
        <div className="p-3 rounded-2xl bg-surface-container-low/60 border border-surface-container text-xs text-app-text-muted space-y-1">
          <span className="font-semibold text-app-text-main flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3 h-3 text-primary" />
            AI Gözlem Notları:
          </span>
          <ul className="list-disc list-inside space-y-0.5 text-[10px] sm:text-[11px] leading-relaxed">
            {notes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default NutritionSummaryCard;
