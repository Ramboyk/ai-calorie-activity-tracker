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
import type { MealType } from "@/types/meal";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Utensils,
  Plus,
  Info,
  Layers,
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
  };

  const handleStartAnalysis = (file: File) => {
    setSelectedFile(file);
    setIsAnalyzing(true);
    // Simulate Gemini Vision Multimodal scanning in Phase 3
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisCompleted(true);
    }, 2400);
  };

  const handleResetAnalysis = () => {
    setAnalysisCompleted(false);
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  const handleSaveToDiary = () => {
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
              <span>Günlük sınırsız AI deneme modu aktif</span>
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

          {/* Dynamic Content Area: Uploader vs Loading vs Completed Result */}
          {isAnalyzing ? (
            /* Skeleton Loading State */
            <AnalysisLoadingState previewUrl={previewUrl} />
          ) : analysisCompleted ? (
            /* Analysis Completed Result Preview (Phase 3 Interactive Demo) */
            <div className="space-y-6 animate-fade-in">
              {/* Image with Stitch-style Scanning Pins */}
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
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-xs font-semibold text-app-text-main shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                      Gemini Vision 2.5
                    </span>
                    <Badge confidence="high" />
                  </div>

                  {/* Detection Anchors */}
                  <div className="absolute top-[32%] left-[26%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-app-text-dark/85 backdrop-blur-md text-white text-[11px] font-bold shadow-md pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-light" />
                    <span>Protein Kaynağı</span>
                  </div>
                  <div className="absolute bottom-[28%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-app-text-dark/85 backdrop-blur-md text-white text-[11px] font-bold shadow-md pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-water-light" />
                    <span>Kompleks Karbonhidrat</span>
                  </div>
                  <div className="absolute top-[38%] right-[18%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-app-text-dark/85 backdrop-blur-md text-white text-[11px] font-bold shadow-md pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-calorie-light" />
                    <span>Sağlıklı Yağ &amp; Yeşillik</span>
                  </div>
                </div>

                {/* Status completion bar */}
                <div className="p-3.5 bg-primary-soft/40 border-t border-primary/10 flex items-center justify-between text-xs text-primary font-semibold">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Porsiyon ve Makro Ayrıştırma Başarıyla Tamamlandı</span>
                  </div>
                  <span className="tabular-nums font-mono text-[11px] text-app-text-muted">
                    0.42 sn
                  </span>
                </div>
              </div>

              {/* AI Detection Summary Card */}
              <Card variant="standard" className="p-5 sm:p-6 space-y-6">
                <CardHeader className="p-0 pb-2 flex flex-row items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        Yapay Zekâ Tespiti
                      </span>
                      <Badge variant="primary">Güven: %94</Badge>
                    </div>
                    <CardTitle as="h2" className="text-xl sm:text-2xl font-extrabold">
                      Izgara Tavuklu Pirinç ve Sebze Kasesi
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
                      560
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
                    <span className="text-base font-bold text-primary tabular-nums">50g</span>
                    <span className="text-[10px] text-app-text-muted block">%36 kalori</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-surface-container-low">
                    <span className="text-xs text-app-text-muted block font-medium">Karbonhidrat</span>
                    <span className="text-base font-bold text-calorie tabular-nums">62g</span>
                    <span className="text-[10px] text-app-text-muted block">%44 kalori</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-surface-container-low">
                    <span className="text-xs text-app-text-muted block font-medium">Sağlıklı Yağ</span>
                    <span className="text-base font-bold text-water tabular-nums">13g</span>
                    <span className="text-[10px] text-app-text-muted block">%20 kalori</span>
                  </div>
                </div>

                {/* Detected Ingredients List */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-app-text-main flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-primary" />
                    Tespit Edilen Besin Kalemleri (3 Kalem):
                  </span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                          <Utensils className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-app-text-main block">
                            Izgara Tavuk Göğsü
                          </span>
                          <span className="text-[11px] text-app-text-muted tabular-nums">
                            180g • 44g P • 0g K • 6g Y
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-app-text-main tabular-nums">290 kcal</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-calorie-soft text-calorie flex items-center justify-center">
                          <Utensils className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-app-text-main block">
                            Yasemin Pirinci
                          </span>
                          <span className="text-[11px] text-app-text-muted tabular-nums">
                            150g • 4g P • 48g K • 1g Y
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-app-text-main tabular-nums">210 kcal</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-water-soft text-water flex items-center justify-center">
                          <Utensils className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-app-text-main block">
                            Buharda Brokoli &amp; Havuç
                          </span>
                          <span className="text-[11px] text-app-text-muted tabular-nums">
                            100g • 2g P • 14g K • 6g Y
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-app-text-main tabular-nums">60 kcal</span>
                    </div>
                  </div>
                </div>

                {/* Final Actions */}
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
                    className="w-full shadow-md shadow-primary/20"
                  >
                    Günlüğe Kaydet
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
