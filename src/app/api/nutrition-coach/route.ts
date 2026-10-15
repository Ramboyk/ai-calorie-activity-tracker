import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, hasValidGeminiKey } from "@/lib/ai/gemini";
import {
  anonymizeIp,
  checkRateLimit,
  incrementRateLimit,
  AI_DAILY_LIMIT,
  GLOBAL_AI_DAILY_LIMIT,
  getRateLimitStatus,
} from "@/lib/rate-limit/limiter";
import type { ApiResponse } from "@/types/api";
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSession } from "@/lib/auth/session";

/**
 * A single chat message in the conversation history.
 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Optional daily nutritional context passed from the client.
 */
export interface DailyNutritionContext {
  consumedCalories: number;
  targetCalories: number;
  remainingCalories: number;
  totalProtein: number;
  targetProtein?: number;
  totalCarbs: number;
  totalFat: number;
  mealNames?: string[];
}

export interface NutritionCoachResponse {
  reply: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

function checkIsAdmin(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (verifyAdminSession(sessionCookie)) return true;

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

// ─── System Instruction Builder ────────────────────────────────────────────

function buildCoachSystemInstruction(ctx?: DailyNutritionContext): string {
  const contextBlock = ctx
    ? `
## Kullanıcının Bugünkü Beslenme Durumu
- Tüketilen Kalori: ${ctx.consumedCalories} kcal
- Hedef Kalori: ${ctx.targetCalories} kcal
- Kalan Kalori: ${ctx.remainingCalories} kcal
- Toplam Protein: ${ctx.totalProtein} g${ctx.targetProtein ? ` / Hedef: ${ctx.targetProtein} g` : ""}
- Toplam Karbonhidrat: ${ctx.totalCarbs} g
- Toplam Yağ: ${ctx.totalFat} g
${ctx.mealNames && ctx.mealNames.length > 0 ? `- Bugün Yenen Öğünler: ${ctx.mealNames.join(", ")}` : ""}

Bu verileri yanıtlarına **mutlaka** dahil et. Kullanıcının kalan kalorisi, eksik proteini veya makrolarındaki açıkları göz önünde bulundurarak öneri ver.
`.trim()
    : "Kullanıcı bugünkü beslenme verilerini paylaşmamış; genel beslenme koçluğu bağlamında yanıt ver.";

  return `
Sen NutriTrack AI'nın kişisel beslenme koçusun (NutriTrack Coach). Adın "NutriCoach".
Türkçe konuşuyorsun. Empatik, pozitif, motive edici ve bilimsel olarak güvenilir bir ton kullan.

## Rolün ve Yeteneklerin
- Klinik beslenme bilgisine sahip bir uzman gibi davran (RD/RDN düzeyinde bilgi).
- Kullanıcının gerçek verilerini analiz ederek **kişiselleştirilmiş** öneriler sun.
- Tarif, ara öğün, porsiyon ve pratik beslenme tüyoları öner.
- Kullanıcının hedeflerine ulaşmasına yardımcı olacak eylem adımları ver.
- Soru sorarak kullanıcıyı daha iyi tanımaya çalış.

${contextBlock}

## Yanıt Formatı
- Yanıtları kısa ve öz tut (genellikle 80-200 kelime).
- Gerektiğinde madde işaretleri veya numaralı liste kullan.
- Tarif önerirken malzeme ve hazırlık süresi belirt.
- Kalori ve makro değerlerini paylaş (yaklaşık olduğunu belirt).
- Her mesajın sonuna motive edici ve kısa bir cümle ekle.

## Güvenlik Kuralları
- KESİNLİKLE tıbbi teşhis, ilaç önerisi veya klinik tedavi planı verme.
- Şiddetli kısıtlayıcı diyetler, uzun süreli açlık veya yeme bozukluğuna yol açabilecek öneriler yapma.
- Her zaman "Bu tahmindir; kişisel sağlık durumunuz için doktorunuza veya diyetisyeninize danışın." uyarısını gerektiğinde ekle.
`.trim();
}

// ─── GET: Status ───────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{
  remainingLimit: number;
  dailyLimit: number;
  isGeminiConfigured: boolean;
}>>> {
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
      isGeminiConfigured,
    },
  });
}

