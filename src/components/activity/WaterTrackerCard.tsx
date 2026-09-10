"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Droplets, Plus, CheckCircle2, RotateCcw, Edit3 } from "lucide-react";

export interface WaterTrackerCardProps {
  currentWaterMl: number;
  waterGoalMl: number;
  onAddWater: (amountMl: number) => void;
  onResetWater?: () => void;
  onSetWater?: (ml: number) => void;
}

export function WaterTrackerCard({
  currentWaterMl,
  waterGoalMl,
  onAddWater,
  onResetWater,
}: WaterTrackerCardProps) {
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState<string>("");

  const percent = Math.min(100, Math.round((currentWaterMl / Math.max(1, waterGoalMl)) * 100));
  const remainingMl = Math.max(0, waterGoalMl - currentWaterMl);
  const remainingGlasses = Math.ceil(remainingMl / 250);

  let statusText = "Düşük";
  if (percent >= 100) statusText = "Hedefe Ulaşıldı!";
  else if (percent >= 60) statusText = "Dengeli";

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(manualInput, 10);
    if (val && val > 0) {
      onAddWater(val);
      setManualInput("");
      setIsManualOpen(false);
    }
  };

  return (
    <Card variant="standard" className="p-4 sm:p-5 flex flex-col space-y-4 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-water-soft flex items-center justify-center text-water">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-app-text-main">Su Tüketimi</h3>
            <span className="text-xs text-app-text-muted">Optimum hidrasyon seviyesi</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-water bg-water-soft px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{statusText}</span>
          </span>

          {onResetWater && currentWaterMl > 0 && (
            <button
              type="button"
              onClick={onResetWater}
              title="Suyu Sıfırla"
              className="w-8 h-8 rounded-full flex items-center justify-center text-app-text-muted hover:text-error hover:bg-surface-container transition-colors active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Visual Hydration Chamber + Stat Display */}
      <div className="flex items-center gap-5 py-1">
        {/* Tactile Minimal Glass Flask Graphic */}
        <div className="relative w-16 h-28 bg-surface-container-high rounded-2xl p-1 flex flex-col justify-end overflow-hidden shadow-inner border border-surface-container shrink-0">
          {/* Scale ticks */}
          <div className="absolute left-1 inset-y-3 flex flex-col justify-between z-20 pointer-events-none opacity-40">
            <span className="w-2 h-0.5 bg-outline rounded-full" />
            <span className="w-3 h-0.5 bg-outline rounded-full" />
            <span className="w-2 h-0.5 bg-outline rounded-full" />
            <span className="w-3 h-0.5 bg-outline rounded-full" />
          </div>

          {/* Liquid Body with Smooth Transition */}
          <div
            className="w-full bg-gradient-to-t from-water to-water-hover rounded-xl transition-all duration-500 ease-out flex items-center justify-center relative overflow-hidden shadow-sm"
            style={{ height: `${percent}%` }}
          >
            <div className="absolute -top-3 inset-x-0 h-4 bg-white/30 rounded-full blur-[1px]" />
          </div>
        </div>

        {/* Water stats & progress bar */}
        <div className="flex-1 flex flex-col justify-center space-y-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-extrabold text-app-text-main tracking-tight tabular-nums">
              {currentWaterMl.toLocaleString("tr-TR")}
            </span>
            <span className="text-sm font-medium text-app-text-muted tabular-nums">
              / {waterGoalMl.toLocaleString("tr-TR")} ml
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-water h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-water tabular-nums">%{percent}</span>
          </div>

          <p className="text-xs text-app-text-muted">
            Kalan hedef:{" "}
            <strong className="text-app-text-main font-semibold tabular-nums">
              {remainingMl.toLocaleString("tr-TR")} ml
            </strong>{" "}
            (yaklaşık {remainingGlasses} bardak)
          </p>
        </div>
      </div>

      {/* Quick Water Action Buttons (min 44px touch) */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => onAddWater(250)}
          className="h-12 min-h-[44px] rounded-xl bg-water-soft text-water hover:bg-water-soft/80 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+250 ml Bardak</span>
        </button>
        <button
          type="button"
          onClick={() => onAddWater(500)}
          className="h-12 min-h-[44px] rounded-xl bg-water text-white hover:bg-water-hover font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs shadow-water/20"
        >
          <Plus className="w-4 h-4" />
          <span>+500 ml Şişe</span>
        </button>
      </div>

      {/* Manual Input Toggle */}
      <div className="flex justify-center pt-0.5">
        <button
          type="button"
          onClick={() => setIsManualOpen(!isManualOpen)}
          className="text-water text-xs font-medium hover:underline flex items-center gap-1 py-1"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isManualOpen ? "Kapat" : "Manuel Miktar Gir"}</span>
        </button>
      </div>

      {/* Manual Water Input Form */}
      {isManualOpen && (
        <form
          onSubmit={handleManualSubmit}
          className="flex items-center gap-2 p-2.5 bg-surface-container-low rounded-xl animate-fade-in"
        >
          <label htmlFor="custom-water-input" className="sr-only">
            Manuel Su Miktarı
          </label>
          <input
            id="custom-water-input"
            type="number"
            min="10"
            max="3000"
            step="50"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Örn: 330"
            className="h-10 flex-1 px-3 bg-white text-app-text-main rounded-lg text-sm font-semibold outline-none border border-surface-container focus:border-water"
            autoFocus
          />
          <span className="text-xs text-app-text-muted font-medium">ml</span>
          <button
            type="submit"
            className="h-10 min-h-[44px] px-4 bg-water text-white text-xs font-bold rounded-lg hover:bg-water-hover active:scale-95 transition-all"
          >
            Ekle
          </button>
        </form>
      )}
    </Card>
  );
}

export default WaterTrackerCard;
