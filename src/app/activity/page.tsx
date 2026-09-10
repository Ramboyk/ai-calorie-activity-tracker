"use client";

import React, { useState } from "react";
import {
  Container,
  Header,
  BottomNav,
  DisclaimerBanner,
} from "@/components";
import { StepTrackerCard } from "@/components/activity/StepTrackerCard";
import { WaterTrackerCard } from "@/components/activity/WaterTrackerCard";
import { AddExerciseModal } from "@/components/activity/AddExerciseModal";
import { useTracker } from "@/context";
import { formatDisplayDate } from "@/lib/utils/date";
import type { ExerciseType } from "@/types/activity";
import {
  Flame,
  Timer,
  Plus,
  Trash2,
  Sparkles,
  Footprints,
  Dumbbell,
  Activity as ActivityIcon,
  Bike,
  Waves,
} from "lucide-react";

export default function ActivityPage() {
  const {
    selectedDate,
    getDailyLog,
    addWater,
    resetWater,
    setWater,
    updateSteps,
    updateStepGoal,
    addActivity,
    deleteActivity,
    getActivitiesForDate,
    getTotalBurnedCalories,
    showToast,
  } = useTracker();

  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState<boolean>(false);

  const dayLog = getDailyLog(selectedDate);
  const dayExercises = getActivitiesForDate(selectedDate);
  const totalBurnedCalories = getTotalBurnedCalories(selectedDate);
  const totalExerciseMinutes = dayExercises.reduce((acc, ex) => acc + ex.durationMinutes, 0);

  const handleAddWater = (amountMl: number) => {
    addWater(amountMl, selectedDate);
  };

  const handleResetWater = () => {
    resetWater(selectedDate);
    showToast("Su tüketimi sıfırlandı", "info");
  };

  const handleSetWater = (ml: number) => {
    setWater(ml, selectedDate);
  };

  const handleUpdateSteps = (steps: number) => {
    updateSteps(steps, selectedDate);
    showToast(`Adım sayısı güncellendi: ${steps.toLocaleString("tr-TR")}`, "success");
  };

  const handleUpdateStepGoal = (goal: number) => {
    updateStepGoal(goal, selectedDate);
    showToast(`Yeni adım hedefi: ${goal.toLocaleString("tr-TR")}`, "success");
  };

  const handleSaveExercise = (data: {
    type: ExerciseType;
    title: string;
    durationMinutes: number;
    caloriesBurned: number;
  }) => {
    addActivity({
      userId: "user_demo_1",
      date: selectedDate,
      time: "",
      type: data.type,
      title: data.title,
      durationMinutes: data.durationMinutes,
      caloriesBurned: data.caloriesBurned,
    });
  };

  const handleDeleteExercise = (id: string) => {
    deleteActivity(id);
  };

  const getExerciseIcon = (type: ExerciseType) => {
    switch (type) {
      case "walking":
      case "hiking":
        return <Footprints className="w-5 h-5 text-primary" />;
      case "running":
        return <ActivityIcon className="w-5 h-5 text-primary" />;
      case "cycling":
        return <Bike className="w-5 h-5 text-primary" />;
      case "swimming":
        return <Waves className="w-5 h-5 text-primary" />;
      case "fitness":
      default:
        return <Dumbbell className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-app-text-main antialiased selection:bg-primary-light selection:text-primary">
      {/* Top Header */}
      <Header />

      <main className="flex-1 w-full pt-4 sm:pt-6 pb-28 md:pb-12">
        <Container className="space-y-6 max-w-4xl">
          {/* Motivational Header Greeting */}
          <section className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                Canlı Veri Senkronizasyonu
              </span>
              <span className="text-[11px] font-medium text-app-text-muted bg-surface-container-high px-2.5 py-0.5 rounded-full">
                Apple Health bağlı
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-app-text-main tracking-tight">
              Günlük Aktivite &amp; Su
            </h1>
            <p className="text-xs sm:text-sm text-app-text-muted">
              {formatDisplayDate(selectedDate)} için hareket ve hidrasyon takibiniz.
            </p>
          </section>

          {/* Daily Summary Banner (Tactile Metric Bar) */}
          <section className="relative overflow-hidden bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl p-4 sm:p-5 shadow-md">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-around relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-xs text-white/80 font-medium block">Toplam Yakılan</span>
                  <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight tabular-nums">
                    {totalBurnedCalories}{" "}
                    <span className="text-xs font-normal opacity-90">kcal</span>
                  </div>
                </div>
              </div>

              <div className="w-px h-10 bg-white/20" />

              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                  <Timer className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-xs text-white/80 font-medium block">Toplam Egzersiz</span>
                  <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight tabular-nums">
                    {totalExerciseMinutes}{" "}
                    <span className="text-xs font-normal opacity-90">dk</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Core Tracking Grid: Steps & Water */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StepTrackerCard
              steps={dayLog.steps}
              stepGoal={dayLog.stepGoal}
              distanceKm={dayLog.distanceKm || Math.round(dayLog.steps * 0.00072 * 10) / 10}
              activeMinutes={dayLog.activeMinutes || Math.round(dayLog.steps / 114)}
              onUpdateSteps={handleUpdateSteps}
              onUpdateStepGoal={handleUpdateStepGoal}
            />

            <WaterTrackerCard
              currentWaterMl={dayLog.waterMl}
              waterGoalMl={dayLog.waterGoalMl}
              onAddWater={handleAddWater}
              onResetWater={handleResetWater}
              onSetWater={handleSetWater}
            />
          </div>

          {/* Exercises Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-app-text-main">Egzersizler</h2>
                <span className="text-xs text-app-text-muted">
                  {dayExercises.length > 0
                    ? `${dayExercises.length} egzersiz kaydedildi`
                    : "Henüz egzersiz eklenmedi"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddExerciseOpen(true)}
                className="h-11 min-h-[44px] px-4 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary-hover active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Egzersiz Ekle</span>
              </button>
            </div>

            {/* Exercise List */}
            <div className="space-y-2.5">
              {dayExercises.length > 0 ? (
                dayExercises.map((exercise) => (
                  <article
                    key={exercise.id}
                    className="bg-surface-container-lowest rounded-xl p-3.5 sm:p-4 flex items-center justify-between shadow-xs border border-surface-container hover:bg-surface-container-low/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
                        {getExerciseIcon(exercise.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-app-text-main truncate">
                            {exercise.title}
                          </h3>
                          <span className="text-[10px] text-app-text-muted bg-surface-container px-1.5 py-0.5 rounded font-medium">
                            {exercise.time || "Bugün"}
                          </span>
                        </div>
                        <p className="text-xs text-app-text-muted truncate">
                          {exercise.durationMinutes} dakika aktif süre
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 pl-2">
                      <div className="text-right">
                        <span className="text-sm font-bold text-calorie block tabular-nums">
                          -{exercise.caloriesBurned} kcal
                        </span>
                        <span className="text-[10px] text-app-text-muted">yakıldı</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteExercise(exercise.id)}
                        aria-label={`${exercise.title} egzersizini sil`}
                        title="Egzersizi Sil"
                        className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-app-text-muted hover:text-error hover:bg-rose-50 transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="p-8 rounded-2xl bg-surface-container-low/40 border border-dashed border-surface-container text-center space-y-2">
                  <Dumbbell className="w-8 h-8 text-app-text-muted mx-auto opacity-50" />
                  <p className="text-sm font-semibold text-app-text-main">
                    Bugün için egzersiz bulunmuyor
                  </p>
                  <p className="text-xs text-app-text-muted max-w-xs mx-auto">
                    Yaptığınız yürüyüş, koşu veya antrenmanı ekleyerek yakılan kaloriyi takip edin.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* AI Recovery Card */}
          <section className="bg-surface-container-low rounded-2xl p-4 sm:p-5 flex items-center gap-4 border border-surface-container">
            <div className="w-12 h-12 rounded-2xl bg-primary-soft flex items-center justify-center text-primary shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-primary uppercase tracking-wide">
                Yapay Zeka Dinlenme &amp; Form Analizi
              </span>
              <p className="text-xs sm:text-sm text-app-text-muted leading-relaxed">
                Bugünkü hareket ve hidrasyon dengeniz optimum seviyede ilerliyor. Antrenman sonrası
                yeterli su tükettiğinizden emin olun!
              </p>
            </div>
          </section>

          {/* Footer Disclaimer */}
          <footer className="pt-2">
            <DisclaimerBanner />
          </footer>
        </Container>
      </main>

      {/* Add Exercise Modal */}
      <AddExerciseModal
        isOpen={isAddExerciseOpen}
        onClose={() => setIsAddExerciseOpen(false)}
        onSave={handleSaveExercise}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
