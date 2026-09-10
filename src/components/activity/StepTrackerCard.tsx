"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Footprints, Edit3, Check, Flame, Clock, Navigation } from "lucide-react";

export interface StepTrackerCardProps {
  steps: number;
  stepGoal: number;
  distanceKm: number;
  activeMinutes: number;
  onUpdateSteps?: (steps: number) => void;
  onUpdateStepGoal?: (goal: number) => void;
}

export function StepTrackerCard({
  steps,
  stepGoal,
  distanceKm,
  activeMinutes,
  onUpdateSteps,
  onUpdateStepGoal,
}: StepTrackerCardProps) {
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [newGoalInput, setNewGoalInput] = useState<string>(String(stepGoal));

  const [isEditingSteps, setIsEditingSteps] = useState<boolean>(false);
  const [newStepsInput, setNewStepsInput] = useState<string>(String(steps));

  const percentage = Math.min(100, Math.round((steps / Math.max(1, stepGoal)) * 100));
  const estimatedCalories = Math.round(steps * 0.04);

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(newGoalInput, 10);
    if (val && val >= 500 && onUpdateStepGoal) {
      onUpdateStepGoal(val);
      setIsEditingGoal(false);
    }
  };

  const handleSaveSteps = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(newStepsInput, 10);
    if (val !== undefined && val >= 0 && onUpdateSteps) {
      onUpdateSteps(val);
      setIsEditingSteps(false);
    }
  };

  return (
    <Card variant="standard" className="p-4 sm:p-5 flex flex-col space-y-4 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center text-primary">
            <Footprints className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-app-text-main">Adım Takibi</h3>
            <span className="text-xs text-app-text-muted">Günlük hareket hedefin</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setNewStepsInput(String(steps));
              setIsEditingSteps(!isEditingSteps);
              setIsEditingGoal(false);
            }}
            aria-label="Adım sayısını düzenle"
            className="h-9 px-2.5 rounded-full bg-surface-container-low hover:bg-surface-container text-app-text-muted hover:text-app-text-main text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Adım Gir</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setNewGoalInput(String(stepGoal));
              setIsEditingGoal(!isEditingGoal);
              setIsEditingSteps(false);
            }}
            aria-label="Adım hedefini düzenle"
            className="h-9 px-2.5 rounded-full bg-surface-container-low hover:bg-surface-container text-primary text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Hedef</span>
          </button>
        </div>
      </div>

      {/* Quick Edit Step Drawer */}
      {isEditingSteps && (
        <form
          onSubmit={handleSaveSteps}
          className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl animate-fade-in"
        >
          <label htmlFor="step-count-input" className="sr-only">
            Günlük Adım Sayısı
          </label>
          <input
            id="step-count-input"
            type="number"
            min="0"
            max="100000"
            value={newStepsInput}
            onChange={(e) => setNewStepsInput(e.target.value)}
            placeholder="Adım sayısı"
            className="h-10 flex-1 px-3.5 bg-white text-app-text-main rounded-lg text-sm font-semibold outline-none border border-surface-container focus:border-primary"
            autoFocus
          />
          <button
            type="submit"
            className="h-10 min-h-[44px] px-4 bg-primary text-white text-xs font-bold rounded-lg shadow-xs hover:bg-primary-hover active:scale-95 transition-all flex items-center gap-1"
          >
            <Check className="w-4 h-4" />
            Kaydet
          </button>
        </form>
      )}

      {/* Quick Edit Goal Drawer */}
      {isEditingGoal && (
        <form
          onSubmit={handleSaveGoal}
          className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl animate-fade-in"
        >
          <label htmlFor="step-goal-input" className="sr-only">
            Yeni Günlük Adım Hedefi
          </label>
          <input
            id="step-goal-input"
            type="number"
            min="500"
            max="100000"
            step="500"
            value={newGoalInput}
            onChange={(e) => setNewGoalInput(e.target.value)}
            placeholder="Hedef adım (örn: 10000)"
            className="h-10 flex-1 px-3.5 bg-white text-app-text-main rounded-lg text-sm font-semibold outline-none border border-surface-container focus:border-primary"
            autoFocus
          />
          <button
            type="submit"
            className="h-10 min-h-[44px] px-4 bg-primary text-white text-xs font-bold rounded-lg shadow-xs hover:bg-primary-hover active:scale-95 transition-all flex items-center gap-1"
          >
            <Check className="w-4 h-4" />
            Uygula
          </button>
        </form>
      )}

      {/* Step Numbers and Percentage */}
      <div className="flex items-baseline justify-between pt-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-extrabold text-app-text-main tracking-tight tabular-nums">
            {steps.toLocaleString("tr-TR")}
          </span>
          <span className="text-sm font-medium text-app-text-muted tabular-nums">
            / {stepGoal.toLocaleString("tr-TR")} adım
          </span>
        </div>
        <span className="text-xs font-extrabold text-primary bg-primary-soft px-2.5 py-1 rounded-full tabular-nums">
          %{percentage}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden p-0.5">
        <div
          className="h-full bg-gradient-to-r from-primary-light to-primary rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Metrics Row */}
      <div className="flex items-center justify-between text-xs text-app-text-muted pt-1 tabular-nums">
        <div className="flex items-center gap-1">
          <Navigation className="w-3.5 h-3.5 text-app-text-muted" />
          <span>{distanceKm} km mesafe</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-app-text-muted" />
          <span>{activeMinutes} dk hareket</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-calorie" />
          <span className="font-semibold text-calorie">{estimatedCalories} kcal</span>
        </div>
      </div>
    </Card>
  );
}

export default StepTrackerCard;
