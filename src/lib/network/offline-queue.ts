/**
 * NutriTrack AI - Network Resilience & Offline Analysis Queue
 *
 * Implements Step 2 of the Stability Roadmap:
 * 1. Zero-dependency IndexedDB 'pending_analyses' storage queue with SSR & in-memory fallback.
 * 2. Automatic Exponential Backoff retry mechanism (1.5s & 3s) for network drops and 5xx errors.
 * 3. Browser online/offline event monitoring and automated background queue flushing.
 */

import type { Meal, MealType, GeminiMealAnalysisResult } from "@/types/meal";
import {
  getDatabase,
  isIndexedDBAvailable,
  PENDING_ANALYSES_STORE,
} from "@/lib/storage/indexed-db";

export interface PendingAnalysis {
  id: string;
  imageData: string; // Base64 data URL
  imageName?: string;
  imageType: string;
  mealType: MealType;
  createdAt: number; // Unix timestamp in ms
  status: "pending" | "processing" | "failed";
  retryCount: number;
  lastError?: string;
  customApiKey?: string;
}

export interface EnqueueAnalysisInput {
  imageData: string;
  mealType: MealType;
  imageName?: string;
  imageType?: string;
  customApiKey?: string;
  id?: string;
}

export interface AnalyzeMealOptions {
  file: File | Blob;
  mealType: MealType;
  customApiKey?: string;
  maxRetries?: number;
  delays?: number[];
  onRetry?: (attempt: number, maxRetries: number, delayMs: number) => void;
  signal?: AbortSignal;
}

export interface AnalyzeMealResponse {
  success: boolean;
  data?: GeminiMealAnalysisResult;
  remainingLimit?: number;
  error?: {
    code: string;
    message: string;
  };
}

export interface ProcessQueueResult {
  processed: number;
  succeeded: number;
  failed: number;
  results: {
    item: PendingAnalysis;
    meal?: Meal;
    error?: string;
  }[];
}

const FALLBACK_LS_KEY = "nutritrack_pending_analyses_fallback";

// In-memory fallback cache for SSR, test environments, or restricted IndexedDB modes
let inMemoryQueue: PendingAnalysis[] = [];

/**
 * Resets the in-memory queue (primarily used for unit test cleanup).
 */
export function resetPendingAnalysesMemoryStore(): void {
  inMemoryQueue = [];
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem(FALLBACK_LS_KEY);
    } catch {
      // ignore
    }
  }
}

/**
 * Persists fallback queue to localStorage safely if available.
 */
function syncFallbackToLocalStorage(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(FALLBACK_LS_KEY, JSON.stringify(inMemoryQueue));
    } catch {
      // Ignore quota errors in fallback
    }
  }
}

/**
 * Hydrates in-memory queue from localStorage if available.
 */
