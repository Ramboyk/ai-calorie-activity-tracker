import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, hasValidGeminiKey } from "@/lib/ai/gemini";
import {
  VOICE_MEAL_ANALYSIS_SYSTEM_INSTRUCTION,
  MEAL_ANALYSIS_SCHEMA,
  createVoiceMealPrompt,
} from "@/lib/ai/prompts";
import {
  anonymizeIp,
  checkRateLimit,
  incrementRateLimit,
  getRateLimitStatus,
  AI_DAILY_LIMIT,
  GLOBAL_AI_DAILY_LIMIT,
} from "@/lib/rate-limit/limiter";
import type { GeminiMealAnalysisResult } from "@/types/meal";
import type { ApiResponse } from "@/types/api";
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSession } from "@/lib/auth/session";

/**
 * Extracts client IP securely from standard proxy headers or defaults to localhost.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Checks if the request carries a valid HMAC-signed admin session.
 */
function checkIsAdmin(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (verifyAdminSession(sessionCookie)) {
    return true;
  }

  const adminHeader = request.headers.get("x-admin-token");
  const expectedSecret = process.env.ADMIN_SESSION_SECRET;
  if (
    expectedSecret &&
    expectedSecret !== "generate_a_random_32_byte_secret_here" &&
    adminHeader === expectedSecret
  ) {
    return true;
  }

  return false;
}

/**
 * GET /api/analyze-voice-meal
 * Returns remaining quota and server configuration status.
 */
export async function GET(
  request: NextRequest
): Promise<
  NextResponse<
    ApiResponse<{
      remainingLimit: number;
      dailyLimit: number;
      remainingGlobal: number;
      globalLimit: number;
      isLimited: boolean;
      isAdmin: boolean;
      isGeminiConfigured: boolean;
    }>
  >
> {
  const rawIp = getClientIp(request);
  const hashedIp = anonymizeIp(rawIp);
  const isAdmin = checkIsAdmin(request);
  const isGeminiConfigured = hasValidGeminiKey();

  if (isAdmin) {
    return NextResponse.json({
      success: true,
      data: {
        remainingLimit: 999,
        dailyLimit: AI_DAILY_LIMIT,
        remainingGlobal: 999,
        globalLimit: GLOBAL_AI_DAILY_LIMIT,
        isLimited: false,
        isAdmin: true,
        isGeminiConfigured,
      },
    });
  }

  const status = await getRateLimitStatus(hashedIp);

  return NextResponse.json({
    success: true,
    data: {
      remainingLimit: status.remainingIp,
      dailyLimit: status.ipLimit,
      remainingGlobal: status.remainingGlobal,
      globalLimit: status.globalLimit,
      isLimited: !status.allowed,
      isAdmin: false,
      isGeminiConfigured,
    },
  });
}

