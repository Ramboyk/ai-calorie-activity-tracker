/**
 * Gamification & Streak Manager
 * Manages daily streaks, XP leveling system, achievement badges, and user milestones.
 */

import { addDays, getTodayDateString } from "@/lib/utils/date";

export type BadgeCategory = "streak" | "nutrition" | "activity" | "milestone";
export type BadgeRarity = "common" | "rare" | "epic" | "legendary";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  xpReward: number;
  target: number;
  unit: string;
}

export interface GamificationStats {
  totalMealsLogged: number;
  totalWaterMlLogged: number;
  totalWorkoutsLogged: number;
  totalWeightLogsLogged: number;
  voiceMealsLogged: number;
}

export interface GamificationState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  streakFreezeCount: number;
  totalXp: number;
  unlockedBadges: Record<string, string>; // badgeId -> ISO string date
  stats: GamificationStats;
}

export interface UserLevelInfo {
  level: number;
  title: string;
  currentLevelXp: number;
  nextLevelXp: number;
  levelProgressPercent: number;
  xpInCurrentLevel: number;
  xpNeededForNext: number;
}

export interface GamificationContext {
  todayMealsCount?: number;
  totalMealsCount?: number;
  consumedCalories?: number;
  calorieGoal?: number;
  totalProtein?: number;
  proteinGoal?: number;
  waterMl?: number;
  waterGoalMl?: number;
  steps?: number;
  stepGoal?: number;
  hasWeightLog?: boolean;
  isVoiceMeal?: boolean;
}

export const LOCAL_STORAGE_GAMIFICATION_KEY = "nutritrack_gamification_v1";

/**
 * Standard Achievement Badges Collection
 */
export const ALL_BADGES: Badge[] = [
  {
    id: "first_meal",
    name: "İlk Adım",
    description: "NutriTrack AI ile ilk öğününü kaydet",
    icon: "🥗",
    category: "nutrition",
    rarity: "common",
    xpReward: 30,
    target: 1,
    unit: "öğün",
  },
  {
    id: "streak_3",
    name: "Ateşleyici",
    description: "3 gün üst üste günlük tutarak seriyi başlat",
    icon: "🔥",
    category: "streak",
    rarity: "common",
    xpReward: 50,
    target: 3,
    unit: "gün",
  },
  {
    id: "water_master",
    name: "Hidrasyon Ustası",
    description: "Günlük su hedefini (2000+ ml) tamamla",
    icon: "💧",
    category: "nutrition",
    rarity: "common",
    xpReward: 40,
    target: 2000,
    unit: "ml",
  },
  {
    id: "steps_10k",
    name: "10.000 Adım Kulübü",
    description: "Tek günde 10.000 adım hedefini devir",
    icon: "🏃",
    category: "activity",
    rarity: "common",
    xpReward: 50,
    target: 10000,
    unit: "adım",
  },
  {
    id: "streak_7",
    name: "Haftalık Savaşçı",
    description: "7 gün kesintisiz seriyi koru ve alışkanlık yarat",
    icon: "⚡",
    category: "streak",
    rarity: "rare",
    xpReward: 120,
    target: 7,
    unit: "gün",
  },
  {
    id: "protein_champion",
    name: "Protein Devi",
    description: "Günlük protein hedefine %100 veya üzeri ulaş",
    icon: "🥩",
    category: "nutrition",
    rarity: "rare",
    xpReward: 75,
    target: 100,
    unit: "%",
  },
  {
    id: "weight_tracker",
    name: "Tartı Disiplini",
    description: "Kilo kaydı ekleyerek vücut kompozisyonunu takip et",
    icon: "⚖️",
    category: "milestone",
    rarity: "common",
    xpReward: 40,
    target: 1,
    unit: "kayıt",
  },
  {
    id: "voice_chef",
    name: "Sesli Vizyon",
    description: "Mikrofonla AI sesli öğün analizi yap",
    icon: "🎙️",
    category: "milestone",
    rarity: "rare",
    xpReward: 60,
    target: 1,
    unit: "analiz",
  },
  {
    id: "calorie_sniper",
    name: "Kalori Keskin Nişancısı",
    description: "Hedef kaloriyi ±75 kcal sapmayla tamamla",
    icon: "🎯",
    category: "nutrition",
    rarity: "epic",
    xpReward: 150,
    target: 1,
    unit: "defa",
  },
  {
    id: "meals_25",
    name: "Beslenme Gurmesi",
    description: "Toplam 25 öğün kaydına ulaş",
    icon: "🍽️",
    category: "nutrition",
    rarity: "rare",
    xpReward: 100,
    target: 25,
    unit: "öğün",
  },
  {
    id: "streak_14",
    name: "Kararlılık Abidesi",
    description: "14 gün boyunca hiç ara vermeden takip et",
    icon: "🛡️",
    category: "streak",
    rarity: "epic",
    xpReward: 250,
    target: 14,
    unit: "gün",
  },
  {
    id: "streak_30",
    name: "Alışkanlık Efendisi",
    description: "30 günlük efsanevi seriyi tamamla",
    icon: "👑",
    category: "streak",
    rarity: "legendary",
    xpReward: 600,
    target: 30,
    unit: "gün",
  },
];

