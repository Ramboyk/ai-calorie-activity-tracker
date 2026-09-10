"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { EditableFoodItem } from "@/types/meal";
import { X, Plus, Utensils } from "lucide-react";

export interface AddFoodItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: EditableFoodItem) => void;
}

export function AddFoodItemModal({
  isOpen,
  onClose,
  onAdd,
}: AddFoodItemModalProps) {
  const [name, setName] = useState<string>("");
  const [weight, setWeight] = useState<string>("100");
  const [calories, setCalories] = useState<string>("150");
  const [protein, setProtein] = useState<string>("10");
  const [carbs, setCarbs] = useState<string>("15");
  const [fat, setFat] = useState<string>("5");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Lütfen besin adını giriniz.");
      return;
    }

    const weightNum = Math.max(1, parseInt(weight, 10) || 100);
    const caloriesNum = Math.max(0, parseInt(calories, 10) || 0);
    const proteinNum = Math.max(0, parseFloat(protein) || 0);
    const carbsNum = Math.max(0, parseFloat(carbs) || 0);
    const fatNum = Math.max(0, parseFloat(fat) || 0);

    const factor = weightNum > 0 ? 100 / weightNum : 1;
    const base100g = {
      calories: Math.round(caloriesNum * factor),
      protein: Math.round(proteinNum * factor * 10) / 10,
      carbs: Math.round(carbsNum * factor * 10) / 10,
      fat: Math.round(fatNum * factor * 10) / 10,
    };

    const newItem: EditableFoodItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: trimmedName,
      estimatedPortion: `${weightNum} g`,
      weightGrams: weightNum,
      calories: caloriesNum,
      protein: proteinNum,
      carbs: carbsNum,
      fat: fatNum,
      base100g,
    };

    onAdd(newItem);

    // Reset and close
    setName("");
    setWeight("100");
    setCalories("150");
    setProtein("10");
    setCarbs("15");
    setFat("5");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-food-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl p-6 border border-surface-container shadow-hero space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h3 id="add-food-modal-title" className="font-bold text-base text-app-text-main">
                Yeni Besin Ekle
              </h3>
              <p className="text-xs text-app-text-muted">
                Öğüne eklemek istediğiniz malzemeyi tanımlayın
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="w-9 h-9 rounded-full flex items-center justify-center text-app-text-muted hover:bg-surface-container transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert if any */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-app-error text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Food Name */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-app-text-main">
              Besin Adı *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Zeytinyağı, Ceviz İçi, Beyaz Peynir"
              required
              className="w-full h-11 px-3.5 rounded-xl border border-surface-container bg-surface-container-low text-xs font-semibold text-app-text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Weight & Calories Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-app-text-main">
                Gramaj (g) *
              </label>
              <input
                type="number"
                min="1"
                max="2000"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
                className="w-full h-11 px-3.5 rounded-xl border border-surface-container bg-surface-container-low text-xs font-semibold text-app-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 tabular-nums"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-app-text-main">
                Kalori (kcal) *
              </label>
              <input
                type="number"
                min="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                required
                className="w-full h-11 px-3.5 rounded-xl border border-surface-container bg-surface-container-low text-xs font-semibold text-app-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 tabular-nums"
              />
            </div>
          </div>

          {/* Macros 3-Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-primary">
                Protein (g)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="w-full h-10 px-2.5 rounded-xl border border-surface-container bg-surface-container-low text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 tabular-nums"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-calorie">
                Karb (g)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="w-full h-10 px-2.5 rounded-xl border border-surface-container bg-surface-container-low text-xs font-bold text-calorie focus:outline-none focus:ring-2 focus:ring-primary/40 tabular-nums"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-water">
                Yağ (g)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="w-full h-10 px-2.5 rounded-xl border border-surface-container bg-surface-container-low text-xs font-bold text-water focus:outline-none focus:ring-2 focus:ring-primary/40 tabular-nums"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-surface-container">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              className="w-full"
            >
              İptal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              className="w-full shadow-sm"
            >
              Besini Ekle
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddFoodItemModal;
