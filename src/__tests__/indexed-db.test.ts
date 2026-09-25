import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  migrateFromLocalStorage,
} from "@/lib/storage/indexed-db";

describe("IndexedDB Storage Layer with Graceful Fallback & Migration", () => {
  beforeEach(() => {
    // Clear mock localStorage before each test
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  describe("CRUD Storage Operations in Fallback/Node Environment", () => {
    it("should return null for non-existent storage keys", async () => {
      const result = await getStorageItem<string>("non_existent_key_123");
      expect(result).toBeNull();
    });

    it("should store and retrieve complex object structures correctly", async () => {
      const testMeal = {
        id: "meal_test_1",
        name: "Yulaf Lapası",
        calories: 320,
        macros: { protein: 12, carbs: 54, fat: 6 },
      };

      await setStorageItem("test_meal_key", testMeal);
      const retrieved = await getStorageItem<typeof testMeal>("test_meal_key");

      expect(retrieved).toEqual(testMeal);
    });

    it("should remove items cleanly", async () => {
      await setStorageItem("temp_key", "temporary_value");
      expect(await getStorageItem<string>("temp_key")).toBe("temporary_value");

      await removeStorageItem("temp_key");
      expect(await getStorageItem<string>("temp_key")).toBeNull();
    });

    it("should handle invalid JSON strings gracefully without throwing", async () => {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("corrupted_key", "{invalid_json_content");
        const result = await getStorageItem("corrupted_key");
        expect(result).toBeNull();
      }
    });
  });

  describe("Automatic Migration from LocalStorage", () => {
    it("should migrate existing localStorage keys into primary storage", async () => {
      if (typeof window !== "undefined" && window.localStorage) {
        const legacyMeals = [
          { id: "legacy_1", name: "Elma", calories: 52 },
          { id: "legacy_2", name: "Ceviz", calories: 185 },
        ];

        window.localStorage.setItem("nutritrack_legacy_meals", JSON.stringify(legacyMeals));

        await migrateFromLocalStorage(["nutritrack_legacy_meals"]);

        const migrated = await getStorageItem<typeof legacyMeals>("nutritrack_legacy_meals");
        expect(migrated).toEqual(legacyMeals);
      }
    });

    it("should safely handle non-existent migration keys without error", async () => {
      await expect(
        migrateFromLocalStorage(["missing_key_a", "missing_key_b"])
      ).resolves.not.toThrow();
    });
  });
});
