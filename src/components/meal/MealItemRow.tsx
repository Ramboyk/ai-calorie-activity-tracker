"use client";

import React from "react";
import type { EditableFoodItem } from "@/types/meal";
import { Utensils, Trash2 } from "lucide-react";

export interface MealItemRowProps {
  item: EditableFoodItem;
  canDelete: boolean;
  onUpdate: (updatedItem: EditableFoodItem) => void;
  onDelete: (id: string) => void;
}

export function MealItemRow({
  item,
  canDelete,
  onUpdate,
  onDelete,
}: MealItemRowProps) {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      ...item,
      name: e.target.value,
    });
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, "");
    const newWeight = Math.min(2000, Math.max(1, parseInt(rawVal, 10) || 1));

    const factor = newWeight / 100;
    const recalculatedCalories = Math.round(item.base100g.calories * factor);
    const recalculatedProtein = Math.round(item.base100g.protein * factor * 10) / 10;
    const recalculatedCarbs = Math.round(item.base100g.carbs * factor * 10) / 10;
    const recalculatedFat = Math.round(item.base100g.fat * factor * 10) / 10;

    onUpdate({
      ...item,
      weightGrams: newWeight,
      estimatedPortion: `${newWeight} g`,
      calories: recalculatedCalories,
      protein: recalculatedProtein,
      carbs: recalculatedCarbs,
      fat: recalculatedFat,
    });
  };

  return (
    <div className="bg-surface-container-lowest p-3.5 sm:p-4 rounded-2xl border border-surface-container shadow-xs flex flex-col gap-3 transition-all hover:border-surface-container-high">
      {/* Top Header: Icon, Editable Food Name & Delete Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <Utensils className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={item.name}
            onChange={handleNameChange}
            placeholder="Besin adı"
            aria-label="Besin adı"
            className="font-bold text-sm sm:text-base text-app-text-main bg-transparent w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1 py-1 truncate"
          />
        </div>

        <button
          type="button"
          onClick={() => onDelete(item.id)}
          disabled={!canDelete}
          title={
            canDelete
              ? "Besini Listeden Sil"
              : "Öğünde en az bir besin kalemi bulunmalıdır"
          }
          aria-label="Besini Listeden Sil"
          className={`w-11 h-11 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error ${
            canDelete
              ? "text-app-text-muted hover:text-error hover:bg-rose-50 active:scale-95"
              : "text-outline/40 cursor-not-allowed"
          }`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Fields Grid: Porsiyon (Gramaj), Kalori, P, K, Y */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 bg-surface-container-low/80 p-2 sm:p-2.5 rounded-xl text-center">
        {/* Gramaj / Weight Input */}
        <div className="flex flex-col items-center">
          <label className="block text-[10px] sm:text-[11px] font-semibold text-app-text-muted uppercase">
            Porsiyon
          </label>
          <div className="flex items-center justify-center gap-0.5 mt-0.5">
            <input
              type="text"
              inputMode="numeric"
              value={item.weightGrams}
              onChange={handleWeightChange}
              aria-label="Porsiyon gramajı"
              className="w-12 text-center text-xs sm:text-sm font-bold text-app-text-main bg-surface-container-lowest border border-surface-container rounded-md py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary tabular-nums"
            />
            <span className="text-[10px] text-app-text-muted font-bold">g</span>
          </div>
        </div>

        {/* Calories */}
        <div className="flex flex-col items-center justify-center">
          <span className="block text-[10px] sm:text-[11px] font-semibold text-app-text-muted uppercase">
            Kalori
          </span>
          <span className="text-xs sm:text-sm font-bold text-app-text-main tabular-nums mt-0.5">
            {item.calories}
            <span className="text-[9px] text-app-text-muted font-normal ml-0.5">kcal</span>
          </span>
        </div>

        {/* Protein (P) */}
        <div className="flex flex-col items-center justify-center">
          <span className="block text-[10px] sm:text-[11px] font-semibold text-primary uppercase">
            P (Prot)
          </span>
          <span className="text-xs sm:text-sm font-bold text-primary tabular-nums mt-0.5">
            {item.protein}g
          </span>
        </div>

        {/* Karbonhidrat (K) */}
        <div className="flex flex-col items-center justify-center">
          <span className="block text-[10px] sm:text-[11px] font-semibold text-calorie uppercase">
            K (Karb)
          </span>
          <span className="text-xs sm:text-sm font-bold text-calorie tabular-nums mt-0.5">
            {item.carbs}g
          </span>
        </div>

        {/* Yağ (Y) */}
        <div className="flex flex-col items-center justify-center">
          <span className="block text-[10px] sm:text-[11px] font-semibold text-water uppercase">
            Y (Yağ)
          </span>
          <span className="text-xs sm:text-sm font-bold text-water tabular-nums mt-0.5">
            {item.fat}g
          </span>
        </div>
      </div>
    </div>
  );
}

export default MealItemRow;