/**
 * Level definitions and XP thresholds
 */
const LEVELS = [
  { level: 1, title: "Başlangıç Yolcusu", minXp: 0, maxXp: 100 },
  { level: 2, title: "Beslenme Çırağı", minXp: 100, maxXp: 250 },
  { level: 3, title: "Sağlık Kaşifi", minXp: 250, maxXp: 500 },
  { level: 4, title: "Form Savaşçısı", minXp: 500, maxXp: 1000 },
  { level: 5, title: "Metabolizma Ustası", minXp: 1000, maxXp: 2000 },
  { level: 6, title: "NutriTrack Şampiyonu", minXp: 2000, maxXp: 5000 },
];

/**
 * Calculates user level and percentage towards next level from total XP
 */
export function calculateUserLevel(totalXp: number): UserLevelInfo {
  const safeXp = Math.max(0, totalXp);

  for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    if (safeXp < lvl.maxXp || i === LEVELS.length - 1) {
      const xpInCurrentLevel = safeXp - lvl.minXp;
      const range = lvl.maxXp - lvl.minXp;
      const levelProgressPercent =
        range > 0 ? Math.min(100, Math.round((xpInCurrentLevel / range) * 100)) : 100;
      const xpNeededForNext = Math.max(0, lvl.maxXp - safeXp);

      return {
        level: lvl.level,
        title: lvl.title,
        currentLevelXp: safeXp,
        nextLevelXp: lvl.maxXp,
        levelProgressPercent,
        xpInCurrentLevel,
        xpNeededForNext,
      };
    }
  }

  const maxLvl = LEVELS[LEVELS.length - 1];
  return {
    level: maxLvl.level,
    title: maxLvl.title,
    currentLevelXp: safeXp,
    nextLevelXp: maxLvl.maxXp,
    levelProgressPercent: 100,
    xpInCurrentLevel: safeXp - maxLvl.minXp,
    xpNeededForNext: 0,
  };
}

/**
 * Calculates day difference between two YYYY-MM-DD strings in UTC.
 */
export function getDaysBetween(date1: string, date2: string): number {
  const p1 = date1.split("-").map(Number);
  const p2 = date2.split("-").map(Number);
  if (p1.length !== 3 || p2.length !== 3) return 0;

  const utc1 = Date.UTC(p1[0], p1[1] - 1, p1[2]);
  const utc2 = Date.UTC(p2[0], p2[1] - 1, p2[2]);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates streak on an activity event (e.g. adding meal, water, step).
 */
export function calculateStreakOnAction(
  state: GamificationState,
  actionDate: string
): {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  streakFreezeCount: number;
  streakIncreased: boolean;
  freezeUsed: boolean;
  streakReset: boolean;
} {
  const { currentStreak, longestStreak, lastActiveDate, streakFreezeCount } = state;

  // First time ever logging
  if (!lastActiveDate) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(longestStreak, 1),
      lastActiveDate: actionDate,
      streakFreezeCount,
      streakIncreased: true,
      freezeUsed: false,
      streakReset: false,
    };
  }

  const diff = getDaysBetween(lastActiveDate, actionDate);

  // Already logged on this date
  if (diff === 0) {
    return {
      currentStreak: Math.max(1, currentStreak),
      longestStreak: Math.max(longestStreak, currentStreak),
      lastActiveDate,
      streakFreezeCount,
      streakIncreased: false,
      freezeUsed: false,
      streakReset: false,
    };
  }

  // Consecutive day (yesterday -> today)
  if (diff === 1) {
    const nextStreak = currentStreak + 1;
    return {
      currentStreak: nextStreak,
      longestStreak: Math.max(longestStreak, nextStreak),
      lastActiveDate: actionDate,
      streakFreezeCount,
      streakIncreased: true,
      freezeUsed: false,
      streakReset: false,
    };
  }

  // Missed exactly 1 day (diff === 2), can use streak freeze if available
  if (diff === 2 && streakFreezeCount > 0) {
    const nextStreak = currentStreak + 1;
    return {
      currentStreak: nextStreak,
      longestStreak: Math.max(longestStreak, nextStreak),
      lastActiveDate: actionDate,
      streakFreezeCount: streakFreezeCount - 1,
      streakIncreased: true,
      freezeUsed: true,
      streakReset: false,
    };
  }

  // Past activity date (logging retroactive date)
  if (diff < 0) {
    return {
      currentStreak,
      longestStreak,
      lastActiveDate,
      streakFreezeCount,
      streakIncreased: false,
      freezeUsed: false,
      streakReset: false,
    };
  }

  // Missed more than 1 day or no freeze available -> Streak resets to 1
  return {
    currentStreak: 1,
    longestStreak,
    lastActiveDate: actionDate,
    streakFreezeCount,
    streakIncreased: false,
    freezeUsed: false,
    streakReset: true,
  };
}

