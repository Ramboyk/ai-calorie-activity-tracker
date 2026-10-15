"use client";

import React from "react";
import {
  ALL_BADGES,
  GamificationState,
  calculateUserLevel,
} from "@/lib/gamification/streak-manager";
import { isToday } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { Flame, Award, ChevronRight, Shield, Sparkles, Snowflake } from "lucide-react";

export interface StreakBadgeCardProps {
  gamification: GamificationState;
  onOpenBadgesModal: () => void;
  className?: string;
}

export function StreakBadgeCard({
  gamification,
  onOpenBadgesModal,
  className,
}: StreakBadgeCardProps) {
  const userLevel = calculateUserLevel(gamification.totalXp);
  const unlockedBadgesCount = Object.keys(gamification.unlockedBadges).length;
  const isProtectedToday = gamification.lastActiveDate
    ? isToday(gamification.lastActiveDate)
    : false;

  // Select 3 showcase badges (prioritize unlocked ones, then common next ones)
  const unlockedBadgeList = ALL_BADGES.filter(
    (b) => gamification.unlockedBadges[b.id]
  );
  const lockedBadgeList = ALL_BADGES.filter(
    (b) => !gamification.unlockedBadges[b.id]
  );
  const showcaseBadges = [...unlockedBadgeList, ...lockedBadgeList].slice(0, 4);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-surface-container-lowest dark:bg-surface-container-low border border-surface-container/80 p-5 shadow-xs transition-all hover:shadow-md",
        className
      )}
    >
      {/* Ambient background glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-primary/10 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Top Header: Streak Flame & Streak Freeze */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Animated Flame Icon */}
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25">
              <Flame className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-app-text-main">
                  {gamification.currentStreak} Günlük Seri
                </h3>
                {isProtectedToday ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Bugün Korundu ✨
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Korumak İçin Kaydet
                  </span>
                )}
              </div>
              <p className="text-xs text-app-text-muted mt-0.5">
                {isProtectedToday
                  ? "Harika iş! Yarın da günlüğe kayıt girerek serini büyüt."
                  : "Bugün bir öğün, su veya aktivite kaydederek serini devam ettir."}
              </p>
            </div>
          </div>

          {/* Streak Freeze Pill */}
          {gamification.streakFreezeCount > 0 && (
            <div
              title="1 Günlük Seri Dondurma Koruması Aktif"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 select-none shrink-0"
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>{gamification.streakFreezeCount} Koruma</span>
            </div>
          )}
        </div>

        {/* User Level & XP Progress Bar */}
        <div className="p-3.5 rounded-2xl bg-surface-container-low/60 border border-surface-container/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-primary/20 text-primary font-black text-[10px] flex items-center justify-center">
                L{userLevel.level}
              </span>
              <span className="font-bold text-app-text-main">
                {userLevel.title}
              </span>
            </div>
            <span className="font-semibold text-app-text-muted text-[11px]">
              <strong className="text-primary font-bold">{gamification.totalXp}</strong> / {userLevel.nextLevelXp} XP
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-emerald-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${userLevel.levelProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Badges Mini Showcase & Action Button */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5">
            {showcaseBadges.map((badge) => {
              const isUnlocked = Boolean(gamification.unlockedBadges[badge.id]);
              return (
                <div
                  key={badge.id}
                  title={`${badge.name}: ${badge.description}`}
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-transform hover:scale-110 select-none",
                    isUnlocked
                      ? "bg-primary-soft/40 border-primary/30 shadow-xs"
                      : "bg-surface-container/40 border-surface-container grayscale opacity-40"
                  )}
                >
                  {badge.icon}
                </div>
              );
            })}
            <span className="text-[11px] font-bold text-app-text-muted ml-1 hidden xs:inline">
              {unlockedBadgesCount} / {ALL_BADGES.length} Rozet
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenBadgesModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-primary hover:text-primary-hover hover:bg-primary-soft/30 transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>Tüm Rozetler</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default StreakBadgeCard;
