"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Meal, MealType } from "@/types/meal";
import Link from "next/link";
import { Plus, Utensils, Sparkles } from "lucide-react";

export interface MealSectionProps {
  meals: Meal[];
  onAddMealClick?: () => void;
  onMealClick?: (meal: Meal) => void;
}

const mealTypeLabels: Record<MealType, { label: string; badgeVariant: "primary" | "water" | "calorie" | "neutral" }> = {
  breakfast: { label: "Kahvaltı", badgeVariant: "primary" },
  lunch: { label: "Öğle Yemeği", badgeVariant: "water" },
  dinner: { label: "Akşam Yemeği", badgeVariant: "calorie" },
  snack: { label: "Ara Öğün", badgeVariant: "neutral" },
};

export function MealSection({ meals, onAddMealClick, onMealClick }: MealSectionProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section className="space-y-4 w-full" aria-label="Günün Öğünleri">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-app-text-main">
            Bugünün Öğünleri
          </h2>
          <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-app-text-muted text-xs font-semibold tabular-nums">
            {meals.length} Öğün
          </span>
        </div>

        {onAddMealClick ? (
          <button
            type="button"
            onClick={onAddMealClick}
            className="h-11 min-h-[44px] px-4 rounded-full bg-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Öğün Ekle</span>
          </button>
        ) : (
          <Link
            href="/analyze"
            className="h-11 min-h-[44px] px-4 rounded-full bg-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Öğün Ekle</span>
          </Link>
        )}
      </div>

      {/* Meals List */}
      <div className="space-y-3">
        {meals.map((meal) => {
          const typeInfo = mealTypeLabels[meal.type] || {
            label: "Öğün",
            badgeVariant: "neutral",
          };
          const hasImage = meal.imageUrl && !failedImages[meal.id];

          return (
            <Card
              key={meal.id}
              variant="standard"
              className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:border-surface-container-high transition-all cursor-pointer active:scale-[0.99]"
              onClick={() => onMealClick?.(meal)}
            >
              {/* Meal Thumbnail / Fallback Icon */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 bg-surface-container-low flex items-center justify-center border border-surface-container">
                {hasImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={meal.imageUrl}
                    alt={meal.name}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(meal.id)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-soft/60 to-surface-container flex items-center justify-center text-primary">
                    <Utensils className="w-6 h-6" />
                  </div>
                )}
              </div>

              {/* Meal Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={typeInfo.badgeVariant} className="text-[11px] py-0 px-2">
                    {typeInfo.label}
                  </Badge>
                  <span className="text-[11px] font-medium text-app-text-muted tabular-nums">
                    {meal.time}
                  </span>
                  {meal.aiConfidence && (
                    <span className="hidden xs:inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-surface-container text-[10px] text-app-text-muted font-medium">
                      <Sparkles className="w-2.5 h-2.5 text-primary" />
                      %{meal.aiConfidence.score} AI
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-bold text-app-text-main truncate">
                  {meal.name}
                </h3>

                <p className="text-xs text-app-text-muted tabular-nums">
                  P: <span className="font-semibold text-app-text-main">{meal.totalProtein}g</span> • K:{" "}
                  <span className="font-semibold text-app-text-main">{meal.totalCarbs}g</span> • Y:{" "}
                  <span className="font-semibold text-app-text-main">{meal.totalFat}g</span>
                </p>
              </div>

              {/* Calories Metric */}
              <div className="text-right shrink-0 pl-1">
                <span className="text-lg sm:text-xl font-extrabold text-app-text-main tabular-nums">
                  {meal.totalCalories}
                </span>
                <span className="block text-[11px] text-app-text-muted font-medium tabular-nums">
                  kcal
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export default MealSection;
