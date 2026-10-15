import { describe, it, expect } from "vitest";
import {
  calculateUserLevel,
  getDaysBetween,
  calculateStreakOnAction,
  evaluateBadges,
  getInitialSeedGamification,
  ALL_BADGES,
  GamificationState,
} from "../lib/gamification/streak-manager";

describe("Gamification: calculateUserLevel", () => {
  it("calculates level 1 for 0 XP", () => {
    const levelInfo = calculateUserLevel(0);
    expect(levelInfo.level).toBe(1);
    expect(levelInfo.title).toBe("Başlangıç Yolcusu");
    expect(levelInfo.levelProgressPercent).toBe(0);
    expect(levelInfo.xpNeededForNext).toBe(100);
  });

  it("calculates mid-level progress correctly for Level 2 (100 - 250 XP)", () => {
    const levelInfo = calculateUserLevel(175);
    expect(levelInfo.level).toBe(2);
    expect(levelInfo.title).toBe("Beslenme Çırağı");
    expect(levelInfo.xpInCurrentLevel).toBe(75);
    // (75 / 150) * 100 = 50%
    expect(levelInfo.levelProgressPercent).toBe(50);
    expect(levelInfo.xpNeededForNext).toBe(75);
  });

  it("handles maximum level (Level 6) without overflow", () => {
    const levelInfo = calculateUserLevel(6000);
    expect(levelInfo.level).toBe(6);
    expect(levelInfo.title).toBe("NutriTrack Şampiyonu");
    expect(levelInfo.levelProgressPercent).toBe(100);
    expect(levelInfo.xpNeededForNext).toBe(0);
  });
});

describe("Gamification: getDaysBetween", () => {
  it("calculates 0 for same date", () => {
    expect(getDaysBetween("2026-10-15", "2026-10-15")).toBe(0);
  });

  it("calculates 1 for consecutive days", () => {
    expect(getDaysBetween("2026-10-14", "2026-10-15")).toBe(1);
  });

  it("calculates cross-month differences correctly", () => {
    expect(getDaysBetween("2026-09-30", "2026-10-01")).toBe(1);
    expect(getDaysBetween("2026-09-28", "2026-10-01")).toBe(3);
  });
});

describe("Gamification: calculateStreakOnAction", () => {
  const baseState: GamificationState = {
    currentStreak: 4,
    longestStreak: 4,
    lastActiveDate: "2026-10-14",
    streakFreezeCount: 1,
    totalXp: 200,
    unlockedBadges: {},
    stats: {
      totalMealsLogged: 10,
      totalWaterMlLogged: 4000,
      totalWorkoutsLogged: 2,
      totalWeightLogsLogged: 1,
      voiceMealsLogged: 0,
    },
  };

  it("initializes streak to 1 if no previous active date", () => {
    const freshState: GamificationState = {
      ...baseState,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
    };
    const res = calculateStreakOnAction(freshState, "2026-10-15");
    expect(res.currentStreak).toBe(1);
    expect(res.longestStreak).toBe(1);
    expect(res.lastActiveDate).toBe("2026-10-15");
    expect(res.streakIncreased).toBe(true);
    expect(res.freezeUsed).toBe(false);
  });

  it("keeps streak unchanged when logging again on the same day", () => {
    const res = calculateStreakOnAction(baseState, "2026-10-14");
    expect(res.currentStreak).toBe(4);
    expect(res.streakIncreased).toBe(false);
    expect(res.freezeUsed).toBe(false);
    expect(res.streakReset).toBe(false);
  });

  it("increments streak on consecutive day", () => {
    const res = calculateStreakOnAction(baseState, "2026-10-15");
    expect(res.currentStreak).toBe(5);
    expect(res.longestStreak).toBe(5);
    expect(res.lastActiveDate).toBe("2026-10-15");
    expect(res.streakIncreased).toBe(true);
    expect(res.freezeUsed).toBe(false);
  });

  it("uses streak freeze when exactly 1 day was missed", () => {
    // lastActiveDate is 2026-10-14, today is 2026-10-16 (diff = 2)
    const res = calculateStreakOnAction(baseState, "2026-10-16");
    expect(res.currentStreak).toBe(5); // Saved by freeze and incremented
    expect(res.streakFreezeCount).toBe(0); // Freeze consumed
    expect(res.freezeUsed).toBe(true);
    expect(res.streakReset).toBe(false);
  });

  it("resets streak to 1 when more than 1 day was missed or no freeze available", () => {
    // 3 days missed
    const res = calculateStreakOnAction(baseState, "2026-10-18");
    expect(res.currentStreak).toBe(1);
    expect(res.longestStreak).toBe(4); // preserves longest streak record
    expect(res.streakReset).toBe(true);
    expect(res.freezeUsed).toBe(false);
  });
});

