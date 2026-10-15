import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import type { DailyMacros } from "@/types/daily";
import { PieChart, Target } from "lucide-react";

export interface MacroDistributionProps {
  macros: DailyMacros;
  onOpenCalculator?: () => void;
}

export function MacroDistribution({ macros, onOpenCalculator }: MacroDistributionProps) {
  const { protein, carbs, fat } = macros;

  const macroItems = [
    {
      id: "protein",
      label: "Protein",
      consumed: protein.consumedGrams,
      goal: protein.goalGrams,
      percent: protein.percentage,
      barColor: "bg-primary",
      dotColor: "bg-primary",
      textColor: "text-primary",
      badgeBg: "bg-primary-soft text-primary",
    },
    {
      id: "carbs",
      label: "Karbonhidrat",
      consumed: carbs.consumedGrams,
      goal: carbs.goalGrams,
      percent: carbs.percentage,
      barColor: "bg-[#f59e0b]",
      dotColor: "bg-[#f59e0b]",
      textColor: "text-[#825100]",
      badgeBg: "bg-calorie-soft text-[#825100]",
    },
    {
      id: "fat",
      label: "Sağlıklı Yağ",
      consumed: fat.consumedGrams,
      goal: fat.goalGrams,
      percent: fat.percentage,
      barColor: "bg-water",
      dotColor: "bg-water",
      textColor: "text-water",
      badgeBg: "bg-water-soft text-water",
    },
  ];

  return (
    <Card variant="standard" className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-primary-soft text-primary">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <CardTitle as="h3">Günlük Makrolar</CardTitle>
            <CardDescription>Hedeflenen besin ögesi oranları</CardDescription>
          </div>
        </div>

        {onOpenCalculator && (
          <button
            type="button"
            onClick={onOpenCalculator}
            title="Akıllı Hedef Hesaplama Sihirbazı"
            aria-label="Makro Hedeflerini Hesapla ve Düzenle"
            className="w-8 h-8 rounded-full flex items-center justify-center text-app-text-muted hover:text-primary hover:bg-surface-container transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Target className="w-4 h-4" />
          </button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {macroItems.map((item) => {
          const clampedPercent = Math.min(100, Math.max(0, item.percent));
          const remainingGrams = Math.max(0, Math.round((item.goal - item.consumed) * 10) / 10);
          const isOver = item.consumed > item.goal;

          return (
            <div key={item.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-app-text-main flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.dotColor}`} />
                  {item.label}
                </span>
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="text-app-text-muted">
                    <strong className="text-app-text-main font-bold">{item.consumed}g</strong> /{" "}
                    {item.goal}g
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${item.badgeBg}`}>
                    %{Math.round(item.percent)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${item.barColor}`}
                  style={{ width: `${clampedPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-app-text-muted tabular-nums">
                <span>{isOver ? "Hedef aşıldı" : `Kalan: ${remainingGrams}g`}</span>
                <span>{item.percent > 100 ? `+%${Math.round(item.percent - 100)}` : ""}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default MacroDistribution;