// ─── POST: Chat ────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<NutritionCoachResponse>>> {
  try {
    const rawIp = getClientIp(request);
    const hashedIp = anonymizeIp(rawIp);
    const isAdmin = checkIsAdmin(request);
    const userCustomKey = request.headers.get("x-gemini-key")?.trim();

    let currentRemaining = AI_DAILY_LIMIT;

    // 1. Rate limit check (non-admin)
    if (!isAdmin) {
      const quotaCheck = await checkRateLimit(hashedIp);
      if (!quotaCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: quotaCheck.code || "RATE_LIMIT_EXCEEDED",
              message: quotaCheck.reason || "Günlük AI koç sohbet limitine ulaşıldı.",
            },
            remainingLimit: 0,
          },
          { status: 429 }
        );
      }
      currentRemaining = quotaCheck.remainingIp;
    }

    // 2. Parse request body
    let body: {
      messages?: unknown;
      dailyContext?: DailyNutritionContext;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_JSON_BODY",
            message: "Geçersiz istek gövdesi. JSON formatında messages dizisi beklenmektedir.",
          },
          remainingLimit: currentRemaining,
        },
        { status: 400 }
      );
    }

    const { messages, dailyContext } = body;

    // 3. Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_MESSAGES",
            message: "Sohbet mesajları eksik veya geçersiz formatta.",
          },
          remainingLimit: currentRemaining,
        },
        { status: 400 }
      );
    }

    const chatMessages = messages as ChatMessage[];

    // Validate each message has role and content
    for (const msg of chatMessages) {
      if (!msg.role || !msg.content || typeof msg.content !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_MESSAGE_FORMAT",
              message: "Her mesaj 'role' (user/assistant) ve 'content' alanlarına sahip olmalıdır.",
            },
            remainingLimit: currentRemaining,
          },
          { status: 400 }
        );
      }
    }

    // 4. Validate Gemini API key
    if (!hasValidGeminiKey(userCustomKey)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_GEMINI_KEY",
            message:
              "Google Gemini API anahtarı tanımlanmamış. AI koç sohbeti için Google AI Studio'dan aldığınız ücretsiz API anahtarını ekleyin.",
          },
          remainingLimit: currentRemaining,
        },
        { status: 400 }
      );
    }

    // 5. Initialize Gemini client
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

    // 6. Build conversation contents for Gemini multi-turn chat
    const systemInstruction = buildCoachSystemInstruction(dailyContext);

    // Gemini expects alternating user/model roles; map "assistant" -> "model"
    const contents = chatMessages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // 7. Call Gemini models with fallback chain
    const modelsToTry = [
      "gemini-3.6-flash",
      "gemini-3.7-flash",
      "gemini-3.8-flash",
      "gemini-2.5-flash",
    ];

    let responseText: string | null = null;
    let lastError: unknown = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        });

        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (modelErr) {
        console.warn(
          `[NutriTrack AI Coach] Model ${modelName} hatası, alternatif model deneniyor:`,
          modelErr
        );
        lastError = modelErr;
      }
    }

    if (!responseText) {
      throw lastError || new Error("Gemini modelinden geçerli yanıt alınamadı.");
    }

    // 8. Decrement quota after successful call
    if (!isAdmin) {
      const remaining = await incrementRateLimit(hashedIp);
      currentRemaining = remaining.remainingIp;
    }

    return NextResponse.json({
      success: true,
      data: { reply: responseText.trim() },
      remainingLimit: isAdmin ? 999 : currentRemaining,
    });
  } catch (apiError: unknown) {
    console.error("[NutriTrack AI Coach] Gemini API sırasında hata:", apiError);

    const rawErr = apiError instanceof Error ? apiError.message : String(apiError);
    let userMessage = "Koç sohbeti sırasında bir hata oluştu.";

    if (rawErr.includes("API_KEY_INVALID") || rawErr.includes("API key not valid")) {
      userMessage = "Geçersiz Gemini API anahtarı. Lütfen Google AI Studio'dan aldığınız anahtarı kontrol edin.";
    } else if (rawErr.includes("RESOURCE_EXHAUSTED") || rawErr.includes("quota") || rawErr.includes("429")) {
      userMessage = "Google Gemini API ücretsiz istek sınırınız doldu. Lütfen 1 dakika bekleyip tekrar deneyin.";
    } else {
      userMessage = `Gemini API Hatası: ${rawErr.length > 150 ? rawErr.substring(0, 150) + "..." : rawErr}`;
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: "GEMINI_API_ERROR", message: userMessage },
      },
      { status: 502 }
    );
  }
}
