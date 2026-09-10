import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSession } from "@/lib/auth/session";
import { getRedisClient, fallbackMemoryStore } from "@/lib/rate-limit/upstash";
import { GLOBAL_AI_DAILY_LIMIT } from "@/lib/rate-limit/limiter";
import type { ApiResponse } from "@/types/api";

export async function GET(
  request: NextRequest
): Promise<
  NextResponse<
    ApiResponse<{
      isAdmin: boolean;
      globalUsage: {
        todayCount: number;
        limit: number;
      };
    }>
  >
> {
  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const isAdmin = verifyAdminSession(sessionCookie);

  // Retrieve today's global usage
  const todayKey = `nutritrack:global_limit:${new Date().toISOString().split("T")[0]}`;
  let todayCount = 0;

  try {
    const redis = getRedisClient();
    if (redis) {
      const count = await redis.get<number>(todayKey);
      todayCount = Number(count) || 0;
    } else {
      todayCount = (await fallbackMemoryStore.get(todayKey)) || 0;
    }
  } catch (err) {
    console.warn("[NutriTrack AI] Error reading global usage:", err);
  }

  return NextResponse.json({
    success: true as const,
    data: {
      isAdmin,
      globalUsage: {
        todayCount,
        limit: GLOBAL_AI_DAILY_LIMIT,
      },
    },
  });
}
