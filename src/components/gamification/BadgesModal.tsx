"use client";

import React, { useState } from "react";
import {
  ALL_BADGES,
  Badge,
  BadgeCategory,
  GamificationState,
  calculateUserLevel,
} from "@/lib/gamification/streak-manager";
import { formatDisplayDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import {
  X,
  Award,
  Flame,
  CheckCircle2,
  Lock,
  Sparkles,
  ShieldAlert,
  Zap,
} from "lucide-react";

export interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  gamification: GamificationState;
}

export function BadgesModal({ isOpen, onClose, gamification }: BadgesModalProps) {
  const [activeCategory, setActiveCategory] = useState<"all" | BadgeCategory>("all");

  if (!isOpen) return null;

  const userLevel = calculateUserLevel(gamification.totalXp);
  const unlockedCount = Object.keys(gamification.unlockedBadges).length;
  const totalBadgesCount = ALL_BADGES.length;
  const percentUnlocked = Math.round((unlockedCount / totalBadgesCount) * 100);

  const filteredBadges = ALL_BADGES.filter((badge) => {
    if (activeCategory === "all") return true;
    return badge.category === activeCategory;
  });

  const categories: Array<{ id: "all" | BadgeCategory; label: string }> = [
    { id: "all", label: `Tümü (${totalBadgesCount})` },
    { id: "streak", label: "🔥 Seri" },
    { id: "nutrition", label: "🥗 Beslenme" },
    { id: "activity", label: "🏃 Aktivite" },
    { id: "milestone", label: "⭐ Kilometre Taşı" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="badges-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-2xl bg-surface-container-lowest dark:bg-surface-container-low rounded-3xl border border-surface-container shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="p-5 sm:p-6 border-b border-surface-container flex items-center justify-between gap-4 bg-gradient-to-r from-primary-soft/30 via-transparent to-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="badges-modal-title"
                  className="text-lg sm:text-xl font-extrabold text-app-text-main"
                >
                  Başarılar & Rozetler
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {unlockedCount}/{totalBadgesCount}
                </span>
              </div>
              <p className="text-xs text-app-text-muted mt-0.5">
                Sağlıklı alışkanlıklar kazandıkça özel rozetlerin ve XP ödüllerinin kilidini aç!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="w-9 h-9 rounded-full flex items-center justify-center text-app-text-muted hover:text-app-text-main hover:bg-surface-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level & XP Overview Banner */}
        <div className="px-5 py-4 bg-surface-container/50 border-b border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-black text-sm shrink-0 border border-amber-500/30">
              L{userLevel.level}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-app-text-main">
                  {userLevel.title}
                </span>
                <span className="text-xs font-semibold text-primary">
                  {gamification.totalXp} XP
                </span>
              </div>
              <p className="text-[11px] text-app-text-muted">
                {userLevel.xpNeededForNext > 0
                  ? `Seviye ${userLevel.level + 1} için ${userLevel.xpNeededForNext} XP kaldı`
                  : "Maksimum seviyeye ulaştın! 🏆"}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-48 space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-app-text-muted">
              <span>İlerleme</span>
              <span className="font-bold text-app-text-main">%{userLevel.levelProgressPercent}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-amber-500 transition-all duration-500 rounded-full"
                style={{ width: `${userLevel.levelProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-5 py-2.5 border-b border-surface-container flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none shrink-0",
                activeCategory === cat.id
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-container-low text-app-text-muted hover:text-app-text-main hover:bg-surface-container"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[50vh] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredBadges.map((badge) => {
              const unlockIso = gamification.unlockedBadges[badge.id];
              const isUnlocked = Boolean(unlockIso);

              return (
                <div
                  key={badge.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all flex items-start gap-3.5 relative select-none",
                    isUnlocked
                      ? "bg-surface-container-low/70 border-primary/30 shadow-xs hover:border-primary/50"
                      : "bg-surface-container-lowest/50 border-surface-container/70 opacity-70 hover:opacity-90"
                  )}
                >
                  {/* Badge Icon */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border shadow-xs",
                      isUnlocked
                        ? "bg-primary-soft/40 border-primary/30 shadow-primary/10"
                        : "bg-surface-container-high/60 border-surface-container grayscale"
                    )}
                  >
                    {badge.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-app-text-main truncate">
                        {badge.name}
                      </h4>
                      {isUnlocked ? (
                        <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-surface-container text-app-text-muted flex items-center justify-center shrink-0">
                          <Lock className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-app-text-muted line-clamp-2 mt-1">
                      {badge.description}
                    </p>

                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        +{badge.xpReward} XP
                      </span>

                      {isUnlocked && unlockIso && (
                        <span className="text-[10px] font-medium text-app-text-muted">
                          {formatDisplayDate(unlockIso.split("T")[0])}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rarity Tag */}
                  <span
                    className={cn(
                      "absolute top-3 right-3 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md tracking-wider",
                      badge.rarity === "common" && "bg-surface-container text-app-text-muted",
                      badge.rarity === "rare" && "bg-sky-500/15 text-sky-600 dark:text-sky-400",
                      badge.rarity === "epic" && "bg-purple-500/15 text-purple-600 dark:text-purple-400",
                      badge.rarity === "legendary" && "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {badge.rarity}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Streak Freeze & Rules Help Note */}
          <div className="mt-4 p-4 rounded-2xl bg-surface-container-low border border-surface-container flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-xs text-app-text-muted space-y-1">
              <p className="font-semibold text-app-text-main">
                Seri Nasıl Hesaplanır?
              </p>
              <p>
                Her gün günlüğüne en az bir öğün, su veya aktivite kaydederek serini koru.
                1 gün kaçırırsan ve <strong>Seri Dondurma (Freeze)</strong> hakkın varsa serin bozulmadan otomatik kurtarılır!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-surface-container bg-surface-container-low/50 flex items-center justify-between gap-3">
          <div className="text-xs text-app-text-muted">
            Toplam Başarı Oranı: <strong className="text-primary font-bold">%{percentUnlocked}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover transition-colors shadow-xs"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
}

export default BadgesModal;
