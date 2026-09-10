"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "./Container";
import { useTracker } from "@/context";
import { formatDisplayDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { Sparkles, ChevronLeft, ChevronRight, Calendar, User, Cloud, RefreshCw, AlertCircle, Shield } from "lucide-react";

export interface HeaderProps {
  currentDateText?: string;
  onPrevDay?: () => void;
  onNextDay?: () => void;
}

export function Header({
  currentDateText,
  onPrevDay,
  onNextDay,
}: HeaderProps) {
  const pathname = usePathname();
  const tracker = useTracker();
  const [isAdmin, setIsAdmin] = React.useState<boolean>(false);

  React.useEffect(() => {
    let isMounted = true;
    async function checkAdmin() {
      try {
        const res = await fetch("/api/admin/status");
        if (!res.ok) return;
        const resJson = await res.json();
        if (isMounted && resJson.success && resJson.data) {
          setIsAdmin(Boolean(resJson.data.isAdmin));
        }
      } catch {
        // ignore error
      }
    }
    checkAdmin();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const activeDateText = currentDateText || formatDisplayDate(tracker.selectedDate);

  const handlePrev = onPrevDay || tracker.goToPrevDay;
  const handleNext = onNextDay || tracker.goToNextDay;
  const handleDateClick = tracker.goToToday;

  const navItems = [
    { id: "bugun", label: "Bugün", href: "/" },
    { id: "aktivite", label: "Aktivite & Su", href: "/activity" },
    { id: "haftalik", label: "Haftalık Özet", href: "/weekly" },
    { id: "analiz", label: "AI Analiz", href: "/analyze" },
  ];

  return (
    <header className="sticky top-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-surface-container transition-all">
      <Container className="h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-2xl bg-primary-soft text-primary flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-app-text-main leading-tight">
              NutriTrack AI
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-app-text-muted leading-none hidden xs:block">
              Akıllı Besin &amp; Kalori
            </span>
          </div>
        </Link>

        {/* Date Selector Navigation (Center / Left-aligned) */}
        <div className="flex items-center gap-1 bg-surface-container-low/80 p-1 rounded-full border border-surface-container/60 shadow-xs">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Önceki Gün"
            title="Önceki Gün"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-app-text-muted hover:text-app-text-main hover:bg-surface-container transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleDateClick}
            aria-label="Bugünün Tarihine Dön"
            title="Bugüne Dön"
            className="flex items-center gap-1.5 px-3 h-11 min-h-[44px] text-xs font-semibold text-app-text-main select-none hover:bg-surface-container rounded-full transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Calendar className="w-3.5 h-3.5 text-primary hidden sm:block" />
            <span className="whitespace-nowrap tabular-nums">{activeDateText}</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Sonraki Gün"
            title="Sonraki Gün"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-app-text-muted hover:text-app-text-main hover:bg-surface-container transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav aria-label="Masaüstü Ana Navigasyon" className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : item.href !== "#" && pathname.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "px-3.5 h-10 min-h-[40px] rounded-full text-xs font-semibold inline-flex items-center justify-center transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isActive
                    ? "bg-primary text-white shadow-xs"
                    : "text-app-text-muted hover:text-app-text-main hover:bg-surface-container"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Side: Cloud Sync Indicator & Profile / User Icon */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border select-none",
              tracker.syncStatus === "synced" && "bg-primary-soft text-primary border-primary/20",
              tracker.syncStatus === "syncing" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
              tracker.syncStatus === "local" && "bg-surface-container-low text-app-text-muted border-surface-container",
              tracker.syncStatus === "error" && "bg-rose-500/10 text-rose-500 border-rose-500/20"
            )}
            title={
              tracker.syncStatus === "synced"
                ? "Bulut Senkronize (Firestore)"
                : tracker.syncStatus === "syncing"
                ? "Bulut ile senkronize ediliyor..."
                : tracker.syncStatus === "error"
                ? "Bulut senkronizasyonunda hata oluştu"
                : "Yerel Hafıza Modu (Local-First)"
            }
          >
            {tracker.syncStatus === "synced" && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <Cloud className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline font-semibold">Bulut Senkron</span>
              </>
            )}
            {tracker.syncStatus === "syncing" && (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span className="hidden sm:inline font-semibold">Senkronize</span>
              </>
            )}
            {tracker.syncStatus === "local" && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-app-text-muted/60" />
                <Cloud className="w-3.5 h-3.5 text-app-text-muted" />
                <span className="hidden sm:inline font-semibold">Yerel Hafıza</span>
              </>
            )}
            {tracker.syncStatus === "error" && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline font-semibold">Senk. Hatası</span>
              </>
            )}
          </div>

          {/* Admin / Portfolio Showcase Access Link */}
          <Link
            href="/admin"
            aria-label="Yönetici Paneli"
            title={isAdmin ? "Yönetici Modu Aktif (Sınırsız AI)" : "Portföy Yönetici Girişi"}
            className={cn(
              "relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border flex items-center justify-center transition-all active:scale-95",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isAdmin
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 shadow-xs"
                : "bg-surface-container-high/80 border-surface-container text-app-text-muted hover:text-app-text-main hover:bg-surface-container"
            )}
          >
            <Shield className="w-4 h-4" />
            {isAdmin && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-surface animate-pulse" />
            )}
          </Link>

          <button
            type="button"
            aria-label="Kullanıcı Profili"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-surface-container-high/80 border border-surface-container flex items-center justify-center text-app-text-main hover:bg-surface-container transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <User className="w-4 h-4 text-app-text-muted" />
          </button>
        </div>
      </Container>
    </header>
  );
}

export default Header;
