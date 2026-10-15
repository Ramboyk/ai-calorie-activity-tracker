"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Scale,
  TrendingDown,
  TrendingUp,
  Minus,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { useTracker } from "@/context";
import { formatDisplayDate, getTodayDateString } from "@/lib/utils/date";
import type { WeightLog } from "@/lib/storage/weight-tracker";
import { cn } from "@/lib/utils/cn";

export interface WeightTrackerCardProps {
  className?: string;
  targetWeightKg?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { date: string; displayDate: string; note?: string } }>;
}

function WeightChartTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-app-text-dark text-white p-2.5 rounded-xl shadow-xl text-xs space-y-0.5 border border-white/10 select-none">
        <span className="font-bold block text-white/90">{data.payload.displayDate}</span>
        <div className="flex items-center gap-1.5 text-primary-light">
          <Scale className="w-3.5 h-3.5" />
          <span className="font-extrabold text-sm tabular-nums">{data.value} kg</span>
        </div>
        {data.payload.note && (
          <span className="text-[10px] text-white/70 block italic">“{data.payload.note}”</span>
        )}
      </div>
    );
  }
  return null;
}

export function WeightTrackerCard({
  className,
  targetWeightKg = 72,
}: WeightTrackerCardProps) {
  const { weightLogs, addWeightLog, deleteWeightLog, getLatestWeight, getWeightProgress } =
    useTracker();

  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [weightInput, setWeightInput] = useState<string>("");
  const [dateInput, setDateInput] = useState<string>(getTodayDateString());
  const [noteInput, setNoteInput] = useState<string>("");
  const [showHistory, setShowHistory] = useState<boolean>(false);

  useEffect(() => {
    queueMicrotask(() => {
      setIsMounted(true);
    });
  }, []);

  const latestLog = getLatestWeight();
  const progress = getWeightProgress();

  useEffect(() => {
    if (latestLog && !weightInput) {
      setWeightInput(String(latestLog.weightKg));
    }
  }, [latestLog, weightInput]);

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(weightInput);
    if (!isNaN(val) && val >= 25 && val <= 300) {
      addWeightLog(val, dateInput, noteInput);
      setIsAdding(false);
      setNoteInput("");
    }
  };

  // Prepare chart data sorted chronologically
  const chartData = weightLogs.map((log) => ({
    date: log.date,
    displayDate: formatDisplayDate(log.date).split(" ").slice(0, 2).join(" "),
    weight: log.weightKg,
    note: log.note,
  }));

  // Min and max weights for YAxis domain padding
  const weights = weightLogs.map((w) => w.weightKg);
  const minWeight = weights.length > 0 ? Math.floor(Math.min(...weights, targetWeightKg) - 1) : 60;
  const maxWeight = weights.length > 0 ? Math.ceil(Math.max(...weights, targetWeightKg) + 1) : 90;

  return (
    <Card variant="standard" className={cn("w-full relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-primary-soft text-primary shadow-xs">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <CardTitle as="h3">Kilo Takibi</CardTitle>
            <CardDescription>Tartım geçmişi ve kilo değişimi</CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {progress && (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold tabular-nums border",
                progress.isLoss
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400"
                  : progress.isGain
                  ? "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400"
                  : "bg-surface-container border-surface-container text-app-text-muted"
              )}
            >
              {progress.isLoss ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : progress.isGain ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <Minus className="w-3.5 h-3.5" />
              )}
              <span>
                {progress.diffKg > 0 ? `+${progress.diffKg}` : progress.diffKg} kg (
                {progress.percentage > 0 ? `+${progress.percentage}` : progress.percentage}%)
              </span>
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            title="Tartım Ekle"
            aria-label="Yeni Tartım Ekle"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-primary-soft text-primary hover:bg-primary hover:text-white transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Quick Add Form Drawer */}
        {isAdding && (
          <form
            onSubmit={handleSaveWeight}
            className="p-3 bg-surface-container-low rounded-2xl border border-surface-container space-y-2.5 animate-fade-in"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-app-text-muted block mb-1">
                  Kilo (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="25"
                  max="300"
                  required
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder="74.5"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-surface-container text-sm font-extrabold text-app-text-main outline-none tabular-nums focus:border-primary"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-app-text-muted block mb-1">
                  Tarih
                </label>
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-surface-container text-xs font-semibold text-app-text-main outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-app-text-muted block mb-1">
                  Not (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Örn: Sabah aç karnına"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-surface-container text-xs text-app-text-main outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-xl border border-surface-container text-xs font-medium text-app-text-muted hover:text-app-text-main transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1.5 hover:bg-primary-hover active:scale-95 transition-all shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Kaydet</span>
              </button>
            </div>
          </form>
        )}

        {/* Current Weight & Meta Banner */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low/70 border border-surface-container">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-app-text-main tabular-nums">
              {latestLog ? latestLog.weightKg : "--"}
            </span>
            <span className="text-xs font-bold text-app-text-muted">kg</span>
            <span className="text-[11px] text-app-text-muted ml-2">
              (Son: {latestLog ? formatDisplayDate(latestLog.date) : "Kayıt yok"})
            </span>
          </div>

          <div className="flex items-center gap-3 text-right">
            <div>
              <span className="text-[10px] text-app-text-muted uppercase font-semibold block">
                Hedef Kilo
              </span>
              <span className="text-sm font-extrabold text-primary tabular-nums">
                {targetWeightKg} kg
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="text-[11px] font-bold text-primary hover:underline"
            >
              {showHistory ? "Grafiği Göster" : "Geçmiş"}
            </button>
          </div>
        </div>

        {/* Toggle between Recharts Line Chart and History Table */}
        {!showHistory ? (
          <div className="w-full h-44 pt-1 -ml-3 sm:ml-0">
            {isMounted && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="displayDate"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#888888" }}
                  />
                  <YAxis
                    domain={[minWeight, maxWeight]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#888888" }}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip content={<WeightChartTooltip />} />
                  <ReferenceLine
                    y={targetWeightKg}
                    stroke="#006948"
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                    label={{
                      value: `Hedef ${targetWeightKg}kg`,
                      position: "right",
                      fill: "#006948",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#006948"
                    strokeWidth={2.5}
                    dot={{ fill: "#006948", r: 4, strokeWidth: 2, stroke: "#ffffff" }}
                    activeDot={{ r: 6, fill: "#006948" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-app-text-muted">
                Grafik için henüz yeterli tartım verisi bulunmuyor.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
            {weightLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low text-xs border border-surface-container/60"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-app-text-muted" />
                  <span className="font-semibold text-app-text-main">
                    {formatDisplayDate(log.date)}
                  </span>
                  {log.note && (
                    <span className="text-[11px] text-app-text-muted italic truncate max-w-[160px]">
                      • {log.note}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-app-text-main tabular-nums">
                    {log.weightKg} kg
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteWeightLog(log.id)}
                    title="Sil"
                    aria-label={`${log.date} tarihli tartımı sil`}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-app-text-muted hover:text-app-error hover:bg-surface-container transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WeightTrackerCard;
