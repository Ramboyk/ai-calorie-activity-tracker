import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  enqueuePendingAnalysis,
  getPendingAnalyses,
  getPendingAnalysis,
  updatePendingAnalysis,
  removePendingAnalysis,
  clearPendingAnalyses,
  getPendingCount,
  resetPendingAnalysesMemoryStore,
  isOnline,
  subscribeToNetworkStatus,
  fileToDataUrl,
  dataUrlToFile,
  convertAnalysisResultToMeal,
  sendMealAnalysisWithRetry,
  processOfflineQueue,
} from "@/lib/network/offline-queue";
import type { GeminiMealAnalysisResult } from "@/types/meal";

describe("Network Resilience & Offline Analysis Queue (Roadmap Step 2)", () => {
  beforeEach(() => {
    resetPendingAnalysesMemoryStore();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetPendingAnalysesMemoryStore();
    vi.restoreAllMocks();
  });

  describe("Queue CRUD Operations & Storage Integrity", () => {
    it("should enqueue a new meal analysis with pending status and correct metadata", async () => {
      const item = await enqueuePendingAnalysis({
        imageData: "data:image/jpeg;base64,sampleBase64ImageData==",
        mealType: "lunch",
        imageName: "tavuk_pilav.jpg",
        imageType: "image/jpeg",
        customApiKey: "AIzaSyTestKey123",
      });

      expect(item.id).toBeDefined();
      expect(item.status).toBe("pending");
      expect(item.retryCount).toBe(0);
      expect(item.mealType).toBe("lunch");
      expect(item.imageName).toBe("tavuk_pilav.jpg");
      expect(item.customApiKey).toBe("AIzaSyTestKey123");
      expect(item.createdAt).toBeGreaterThan(0);

      const count = await getPendingCount();
      expect(count).toBe(1);
    });

    it("should return queued items in chronological FIFO order", async () => {
      const item1 = await enqueuePendingAnalysis({
        imageData: "data:image/jpeg;base64,item1",
        mealType: "breakfast",
      });
      // slight delay to ensure distinct timestamp
      await new Promise((r) => setTimeout(r, 10));

      const item2 = await enqueuePendingAnalysis({
        imageData: "data:image/jpeg;base64,item2",
        mealType: "lunch",
      });

      const list = await getPendingAnalyses();
      expect(list.length).toBe(2);
      expect(list[0].id).toBe(item1.id);
      expect(list[1].id).toBe(item2.id);
    });

    it("should get a specific item by ID and return null for missing IDs", async () => {
      const created = await enqueuePendingAnalysis({
        imageData: "data:image/jpeg;base64,singleItem",
        mealType: "dinner",
      });

      const found = await getPendingAnalysis(created.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.mealType).toBe("dinner");

      const notFound = await getPendingAnalysis("non_existent_id_999");
      expect(notFound).toBeNull();
    });

    it("should update item status, error message, and retry count", async () => {
      const item = await enqueuePendingAnalysis({
        imageData: "data:image/jpeg;base64,updateItem",
        mealType: "snack",
      });

      const updated = await updatePendingAnalysis(item.id, {
        status: "processing",
        retryCount: 1,
        lastError: "Temporary timeout",
      });

      expect(updated?.status).toBe("processing");
      expect(updated?.retryCount).toBe(1);
      expect(updated?.lastError).toBe("Temporary timeout");

      const retrieved = await getPendingAnalysis(item.id);
      expect(retrieved?.status).toBe("processing");
    });

    it("should remove items cleanly from the queue", async () => {
      const item = await enqueuePendingAnalysis({
        imageData: "data:image/jpeg;base64,toDelete",
        mealType: "breakfast",
      });

      expect(await getPendingCount()).toBe(1);
      await removePendingAnalysis(item.id);
      expect(await getPendingCount()).toBe(0);
      expect(await getPendingAnalysis(item.id)).toBeNull();
    });

    it("should clear the entire queue", async () => {
      await enqueuePendingAnalysis({ imageData: "data:image/jpeg;base64,1", mealType: "breakfast" });
      await enqueuePendingAnalysis({ imageData: "data:image/jpeg;base64,2", mealType: "lunch" });
      expect(await getPendingCount()).toBe(2);

      await clearPendingAnalyses();
      expect(await getPendingCount()).toBe(0);
    });
  });

  describe("Data Conversion & Meal Formatting Helpers", () => {
    it("should convert Data URL to File and back cleanly", async () => {
      const sampleBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const file = dataUrlToFile(sampleBase64, "pixel.png");

      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe("pixel.png");
      expect(file.type).toBe("image/png");

      const roundTripDataUrl = await fileToDataUrl(file);
      expect(roundTripDataUrl).toContain("data:image/png;base64,");
    });

    it("should convert GeminiMealAnalysisResult to standardized NutriTrack Meal", () => {
      const mockResult: GeminiMealAnalysisResult = {
        mealName: "Izgara Köfte & Salata",
        items: [
          {
            name: "Izgara Köfte",
            estimatedPortion: "4 adet",
            estimatedWeightGrams: 160,
            calories: 320,
            protein: 28,
            carbs: 4,
            fat: 20,
          },
          {
            name: "Mevsim Salata",
            estimatedPortion: "1 kase",
            estimatedWeightGrams: 150,
            calories: 60,
            protein: 2,
            carbs: 8,
            fat: 2,
          },
        ],
        totalCalories: 380,
        totalProtein: 30,
        totalCarbs: 12,
        totalFat: 22,
        confidence: "high",
        notes: ["Dengeli protein ve lif kaynağı."],
      };

      const meal = convertAnalysisResultToMeal(mockResult, {
        mealType: "dinner",
        imageUrl: "data:image/jpeg;base64,mock",
      });

      expect(meal.name).toBe("Izgara Köfte & Salata");
      expect(meal.type).toBe("dinner");
      expect(meal.totalCalories).toBe(380);
      expect(meal.totalProtein).toBe(30);
      expect(meal.items).toHaveLength(2);
      expect(meal.aiConfidence?.score).toBe(95);
      expect(meal.aiConfidence?.modelVersion).toBe("Gemini-3.6-Flash-Vision");
    });
  });

  describe("Network Status Monitoring Helpers", () => {
    it("should correctly report online status based on navigator", () => {
      expect(typeof isOnline()).toBe("boolean");
    });

    it("should subscribe to online and offline window events", () => {
      const eventTarget = new EventTarget();
      (globalThis as unknown as { window?: EventTarget }).window = eventTarget;

      const listener = vi.fn();
      const unsubscribe = subscribeToNetworkStatus(listener);

      eventTarget.dispatchEvent(new Event("online"));
      expect(listener).toHaveBeenCalledWith(true);

      eventTarget.dispatchEvent(new Event("offline"));
      expect(listener).toHaveBeenCalledWith(false);

      unsubscribe();
      eventTarget.dispatchEvent(new Event("online"));
      expect(listener).toHaveBeenCalledTimes(2);

      delete (globalThis as unknown as { window?: EventTarget }).window;
    });
  });

  describe("Automatic Exponential Backoff Retry Mechanism", () => {
    it("should succeed on first attempt without retrying when API responds with 200 OK", async () => {
      const mockResult: GeminiMealAnalysisResult = {
        mealName: "Mercimek Çorbası",
        items: [],
        totalCalories: 180,
        totalProtein: 8,
        totalCarbs: 26,
        totalFat: 4,
        confidence: "high",
        notes: [],
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockResult }),
      });
      globalThis.fetch = mockFetch;

      const dummyFile = new File(["dummy"], "soup.jpg", { type: "image/jpeg" });
      const onRetry = vi.fn();

      const response = await sendMealAnalysisWithRetry({
        file: dummyFile,
        mealType: "lunch",
        delays: [10, 20], // fast delays for unit test
        onRetry,
      });

      expect(response.success).toBe(true);
      expect(response.data?.mealName).toBe("Mercimek Çorbası");
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(onRetry).not.toHaveBeenCalled();
    });

    it("should retry silently on 5xx server errors and succeed if subsequent attempt succeeds", async () => {
      const mockResult: GeminiMealAnalysisResult = {
        mealName: "Yumurta & Peynir",
        items: [],
        totalCalories: 240,
        totalProtein: 16,
        totalCarbs: 2,
        totalFat: 18,
        confidence: "high",
        notes: [],
      };

      // 1st attempt: 502 Bad Gateway
      // 2nd attempt: 200 OK
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 502,
          json: async () => ({
            success: false,
            error: { code: "BAD_GATEWAY", message: "Temporary upstream failure" },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: mockResult }),
        });

      globalThis.fetch = mockFetch;
      const onRetry = vi.fn();
      const dummyFile = new File(["dummy"], "breakfast.jpg", { type: "image/jpeg" });

      const response = await sendMealAnalysisWithRetry({
        file: dummyFile,
        mealType: "breakfast",
        delays: [10, 20],
        onRetry,
      });

      expect(response.success).toBe(true);
      expect(response.data?.mealName).toBe("Yumurta & Peynir");
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, 2, 10);
    });

    it("should retry on network fetch errors and exhaust retries after 2 retries (3 total calls)", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
      globalThis.fetch = mockFetch;

      const onRetry = vi.fn();
      const dummyFile = new File(["dummy"], "meal.jpg", { type: "image/jpeg" });

      const response = await sendMealAnalysisWithRetry({
        file: dummyFile,
        mealType: "dinner",
        maxRetries: 2,
        delays: [10, 20],
        onRetry,
      });

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe("NETWORK_FAILED_AFTER_RETRIES");
      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it("should NEVER retry on 429 Rate Limit Exceeded or 400 Bad Request client errors", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          success: false,
          error: { code: "RATE_LIMIT_EXCEEDED", message: "Günlük kota doldu." },
          remainingLimit: 0,
        }),
      });

      globalThis.fetch = mockFetch;
      const onRetry = vi.fn();
      const dummyFile = new File(["dummy"], "quota.jpg", { type: "image/jpeg" });

      const response = await sendMealAnalysisWithRetry({
        file: dummyFile,
        mealType: "snack",
        delays: [10, 20],
        onRetry,
      });

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(response.remainingLimit).toBe(0);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Immediate failure without retry
      expect(onRetry).not.toHaveBeenCalled();
    });
  });

  describe("Automated Background Queue Processing", () => {
    it("should process pending items in background, convert them to meals, and remove them from queue", async () => {
      const sampleDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      await enqueuePendingAnalysis({
        imageData: sampleDataUrl,
        mealType: "lunch",
        imageName: "offline_lunch.png",
      });

      expect(await getPendingCount()).toBe(1);

      const mockResult: GeminiMealAnalysisResult = {
        mealName: "Ton Balıklı Salata",
        items: [],
        totalCalories: 310,
        totalProtein: 28,
        totalCarbs: 6,
        totalFat: 14,
        confidence: "high",
        notes: ["Sağlıklı omega-3 kaynağı"],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: mockResult }),
      });

      const onSuccess = vi.fn();
      const onError = vi.fn();

      const result = await processOfflineQueue(onSuccess, onError);

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(0);
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onError).not.toHaveBeenCalled();

      const savedMeal = onSuccess.mock.calls[0][0];
      expect(savedMeal.name).toBe("Ton Balıklı Salata");
      expect(savedMeal.type).toBe("lunch");

      // Queue item should now be removed from storage
      expect(await getPendingCount()).toBe(0);
    });

    it("should mark item as failed when analysis fails permanently", async () => {
      const sampleDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const item = await enqueuePendingAnalysis({
        imageData: sampleDataUrl,
        mealType: "dinner",
      });

      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Persistent offline drop"));

      const onSuccess = vi.fn();
      const onError = vi.fn();

      const result = await processOfflineQueue(onSuccess, onError, { delays: [5, 10] });

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(1);
      expect(onError).toHaveBeenCalledTimes(1);

      // Item remains in queue marked as failed with error recorded
      const updated = await getPendingAnalysis(item.id);
      expect(updated?.status).toBe("failed");
      expect(updated?.lastError).toBeDefined();
    });
  });
});
