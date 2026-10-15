/**
 * Weight Tracking Storage and Calculations
 * Manages user weight logs, historical trend analysis, and progress metrics.
 */

import { addDays, getTodayDateString } from "@/lib/utils/date";

export interface WeightLog {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  note?: string;
  createdAt: string; // ISO 8601 string
}

export interface WeightProgressSummary {
  initialWeight: number;
  currentWeight: number;
  diffKg: number;
  percentage: number;
  isLoss: boolean;
  isGain: boolean;
  direction: "loss" | "gain" | "neutral";
  totalLogsCount: number;
}

export const LOCAL_STORAGE_WEIGHT_LOGS_KEY = "nutritrack_weight_logs_v1";

/**
 * Generates realistic seed weight history for initial demonstration
 * showing a steady, healthy progression over the past 3 weeks.
 */
export function getInitialSeedWeightLogs(todayStr: string = getTodayDateString()): WeightLog[] {
  return [
    {
      id: "weight_seed_1",
      date: addDays(todayStr, -21),
      weightKg: 76.8,
      note: "Başlangıç tartımı",
      createdAt: `${addDays(todayStr, -21)}T08:00:00Z`,
    },
    {
      id: "weight_seed_2",
      date: addDays(todayStr, -14),
      weightKg: 76.1,
      note: "1. hafta kontrolü",
      createdAt: `${addDays(todayStr, -14)}T08:15:00Z`,
    },
    {
      id: "weight_seed_3",
      date: addDays(todayStr, -7),
      weightKg: 75.3,
      note: "Temiz beslenme haftası",
      createdAt: `${addDays(todayStr, -7)}T08:05:00Z`,
    },
    {
      id: "weight_seed_4",
      date: addDays(todayStr, -3),
      weightKg: 74.8,
      note: "Ağırlık antrenmanı sonrası",
      createdAt: `${addDays(todayStr, -3)}T08:30:00Z`,
    },
    {
      id: "weight_seed_5",
      date: todayStr,
      weightKg: 74.4,
      note: "Sabah aç karnına tartım",
      createdAt: `${todayStr}T08:10:00Z`,
    },
  ];
}

/**
 * Returns weight logs sorted chronologically.
 */
export function getSortedWeightLogs(
  logs: WeightLog[],
  order: "asc" | "desc" = "asc"
): WeightLog[] {
  if (!Array.isArray(logs) || logs.length === 0) return [];

  return [...logs].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return order === "asc" ? timeA - timeB : timeB - timeA;
  });
}

/**
 * Returns the latest (most recent) weight log.
 */
export function getLatestWeightLog(logs: WeightLog[]): WeightLog | null {
  const sorted = getSortedWeightLogs(logs, "desc");
  return sorted.length > 0 ? sorted[0] : null;
}

/**
 * Calculates overall weight change and percentage since the initial record.
 */
export function calculateWeightProgress(logs: WeightLog[]): WeightProgressSummary | null {
  if (!Array.isArray(logs) || logs.length === 0) {
    return null;
  }

  const sorted = getSortedWeightLogs(logs, "asc");
  const initial = sorted[0];
  const current = sorted[sorted.length - 1];

  const diffKg = Math.round((current.weightKg - initial.weightKg) * 10) / 10;
  const percentage =
    initial.weightKg > 0
      ? Math.round(((current.weightKg - initial.weightKg) / initial.weightKg) * 1000) / 10
      : 0;

  const isLoss = diffKg < 0;
  const isGain = diffKg > 0;
  const direction: "loss" | "gain" | "neutral" = isLoss
    ? "loss"
    : isGain
    ? "gain"
    : "neutral";

  return {
    initialWeight: initial.weightKg,
    currentWeight: current.weightKg,
    diffKg,
    percentage,
    isLoss,
    isGain,
    direction,
    totalLogsCount: sorted.length,
  };
}
