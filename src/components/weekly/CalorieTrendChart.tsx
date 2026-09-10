"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import type { WeeklyDayStat } from "@/types/daily";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

export interface CalorieTrendChartProps {
  days: WeeklyDayStat[];
  targetCalorie?: number;
}

interface TooltipPayloadItem {
  value: number;
  dataKey: string;
  name: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const consumed = payload.find((p) => p.dataKey === "consumedCalories")?.value || 0;
    const burned = payload.find((p) => p.dataKey === "burnedCalories")?.value || 0;
    const net = consumed - burned;

    return (
      <div className="bg-app-text-dark text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-white/10 select-none">
        <span className="font-bold block text-white/90">{label}</span>
        <div className="flex items-center justify-between gap-4 text-[11px]">
          <span className="text-primary-light">Alınan:</span>
          <span className="font-bold tabular-nums">{consumed.toLocaleString("tr-TR")} kcal</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-[11px]">
          <span className="text-[#f59e0b]">Yakılan:</span>
          <span className="font-bold tabular-nums">-{burned.toLocaleString("tr-TR")} kcal</span>
        </div>
        <div className="pt-1 border-t border-white/10 flex items-center justify-between gap-4 text-[11px]">
          <span className="text-white/70 font-semibold">Net Denge:</span>
          <span className="font-extrabold text-white tabular-nums">{net.toLocaleString("tr-TR")} kcal</span>
        </div>
      </div>
    );
  }
  return null;
}

export function CalorieTrendChart({ days, targetCalorie = 2000 }: CalorieTrendChartProps) {
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    queueMicrotask(() => {
      setIsMounted(true);
    });
  }, []);

  const chartData = days.map((day) => ({
    name: day.dayLabel,
    date: day.date,
    consumedCalories: day.consumedCalories,
    burnedCalories: day.burnedCalories,
    netCalories: day.netCalories,
  }));

  return (
    <Card variant="standard" className="p-4 sm:p-5 flex flex-col space-y-3">
      <CardHeader className="p-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
            <span className="font-bold text-xs">kcal</span>
          </div>
          <div>
            <CardTitle as="h3" className="text-base font-bold text-app-text-main">
              Günlük Kalori Dağılımı
            </CardTitle>
            <span className="text-xs text-app-text-muted">Alınan vs. Yakılan Kalori</span>
          </div>
        </div>
        <span className="text-xs font-semibold text-app-text-muted bg-surface-container-low px-2.5 py-1 rounded-full tabular-nums">
          Hedef: {targetCalorie.toLocaleString("tr-TR")} kcal
        </span>
      </CardHeader>

      <div className="w-full h-64 pt-2">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6d7a72", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6d7a72", fontSize: 11 }}
                domain={[0, (dataMax: number) => Math.max(2400, Math.ceil(dataMax * 1.15))]}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={targetCalorie}
                stroke="#006948"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
              />
              {/* Consumed Calories Bar */}
              <Bar
                dataKey="consumedCalories"
                name="Alınan"
                fill="#006948"
                radius={[6, 6, 0, 0]}
                isAnimationActive={true}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.consumedCalories > targetCalorie ? "#00855d" : "#006948"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container-low/30 rounded-xl animate-pulse text-xs text-app-text-muted">
            Grafik yükleniyor...
          </div>
        )}
      </div>
    </Card>
  );
}

export default CalorieTrendChart;
