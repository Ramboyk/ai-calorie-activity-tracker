"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import {
  Camera,
  Upload,
  AlertCircle,
  X,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { CameraModal } from "./CameraModal";
import { compressImage } from "@/lib/utils/image-compression";

export interface ImageUploaderProps {
  onImageSelected?: (file: File, previewUrl: string) => void;
  onAnalyzeRequest?: (file: File) => void;
  isLoading?: boolean;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ImageUploader({
  onImageSelected,
  onAnalyzeRequest,
  isLoading = false,
}: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fallbackCameraInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL when preview changes or component unmounts
  const cleanupPreviewUrl = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      cleanupPreviewUrl();
    };
  }, [cleanupPreviewUrl]);

  /**
   * Optimizes, compresses, and validates the file.
   * Prevents mobile out-of-memory crashes by scaling huge phone photos down client-side.
   */
  const processAndSetFile = async (rawFile: File) => {
    setErrorMessage(null);

    // Initial check: must be an image
    if (!rawFile.type.startsWith("image/") && !ALLOWED_MIME_TYPES.includes(rawFile.type)) {
      setErrorMessage("Lütfen geçerli bir görsel formatı seçin (JPG, PNG veya WEBP).");
      return;
    }

    try {
      setIsOptimizing(true);

      // Client-side canvas compression: max 1600px, quality 0.82
      const optimizedFile = await compressImage(rawFile, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.82,
        mimeType: "image/jpeg",
      });

      // Post-optimization file size check against 5MB guard
      if (optimizedFile.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage("Görsel optimize edildikten sonra dahi 5 MB sınırını aşıyor.");
        setIsOptimizing(false);
        return;
      }

      cleanupPreviewUrl();
      const newUrl = URL.createObjectURL(optimizedFile);
      setSelectedFile(optimizedFile);
      setPreviewUrl(newUrl);

      if (onImageSelected) {
        onImageSelected(optimizedFile, newUrl);
      }
    } catch (err) {
      console.warn("[NutriTrack AI] Görsel optimize etme hatası:", err);
      // Graceful fallback to original file
      cleanupPreviewUrl();
      const newUrl = URL.createObjectURL(rawFile);
      setSelectedFile(rawFile);
      setPreviewUrl(newUrl);

      if (onImageSelected) {
        onImageSelected(rawFile, newUrl);
      }
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processAndSetFile(file);
    }
    // Reset input so user can choose the same file again if desired
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processAndSetFile(file);
    }
  };

  const handleRemoveImage = () => {
    cleanupPreviewUrl();
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
  };

  /**
   * Tapping "Fotoğraf Çek":
   * Prioritizes in-app live camera modal (getUserMedia) so Android OS never suspends or kills Chrome.
   * Falls back to standard camera picker if getUserMedia is unavailable.
   */
  const triggerCamera = () => {
    if (
      typeof navigator !== "undefined" &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function"
    ) {
      setIsCameraModalOpen(true);
    } else {
      fallbackCameraInputRef.current?.click();
    }
  };

  const triggerGallery = () => {
    galleryInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full space-y-4">
      {/* Hidden Native File Inputs */}
      {/* 1. Gallery / File picker (no capture attribute to avoid aggressive camera takeover) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="Galeriden veya dosyalardan seç"
      />

      {/* 2. Fallback camera input if getUserMedia is not supported */}
      <input
        ref={fallbackCameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="Yedek kamera ile çek"
      />

      {/* In-App Live Camera Modal */}
      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(capturedFile) => void processAndSetFile(capturedFile)}
        onFallbackToFilePicker={triggerGallery}
      />

      {/* Error Alert Card */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-50/90 border border-red-200/80 text-app-error flex items-start justify-between gap-3 animate-fade-in"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-app-error shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-app-error">Doğrulama Hatası</p>
              <p className="text-xs text-app-error/90 mt-0.5 leading-relaxed">
                {errorMessage}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-app-error/70 hover:text-app-error hover:bg-red-100 transition-colors"
            aria-label="Hatayı kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Optimizing Indicator Overlay Banner */}
      {isOptimizing && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-primary-soft/60 border border-primary/20 text-primary flex items-center gap-3 animate-pulse"
        >
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <div className="text-xs">
            <p className="font-bold">Görsel mobil bellek için optimize ediliyor...</p>
            <p className="text-app-text-muted mt-0.5">Yüksek çözünürlük yapay zekâ için sıkıştırılıyor.</p>
          </div>
        </div>
      )}

      {/* When NO image is selected: Action Buttons & Drag-Drop Zone */}
      {!previewUrl && (
        <div className="space-y-4">
          {/* Dual Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={triggerCamera}
              leftIcon={<Camera className="w-5 h-5" />}
              className="w-full shadow-sm"
              disabled={isOptimizing}
            >
              Fotoğraf Çek
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={triggerGallery}
              leftIcon={<ImageIcon className="w-5 h-5 text-primary" />}
              className="w-full"
              disabled={isOptimizing}
            >
              Galeriden Seç
            </Button>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerGallery}
            className={`cursor-pointer w-full p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center space-y-3 ${
              isDragOver
                ? "border-primary bg-primary-soft/40 scale-[1.01]"
                : "border-surface-container bg-surface-container-lowest hover:bg-surface-container-low/60 hover:border-outline-variant"
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shadow-xs">
              <Upload className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-app-text-main">
                Yemek fotoğrafını buraya sürükleyin
              </p>
              <p className="text-xs text-app-text-muted">
                veya cihazınızdan/galerinizden bir dosya seçmek için tıklayın
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 text-[11px] font-medium text-app-text-muted">
              <span className="px-2 py-0.5 rounded-md bg-surface-container">JPG, PNG, WEBP</span>
              <span>•</span>
              <span>Otomatik Mobil Bellek Optimizasyonu</span>
            </div>
          </div>
        </div>
      )}

      {/* When Image IS selected: Rich Preview Card */}
      {previewUrl && selectedFile && (
        <div className="space-y-4">
          <div className="relative w-full rounded-3xl overflow-hidden bg-surface-container-lowest border border-surface-container shadow-card">
            {/* Image Preview Container */}
            <div className="relative w-full aspect-[4/3] max-h-[420px] overflow-hidden bg-surface-container-low flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Seçilen Yemek Önizlemesi"
                className="w-full h-full object-cover object-center"
              />

              {/* Floating Top Badges */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-xs font-semibold text-app-text-main shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Vision Core Hazır
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-light/90 text-primary text-xs font-bold shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Optimize Edildi
                </span>
              </div>

              {/* Laser Scanning Effect Accent */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary-light to-transparent opacity-80 shadow-[0_0_12px_#85f8c4] pointer-events-none animate-pulse" />
            </div>

            {/* File Info Bar */}
            <div className="p-4 bg-surface-container-lowest border-t border-surface-container flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-app-text-main truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-app-text-muted tabular-nums">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type.replace("image/", "").toUpperCase()}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={triggerGallery}
                  className="h-10 px-3 rounded-xl border border-surface-container text-xs font-semibold text-app-text-main hover:bg-surface-container flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-app-text-muted" />
                  <span className="hidden sm:inline">Farklı Seç</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="h-10 px-3 rounded-xl border border-red-200/80 text-xs font-semibold text-app-error hover:bg-red-50 flex items-center gap-1.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kaldır</span>
                </button>
              </div>
            </div>
          </div>

          {/* Primary CTA Button */}
          <Button
            variant="primary"
            size="lg"
            isLoading={isLoading}
            onClick={() => onAnalyzeRequest?.(selectedFile)}
            leftIcon={<Sparkles className="w-5 h-5" />}
            className="w-full text-base font-bold shadow-md shadow-primary/20"
          >
            {isLoading ? "Yapay Zekâ İnceliyor..." : "Yemeği Analiz Et"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
