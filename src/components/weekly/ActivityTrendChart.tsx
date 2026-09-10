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
} from "recharts";
import { Footprints } from "lucide-react";

export interface ActivityTrendChartProps {
  days: WeeklyDayStat[];
  targetSteps?: number;
}

interface TooltipPayloadItem {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function StepsTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const steps = payload[0].value || 0;
    const km = (steps * 0.00072).toFixed(1);
    const kcal = Math.round(steps * 0.04);

    return (
      <div className="bg-app-text-dark text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1 border border-white/10 select-none">
        <span className="font-bold block text-white/90">{label}</span>
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <span className="text-secondary-fixed">Adım:</span>
          <span className="font-extrabold tabular-nums">{steps.toLocaleString("tr-TR")}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-[10px] text-white/70 tabular-nums">
          <span>{km} km</span>
          <span>•</span>
          <span>{kcal} kcal</span>
        </div>
      </div>
    );
  }
  return null;
}

export function ActivityTrendChart({ days, targetSteps = 10000 }: ActivityTrendChartProps) {
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    queueMicrotask(() => {
      setIsMounted(true);
    });
  }, []);

  const chartData = days.map((day) => ({
    name: day.dayLabel,
    steps: day.steps,
    date: day.date,
  }));

  const avgSteps = Math.round(days.reduce((acc, d) => acc + d.steps, 0) / (days.length || 7));

  return (
    <Card variant="standard" className="p-4 sm:p-5 flex flex-col space-y-3">
      <CardHeader className="p-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-water-soft text-water flex items-center justify-center">
            <Footprints className="w-4 h-4" />
          </div>
          <div>
            <CardTitle as="h3" className="text-base font-bold text-app-text-main">
              Günlük Adımlar
            </CardTitle>
            <span className="text-xs text-app-text-muted">7 günlük hareket trendi</span>
          </div>
        </div>
        <span className="text-xs font-bold text-water bg-water-soft px-2.5 py-1 rounded-full tabular-nums">
          Ort. {avgSteps.toLocaleString("tr-TR")}
        </span>
      </CardHeader>

      <div className="w-full h-52 pt-1">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6d7a72", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6d7a72", fontSize: 10 }}
                domain={[0, (dataMax: number) => Math.max(12000, Math.ceil(dataMax * 1.15))]}
              />
              <Tooltip content={<StepsTooltip />} />
              <ReferenceLine
                y={targetSteps}
                stroke="#006398"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
              <Bar
                dataKey="steps"
                name="Adım"
                fill="#006398"
                radius={[5, 5, 0, 0]}
                isAnimationActive={true}
              />
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

export default ActivityTrendChart;
