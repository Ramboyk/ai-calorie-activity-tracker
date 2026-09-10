"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Flame, BarChart3, User, Camera } from "lucide-react";

export interface BottomNavProps {
  onCaptureClick?: () => void;
}

export function BottomNav({ onCaptureClick }: BottomNavProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<string>("bugun");

  const isAnalyzePage = pathname === "/analyze";

  return (
    <nav
      aria-label="Mobil Alt Navigasyon"
      className="fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-surface-container shadow-[0_-4px_20px_rgba(19,27,46,0.05)] pb-[env(safe-area-inset-bottom,0px)] md:hidden"
    >
      <div className="relative flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {/* Tab 1: Bugün */}
        <Link
          href="/"
          aria-label="Bugün Paneli"
          aria-current={pathname === "/" ? "page" : undefined}
          className={`flex flex-col items-center justify-center min-w-[44px] w-14 h-12 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            pathname === "/"
              ? "text-primary font-bold"
              : "text-app-text-muted hover:text-app-text-main"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-1">Bugün</span>
        </Link>

        {/* Tab 2: Aktivite */}
        <Link
          href="/activity"
          aria-label="Aktivite ve Su Takibi"
          aria-current={pathname === "/activity" ? "page" : undefined}
          className={`flex flex-col items-center justify-center min-w-[44px] w-14 h-12 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            pathname === "/activity"
              ? "text-primary font-bold"
              : "text-app-text-muted hover:text-app-text-main"
          }`}
        >
          <Flame className="w-5 h-5" />
          <span className="text-[10px] mt-1">Aktivite</span>
        </Link>

        {/* Center: Elevated Camera FAB Button */}
        <div className="relative flex flex-col items-center justify-center -top-4">
          <Link
            href="/analyze"
            onClick={onCaptureClick}
            aria-label="Yemek Analiz Et"
            aria-current={isAnalyzePage ? "page" : undefined}
            className={`w-14 h-14 min-w-[44px] min-h-[44px] rounded-full bg-primary text-white flex items-center justify-center shadow-[0_8px_20px_rgba(0,105,72,0.38)] active:scale-95 transition-transform hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 ${
              isAnalyzePage ? "ring-4 ring-primary/30" : ""
            }`}
          >
            <Camera className="w-6 h-6" />
          </Link>
          <span className="text-[10px] font-bold text-primary mt-1">Öğün Tara</span>
        </div>

        {/* Tab 3: Haftalık */}
        <Link
          href="/weekly"
          aria-label="Haftalık Özet ve İstatistikler"
          aria-current={pathname === "/weekly" ? "page" : undefined}
          className={`flex flex-col items-center justify-center min-w-[44px] w-14 h-12 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            pathname === "/weekly"
              ? "text-primary font-bold"
              : "text-app-text-muted hover:text-app-text-main"
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] mt-1">Haftalık</span>
        </Link>

        {/* Tab 4: Profil */}
        <button
          type="button"
          onClick={() => setActiveTab("profil")}
          aria-label="Kullanıcı Profili"
          className={`flex flex-col items-center justify-center min-w-[44px] w-14 h-12 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95 ${
            activeTab === "profil" && !isAnalyzePage
              ? "text-primary font-bold"
              : "text-app-text-muted hover:text-app-text-main"
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-1">Profil</span>
        </button>
      </div>
    </nav>
  );
}

export default BottomNav;
