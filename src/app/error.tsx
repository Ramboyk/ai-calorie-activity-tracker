"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { AlertCircle, RefreshCw, ArrowLeft, ShieldAlert } from "lucide-react";

export interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log filtered error internally without exposing details to UI
    console.error("[NutriTrack AI] Unhandled application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface text-app-text-main p-4 antialiased">
      <Container className="max-w-md w-full">
        <div className="p-7 sm:p-9 rounded-3xl bg-surface-container-low border border-surface-container shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-app-text-main">
              Beklenmeyen Bir Durum Oluştu
            </h1>
            <p className="text-xs sm:text-sm text-app-text-muted leading-relaxed max-w-sm mx-auto">
              İşleminiz gerçekleştirilirken teknik bir sorun yaşandı. Verileriniz güvendedir.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={reset}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              className="w-full shadow-md shadow-primary/25 min-h-[44px]"
            >
              Yeniden Dene
            </Button>
            <Link href="/" className="w-full">
              <Button
                variant="outline"
                size="lg"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="w-full min-h-[44px]"
              >
                Ana Sayfaya Dön
              </Button>
            </Link>
          </div>

          <div className="p-3 rounded-2xl bg-surface-container-lowest border border-surface-container/60 text-[11px] text-app-text-muted/70 flex items-center justify-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Hata Referansı: {error.digest || "ERR_RUNTIME_RECOVERABLE"}</span>
          </div>
        </div>
      </Container>
    </div>
  );
}