/**
 * POST /api/analyze-voice-meal
 * Parses spoken dietary descriptions and returns structured nutrition estimations.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<GeminiMealAnalysisResult>>> {
  try {
    const rawIp = getClientIp(request);
    const hashedIp = anonymizeIp(rawIp);
    const isAdmin = checkIsAdmin(request);
    const userCustomKey = request.headers.get("x-gemini-key")?.trim();

    let currentRemaining = AI_DAILY_LIMIT;

    // 1. Quota Check (Non-admin requests)
    if (!isAdmin) {
      const quotaCheck = await checkRateLimit(hashedIp);
      if (!quotaCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: quotaCheck.code || "RATE_LIMIT_EXCEEDED",
              message: quotaCheck.reason || "Günlük AI analiz limitine ulaşıldı.",
            },
            remainingLimit: 0,
          },
          { status: 429 }
        );
      }
      currentRemaining = quotaCheck.remainingIp;
    }

    // 2. Parse and Validate JSON Body
    let body: { transcript?: unknown; mealType?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_JSON_BODY",
            message: "Geçersiz istek gövdesi. JSON formatında transcript ve mealType beklenmektedir.",
          },
          remainingLimit: currentRemaining,
        },
        { status: 400 }
      );
    }

    const { transcript, mealType } = body;

    if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_TRANSCRIPT",
            message: "Lütfen sesli olarak anlattığınız öğün metnini iletin.",
          },
          remainingLimit: currentRemaining,
        },
        { status: 400 }
      );
    }

    const safeTranscript = transcript.trim();
    const safeMealType = typeof mealType === "string" ? mealType.trim() : undefined;

    // 3. Gemini API Key Validation
    if (!hasValidGeminiKey(userCustomKey)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_GEMINI_KEY",
            message:
              "Google Gemini API anahtarı tanımlanmamış. Sesli öğün analizinin çalışabilmesi için Google AI Studio'dan aldığınız ücretsiz API anahtarını ekleyin veya Vercel üzerinde GEMINI_API_KEY olarak tanımlayın.",
          },
          remainingLimit: currentRemaining,
        },
        { status: 400 }
      );
    }

    // 4. Initialize Gemini Client
    const client = getGeminiClient(userCustomKey);
    if (!client) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "GEMINI_CLIENT_INIT_FAILED",
            message: "Gemini istemcisi başlatılamadı. Lütfen API anahtarınızı kontrol edin.",
          },
          remainingLimit: currentRemaining,
        },
        { status: 400 }
      );
    }

    // 5. Call Gemini Models with Fallback
    const modelsToTry = [
      "gemini-3.6-flash",
      "gemini-3.7-flash",
      "gemini-3.8-flash",
      "gemini-2.5-flash",
    ];
    let responseText: string | null = null;
    let lastError: unknown = null;

    const userPrompt = createVoiceMealPrompt(safeTranscript, safeMealType);

    for (const modelName of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }],
            },
          ],
          config: {
            systemInstruction: VOICE_MEAL_ANALYSIS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: MEAL_ANALYSIS_SCHEMA as unknown as Record<string, unknown>,
            temperature: 0.2,
          },
        });

        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (modelErr) {
        console.warn(
          `[NutriTrack AI] Voice Meal Model ${modelName} hatası, alternatif model deneniyor:`,
          modelErr
        );
        lastError = modelErr;
      }
    }

    if (!responseText) {
      throw lastError || new Error("Gemini modelinden geçerli yanıt alınamadı.");
    }

    const parsedData = JSON.parse(responseText) as GeminiMealAnalysisResult;

    // 6. Decrement quota only after genuine, successful AI analysis
    if (!isAdmin) {
      const remaining = await incrementRateLimit(hashedIp);
      currentRemaining = remaining.remainingIp;
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
      remainingLimit: isAdmin ? 999 : currentRemaining,
    });
  } catch (apiError: unknown) {
    console.error("[NutriTrack AI] Sesli öğün analizi sırasında hata oluştu:", apiError);

    const rawErr = apiError instanceof Error ? apiError.message : String(apiError);
    let userMessage = "Yapay zekâ sesli öğün analizi sırasında bir hata oluştu.";

    if (
      rawErr.includes("API_KEY_INVALID") ||
      rawErr.includes("invalid api key") ||
      rawErr.includes("API key not valid")
    ) {
      userMessage =
        "Geçersiz Gemini API anahtarı. Lütfen Google AI Studio'dan aldığınız anahtarı doğru girdiğinizden emin olun.";
    } else if (
      rawErr.includes("RESOURCE_EXHAUSTED") ||
      rawErr.includes("quota") ||
      rawErr.includes("429")
    ) {
      userMessage =
        "Google Gemini API ücretsiz istek sınırınız doldu. Lütfen 1 dakika bekleyip tekrar deneyin.";
    } else {
      userMessage = `Gemini API Hatası: ${rawErr.length > 150 ? rawErr.substring(0, 150) + "..." : rawErr}`;
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "GEMINI_API_ERROR",
          message: userMessage,
        },
      },
      { status: 502 }
    );
  }
}
