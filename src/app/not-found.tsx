import React from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Compass, ArrowLeft, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface text-app-text-main p-4 antialiased">
      <Container className="max-w-md w-full">
        <div className="p-7 sm:p-9 rounded-3xl bg-surface-container-low border border-surface-container shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-primary-soft text-primary flex items-center justify-center mx-auto shadow-xs">
            <Compass className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-[11px] font-bold text-primary">
              <Sparkles className="w-3 h-3" />
              <span>Hata Kodu: 404</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-app-text-main">
              404 — Sayfa Bulunamadı
            </h1>
            <p className="text-xs sm:text-sm text-app-text-muted leading-relaxed max-w-sm mx-auto">
              Aradığınız ekran mevcut değil veya taşınmış olabilir. Günlük besin ve kalori takibinize ana sayfadan devam edebilirsiniz.
            </p>
          </div>

          <div className="pt-2">
            <Link href="/" className="w-full inline-block">
              <Button
                variant="primary"
                size="lg"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="w-full shadow-md shadow-primary/25 min-h-[44px]"
              >
                Dashboard&apos;a Dön
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
