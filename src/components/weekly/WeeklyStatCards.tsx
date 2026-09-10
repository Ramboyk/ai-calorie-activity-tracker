"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import type { WeeklyStats } from "@/types/daily";
import { Utensils, Footprints, Droplets, Flame } from "lucide-react";

export interface WeeklyStatCardsProps {
  stats: WeeklyStats;
}

export function WeeklyStatCards({ stats }: WeeklyStatCardsProps) {
  const { averages } = stats;

  const totalActiveHours = Math.floor(averages.totalActiveMinutes / 60);
  const totalActiveRemMinutes = averages.totalActiveMinutes % 60;
  const activeDurationText =
    totalActiveHours > 0
      ? `${totalActiveHours}s ${totalActiveRemMinutes}d`
      : `${totalActiveRemMinutes} dk`;

  const cards = [
    {
      id: "calories",
      label: "Ort. Kalori",
      value: averages.avgConsumedCalories.toLocaleString("tr-TR"),
      unit: "kcal/gün",
      badge: "%92 Hedef",
      badgeClass: "bg-surface-container-high text-primary",
      icon: <Utensils className="w-4 h-4" />,
      iconBg: "bg-primary-soft text-primary",
      barPercent: Math.min(100, Math.round((averages.avgConsumedCalories / 2000) * 100)),
      barColor: "bg-primary",
    },
    {
      id: "steps",
      label: "Ort. Adım",
      value: averages.avgSteps.toLocaleString("tr-TR"),
      unit: "adım/gün",
      badge: "10k Hedef",
      badgeClass: "bg-water-soft text-water",
      icon: <Footprints className="w-4 h-4" />,
      iconBg: "bg-water-soft text-water",
      barPercent: Math.min(100, Math.round((averages.avgSteps / 10000) * 100)),
      barColor: "bg-water",
    },
    {
      id: "water",
      label: "Ort. Su",
      value: averages.avgWaterLiters.toFixed(1),
      unit: "L/gün",
      badge: "2.5L Hedef",
      badgeClass: "bg-surface-container-high text-app-text-muted",
      icon: <Droplets className="w-4 h-4" />,
      iconBg: "bg-water-soft text-water",
      barPercent: Math.min(100, Math.round((averages.avgWaterLiters / 2.5) * 100)),
      barColor: "bg-water",
    },
    {
      id: "activity",
      label: "Toplam Aktivite",
      value: activeDurationText,
      unit: "süre",
      badge: `${averages.activeDaysCount} Gün Aktif`,
      badgeClass: "bg-calorie-soft text-calorie",
      icon: <Flame className="w-4 h-4" />,
      iconBg: "bg-calorie-soft text-calorie",
      barPercent: Math.min(100, Math.round((averages.activeDaysCount / 7) * 100)),
      barColor: "bg-calorie",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
      {cards.map((card) => (
        <Card
          key={card.id}
          variant="standard"
          className="p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-surface-container-high transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.iconBg}`}>
              {card.icon}
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${card.badgeClass}`}>
              {card.badge}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-app-text-muted block uppercase tracking-wider">
              {card.label}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-extrabold text-app-text-main tabular-nums">
                {card.value}
              </span>
              <span className="text-xs font-medium text-app-text-muted">{card.unit}</span>
            </div>
          </div>

          <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${card.barColor}`}
              style={{ width: `${card.barPercent}%` }}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}

export default WeeklyStatCards;
