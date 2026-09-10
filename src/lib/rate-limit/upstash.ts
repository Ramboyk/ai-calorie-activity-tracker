import { Redis } from "@upstash/redis";

/**
 * Upstash Redis Client Configuration.
 * Provides a resilient singleton Redis instance when credentials are present,
 * or falls back to an in-memory TTL store during local development or when credentials are missing.
 */

const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.STORAGE_REST_API_URL ||
  process.env.KV_REST_API_URL;

const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.STORAGE_REST_API_TOKEN ||
  process.env.KV_REST_API_TOKEN;

/**
 * Validates if valid Upstash Redis credentials have been provided.
 */
export function isRedisConfigured(): boolean {
  return Boolean(
    redisUrl &&
      redisUrl.startsWith("https://") &&
      !redisUrl.includes("your-upstash-redis") &&
      redisToken &&
      redisToken !== "your_upstash_redis_rest_token_here"
  );
}

let redisInstance: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!isRedisConfigured()) {
    return null;
  }

  if (!redisInstance) {
    try {
      redisInstance = new Redis({
        url: redisUrl,
        token: redisToken,
      });
    } catch (err) {
      console.warn("[NutriTrack AI] Failed to initialize Upstash Redis. Falling back to memory store:", err);
      redisInstance = null;
    }
  }

  return redisInstance;
}

// In-memory fallback for local development or when Redis is not yet provisioned
interface MemoryEntry {
  value: number;
  expiresAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

export const fallbackMemoryStore = {
  get: async (key: string): Promise<number | null> => {
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return entry.value;
  },
  incr: async (key: string, ttlSeconds: number = 86400): Promise<number> => {
    const now = Date.now();
    const existing = memoryStore.get(key);
    if (existing && now < existing.expiresAt) {
      existing.value += 1;
      return existing.value;
    }
    const newValue = 1;
    memoryStore.set(key, {
      value: newValue,
      expiresAt: now + ttlSeconds * 1000,
    });
    return newValue;
  },
};
