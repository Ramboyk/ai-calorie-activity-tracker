import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import type { ExerciseLog } from "@/types/activity";
import { Flame, TrendingUp, Dumbbell, Timer } from "lucide-react";

export interface ActivitySummaryCardProps {
  exercises: ExerciseLog[];
  totalBurnedCalories: number;
}

export function ActivitySummaryCard({
  exercises,
  totalBurnedCalories,
}: ActivitySummaryCardProps) {
  const totalMinutes = exercises.reduce((acc, curr) => acc + curr.durationMinutes, 0);

  return (
    <Card variant="standard" className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-calorie-soft text-calorie">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <CardTitle as="h3">Aktivite Özeti</CardTitle>
            <CardDescription>Günlük egzersiz ve kalori yakımı</CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-primary bg-primary-soft px-2 py-0.5 rounded-full tabular-nums">
          <TrendingUp className="w-3.5 h-3.5" />
          +12%
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Burned Headline Banner */}
        <div className="p-3.5 rounded-2xl bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-calorie-soft flex items-center justify-center text-calorie shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-app-text-main tabular-nums">
                {totalBurnedCalories} kcal Yakıldı
              </div>
              <p className="text-xs text-app-text-muted flex items-center gap-1 tabular-nums mt-0.5">
                <Timer className="w-3 h-3" />
                {totalMinutes} dk toplam aktif süre
              </p>
            </div>
          </div>
        </div>

        {/* Exercises Mini-list */}
        <div className="space-y-2 pt-1">
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-surface-container hover:bg-surface-container-low transition-colors text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-app-text-muted shrink-0">
                  <Dumbbell className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="font-semibold text-app-text-main block truncate">
                    {exercise.title}
                  </span>
                  <span className="text-[11px] text-app-text-muted tabular-nums">
                    {exercise.durationMinutes} dk • {exercise.time}
                  </span>
                </div>
              </div>

              <span className="font-bold text-calorie tabular-nums shrink-0 pl-2">
                -{exercise.caloriesBurned} kcal
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ActivitySummaryCard;