function hydrateFallbackFromLocalStorage(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(FALLBACK_LS_KEY);
      if (raw) {
        inMemoryQueue = JSON.parse(raw);
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Checks whether the browser is currently online.
 */
export function isOnline(): boolean {
  if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
    return navigator.onLine;
  }
  return true;
}

/**
 * Subscribes to browser 'online' and 'offline' events.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToNetworkStatus(
  callback: (online: boolean) => void
): () => void {
  const target: EventTarget | null =
    typeof window !== "undefined"
      ? window
      : typeof globalThis !== "undefined" && typeof (globalThis as unknown as { addEventListener?: unknown }).addEventListener === "function"
      ? (globalThis as unknown as EventTarget)
      : null;

  if (!target) {
    return () => {};
  }

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  target.addEventListener("online", handleOnline);
  target.addEventListener("offline", handleOffline);

  return () => {
    target.removeEventListener("online", handleOnline);
    target.removeEventListener("offline", handleOffline);
  };
}

/**
 * Converts a File or Blob into a base64 Data URL string.
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === "undefined") {
      // Node.js test environment fallback
      file
        .arrayBuffer()
        .then((buf) => {
          const base64 = Buffer.from(buf).toString("base64");
          const mime = file.type || "image/jpeg";
          resolve(`data:${mime};base64,${base64}`);
        })
        .catch(reject);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("FileReader result is not a string"));
      }
    };
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a base64 Data URL back into a File object.
 */
export function dataUrlToFile(
  dataUrl: string,
  filename = "offline_meal.jpg"
): File {
  const parts = dataUrl.split(",");
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(parts[1] || "");
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

/**
 * Enqueues a new food analysis into IndexedDB 'pending_analyses'.
 */
export async function enqueuePendingAnalysis(
  input: EnqueueAnalysisInput
): Promise<PendingAnalysis> {
  const id = input.id || `pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const item: PendingAnalysis = {
    id,
    imageData: input.imageData,
    imageName: input.imageName || "photo.jpg",
    imageType: input.imageType || "image/jpeg",
    mealType: input.mealType,
    createdAt: Date.now(),
    status: "pending",
    retryCount: 0,
    customApiKey: input.customApiKey,
  };

  if (!isIndexedDBAvailable()) {
    hydrateFallbackFromLocalStorage();
    inMemoryQueue.push(item);
    syncFallbackToLocalStorage();
    return item;
  }

  try {
    const db = await getDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PENDING_ANALYSES_STORE, "readwrite");
      const store = tx.objectStore(PENDING_ANALYSES_STORE);
      const req = store.put(item);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error("Failed to enqueue item in IndexedDB"));
    });
    return item;
  } catch (err) {
    console.warn("[NutriTrack Queue] IndexedDB enqueue failed, using fallback:", err);
    hydrateFallbackFromLocalStorage();
    inMemoryQueue.push(item);
    syncFallbackToLocalStorage();
    return item;
  }
}

/**
 * Retrieves all items in the 'pending_analyses' queue sorted chronologically.
 */
export async function getPendingAnalyses(): Promise<PendingAnalysis[]> {
  if (!isIndexedDBAvailable()) {
    hydrateFallbackFromLocalStorage();
    return [...inMemoryQueue].sort((a, b) => a.createdAt - b.createdAt);
  }

  try {
    const db = await getDatabase();
    return await new Promise<PendingAnalysis[]>((resolve, reject) => {
      const tx = db.transaction(PENDING_ANALYSES_STORE, "readonly");
      const store = tx.objectStore(PENDING_ANALYSES_STORE);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = (req.result as PendingAnalysis[]) || [];
        results.sort((a, b) => a.createdAt - b.createdAt);
        resolve(results);
      };
      req.onerror = () => reject(req.error || new Error("Failed to get pending analyses"));
    });
  } catch (err) {
    console.warn("[NutriTrack Queue] IndexedDB read failed, using fallback:", err);
    hydrateFallbackFromLocalStorage();
    return [...inMemoryQueue].sort((a, b) => a.createdAt - b.createdAt);
  }
}

/**
 * Retrieves a single pending item by its unique ID.
 */
export async function getPendingAnalysis(id: string): Promise<PendingAnalysis | null> {
  if (!isIndexedDBAvailable()) {
    hydrateFallbackFromLocalStorage();
    return inMemoryQueue.find((i) => i.id === id) || null;
  }

  try {
    const db = await getDatabase();
    return await new Promise<PendingAnalysis | null>((resolve, reject) => {
      const tx = db.transaction(PENDING_ANALYSES_STORE, "readonly");
      const store = tx.objectStore(PENDING_ANALYSES_STORE);
      const req = store.get(id);

      req.onsuccess = () => resolve((req.result as PendingAnalysis) || null);
      req.onerror = () => reject(req.error || new Error(`Failed to get pending analysis ${id}`));
    });
  } catch (err) {
    console.warn(`[NutriTrack Queue] IndexedDB get(${id}) failed, using fallback:`, err);
    hydrateFallbackFromLocalStorage();
    return inMemoryQueue.find((i) => i.id === id) || null;
  }
}

/**
 * Updates a pending analysis item's status, error, or retry count.
 */
export async function updatePendingAnalysis(
  id: string,
  updates: Partial<PendingAnalysis>
): Promise<PendingAnalysis | null> {
  const existing = await getPendingAnalysis(id);
  if (!existing) return null;

  const updated: PendingAnalysis = {
    ...existing,
    ...updates,
  };

  if (!isIndexedDBAvailable()) {
    hydrateFallbackFromLocalStorage();
    inMemoryQueue = inMemoryQueue.map((item) => (item.id === id ? updated : item));
    syncFallbackToLocalStorage();
    return updated;
  }

  try {
    const db = await getDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PENDING_ANALYSES_STORE, "readwrite");
      const store = tx.objectStore(PENDING_ANALYSES_STORE);
      const req = store.put(updated);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error(`Failed to update item ${id}`));
    });
    return updated;
  } catch (err) {
    console.warn(`[NutriTrack Queue] IndexedDB update(${id}) failed, using fallback:`, err);
    hydrateFallbackFromLocalStorage();
    inMemoryQueue = inMemoryQueue.map((item) => (item.id === id ? updated : item));
    syncFallbackToLocalStorage();
    return updated;
  }
}

/**
 * Removes an analysis item from the queue (called when successfully completed or dismissed).
 */
export async function removePendingAnalysis(id: string): Promise<void> {
  if (!isIndexedDBAvailable()) {
    hydrateFallbackFromLocalStorage();
    inMemoryQueue = inMemoryQueue.filter((item) => item.id !== id);
    syncFallbackToLocalStorage();
    return;
  }

  try {
    const db = await getDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PENDING_ANALYSES_STORE, "readwrite");
      const store = tx.objectStore(PENDING_ANALYSES_STORE);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error(`Failed to delete item ${id}`));
    });
  } catch (err) {
    console.warn(`[NutriTrack Queue] IndexedDB delete(${id}) failed, using fallback:`, err);
    hydrateFallbackFromLocalStorage();
    inMemoryQueue = inMemoryQueue.filter((item) => item.id !== id);
    syncFallbackToLocalStorage();
  }
}

/**
 * Clears all pending analyses from the queue.
 */
export async function clearPendingAnalyses(): Promise<void> {
  if (!isIndexedDBAvailable()) {
    inMemoryQueue = [];
    syncFallbackToLocalStorage();
    return;
  }

  try {
    const db = await getDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PENDING_ANALYSES_STORE, "readwrite");
      const store = tx.objectStore(PENDING_ANALYSES_STORE);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error("Failed to clear queue"));
    });
  } catch (err) {
    console.warn("[NutriTrack Queue] IndexedDB clear failed, using fallback:", err);
    inMemoryQueue = [];
    syncFallbackToLocalStorage();
  }
}

/**
 * Returns total count of pending items.
 */
export async function getPendingCount(): Promise<number> {
  const items = await getPendingAnalyses();
  return items.length;
}

/**
 * Utility promise-based sleep for backoff delays.
 */
export function waitDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Converts a successful GeminiMealAnalysisResult into a standardized NutriTrack Meal entity.
 */
export function convertAnalysisResultToMeal(
  result: GeminiMealAnalysisResult,
  options: {
    mealType: MealType;
    imageUrl?: string;
    createdAt?: number | string;
    userId?: string;
  }
): Meal {
  const dateObj = new Date(options.createdAt || Date.now());
  const dateStr = dateObj.toISOString().split("T")[0];
  const timeStr = dateObj.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return {
    id: `meal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId: options.userId || "user_demo_1",
    date: dateStr,
    time: timeStr,
    type: options.mealType,
    name: result.mealName || "Analiz Edilen Öğün",
    totalCalories: result.totalCalories,
    totalProtein: result.totalProtein,
    totalCarbs: result.totalCarbs,
    totalFat: result.totalFat,
    imageUrl: options.imageUrl,
    aiConfidence: {
      score: result.confidence === "high" ? 95 : result.confidence === "medium" ? 80 : 50,
      level: result.confidence,
      modelVersion: "Gemini-3.6-Flash-Vision",
    },
    notes: result.notes && result.notes.length > 0 ? result.notes.join(" • ") : undefined,
    createdAt: dateObj.toISOString(),
    items: result.items.map((item, idx) => ({
      id: `item_${idx}_${Date.now()}`,
      name: item.name,
      portion: item.estimatedWeightGrams > 0 ? item.estimatedWeightGrams : 100,
      portionUnit: "g" as const,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    })),
  };
}

/**
 * Step 2: Automatic Exponential Backoff Meal Analysis Request
 *
 * Silently retries network drops or 5xx server errors 2 times:
 * - Attempt 0: Initial call
 * - Attempt 1 (Retry 1): after 1500ms (1.5s)
 * - Attempt 2 (Retry 2): after 3000ms (3.0s)
 *
 * Client errors (400, 429 quota limits) are NEVER retried.
 */
export async function sendMealAnalysisWithRetry(
  options: AnalyzeMealOptions
): Promise<AnalyzeMealResponse> {
  const maxRetries = typeof options.maxRetries === "number" ? options.maxRetries : 2;
  const delays = options.delays || [1500, 3000];

  // If the browser is definitely offline upfront, fail immediately with OFFLINE status
  if (!isOnline()) {
    return {
      success: false,
      error: {
        code: "OFFLINE_NETWORK_ERROR",
        message: "İnternet bağlantısı kesildi. Yemeğiniz çevrimdışı kuyruğa alındı.",
      },
    };
  }

  let lastError: Error | null = null;
  let lastResponseJson: AnalyzeMealResponse | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const formData = new FormData();
      formData.append("image", options.file);
      formData.append("mealType", options.mealType);

      const headers: HeadersInit = {};
      if (options.customApiKey) {
        headers["x-gemini-key"] = options.customApiKey.trim();
      }

      const response = await fetch("/api/analyze-meal", {
        method: "POST",
        headers,
        body: formData,
        signal: options.signal,
      });

      // 4xx status codes are client errors/quota limits: NEVER retry
      if (response.status >= 400 && response.status < 500) {
        const errorJson = (await response.json().catch(() => ({}))) as AnalyzeMealResponse;
        return {
          success: false,
          remainingLimit: errorJson.remainingLimit ?? (response.status === 429 ? 0 : undefined),
          error: errorJson.error || {
            code: response.status === 429 ? "RATE_LIMIT_EXCEEDED" : "CLIENT_ERROR",
            message:
              response.status === 429
                ? "Günlük yapay zekâ analiz hakkınız doldu."
                : "Geçersiz istek parametreleri.",
          },
        };
      }

      // If 5xx Server Error: retry if attempts remain
      if (response.status >= 500) {
        const serverError = (await response.json().catch(() => ({}))) as AnalyzeMealResponse;
        lastResponseJson = serverError;

        if (attempt < maxRetries) {
          const delayMs = delays[attempt] ?? 1500;
          options.onRetry?.(attempt + 1, maxRetries, delayMs);
          await waitDelay(delayMs);
          continue;
        }

        return {
          success: false,
          error: serverError.error || {
            code: "SERVER_5XX_ERROR",
            message: "Sunucu hatası oluştu. Lütfen biraz sonra tekrar deneyin.",
          },
        };
      }

      // Successful 2xx response
      const successJson = (await response.json()) as AnalyzeMealResponse;
      return successJson;
    } catch (err: unknown) {
      // Network disconnect, DNS failure, aborted fetch
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < maxRetries) {
        const delayMs = delays[attempt] ?? 1500;
        options.onRetry?.(attempt + 1, maxRetries, delayMs);
        await waitDelay(delayMs);
        continue;
      }
    }
  }

  return {
    success: false,
    error: lastResponseJson?.error || {
      code: "NETWORK_FAILED_AFTER_RETRIES",
      message:
        lastError?.message ||
        "Ağ hatası: İstek tekrarlanan denemelere rağmen tamamlanamadı.",
    },
  };
}

