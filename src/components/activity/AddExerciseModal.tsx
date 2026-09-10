"use client";

import React, { useState } from "react";
import type { ExerciseType } from "@/types/activity";
import { X, Dumbbell, Flame, Timer, Check } from "lucide-react";

export interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    type: ExerciseType;
    title: string;
    durationMinutes: number;
    caloriesBurned: number;
  }) => void;
}

interface ExerciseOption {
  type: ExerciseType;
  title: string;
  metRate: number; // kcal per minute approximate
}

const EXERCISE_OPTIONS: ExerciseOption[] = [
  { type: "walking", title: "Yürüyüş", metRate: 4.5 },
  { type: "running", title: "Koşu", metRate: 10.5 },
  { type: "cycling", title: "Bisiklet", metRate: 7.8 },
  { type: "fitness", title: "Fitness & Kuvvet", metRate: 8.0 },
  { type: "swimming", title: "Yüzme", metRate: 9.2 },
  { type: "other", title: "Diğer Egzersiz", metRate: 5.0 },
];

export function AddExerciseModal({ isOpen, onClose, onSave }: AddExerciseModalProps) {
  const [selectedType, setSelectedType] = useState<ExerciseType>("fitness");
  const [customTitle, setCustomTitle] = useState<string>("Fitness & Kuvvet");
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [customCalories, setCustomCalories] = useState<number | null>(null);

  // Derived estimated calories: if user entered custom calories, use that; otherwise calculate from MET
  const selectedOption = EXERCISE_OPTIONS.find((opt) => opt.type === selectedType);
  const metRate = selectedOption?.metRate || 5.0;
  const calculatedCalories = Math.round(durationMinutes * metRate);
  const activeCalories = customCalories !== null ? customCalories : calculatedCalories;

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTypeSelect = (opt: ExerciseOption) => {
    setSelectedType(opt.type);
    setCustomTitle(opt.title);
    setCustomCalories(null); // Reset custom override
  };

  const handleDurationPreset = (mins: number) => {
    setDurationMinutes(mins);
    setCustomCalories(null); // Reset custom override
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validMinutes = Math.max(1, durationMinutes);
    const validCalories = Math.max(1, activeCalories);

    onSave({
      type: selectedType,
      title: customTitle.trim() || "Egzersiz",
      durationMinutes: validMinutes,
      caloriesBurned: validCalories,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-app-text-dark/50 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container overflow-hidden animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-container bg-surface-container-low/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 id="modal-title" className="text-base font-bold text-app-text-main">
                Yeni Egzersiz Kaydı
              </h3>
              <p className="text-xs text-app-text-muted">Yakılan aktif kaloriyi kaydet</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Modalı Kapat"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-app-text-muted hover:text-app-text-main hover:bg-surface-container transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* Exercise Type Selection Pills */}
          <div>
            <label className="text-xs font-semibold text-app-text-muted block mb-2">
              Egzersiz Türü
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EXERCISE_OPTIONS.map((opt) => {
                const isSelected = selectedType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => handleTypeSelect(opt)}
                    className={`h-11 min-h-[44px] px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isSelected
                        ? "bg-primary text-white shadow-xs"
                        : "bg-surface-container-low text-app-text-main hover:bg-surface-container"
                    }`}
                  >
                    {opt.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Exercise Name */}
          <div>
            <label htmlFor="exercise-title-input" className="text-xs font-semibold text-app-text-muted block mb-1.5">
              Egzersiz Başlığı
            </label>
            <input
              id="exercise-title-input"
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Örn: Sabah Koşusu"
              className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-transparent focus:border-primary focus:bg-white text-app-text-main text-sm outline-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              required
            />
          </div>

          {/* Duration & Estimated Calories Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="exercise-duration-input" className="text-xs font-semibold text-app-text-muted block mb-1.5">
                Süre (dakika)
              </label>
              <div className="relative">
                <input
                  id="exercise-duration-input"
                  type="number"
                  min="1"
                  max="360"
                  value={durationMinutes}
                  onChange={(e) => {
                    setDurationMinutes(Number(e.target.value) || 0);
                    setCustomCalories(null);
                  }}
                  className="w-full h-11 pl-3.5 pr-9 rounded-xl bg-surface-container-low border border-transparent focus:border-primary focus:bg-white text-app-text-main text-sm font-semibold outline-none transition-colors tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <Timer className="w-4 h-4 text-app-text-muted absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="exercise-calories-input" className="text-xs font-semibold text-app-text-muted block mb-1.5">
                Yakılan Kalori
              </label>
              <div className="relative">
                <input
                  id="exercise-calories-input"
                  type="number"
                  min="1"
                  max="3000"
                  value={activeCalories}
                  onChange={(e) => {
                    setCustomCalories(Number(e.target.value) || 0);
                  }}
                  className="w-full h-11 pl-3.5 pr-9 rounded-xl bg-surface-container-low border border-transparent focus:border-calorie focus:bg-white text-calorie text-sm font-bold outline-none transition-colors tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-calorie"
                />
                <Flame className="w-4 h-4 text-calorie absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Quick Duration Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-app-text-muted mr-1">Hızlı Seç:</span>
            {[15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => handleDurationPreset(mins)}
                className={`min-h-[44px] min-w-[44px] px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center justify-center tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  durationMinutes === mins
                    ? "bg-primary-soft text-primary font-bold"
                    : "bg-surface-container-low text-app-text-muted hover:bg-surface-container"
                }`}
              >
                {mins} dk
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 min-h-[44px] rounded-xl border border-surface-container text-app-text-main text-xs font-bold hover:bg-surface-container-low transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="flex-1 h-12 min-h-[44px] rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-primary-hover shadow-md active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Check className="w-4 h-4" />
              Egzersizi Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddExerciseModal;
