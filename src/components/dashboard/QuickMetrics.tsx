import React from "react";
import { Card } from "@/components/ui/Card";
import type { StepsData, WaterLog } from "@/types/activity";
import { Footprints, Droplets, Plus } from "lucide-react";

export interface QuickMetricsProps {
  steps: StepsData;
  water: WaterLog;
  onAddWater?: (amountMl: number) => void;
  onStepClick?: () => void;
}

export function QuickMetrics({
  steps,
  water,
  onAddWater,
  onStepClick,
}: QuickMetricsProps) {
  const handleQuickAddWater = (amountMl: number) => {
    if (onAddWater) {
      onAddWater(amountMl);
    }
  };

  const stepsPercent = Math.min(100, Math.round((steps.count / Math.max(1, steps.goal)) * 100));
  const waterPercent = Math.min(100, Math.round((water.currentMl / Math.max(1, water.goalMl)) * 100));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      {/* Steps Metric Card */}
      <Card
        variant="standard"
        onClick={onStepClick}
        className={`p-4 flex flex-col justify-between space-y-4 ${
          onStepClick ? "cursor-pointer hover:border-primary/40 transition-colors" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-water-soft/80 flex items-center justify-center text-water shadow-xs">
            <Footprints className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-water bg-water-soft px-2 py-0.5 rounded-full tabular-nums">
            %{stepsPercent}
          </span>
        </div>

        <div>
          <span className="text-xs font-medium text-app-text-muted block">Günlük Adım</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-app-text-main tabular-nums">
              {steps.count.toLocaleString("tr-TR")}
            </span>
            <span className="text-xs text-app-text-muted font-medium tabular-nums">
              / {(steps.goal / 1000).toFixed(0)}k
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-app-text-muted mt-1 tabular-nums">
            <span>{steps.distanceKm} km</span>
            <span>•</span>
            <span>{steps.activeMinutes} dk aktif</span>
          </div>
        </div>

        {/* Steps Progress Bar */}
        <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
          <div
            className="bg-water h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${stepsPercent}%` }}
          />
        </div>
      </Card>

      {/* Water Intake Card */}
      <Card variant="standard" className="p-4 flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-water/10 flex items-center justify-center text-water shadow-xs">
            <Droplets className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-water bg-water-soft px-2 py-0.5 rounded-full tabular-nums">
            %{waterPercent}
          </span>
        </div>

        <div>
          <span className="text-xs font-medium text-app-text-muted block">Su Tüketimi</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-app-text-main tabular-nums">
              {(water.currentMl / 1000).toFixed(2)}
            </span>
            <span className="text-xs text-app-text-muted font-medium tabular-nums">
              / {(water.goalMl / 1000).toFixed(1)} L
            </span>
          </div>
          <p className="text-[11px] text-app-text-muted mt-1">
            Hedefe {Math.max(0, water.goalMl - water.currentMl)} ml kaldı
          </p>
        </div>

        {/* Water Progress Bar */}
        <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
          <div
            className="bg-water h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${waterPercent}%` }}
          />
        </div>

        {/* Quick Add Buttons with min 44px touch height */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-surface-container">
          <button
            type="button"
            onClick={() => handleQuickAddWater(250)}
            className="h-11 min-h-[44px] flex items-center justify-center gap-1 rounded-xl bg-water-soft text-water text-xs font-bold hover:bg-water-soft/80 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            250 ml
          </button>
          <button
            type="button"
            onClick={() => handleQuickAddWater(500)}
            className="h-11 min-h-[44px] flex items-center justify-center gap-1 rounded-xl bg-water text-white text-xs font-bold hover:bg-water-hover active:scale-95 transition-all shadow-xs shadow-water/20"
          >
            <Plus className="w-3.5 h-3.5" />
            500 ml
          </button>
        </div>
      </Card>
    </div>
  );
}

export default QuickMetrics;
