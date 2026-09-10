"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "./Container";
import { Sparkles, ChevronLeft, ChevronRight, Calendar, User } from "lucide-react";

export interface HeaderProps {
  currentDateText?: string;
  onPrevDay?: () => void;
  onNextDay?: () => void;
}

export function Header({
  currentDateText = "10 Eylül, Çarşamba",
  onPrevDay,
  onNextDay,
}: HeaderProps) {
  const pathname = usePathname();

  const navItems = [
    { id: "bugun", label: "Bugün", href: "/" },
    { id: "aktivite", label: "Aktivite & Su", href: "#" },
    { id: "haftalik", label: "Haftalık Özet", href: "#" },
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
        <div className="flex items-center gap-1.5 bg-surface-container-low/80 p-1 rounded-full border border-surface-container/60 shadow-xs">
          <button
            type="button"
            onClick={onPrevDay}
            aria-label="Önceki Gün"
            className="w-8 h-8 rounded-full flex items-center justify-center text-app-text-muted hover:text-app-text-main hover:bg-surface-container transition-colors active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold text-app-text-main select-none">
            <Calendar className="w-3.5 h-3.5 text-primary hidden sm:block" />
            <span className="whitespace-nowrap">{currentDateText}</span>
          </div>

          <button
            type="button"
            onClick={onNextDay}
            aria-label="Sonraki Gün"
            className="w-8 h-8 rounded-full flex items-center justify-center text-app-text-muted hover:text-app-text-main hover:bg-surface-container transition-colors active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : item.href !== "#" && pathname.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-xs"
                    : "text-app-text-muted hover:text-app-text-main hover:bg-surface-container"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Side: Profile / User Icon */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            aria-label="Kullanıcı Profili"
            className="w-10 h-10 rounded-full bg-surface-container-high/80 border border-surface-container flex items-center justify-center text-app-text-main hover:bg-surface-container transition-colors active:scale-95"
          >
            <User className="w-4 h-4 text-app-text-muted" />
          </button>
        </div>
      </Container>
    </header>
  );
}

export default Header;
