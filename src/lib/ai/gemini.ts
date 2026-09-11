import { GoogleGenAI } from "@google/genai";

let geminiClientInstance: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;

export function getGeminiClient(customApiKey?: string): GoogleGenAI | null {
  const apiKey = (customApiKey || process.env.GEMINI_API_KEY || "").trim();

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return null;
  }

  if (customApiKey) {
    return new GoogleGenAI({ apiKey: customApiKey.trim() });
  }

  if (!geminiClientInstance || cachedApiKey !== apiKey) {
    geminiClientInstance = new GoogleGenAI({ apiKey });
    cachedApiKey = apiKey;
  }

  return geminiClientInstance;
}

export function hasValidGeminiKey(customApiKey?: string): boolean {
  const apiKey = (customApiKey || process.env.GEMINI_API_KEY || "").trim();
  return Boolean(apiKey && apiKey !== "your_gemini_api_key_here");
}