/**
 * Checks and awards badges based on current state and action context.
 */
export function evaluateBadges(
  state: GamificationState,
  context: GamificationContext
): {
  updatedState: GamificationState;
  newlyUnlocked: Badge[];
} {
  const newlyUnlocked: Badge[] = [];
  const updatedUnlocked = { ...state.unlockedBadges };
  let addedXp = 0;
  const nowIso = new Date().toISOString();

  const unlockBadge = (badgeId: string) => {
    if (updatedUnlocked[badgeId]) return;
    const badge = ALL_BADGES.find((b) => b.id === badgeId);
    if (!badge) return;

    updatedUnlocked[badgeId] = nowIso;
    addedXp += badge.xpReward;
    newlyUnlocked.push(badge);
  };

  // 1. First Meal
  if ((context.todayMealsCount ?? 0) > 0 || (context.totalMealsCount ?? 0) > 0) {
    unlockBadge("first_meal");
  }

  // 2. 25 Meals
  if ((context.totalMealsCount ?? 0) >= 25) {
    unlockBadge("meals_25");
  }

  // 3. Streak Milestones
  if (state.currentStreak >= 3) unlockBadge("streak_3");
  if (state.currentStreak >= 7) unlockBadge("streak_7");
  if (state.currentStreak >= 14) unlockBadge("streak_14");
  if (state.currentStreak >= 30) unlockBadge("streak_30");

  // 4. Water Goal (>= 2000 ml)
  if ((context.waterMl ?? 0) >= 2000) {
    unlockBadge("water_master");
  }

  // 5. Steps (>= 10000)
  if ((context.steps ?? 0) >= 10000) {
    unlockBadge("steps_10k");
  }

  // 6. Protein Champion (>= 100% of protein goal)
  if (
    context.proteinGoal &&
    context.proteinGoal > 0 &&
    (context.totalProtein ?? 0) >= context.proteinGoal
  ) {
    unlockBadge("protein_champion");
  }

  // 7. Calorie Sniper (within +-75 kcal of calorie goal, with at least 1 meal logged)
  if (
    context.calorieGoal &&
    context.calorieGoal > 500 &&
    (context.todayMealsCount ?? 0) >= 2 &&
    context.consumedCalories !== undefined &&
    Math.abs(context.consumedCalories - context.calorieGoal) <= 75
  ) {
    unlockBadge("calorie_sniper");
  }

  // 8. Weight Logged
  if (context.hasWeightLog) {
    unlockBadge("weight_tracker");
  }

  // 9. Voice Meal Logged
  if (context.isVoiceMeal) {
    unlockBadge("voice_chef");
  }

  const updatedState: GamificationState = {
    ...state,
    totalXp: state.totalXp + addedXp,
    unlockedBadges: updatedUnlocked,
  };

  return { updatedState, newlyUnlocked };
}

/**
 * Initial seed state for portfolio demo
 * Gives the user an active 3-day streak and starter badges.
 */
export function getInitialSeedGamification(todayStr: string = getTodayDateString()): GamificationState {
  const threeDaysAgo = addDays(todayStr, -2);

  return {
    currentStreak: 3,
    longestStreak: 5,
    lastActiveDate: todayStr,
    streakFreezeCount: 1,
    totalXp: 160, // Level 2
    unlockedBadges: {
      first_meal: `${threeDaysAgo}T09:00:00Z`,
      streak_3: `${todayStr}T14:30:00Z`,
      water_master: `${todayStr}T16:00:00Z`,
    },
    stats: {
      totalMealsLogged: 12,
      totalWaterMlLogged: 6500,
      totalWorkoutsLogged: 4,
      totalWeightLogsLogged: 4,
      voiceMealsLogged: 1,
    },
  };
}
