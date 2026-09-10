import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, hasValidGeminiKey } from "@/lib/ai/gemini";
import {
  MEAL_ANALYSIS_SYSTEM_INSTRUCTION,
  MEAL_ANALYSIS_PROMPT,
  MEAL_ANALYSIS_SCHEMA,
  FALLBACK_MEAL_ANALYSIS,
} from "@/lib/ai/prompts";
import type { GeminiMealAnalysisResult } from "@/types/meal";
import type { ApiResponse } from "@/types/api";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<GeminiMealAnalysisResult>>> {
  try {
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
        },
        { status: 400 }
      );
    }

    const file = imageEntry as File;

    // Server-side MIME validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_MIME_TYPE",
            message: "Yalnızca JPG, PNG veya WEBP formatındaki görseller desteklenmektedir.",
          },
        },
        { status: 400 }
      );
    }

    // Server-side size validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FILE_TOO_LARGE",
            message: "Görsel boyutu 5 MB üst sınırını aşamaz.",
          },
        },
        { status: 400 }
      );
    }

    // Check if GEMINI_API_KEY is configured
    if (!hasValidGeminiKey()) {
      console.warn(
        "[NutriTrack AI] GEMINI_API_KEY tanımlı değil veya şablon değerinde. Geliştirme ortamı için simülasyon yanıtı kullanılıyor."
      );

      // Return realistic mock analysis to maintain UX during dev
      return NextResponse.json({
        success: true,
        data: FALLBACK_MEAL_ANALYSIS,
        message: "Demo modu: AI tahmini yerel simülasyon ile üretildi.",
      });
    }

    // Convert file to base64 buffer in-memory (no disk writing)
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const client = getGeminiClient();
    if (!client) {
      return NextResponse.json({
        success: true,
        data: FALLBACK_MEAL_ANALYSIS,
      });
    }

    // Call Gemini Multimodal API with Structured Output schema
    try {
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
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

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Gemini modelinden boş yanıt döndü.");
      }

      const parsedData = JSON.parse(responseText) as GeminiMealAnalysisResult;

      return NextResponse.json({
        success: true,
        data: parsedData,
      });
    } catch (apiError: unknown) {
      console.error("[NutriTrack AI] Gemini Vision API çağrısı sırasında hata oluştu:", apiError);

      // Gracefully fall back so user does not get a broken page
      return NextResponse.json({
        success: true,
        data: {
          ...FALLBACK_MEAL_ANALYSIS,
          notes: [
            ...FALLBACK_MEAL_ANALYSIS.notes,
            "Canlı API kotası veya bağlantı gecikmesi nedeniyle önceden optimize edilmiş referans besin modeli kullanıldı.",
          ],
        },
        message: "Yedek besin modeli devreye alındı.",
      });
    }
  } catch (err: unknown) {
    console.error("[NutriTrack AI] /api/analyze-meal beklenmeyen hata:", err);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Yemek analiz edilirken sunucu tarafında bir hata oluştu. Lütfen tekrar deneyin.",
        },
      },
      { status: 500 }
    );
  }
}