/**
 * Concurrency Mutex to ensure only one queue processor runs at a time.
 */
let isQueueProcessingActive = false;

/**
 * Processes all pending analyses in the queue sequentially.
 * Called automatically when 'online' event fires or on demand.
 */
export async function processOfflineQueue(
  onSuccessMeal?: (meal: Meal) => void,
  onError?: (item: PendingAnalysis, error: string) => void,
  retryOptions?: { delays?: number[]; maxRetries?: number }
): Promise<ProcessQueueResult> {
  if (isQueueProcessingActive) {
    return { processed: 0, succeeded: 0, failed: 0, results: [] };
  }

  isQueueProcessingActive = true;

  const result: ProcessQueueResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    results: [],
  };

  try {
    const queue = await getPendingAnalyses();
    const pendingItems = queue.filter((i) => i.status !== "processing");

    for (const item of pendingItems) {
      result.processed++;

      // Mark as processing
      await updatePendingAnalysis(item.id, {
        status: "processing",
        retryCount: item.retryCount + 1,
      });

      try {
        const file = dataUrlToFile(item.imageData, item.imageName || "offline_meal.jpg");
        const res = await sendMealAnalysisWithRetry({
          file,
          mealType: item.mealType,
          customApiKey: item.customApiKey,
          delays: retryOptions?.delays,
          maxRetries: retryOptions?.maxRetries,
        });

        if (res.success && res.data) {
          const meal = convertAnalysisResultToMeal(res.data, {
            mealType: item.mealType,
            imageUrl: item.imageData,
            createdAt: item.createdAt,
          });

          // Successfully processed: remove from queue
          await removePendingAnalysis(item.id);
          result.succeeded++;
          result.results.push({ item, meal });

          if (onSuccessMeal) {
            onSuccessMeal(meal);
          }
        } else {
          const errMsg = res.error?.message || "Bilinmeyen analiz hatası";
          await updatePendingAnalysis(item.id, {
            status: "failed",
            lastError: errMsg,
          });
          result.failed++;
          result.results.push({ item, error: errMsg });

          if (onError) {
            onError(item, errMsg);
          }
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        await updatePendingAnalysis(item.id, {
          status: "failed",
          lastError: errMsg,
        });
        result.failed++;
        result.results.push({ item, error: errMsg });

        if (onError) {
          onError(item, errMsg);
        }
      }
    }
  } finally {
    isQueueProcessingActive = false;
  }

  return result;
}
