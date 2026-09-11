import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, hasValidGeminiKey } from "@/lib/ai/gemini";
import {
  MEAL_ANALYSIS_SYSTEM_INSTRUCTION,
  MEAL_ANALYSIS_PROMPT,
  MEAL_ANALYSIS_SCHEMA,
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
import { validateImageMagicBytes } from "@/lib/validation/image";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

  // Also support direct secret token header for integration testing
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
 * GET /api/analyze-meal
 * Returns current remaining AI quotas for client IP without consuming any quota,
 * plus whether Gemini API key is configured on the server.
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
 * POST /api/analyze-meal
 * Performs multimodal food recognition protected by dual-guard rate limits.
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

    // 2. Parse Multipart Form Data
    const formData = await request.formData();
    const imageEntry = formData.get("image");

    if (!imageEntry || !(imageEntry instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_IMAGE",
            message: "Lütfen analiz edilecek bir yemek fotoğrafı yükleyin.",
          },
          remainingLimit: currentRemaining,
        },
        { status: 400 }
      );
    }

    const file = imageEntry as File;

    // 3. Server-side MIME validation (Quota not consumed on validation failures)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_MIME_TYPE",
            message: "Yalnızca JPG, PNG veya WEBP formatındaki görseller desteklenmektedir.",
          },
          remainingLimit: currentRemaining,
        },
        { status: 400 }
      );
    }

    // 4. Server-side size validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FILE_TOO_LARGE",
            message: "Görsel boyutu 5 MB üst sınırını aşamaz.",
          },
          remainingLimit: currentRemaining,
        },
        { status: 400 }
      );
    }

    // 5. Binary Magic Bytes Validation (Defense against extension manipulation attacks)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const magicCheck = validateImageMagicBytes(buffer);
    if (!magicCheck.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_IMAGE_SIGNATURE",
            message:
              "Yüklenen dosyanın ikili içeriği geçerli bir görsel imzası (JPEG, PNG, WEBP) taşımıyor.",
          },
          remainingLimit: currentRemaining,
        },
        { status: 400 }
      );
    }

    // 6. Check if GEMINI_API_KEY is configured (either on server or provided by user in header)
    if (!hasValidGeminiKey(userCustomKey)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_GEMINI_KEY",
            message:
              "Google Gemini API anahtarı tanımlanmamış. Gerçek yapay zekâ analizinin çalışabilmesi için Google AI Studio'dan aldığınız ücretsiz API anahtarını ekleyin veya Vercel üzerinde GEMINI_API_KEY olarak tanımlayın.",
          },
          remainingLimit: currentRemaining,
        },
        { status: 400 }
      );
    }

    // 7. Convert validated buffer to base64 string in-memory
    const base64Data = buffer.toString("base64");

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

    // 8. Call Gemini Multimodal API with Multi-Model Fallback ("gemini-2.5-flash" -> "gemini-1.5-flash")
    const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
    let responseText: string | null = null;
    let lastError: unknown = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [
                { text: MEAL_ANALYSIS_PROMPT },
                {
                  inlineData: {
                    mimeType: file.type,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          config: {
            systemInstruction: MEAL_ANALYSIS_SYSTEM_INSTRUCTION,
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
        console.warn(`[NutriTrack AI] Model ${modelName} hatası, alternatif model deneniyor:`, modelErr);
        lastError = modelErr;
      }
    }

    if (!responseText) {
      throw lastError || new Error("Gemini modelinden geçerli yanıt alınamadı.");
    }

    const parsedData = JSON.parse(responseText) as GeminiMealAnalysisResult;

    // 9. Decrement quota only after genuine, successful AI analysis
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
    console.error("[NutriTrack AI] Gemini Vision API çağrısı sırasında hata oluştu:", apiError);

    const rawErr = apiError instanceof Error ? apiError.message : String(apiError);
    let userMessage = "Yapay zekâ görsel analizi sırasında bir hata oluştu.";

    if (rawErr.includes("API_KEY_INVALID") || rawErr.includes("invalid api key") || rawErr.includes("API key not valid")) {
      userMessage = "Geçersiz Gemini API anahtarı. Lütfen Google AI Studio'dan aldığınız anahtarı doğru girdiğinizden emin olun.";
    } else if (rawErr.includes("RESOURCE_EXHAUSTED") || rawErr.includes("quota") || rawErr.includes("429")) {
      userMessage = "Google Gemini API ücretsiz istek sınırınız doldu. Lütfen 1 dakika bekleyip tekrar deneyin.";
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
