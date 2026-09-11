"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Container,
  Header,
  BottomNav,
  ImageUploader,
  AnalysisLoadingState,
  DisclaimerBanner,
  Button,
  MealItemRow,
  NutritionSummaryCard,
  AddFoodItemModal,
} from "@/components";
import type {
  MealType,
  GeminiMealAnalysisResult,
  EditableFoodItem,
  Meal,
} from "@/types/meal";
import { useTracker } from "@/context";
import { cn } from "@/lib/utils/cn";
import { createThumbnail } from "@/lib/utils/image-compression";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Plus,
  AlertCircle,
  RefreshCw,
  Camera,
  Edit2,
  Utensils,
  Check,
  ShieldAlert,
} from "lucide-react";

export default function AnalyzeMealPage() {
  const router = useRouter();
  const tracker = useTracker();

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
  const [analysisResult, setAnalysisResult] = useState<GeminiMealAnalysisResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Rate Limiting & Quota State (Phase 11)
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number>(3);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);
  const [quotaExceededMessage, setQuotaExceededMessage] = useState<string>("");
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);

  // Review & Editing State (Phase 5)
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [mealTitle, setMealTitle] = useState<string>("");
  const [editableItems, setEditableItems] = useState<EditableFoodItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Fetch remaining quota on page mount
  useEffect(() => {
    let isMounted = true;
    async function fetchQuota() {
      try {
        const res = await fetch("/api/analyze-meal");
        if (!res.ok) return;
        const resJson = await res.json();
        if (isMounted && resJson.success && resJson.data) {
          setRemainingQuota(resJson.data.remainingLimit);
          setDailyLimit(resJson.data.dailyLimit || 3);
          setIsAdminUser(Boolean(resJson.data.isAdmin));
          if (resJson.data.isLimited) {
            setIsQuotaExceeded(true);
            setQuotaExceededMessage(
              "Bugünkü demo AI analiz hakkınız doldu. Yarın tekrar deneyebilirsiniz."
            );
          }
        }
      } catch (err) {
        console.warn("[NutriTrack AI] Quota check error:", err);
      }
    }
    fetchQuota();
    return () => {
      isMounted = false;
    };
  }, []);

  const mealTypeOptions: { id: MealType; label: string }[] = [
    { id: "breakfast", label: "Kahvaltı" },
    { id: "lunch", label: "Öğle Yemeği" },
    { id: "dinner", label: "Akşam Yemeği" },
    { id: "snack", label: "Ara Öğün" },
  ];

  const handleImageSelected = (file: File, url: string) => {
    setSelectedFile(file);
    setPreviewUrl(url);
    setAnalysisResult(null);
    setApiError(null);
    setIsReviewMode(false);
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

      if (response.status === 429 || resJson.error?.code?.includes("LIMIT_EXCEEDED")) {
        setIsQuotaExceeded(true);
        setRemainingQuota(0);
        setQuotaExceededMessage(
          resJson.error?.message ||
            "Bugünkü 3 ücretsiz AI analiz hakkınızı kullandınız. Yarın tekrar deneyebilirsiniz."
        );
        return;
      }

      if (!response.ok || !resJson.success) {
        throw new Error(
          resJson.error?.message ||
            "Yemek analiz edilemedi. Lütfen daha net veya aydınlık bir fotoğraf deneyin."
        );
      }

      if (typeof resJson.remainingLimit === "number") {
        setRemainingQuota(resJson.remainingLimit);
      }

      const result = resJson.data as GeminiMealAnalysisResult;
      setAnalysisResult(result);
      setMealTitle(result.mealName);

      // Convert result items into editable items with 100g base reference
      const formattedItems: EditableFoodItem[] = result.items.map((item, idx) => {
        const weight = item.estimatedWeightGrams > 0 ? item.estimatedWeightGrams : 100;
        const factor = 100 / weight;
        const base100g = {
          calories: Math.round(item.calories * factor),
          protein: Math.round(item.protein * factor * 10) / 10,
          carbs: Math.round(item.carbs * factor * 10) / 10,
          fat: Math.round(item.fat * factor * 10) / 10,
        };

        return {
          id: `item_${idx}_${Date.now()}`,
          name: item.name,
          estimatedPortion: item.estimatedPortion,
          weightGrams: weight,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          base100g,
        };
      });

      setEditableItems(formattedItems);
      // Seamlessly activate review mode
      setIsReviewMode(true);
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

  const handleStartManualMeal = () => {
    setMealTitle("Manuel Öğün");
    setEditableItems([
      {
        id: `manual_item_${Date.now()}`,
        name: "Yemek / Malzeme",
        estimatedPortion: "1 porsiyon",
        weightGrams: 150,
        calories: 250,
        protein: 15,
        carbs: 25,
        fat: 10,
        base100g: {
          calories: 167,
          protein: 10,
          carbs: 16.7,
          fat: 6.7,
        },
      },
    ]);
    setAnalysisResult({
      mealName: "Manuel Öğün",
      items: [],
      totalCalories: 250,
      totalProtein: 15,
      totalCarbs: 25,
      totalFat: 10,
      confidence: "medium",
      notes: ["Manuel olarak oluşturuldu."],
    });
    setIsReviewMode(true);
    setIsQuotaExceeded(false);
  };

  const handleResetAnalysis = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setAnalysisResult(null);
    setApiError(null);
    setIsReviewMode(false);
    setEditableItems([]);
  };

  const handleRetry = () => {
    if (selectedFile) {
      handleStartAnalysis(selectedFile);
    }
  };

  // Editing Actions
  const handleUpdateItem = (updatedItem: EditableFoodItem) => {
    setEditableItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    if (editableItems.length <= 1) return;
    setEditableItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddCustomItem = (newItem: EditableFoodItem) => {
    setEditableItems((prev) => [...prev, newItem]);
  };

  // Aggregated totals dynamically recalculated via pure reduction
  const totals = useMemo(() => {
    return editableItems.reduce(
      (acc, curr) => ({
        calories: acc.calories + curr.calories,
        protein: Math.round((acc.protein + curr.protein) * 10) / 10,
        carbs: Math.round((acc.carbs + curr.carbs) * 10) / 10,
        fat: Math.round((acc.fat + curr.fat) * 10) / 10,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [editableItems]);

  const handleSaveConfirmedMeal = async () => {
    let persistentImageUrl = previewUrl || undefined;
    if (selectedFile) {
      try {
        const thumb = await createThumbnail(selectedFile, 320);
        if (thumb) {
          persistentImageUrl = thumb;
        }
      } catch {
        // Fallback to previewUrl
      }
    }

    const finalMeal: Meal = {
      id: `meal_${Date.now()}`,
      userId: "user_demo_1",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      type: mealType,
      name: mealTitle || "Öğün",
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      imageUrl: persistentImageUrl,
      aiConfidence: analysisResult
        ? {
            score: analysisResult.confidence === "high" ? 95 : analysisResult.confidence === "medium" ? 80 : 50,
            level: analysisResult.confidence,
            modelVersion: "Gemini-2.5-Flash-Vision",
          }
        : undefined,
      createdAt: new Date().toISOString(),
      items: editableItems.map((item) => ({
        id: item.id,
        name: item.name,
        portion: item.weightGrams,
        portionUnit: "g",
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      })),
    };

    console.log("[NutriTrack AI] Kaydedilen Öğün (Phase 6 devrede):", finalMeal);
    tracker.addMeal(finalMeal);
    setSaveSuccessMessage("Öğün başarıyla doğrulandı ve günlüğe kaydedildi!");

    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-app-text-main antialiased selection:bg-primary-light selection:text-primary">
      {/* Sticky Header */}
      <Header />

      <main className="flex-1 w-full pt-4 sm:pt-6 pb-28 md:pb-12">
        <Container className="max-w-4xl space-y-6">
          {/* Top Bar: Back Button & AI Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-app-text-muted hover:text-app-text-main transition-colors w-fit px-3 py-2 rounded-xl hover:bg-surface-container"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard&apos;a Dön</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container text-app-text-muted text-xs font-medium w-fit">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Gemini 2.5 Flash Vision</span>
              </div>

              {/* Quota Badge / Admin Showcase Badge */}
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all select-none",
                  isAdminUser
                    ? "bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-primary-soft border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-xs"
                    : remainingQuota === 0
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                    : (remainingQuota ?? dailyLimit) <= 1
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                    : "bg-surface-container-low border-surface-container text-app-text-main"
                )}
                title={
                  isAdminUser
                    ? "Portföy Yönetici Modu: Rate Limit Bypass Devrede"
                    : `Günlük Kalan AI Analiz: ${remainingQuota ?? dailyLimit} / ${dailyLimit}`
                }
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isAdminUser
                      ? "bg-emerald-500 animate-pulse shadow-xs shadow-emerald-500/50"
                      : remainingQuota === 0
                      ? "bg-rose-500"
                      : (remainingQuota ?? dailyLimit) <= 1
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  )}
                />
                <span>
                  {isAdminUser
                    ? "⚡ Portföy Admin Modu: Sınırsız Analiz Aktif"
                    : `Günlük Kalan AI Analiz: ${remainingQuota !== null ? remainingQuota : dailyLimit} / ${dailyLimit}`}
                </span>
              </div>
            </div>
          </div>

          {/* Success Notification Alert */}
          {saveSuccessMessage && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-primary-soft border border-primary/20 text-primary flex items-center gap-2.5 text-xs font-bold animate-fade-in shadow-xs"
            >
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* Page Title & Instructions */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-app-text-main">
              {isReviewMode ? "Öğün Detayları ve İnceleme" : "Yemeğini Analiz Et"}
            </h1>
            <p className="text-xs sm:text-sm text-app-text-muted leading-relaxed max-w-2xl">
              {isReviewMode
                ? "Yapay zekânın tespit ettiği porsiyon ve besin değerlerini kontrol edin. Dilediğiniz gibi gramajları düzenleyebilir veya yeni malzeme ekleyebilirsiniz."
                : "Yemeğinin fotoğrafını yükle veya doğrudan kamera ile çek. Yapay zekâ besinleri, porsiyonları ve makro değerleri otomatik tahmin etsin."}
            </p>
          </div>

          {/* Rate Limit Polite Quota Exceeded Card (Phase 11) */}
          {isQuotaExceeded && (
            <div
              role="alert"
              className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-amber-500/10 via-surface-container to-surface-container-low border border-amber-500/25 text-app-text-main space-y-4 animate-fade-in shadow-sm"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-app-text-main">
                      Günlük AI Analiz Limiti
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      0 / {dailyLimit} Kalan
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-app-text-muted leading-relaxed">
                    {quotaExceededMessage ||
                      "Portföy demo sürümümüzde API kotalarını korumak amacıyla günlük kullanım sınırlandırılmıştır."}
                  </p>
                  <p className="text-[11px] text-app-text-muted/80">
                    İpucu: Manuel öğün ekleme, su ve aktivite takibi kısıtlama olmadan sıfır kesintiyle çalışmaya devam eder.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-surface-container">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleStartManualMeal}
                  leftIcon={<Utensils className="w-4 h-4" />}
                >
                  Manuel Öğün Ekle
                </Button>
                <Link href="/">
                  <Button variant="outline" size="md">
                    Dashboard&apos;a Dön
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* API Error State Card (Other Errors) */}
          {apiError && !isQuotaExceeded && (
            <div
              role="alert"
              className="p-5 rounded-3xl bg-red-50/90 border border-red-200 text-app-error space-y-3 animate-fade-in shadow-xs"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-app-error shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <h3 className="text-sm font-bold text-app-error">Analiz Tamamlanamadı</h3>
                  <p className="text-xs text-app-error/90 leading-relaxed">{apiError}</p>
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
                <Button variant="ghost" size="sm" onClick={handleResetAnalysis}>
                  Başka Fotoğraf Seç
                </Button>
              </div>
            </div>
          )}

          {/* Dynamic Content: Uploader vs Loading vs Review Mode */}
          {isAnalyzing ? (
            /* Skeleton Loading State */
            <AnalysisLoadingState previewUrl={previewUrl} />
          ) : isReviewMode && analysisResult ? (
            /* Phase 5: Meal Review & Editing Form */
            <div className="space-y-6 animate-fade-in">
              {/* Photo Banner Preview with Replace Button */}
              {previewUrl && (
                <div className="relative w-full h-48 sm:h-56 rounded-3xl overflow-hidden bg-surface-container border border-surface-container shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Taranan Öğün"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 text-xs font-bold text-app-text-main">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span>%{analysisResult.confidence === "high" ? "95" : "80"} Güven Skoru</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetAnalysis}
                    className="absolute bottom-3 right-3 bg-app-text-dark/85 backdrop-blur-md hover:bg-app-text-dark text-white text-xs font-semibold px-3 py-2 rounded-full flex items-center gap-1.5 transition-transform active:scale-95 shadow-md"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Fotoğrafı Değiştir</span>
                  </button>
                </div>
              )}

              {/* Meal Type Filter Chips */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-app-text-muted uppercase">
                  ÖĞÜN TİPİ
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {mealTypeOptions.map((opt) => {
                    const isSelected = mealType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setMealType(opt.id)}
                        className={`min-h-[44px] px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          isSelected
                            ? "bg-primary text-white shadow-sm"
                            : "bg-surface-container text-app-text-main hover:bg-surface-container-high"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Editable Meal Title Card */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-app-text-muted uppercase">
                  ÖĞÜN BAŞLIĞI
                </label>
                <div className="bg-surface-container-low rounded-2xl p-3 flex items-center gap-2.5 border border-surface-container/60 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={mealTitle}
                    onChange={(e) => setMealTitle(e.target.value)}
                    placeholder="Öğün başlığı giriniz"
                    aria-label="Öğün başlığı"
                    className="w-full bg-transparent font-bold text-base sm:text-lg text-app-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-2 py-1"
                  />
                  <Edit2 className="w-4 h-4 text-app-text-muted shrink-0" />
                </div>
              </div>

              {/* Detected Items Header & Count */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-app-text-main">
                    Algılanan Besinler
                  </h2>
                  <span className="bg-surface-container px-2.5 py-0.5 rounded-full text-xs font-bold text-app-text-muted tabular-nums">
                    {editableItems.length} Kalem
                  </span>
                </div>
                <span className="text-xs font-semibold text-primary">
                  Gramajı değiştirerek yeniden hesaplayın
                </span>
              </div>

              {/* Detected Items Rows List */}
              <div className="space-y-3">
                {editableItems.map((item) => (
                  <MealItemRow
                    key={item.id}
                    item={item}
                    canDelete={editableItems.length > 1}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>

              {/* Add Custom Item Button */}
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl bg-surface-container-high hover:bg-surface-variant text-primary font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Besin Ekle</span>
              </button>

              {/* Real-time Dynamic Nutrition Summary Bento Card */}
              <NutritionSummaryCard
                totalCalories={totals.calories}
                totalProtein={totals.protein}
                totalCarbs={totals.carbs}
                totalFat={totals.fat}
                confidence={analysisResult.confidence}
                notes={analysisResult.notes}
              />

              {/* Bottom CTA Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleResetAnalysis}
                  className="w-full"
                >
                  İptal &amp; Yeniden Çek
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSaveConfirmedMeal}
                  leftIcon={<CheckCircle2 className="w-5 h-5" />}
                  className="w-full shadow-md shadow-primary/25"
                >
                  Öğünü Günlüğe Kaydet
                </Button>
              </div>
            </div>
          ) : isQuotaExceeded ? (
            /* Quota Exceeded Friendly Helper Container */
            <div className="p-8 sm:p-10 rounded-3xl bg-surface-container-low/70 border border-dashed border-surface-container text-center space-y-3 animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-app-text-main">
                AI Analiz Kotası Doldu
              </h3>
              <p className="text-xs text-app-text-muted max-w-md mx-auto leading-relaxed">
                Bugünkü ücretsiz yapay zekâ analiz limitiniz dolduğu için görsel yükleme geçici olarak kapalıdır.
                Dilerseniz öğününüzü hemen manuel olarak ekleyebilirsiniz.
              </p>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleStartManualMeal}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Manuel Olarak Öğün Ekle
                </Button>
              </div>
            </div>
          ) : (
            /* Default Image Uploader View */
            <div className="space-y-4">
              {/* Meal Type Selector Pill Group for Initial Intake */}
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

              <ImageUploader
                onImageSelected={handleImageSelected}
                onAnalyzeRequest={handleStartAnalysis}
                isLoading={isAnalyzing}
              />
            </div>
          )}

          {/* Medical / AI Estimation Disclaimer */}
          <DisclaimerBanner />
        </Container>
      </main>

      {/* Add Food Item Modal Dialog */}
      <AddFoodItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCustomItem}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
