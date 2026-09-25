/**
 * High-Performance, Zero-Dependency Native IndexedDB Storage Layer
 * 
 * Replaces synchronous 5MB-limited localStorage with asynchronous,
 * gigabyte-scale IndexedDB storage to prevent mobile QuotaExceededError crashes.
 * 
 * Features:
 * 1. 100% SSR-safe (graceful degradation when running in Node.js/tests).
 * 2. Transparent fallback to localStorage and in-memory store if IndexedDB is disabled/blocked.
 * 3. Automatic migration utility for existing users' localStorage data.
 */

export const DB_NAME = "NutriTrackDB";
export const DB_VERSION = 2;
export const STORE_NAME = "app_state";
export const PENDING_ANALYSES_STORE = "pending_analyses";

let dbPromise: Promise<IDBDatabase> | null = null;
const inMemoryStore = new Map<string, unknown>();

function getLocalStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  if (
    typeof globalThis !== "undefined" &&
    (globalThis as unknown as { localStorage?: Storage }).localStorage
  ) {
    return (globalThis as unknown as { localStorage: Storage }).localStorage;
  }
  return null;
}

export function isIndexedDBAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof indexedDB !== "undefined" &&
    indexedDB !== null
  );
}

export function getDatabase(): Promise<IDBDatabase> {
  if (!isIndexedDBAvailable()) {
    return Promise.reject(new Error("IndexedDB is not supported in this environment"));
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
        if (!db.objectStoreNames.contains(PENDING_ANALYSES_STORE)) {
          db.createObjectStore(PENDING_ANALYSES_STORE, { keyPath: "id" });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error || new Error("Failed to open IndexedDB"));
      };

      request.onblocked = () => {
        console.warn("[NutriTrack Storage] IndexedDB open blocked by another tab");
      };
    } catch (err) {
      reject(err);
    }
  });

  return dbPromise;
}

/**
 * Retrieves an item by key from IndexedDB with fallback to localStorage and in-memory store.
 */
export async function getStorageItem<T>(key: string): Promise<T | null> {
  if (!isIndexedDBAvailable()) {
    const ls = getLocalStorage();
    if (ls) {
      try {
        const raw = ls.getItem(key);
        if (raw !== null && raw !== undefined) {
          return JSON.parse(raw) as T;
        }
      } catch {
        // invalid JSON
      }
    }

    if (inMemoryStore.has(key)) {
      return (inMemoryStore.get(key) as T) ?? null;
    }
    return null;
  }

  try {
    const db = await getDatabase();
    return await new Promise<T | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve((request.result as T) ?? null);
      };

      request.onerror = () => {
        reject(request.error || new Error(`Failed to get key: ${key}`));
      };
    });
  } catch (err) {
    console.warn(`[NutriTrack Storage] IndexedDB get error for key "${key}", falling back:`, err);
    const ls = getLocalStorage();
    if (ls) {
      try {
        const raw = ls.getItem(key);
        if (raw !== null && raw !== undefined) {
          return JSON.parse(raw) as T;
        }
      } catch {
        // invalid JSON
      }
    }

    if (inMemoryStore.has(key)) {
      return (inMemoryStore.get(key) as T) ?? null;
    }
    return null;
  }
}

/**
 * Saves an item by key into IndexedDB, mirrored to localStorage and in-memory store.
 */
export async function setStorageItem<T>(key: string, value: T): Promise<void> {
  // Always update in-memory store
  inMemoryStore.set(key, value);

  // Update localStorage as immediate lightweight synchronous mirror (safely catch quota errors)
  const ls = getLocalStorage();
  if (ls) {
    try {
      ls.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore localStorage quota errors because IndexedDB is the authoritative primary store
    }
  }

  if (!isIndexedDBAvailable()) {
    return;
  }

  try {
    const db = await getDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error || new Error(`Failed to set key: ${key}`));
      };
    });
  } catch (err) {
    console.warn(`[NutriTrack Storage] IndexedDB set error for key "${key}":`, err);
  }
}

/**
 * Removes an item by key from IndexedDB, localStorage, and in-memory store.
 */
export async function removeStorageItem(key: string): Promise<void> {
  inMemoryStore.delete(key);

  const ls = getLocalStorage();
  if (ls) {
    try {
      ls.removeItem(key);
    } catch {
      // ignore
    }
  }

  if (!isIndexedDBAvailable()) {
    return;
  }

  try {
    const db = await getDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error || new Error(`Failed to delete key: ${key}`));
      };
    });
  } catch (err) {
    console.warn(`[NutriTrack Storage] IndexedDB delete error for key "${key}":`, err);
  }
}

/**
 * Automatically migrates existing localStorage data into IndexedDB on initial launch.
 * Ensures zero data loss for existing users.
 */
export async function migrateFromLocalStorage(keys: string[]): Promise<void> {
  const ls = getLocalStorage();
  if (!ls) {
    return;
  }

  for (const key of keys) {
    try {
      const raw = ls.getItem(key);
      if (raw) {
        const idbValue = await getStorageItem(key);
        // Only migrate if not already present in primary storage
        if (idbValue === null) {
          const parsed = JSON.parse(raw);
          await setStorageItem(key, parsed);
          console.info(`[NutriTrack Storage] Successfully migrated "${key}" from localStorage to IndexedDB.`);
        }
      }
    } catch (err) {
      console.warn(`[NutriTrack Storage] Migration error for "${key}":`, err);
    }
  }
}
