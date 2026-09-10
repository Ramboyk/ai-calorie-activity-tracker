"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Container,
  Header,
  BottomNav,
  ImageUploader,
  AnalysisLoadingState,
  DisclaimerBanner,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Button,
} from "@/components";
import type { MealType, GeminiMealAnalysisResult } from "@/types/meal";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Utensils,
  Plus,
  Info,
  Layers,
  AlertCircle,
  RefreshCw,
  Edit3,
} from "lucide-react";

export default function AnalyzeMealPage() {
  const router = useRouter();

  // Smart default meal type based on hour of day
  const defaultMealType = useMemo<MealType>(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "breakfast";
    if (hour >= 11 && hour < 16) return "lunch";
    if (hour >= 16 && hour < 22) return "dinner";
    return "snack";
  }, []);

  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisCompleted, setAnalysisCompleted] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<GeminiMealAnalysisResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const mealTypeOptions: { id: MealType; label: string }[] = [
    { id: "breakfast", label: "Kahvaltı" },
    { id: "lunch", label: "Öğle Yemeği" },
    { id: "dinner", label: "Akşam Yemeği" },
    { id: "snack", label: "Ara Öğün" },
  ];

  const handleImageSelected = (file: File, url: string) => {
    setSelectedFile(file);
    setPreviewUrl(url);
    setAnalysisCompleted(false);
    setAnalysisResult(null);
    setApiError(null);
  };

  const handleStartAnalysis = async (file: File) => {
    setSelectedFile(file);
    setIsAnalyzing(true);
    setApiError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("mealType", mealType);

      const response = await fetch("/api/analyze-meal", {
        method: "POST",
        body: formData,
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(
          resJson.error?.message ||
            "Yemek analiz edilemedi. Lütfen daha net veya aydınlık bir fotoğraf deneyin."
        );
      }

      setAnalysisResult(resJson.data as GeminiMealAnalysisResult);
      setAnalysisCompleted(true);
    } catch (err: unknown) {
      console.error("[NutriTrack AI] Analiz hatası:", err);
      setApiError(
        err instanceof Error
          ? err.message
          : "Yemek analiz edilemedi. Lütfen daha net veya aydınlık bir fotoğraf deneyin."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResetAnalysis = () => {
    setAnalysisCompleted(false);
    setPreviewUrl(null);
    setSelectedFile(null);
    setAnalysisResult(null);
    setApiError(null);
  };

  const handleRetry = () => {
    if (selectedFile) {
      handleStartAnalysis(selectedFile);
    }
  };

  const handleSaveToDiary = () => {
    // Navigates to dashboard for Phase 5 persistence
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-app-text-main antialiased selection:bg-primary-light selection:text-primary">
      {/* Sticky Header */}
      <Header />

      <main className="flex-1 w-full pt-4 sm:pt-6 pb-28 md:pb-12">
        <Container className="max-w-4xl space-y-6">
          {/* Top Bar: Back Button & Free AI Quota Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-app-text-muted hover:text-app-text-main transition-colors w-fit px-3 py-2 rounded-xl hover:bg-surface-container"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard&apos;a Dön</span>
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container text-app-text-muted text-xs font-medium w-fit">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Gemini 2.5 Flash Vision devrede</span>
            </div>
          </div>

          {/* Page Title & Instructions */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-app-text-main">
              Yemeğini Analiz Et
            </h1>
            <p className="text-xs sm:text-sm text-app-text-muted leading-relaxed max-w-2xl">
              Yemeğinin fotoğrafını yükle veya doğrudan kamera ile çek. Yapay zekâ besinleri,
              porsiyonları ve makro değerleri otomatik tahmin etsin.
            </p>
          </div>

          {/* Meal Type Selector Pill Group */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-app-text-main block">
              Öğün Türü Seçin:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {mealTypeOptions.map((opt) => {
                const isSelected = mealType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMealType(opt.id)}
                    className={`h-11 min-h-[44px] px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 select-none ${
                      isSelected
                        ? "bg-primary text-white shadow-sm shadow-primary/20 scale-[1.01]"
                        : "bg-surface-container-lowest border border-surface-container text-app-text-muted hover:bg-surface-container hover:text-app-text-main"
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* API Error State Card */}
          {apiError && (
            <div
              role="alert"
              className="p-5 rounded-3xl bg-red-50/90 border border-red-200 text-app-error space-y-3 animate-fade-in shadow-xs"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-app-error shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <h3 className="text-sm font-bold text-app-error">Analiz Tamamlanamadı</h3>
                  <p className="text-xs text-app-error/90 leading-relaxed">
                    {apiError}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-red-200/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  className="bg-white"
                >
                  Tekrar Dene
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetAnalysis}
                >
                  Başka Fotoğraf Seç
                </Button>
              </div>
            </div>
          )}

          {/* Dynamic Content Area: Uploader vs Loading vs Live Analysis Result */}
          {isAnalyzing ? (
            /* Skeleton Loading State */
            <AnalysisLoadingState previewUrl={previewUrl} />
          ) : analysisCompleted && analysisResult ? (
            /* Live Gemini Multimodal Analysis Result */
            <div className="space-y-6 animate-fade-in">
              {/* Image with Stitch-style Scanning Badges */}
              <div className="relative w-full rounded-3xl overflow-hidden bg-surface-container-lowest border border-surface-container shadow-card">
                <div className="relative w-full aspect-[4/3] max-h-[380px] overflow-hidden bg-surface-container-low flex items-center justify-center">
                  {previewUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="Taranan Yemek"
                      className="w-full h-full object-cover object-center"
                    />
                  )}

                  {/* Overlaid Badges */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-xs font-semibold text-app-text-main shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                      Gemini Multimodal Vision
                    </span>
                    <Badge confidence={analysisResult.confidence} />
                  </div>

                  {/* Visual Detection Anchors */}
                  {analysisResult.items.slice(0, 3).map((item, idx) => {
                    const positions = [
                      "top-[32%] left-[26%]",
                      "bottom-[28%] left-[50%]",
                      "top-[38%] right-[18%]",
                    ];
                    const dotColors = [
                      "bg-primary-light",
                      "bg-water-light",
                      "bg-calorie-light",
                    ];

                    return (
                      <div
                        key={idx}
                        className={`absolute ${positions[idx] || "top-1/2 left-1/2"} -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-app-text-dark/85 backdrop-blur-md text-white text-[11px] font-bold shadow-md pointer-events-none`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[idx] || "bg-primary"}`} />
                        <span>{item.name}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Status completion bar */}
                <div className="p-3.5 bg-primary-soft/40 border-t border-primary/10 flex items-center justify-between text-xs text-primary font-semibold">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Porsiyon ve Besin Değerleri Ayrıştırıldı</span>
                  </div>
                  <span className="tabular-nums font-mono text-[11px] text-app-text-muted">
                    {analysisResult.items.length} Besin Kalemi
                  </span>
                </div>
              </div>

              {/* AI Detection Summary Card */}
              <Card variant="standard" className="p-5 sm:p-6 space-y-6">
                <CardHeader className="p-0 pb-2 flex flex-row items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        Yapay Zekâ Tespiti
                      </span>
                      <Badge confidence={analysisResult.confidence} />
                    </div>
                    <CardTitle as="h2" className="text-xl sm:text-2xl font-extrabold">
                      {analysisResult.mealName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1 flex-wrap">
                      <Info className="w-3.5 h-3.5" />
                      <span>Görsel üzerindeki hacim ve tabak derinliği üzerinden hesaplandı</span>
                      {selectedFile && (
                        <span className="text-[11px] text-primary font-medium">
                          ({selectedFile.name})
                        </span>
                      )}
                    </CardDescription>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-3xl font-extrabold text-app-text-main tabular-nums">
                      {analysisResult.totalCalories}
                    </span>
                    <span className="block text-xs font-semibold text-app-text-muted uppercase">
                      kcal
                    </span>
                  </div>
                </CardHeader>

                {/* Macro Distribution */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-surface-container text-center">
                  <div className="p-3 rounded-2xl bg-surface-container-low">
                    <span className="text-xs text-app-text-muted block font-medium">Protein</span>
                    <span className="text-base font-bold text-primary tabular-nums">
                      {analysisResult.totalProtein}g
                    </span>
                    <span className="text-[10px] text-app-text-muted block">
                      {analysisResult.totalCalories > 0
                        ? `%${Math.round(((analysisResult.totalProtein * 4) / analysisResult.totalCalories) * 100)} kalori`
                        : "Protein"}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-surface-container-low">
                    <span className="text-xs text-app-text-muted block font-medium">Karbonhidrat</span>
                    <span className="text-base font-bold text-calorie tabular-nums">
                      {analysisResult.totalCarbs}g
                    </span>
                    <span className="text-[10px] text-app-text-muted block">
                      {analysisResult.totalCalories > 0
                        ? `%${Math.round(((analysisResult.totalCarbs * 4) / analysisResult.totalCalories) * 100)} kalori`
                        : "Karbonhidrat"}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-surface-container-low">
                    <span className="text-xs text-app-text-muted block font-medium">Sağlıklı Yağ</span>
                    <span className="text-base font-bold text-water tabular-nums">
                      {analysisResult.totalFat}g
                    </span>
                    <span className="text-[10px] text-app-text-muted block">
                      {analysisResult.totalCalories > 0
                        ? `%${Math.round(((analysisResult.totalFat * 9) / analysisResult.totalCalories) * 100)} kalori`
                        : "Yağ"}
                    </span>
                  </div>
                </div>

                {/* Detected Ingredients List */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-app-text-main flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-primary" />
                    Tespit Edilen Besin Kalemleri ({analysisResult.items.length} Kalem):
                  </span>
                  <div className="space-y-2">
                    {analysisResult.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low text-xs hover:bg-surface-container transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                            <Utensils className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-app-text-main block truncate">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-app-text-muted tabular-nums">
                              {item.estimatedPortion} ({item.estimatedWeightGrams}g) •{" "}
                              {item.protein}g P • {item.carbs}g K • {item.fat}g Y
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-app-text-main tabular-nums shrink-0 pl-2">
                          {item.calories} kcal
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Notes and Observations */}
                {analysisResult.notes && analysisResult.notes.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-surface-container-low/70 border border-surface-container text-xs text-app-text-muted space-y-1.5">
                    <span className="font-semibold text-app-text-main flex items-center gap-1.5 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Yapay Zekâ Gözlem Notları:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] leading-relaxed">
                      {analysisResult.notes.map((note, idx) => (
                        <li key={idx}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Final Actions for Phase 5 Preparation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-surface-container">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleResetAnalysis}
                    className="w-full"
                  >
                    Farklı Fotoğraf Çek
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSaveToDiary}
                    leftIcon={<Plus className="w-4 h-4" />}
                    rightIcon={<Edit3 className="w-4 h-4 opacity-70" />}
                    className="w-full shadow-md shadow-primary/20"
                  >
                    Öğünü Düzenle ve Kaydet
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            /* Default Image Uploader Box */
            <ImageUploader
              onImageSelected={handleImageSelected}
              onAnalyzeRequest={handleStartAnalysis}
              isLoading={isAnalyzing}
            />
          )}

          {/* Medical / AI Estimation Disclaimer */}
          <DisclaimerBanner />
        </Container>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
