"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  Sparkles,
  Check,
  Printer,
  ChevronRight,
} from "lucide-react";
import { useTracker } from "@/context";
import {
  exportToCsv,
  generatePdfReport,
  type ReportRange,
  type ReportDataset,
} from "@/lib/export/report-generator";
import { cn } from "@/lib/utils/cn";

export interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRange?: ReportRange;
}

export function ExportReportModal({
  isOpen,
  onClose,
  defaultRange = "7days",
}: ExportReportModalProps) {
  const { meals, dailyLogs, activities, weightLogs, calorieGoal, macroGoals, showToast } =
    useTracker();

  const [selectedRange, setSelectedRange] = useState<ReportRange>(defaultRange);
  const [selectedFormat, setSelectedFormat] = useState<"pdf" | "csv">("pdf");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const dataset: ReportDataset = {
    range: selectedRange,
    meals,
    dailyLogs,
    activities,
    weightLogs,
    calorieGoal,
    macroGoals,
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      if (selectedFormat === "csv") {
        exportToCsv(dataset);
        showToast("Excel / CSV raporu başarıyla indirildi 📊", "success");
      } else {
        generatePdfReport(dataset);
        showToast("Klinik PDF raporu hazırlandı 📄", "success");
      }
      onClose();
    } catch (err) {
      console.error("[NutriTrack AI] Export hatası:", err);
      showToast("Rapor oluşturulurken bir hata meydana geldi.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const rangeOptions: Array<{ id: ReportRange; title: string; desc: string; emoji: string }> = [
    {
      id: "7days",
      title: "Son 7 Gün",
      desc: "Haftalık beslenme ve aktivite dökümü",
      emoji: "📅",
    },
    {
      id: "30days",
      title: "Son 30 Gün",
      desc: "Aylık klinik kilo ve kalori eğilimi",
      emoji: "📆",
    },
    {
      id: "all",
      title: "Tüm Zamanlar",
      desc: "Uygulamadaki tüm geçmiş kayıtlar",
      emoji: "🗂️",
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-3xl shadow-2xl border border-surface-container overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-container bg-surface-container-low/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary-soft text-primary flex items-center justify-center font-bold shadow-xs">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 id="export-modal-title" className="text-base sm:text-lg font-bold text-app-text-main flex items-center gap-1.5">
                Diyetisyen & Beslenme Raporu
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h2>
              <p className="text-xs text-app-text-muted">
                Profesyonel klinik PDF çıktısı veya Excel CSV tablosu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="w-9 h-9 rounded-full flex items-center justify-center text-app-text-muted hover:text-app-text-main hover:bg-surface-container transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Format Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-app-text-main uppercase tracking-wider block">
              1. Rapor Formatı
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedFormat("pdf")}
                className={cn(
                  "p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] flex flex-col justify-between",
                  selectedFormat === "pdf"
                    ? "bg-primary-soft/90 border-primary text-primary shadow-xs ring-2 ring-primary/20"
                    : "bg-surface-container-low border-surface-container text-app-text-muted hover:text-app-text-main"
                )}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Printer className="w-4 h-4" />
                  </div>
                  {selectedFormat === "pdf" && <Check className="w-4 h-4 text-primary" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-app-text-main block">
                    Klinik PDF Raporu
                  </span>
                  <span className="text-[10px] text-app-text-muted leading-tight mt-0.5 block">
                    A4 Diyetisyen formatı, hazır yazdırılabilir sayfa
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat("csv")}
                className={cn(
                  "p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] flex flex-col justify-between",
                  selectedFormat === "csv"
                    ? "bg-primary-soft/90 border-primary text-primary shadow-xs ring-2 ring-primary/20"
                    : "bg-surface-container-low border-surface-container text-app-text-muted hover:text-app-text-main"
                )}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  {selectedFormat === "csv" && <Check className="w-4 h-4 text-primary" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-app-text-main block">
                    Excel / Sheets CSV
                  </span>
                  <span className="text-[10px] text-app-text-muted leading-tight mt-0.5 block">
                    Makro ve tartım verilerini içeren ham tablo
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-app-text-main uppercase tracking-wider block">
              2. Tarih Aralığı
            </label>
            <div className="grid grid-cols-3 gap-2">
              {rangeOptions.map((opt) => {
                const isSelected = selectedRange === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedRange(opt.id)}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all active:scale-[0.98] flex flex-col justify-between",
                      isSelected
                        ? "bg-primary-soft/80 border-primary ring-2 ring-primary/20 shadow-xs"
                        : "bg-surface-container-low border-surface-container hover:bg-surface-container"
                    )}
                  >
                    <span className="text-lg mb-1">{opt.emoji}</span>
                    <div>
                      <span className={cn("text-xs font-bold block", isSelected ? "text-primary" : "text-app-text-main")}>
                        {opt.title}
                      </span>
                      <span className="text-[10px] text-app-text-muted leading-tight mt-0.5 block">
                        {opt.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary Preview Pill */}
          <div className="p-3 rounded-2xl bg-surface-container-low/70 border border-surface-container text-xs text-app-text-muted flex items-center justify-between">
            <span>Rapor Kapsamı:</span>
            <span className="font-bold text-app-text-main">
              {meals.length} Öğün • {Object.keys(dailyLogs).length} Günlük Takip • {weightLogs.length} Tartım
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-surface-container bg-surface-container-low/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-surface-container text-app-text-muted hover:text-app-text-main text-xs font-semibold transition-colors active:scale-95"
          >
            Vazgeç
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/25 active:scale-95 transition-all"
          >
            {selectedFormat === "pdf" ? (
              <>
                <Printer className="w-4 h-4" />
                <span>PDF Raporunu Aç & Yazdır</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>CSV Dosyasını İndir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportReportModal;
