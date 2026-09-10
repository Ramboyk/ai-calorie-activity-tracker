"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Sparkles, Loader2, Utensils } from "lucide-react";

export interface AnalysisLoadingStateProps {
  previewUrl?: string | null;
}

export function AnalysisLoadingState({ previewUrl }: AnalysisLoadingStateProps) {
  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Loading Status Header Banner */}
      <div className="p-5 rounded-3xl bg-primary-soft/80 border border-primary/20 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md shadow-primary/30">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h3 className="text-base sm:text-lg font-extrabold text-app-text-main">
              Yemeğiniz analiz ediliyor...
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
              <Sparkles className="w-3 h-3" />
              Gemini Vision
            </span>
          </div>
          <p className="text-xs text-app-text-muted leading-relaxed max-w-xl">
            Yapay zekâ görseldeki besinleri ve porsiyonları inceliyor. Bu işlem birkaç saniye
            sürebilir.
          </p>
        </div>
      </div>

      {/* Image with Scanning Laser Effect if previewUrl is available */}
      {previewUrl && (
        <div className="relative w-full aspect-[16/9] max-h-60 rounded-2xl overflow-hidden bg-surface-container-low border border-surface-container shadow-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Taranan Yemek"
            className="w-full h-full object-cover opacity-60 filter blur-[1px]"
          />
          {/* Scanning Laser Line */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-90 shadow-[0_0_16px_#006948] animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end p-4">
            <span className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-light animate-ping" />
              Görsel pikselleri taranıyor...
            </span>
          </div>
        </div>
      )}

      {/* Zero Layout-Shift Skeleton Card Structure */}
      <Card variant="standard" className="p-6 space-y-6">
        {/* Skeleton: Meal Title & Total Calories */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-surface-container">
          <div className="space-y-2 flex-1">
            <div className="h-3 w-28 bg-surface-container rounded-full animate-pulse" />
            <div className="h-7 w-3/4 max-w-sm bg-surface-container rounded-xl animate-pulse" />
            <div className="h-3 w-1/2 max-w-xs bg-surface-container-high rounded-full animate-pulse" />
          </div>
          <div className="space-y-1 text-right shrink-0">
            <div className="h-8 w-20 bg-surface-container rounded-xl animate-pulse ml-auto" />
            <div className="h-3 w-12 bg-surface-container-high rounded-full animate-pulse ml-auto" />
          </div>
        </div>

        {/* Skeleton: Macro Distribution Bars */}
        <div className="space-y-3">
          <div className="h-3.5 w-32 bg-surface-container rounded-full animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-surface-container-low space-y-2"
              >
                <div className="h-3 w-14 bg-surface-container rounded-full animate-pulse" />
                <div className="h-5 w-10 bg-surface-container-high rounded-md animate-pulse" />
                <div className="h-2 w-full bg-surface-container rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Skeleton: Food Items List */}
        <div className="space-y-3 pt-2">
          <div className="h-3.5 w-36 bg-surface-container rounded-full animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3].map((row) => (
              <div
                key={row}
                className="p-3 rounded-xl border border-surface-container flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-outline animate-pulse">
                    <Utensils className="w-4 h-4 opacity-40" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-40 bg-surface-container rounded-md animate-pulse" />
                    <div className="h-3 w-28 bg-surface-container-high rounded-md animate-pulse" />
                  </div>
                </div>
                <div className="h-5 w-14 bg-surface-container rounded-md animate-pulse shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AnalysisLoadingState;
