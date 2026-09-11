"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, RefreshCw, AlertCircle, Sparkles, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  onFallbackToFilePicker: () => void;
}

export function CameraModal({
  isOpen,
  onClose,
  onCapture,
  onFallbackToFilePicker,
}: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState<boolean>(true);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Stop camera stream cleanly
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
  }, []);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    setIsLoadingCamera(true);
    setCameraError(null);
    stopStream();

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Cihazınız veya tarayıcınız doğrudan kamera erişimini desteklemiyor. Lütfen galeriden veya dosyalardan seçin.");
      setIsLoadingCamera(false);
      return;
    }

    try {
      // Try preferred facing mode first
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920, max: 2560 },
            height: { ideal: 1080, max: 1440 },
          },
          audio: false,
        });
      } catch {
        // Fallback to basic video constraint if strict ideal failed
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {
          // Some browsers require explicit muted property
          if (videoRef.current) {
            videoRef.current.muted = true;
            return videoRef.current.play();
          }
        });
      }
      setIsLoadingCamera(false);
    } catch (err: unknown) {
      console.warn("[NutriTrack AI] Kamera başlatma hatası:", err);
      const isPermissionDenied =
        err instanceof Error &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");

      setCameraError(
        isPermissionDenied
          ? "Kamera izni verilmedi. Lütfen tarayıcı ayarlarından kamera iznini açın veya galeriden dosya yükleyin."
          : "Kameraya erişilemedi. Lütfen cihaz kamerasının başka bir uygulama tarafından kullanılmadığından emin olun."
      );
      setIsLoadingCamera(false);
    }
  }, [facingMode, stopStream]);

  // Start camera when modal opens, stop when closes
  useEffect(() => {
    if (isOpen) {
      void startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  // Flip between rear and front camera
  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Capture current frame directly to lightweight JPEG File
  const handleShutterClick = async () => {
    if (!videoRef.current || isCapturing) return;
    setIsCapturing(true);

    try {
      // Haptic feedback for tactile shutter feel on mobile
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
      }

      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Canvas context oluşturulamadı");

      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          // Immediately stop camera tracks to release camera hardware and RAM
          stopStream();
          canvas.width = 0;
          canvas.height = 0;

          if (!blob) {
            throw new Error("Görsel yakalanamadı");
          }

          const capturedFile = new File([blob], `meal_${Date.now()}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          onCapture(capturedFile);
          onClose();
          setIsCapturing(false);
        },
        "image/jpeg",
        0.85
      );
    } catch (err) {
      console.error("[NutriTrack AI] Çekim hatası:", err);
      setIsCapturing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Kamera ile Yemek Çek"
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between overflow-hidden animate-fade-in select-none"
    >
      {/* Top Bar Controls */}
      <div className="w-full px-4 pt-4 pb-3 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10">
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 transition-transform active:scale-95"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>NutriTrack Vision</span>
        </div>

        <button
          type="button"
          onClick={handleToggleFacingMode}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 transition-transform active:scale-95"
          aria-label="Kamerayı Çevir"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Main Viewfinder / Video Stream Area */}
      <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden bg-black">
        {/* Live Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoadingCamera || cameraError ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* Viewfinder Target Framing Grid */}
        {!cameraError && !isLoadingCamera && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8">
            <div className="relative w-full max-w-sm aspect-[4/3] rounded-3xl border-2 border-dashed border-white/40 flex items-center justify-center">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

              <p className="px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-sm text-white/90 text-xs font-medium">
                Yemeği çerçevenin ortasına hizalayın
              </p>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoadingCamera && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
            <div className="w-10 h-10 border-3 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
            <p className="text-xs font-medium text-white/80">Kamera başlatılıyor...</p>
          </div>
        )}

        {/* Camera Permission / Access Error Card */}
        {cameraError && (
          <div className="absolute inset-x-6 max-w-md mx-auto p-6 rounded-3xl bg-neutral-900/95 border border-red-500/40 text-white text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Kamera Erişimi Gerekli</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">{cameraError}</p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  onClose();
                  onFallbackToFilePicker();
                }}
                leftIcon={<ImageIcon className="w-4 h-4" />}
                className="w-full"
              >
                Galeriden / Dosyalardan Seç
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={startCamera}
                leftIcon={<RefreshCw className="w-4 h-4" />}
                className="w-full text-white border-white/20 hover:bg-white/10"
              >
                Yeniden Dene
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Shutter Controls */}
      <div className="w-full px-6 pb-8 pt-4 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-around z-10">
        {/* Gallery Fallback Option */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onFallbackToFilePicker();
          }}
          className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-transform active:scale-95"
          aria-label="Galeriden seç"
        >
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-semibold">Galeri</span>
        </button>

        {/* Shutter Button */}
        <button
          type="button"
          onClick={handleShutterClick}
          disabled={isLoadingCamera || Boolean(cameraError) || isCapturing}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1.5 disabled:opacity-40 transition-transform active:scale-90 shadow-lg shadow-black/50"
          aria-label="Fotoğrafı Çek"
        >
          <div
            className={`w-full h-full rounded-full transition-all duration-150 ${
              isCapturing ? "bg-emerald-400 scale-75" : "bg-white hover:bg-neutral-100"
            }`}
          />
        </button>

        {/* Cancel / Close */}
        <button
          type="button"
          onClick={onClose}
          className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-transform active:scale-95"
          aria-label="Vazgeç"
        >
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-semibold">Vazgeç</span>
        </button>
      </div>
    </div>
  );
}

export default CameraModal;
