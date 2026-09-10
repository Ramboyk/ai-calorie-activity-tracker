import { createHash } from "crypto";
import { getRedisClient, fallbackMemoryStore } from "./upstash";

/**
 * Rate Limiting and Quota Guard service for NutriTrack AI.
 * Protects Gemini Multimodal Vision API costs and prevents DDoS abuse.
 * Full GDPR/KVKK compliance: raw IP addresses are hashed using SHA-256 + salt.
 */

const SALT = process.env.IP_HASH_SALT || "nutritrack_salt_v1_secure_hash";
const TTL_SECONDS = 86400; // 24 hours

export const AI_DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT) || 3;
export const GLOBAL_AI_DAILY_LIMIT = Number(process.env.GLOBAL_AI_DAILY_LIMIT) || 20;

export interface RateLimitCheckResult {
  allowed: boolean;
  remainingIp: number;
  remainingGlobal: number;
  ipLimit: number;
  globalLimit: number;
  reason?: string;
  code?: "IP_LIMIT_EXCEEDED" | "GLOBAL_LIMIT_EXCEEDED";
}

/**
 * Anonymizes raw client IP address using SHA-256 with salt.
 * Never stores or transmits raw user IP.
 */
export function anonymizeIp(rawIp: string): string {
  const sanitized = (rawIp || "127.0.0.1").trim();
  return createHash("sha256").update(`${sanitized}:${SALT}`).digest("hex").slice(0, 32);
}

/**
 * Returns today's date formatted as YYYY-MM-DD (UTC/Local aligned).
 */
function getTodayDateKey(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Builds Redis keys for daily quotas.
 */
function getQuotaKeys(hashedIp: string) {
  const dateKey = getTodayDateKey();
  return {
    globalKey: `nutritrack:global_limit:${dateKey}`,
    ipKey: `nutritrack:ip_limit:${hashedIp}:${dateKey}`,
  };
}

/**
 * Inspects current quota status without incrementing counts.
 */
export async function getRateLimitStatus(hashedIp: string): Promise<RateLimitCheckResult> {
  const redis = getRedisClient();
  const { globalKey, ipKey } = getQuotaKeys(hashedIp);

  let globalCount = 0;
  let ipCount = 0;

  if (redis) {
    try {
      const [gRes, ipRes] = await Promise.all([
        redis.get<number>(globalKey),
        redis.get<number>(ipKey),
      ]);
      globalCount = Number(gRes) || 0;
      ipCount = Number(ipRes) || 0;
    } catch (err) {
      console.warn("[NutriTrack AI] Redis get error. Using fallback memory store:", err);
      globalCount = (await fallbackMemoryStore.get(globalKey)) || 0;
      ipCount = (await fallbackMemoryStore.get(ipKey)) || 0;
    }
  } else {
    globalCount = (await fallbackMemoryStore.get(globalKey)) || 0;
    ipCount = (await fallbackMemoryStore.get(ipKey)) || 0;
  }

  const remainingGlobal = Math.max(0, GLOBAL_AI_DAILY_LIMIT - globalCount);
  const remainingIp = Math.max(0, AI_DAILY_LIMIT - ipCount);

  if (globalCount >= GLOBAL_AI_DAILY_LIMIT) {
    return {
      allowed: false,
      remainingIp,
      remainingGlobal: 0,
      ipLimit: AI_DAILY_LIMIT,
      globalLimit: GLOBAL_AI_DAILY_LIMIT,
      reason: "Bugünkü demo AI analiz limiti doldu. Yarın tekrar deneyebilirsiniz.",
      code: "GLOBAL_LIMIT_EXCEEDED",
    };
  }

  if (ipCount >= AI_DAILY_LIMIT) {
    return {
      allowed: false,
      remainingIp: 0,
      remainingGlobal,
      ipLimit: AI_DAILY_LIMIT,
      globalLimit: GLOBAL_AI_DAILY_LIMIT,
      reason: `Bugünkü ${AI_DAILY_LIMIT} ücretsiz AI analiz hakkınızı kullandınız. Yarın tekrar deneyebilirsiniz.`,
      code: "IP_LIMIT_EXCEEDED",
    };
  }

  return {
    allowed: true,
    remainingIp,
    remainingGlobal,
    ipLimit: AI_DAILY_LIMIT,
    globalLimit: GLOBAL_AI_DAILY_LIMIT,
  };
}

/**
 * Checks if client request is within allowed daily quotas before invoking AI models.
 */
export async function checkRateLimit(hashedIp: string): Promise<RateLimitCheckResult> {
  return getRateLimitStatus(hashedIp);
}

/**
 * Increments quota counters only after an AI analysis operation has succeeded.
 * Sets 24-hour expiration TTL for automatic key cleanup.
 */
export async function incrementRateLimit(
  hashedIp: string
): Promise<{ remainingIp: number; remainingGlobal: number }> {
  const redis = getRedisClient();
  const { globalKey, ipKey } = getQuotaKeys(hashedIp);

  let newGlobalCount = 1;
  let newIpCount = 1;

  if (redis) {
    try {
      // Pipeline atomic increment + TTL set
      const pipeline = redis.pipeline();
      pipeline.incr(globalKey);
      pipeline.expire(globalKey, TTL_SECONDS);
      pipeline.incr(ipKey);
      pipeline.expire(ipKey, TTL_SECONDS);
      const results = await pipeline.exec();

      newGlobalCount = Number(results[0]) || 1;
      newIpCount = Number(results[2]) || 1;
    } catch (err) {
      console.warn("[NutriTrack AI] Redis increment error. Using fallback memory store:", err);
      newGlobalCount = await fallbackMemoryStore.incr(globalKey, TTL_SECONDS);
      newIpCount = await fallbackMemoryStore.incr(ipKey, TTL_SECONDS);
    }
  } else {
    newGlobalCount = await fallbackMemoryStore.incr(globalKey, TTL_SECONDS);
    newIpCount = await fallbackMemoryStore.incr(ipKey, TTL_SECONDS);
  }

  return {
    remainingGlobal: Math.max(0, GLOBAL_AI_DAILY_LIMIT - newGlobalCount),
    remainingIp: Math.max(0, AI_DAILY_LIMIT - newIpCount),
  };
}