describe("Gamification: evaluateBadges", () => {
  const emptyState: GamificationState = {
    currentStreak: 1,
    longestStreak: 1,
    lastActiveDate: "2026-10-15",
    streakFreezeCount: 1,
    totalXp: 0,
    unlockedBadges: {},
    stats: {
      totalMealsLogged: 0,
      totalWaterMlLogged: 0,
      totalWorkoutsLogged: 0,
      totalWeightLogsLogged: 0,
      voiceMealsLogged: 0,
    },
  };

  it("unlocks first_meal badge and awards XP", () => {
    const { updatedState, newlyUnlocked } = evaluateBadges(emptyState, {
      todayMealsCount: 1,
      totalMealsCount: 1,
    });

    expect(newlyUnlocked.some((b) => b.id === "first_meal")).toBe(true);
    expect(updatedState.unlockedBadges["first_meal"]).toBeDefined();
    expect(updatedState.totalXp).toBe(30); // first_meal xp
  });

  it("unlocks water_master when water >= 2000 ml", () => {
    const { updatedState, newlyUnlocked } = evaluateBadges(emptyState, {
      waterMl: 2250,
    });

    expect(newlyUnlocked.some((b) => b.id === "water_master")).toBe(true);
    expect(updatedState.totalXp).toBe(40);
  });

  it("unlocks steps_10k when steps >= 10000", () => {
    const { newlyUnlocked } = evaluateBadges(emptyState, {
      steps: 10450,
    });

    expect(newlyUnlocked.some((b) => b.id === "steps_10k")).toBe(true);
  });

  it("unlocks protein_champion when protein >= proteinGoal", () => {
    const { newlyUnlocked } = evaluateBadges(emptyState, {
      totalProtein: 145,
      proteinGoal: 140,
    });

    expect(newlyUnlocked.some((b) => b.id === "protein_champion")).toBe(true);
  });

  it("unlocks calorie_sniper when within 75 kcal of goal", () => {
    const { newlyUnlocked } = evaluateBadges(emptyState, {
      todayMealsCount: 3,
      consumedCalories: 2040,
      calorieGoal: 2000,
    });

    expect(newlyUnlocked.some((b) => b.id === "calorie_sniper")).toBe(true);
  });

  it("does not award duplicate XP for previously unlocked badges", () => {
    const stateWithBadge: GamificationState = {
      ...emptyState,
      totalXp: 30,
      unlockedBadges: {
        first_meal: "2026-10-14T10:00:00Z",
      },
    };

    const { updatedState, newlyUnlocked } = evaluateBadges(stateWithBadge, {
      todayMealsCount: 2,
    });

    expect(newlyUnlocked.length).toBe(0);
    expect(updatedState.totalXp).toBe(30); // No extra XP added
  });

  it("contains all defined badges with unique IDs", () => {
    const ids = ALL_BADGES.map((b) => b.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
    expect(ALL_BADGES.length).toBeGreaterThanOrEqual(10);
  });

  it("generates valid initial seed state", () => {
    const seed = getInitialSeedGamification("2026-10-15");
    expect(seed.currentStreak).toBe(3);
    expect(seed.totalXp).toBeGreaterThan(100);
    expect(Object.keys(seed.unlockedBadges).length).toBeGreaterThan(0);
  });
});
