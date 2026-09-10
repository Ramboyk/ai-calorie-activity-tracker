"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  User,
  Sparkles,
  Zap,
  ArrowRight,
  LogOut,
  Activity,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [globalUsage, setGlobalUsage] = useState<{ todayCount: number; limit: number }>({
    todayCount: 0,
    limit: 20,
  });

  // Check admin session on mount
  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      try {
        const res = await fetch("/api/admin/status");
        if (!res.ok) return;
        const resJson = await res.json();
        if (isMounted && resJson.success && resJson.data) {
          setIsAdmin(Boolean(resJson.data.isAdmin));
          if (resJson.data.globalUsage) {
            setGlobalUsage(resJson.data.globalUsage);
          }
        }
      } catch (err) {
        console.warn("[NutriTrack AI] Admin status check failed:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    checkStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const resJson = await res.json();

      if (!res.ok || !resJson.success) {
        throw new Error(resJson.error?.message || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
      }

      setIsAdmin(true);
      setPassword("");

      // Refresh status
      const statusRes = await fetch("/api/admin/status");
      if (statusRes.ok) {
        const statusJson = await statusRes.json();
        if (statusJson.data?.globalUsage) {
          setGlobalUsage(statusJson.data.globalUsage);
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Giriş yapılamadı.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      setIsAdmin(false);
      router.refresh();
    } catch (err) {
      console.warn("[NutriTrack AI] Logout error:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-app-text-main antialiased selection:bg-primary-light selection:text-primary">
      <Header />

      <main className="flex-1 w-full pt-4 sm:pt-6 pb-28 md:pb-12">
        <Container className="max-w-2xl space-y-6">
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-app-text-muted hover:text-app-text-main transition-colors w-fit px-3 py-2 rounded-xl hover:bg-surface-container"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard&apos;a Dön</span>
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container text-xs font-semibold text-app-text-muted">
              <KeyRound className="w-3.5 h-3.5 text-primary" />
              <span>Portföy Yönetici Portalı</span>
            </div>
          </div>

          {isLoading ? (
            /* Loading Skeleton */
            <div className="p-8 rounded-3xl bg-surface-container-low border border-surface-container animate-pulse space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-container mx-auto" />
              <div className="h-5 w-48 bg-surface-container rounded-full mx-auto" />
              <div className="h-4 w-72 bg-surface-container/70 rounded-full mx-auto" />
            </div>
          ) : isAdmin ? (
            /* Authenticated Admin Showcase Panel */
            <div className="space-y-6 animate-fade-in">
              {/* Active Admin Banner */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-surface-container to-surface-container-low border border-emerald-500/30 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                      <Zap className="w-6 h-6 text-emerald-500 fill-emerald-500/30" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-extrabold text-app-text-main">
                          Yönetici Modu Aktif
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500 text-white shadow-xs">
                          Sınırsız AI
                        </span>
                      </div>
                      <p className="text-xs text-app-text-muted mt-0.5">
                        HMAC-SHA256 Güvenli Oturum Doğrulandı • Rate Limit Koruması Bypass Edildi
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Oturumu Kapat"
                    className="p-2.5 rounded-xl border border-surface-container bg-surface-container-low text-app-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-2xl bg-surface-container-lowest/80 border border-surface-container/80 space-y-1">
                    <span className="text-[11px] font-bold text-app-text-muted uppercase tracking-wider">
                      IP Kotası Durumu
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        Bypass Devrede (Limitsiz)
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-container-lowest/80 border border-surface-container/80 space-y-1">
                    <span className="text-[11px] font-bold text-app-text-muted uppercase tracking-wider">
                      Bugünkü Demo AI Kullanımı
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-app-text-main">
                        {globalUsage.todayCount} / {globalUsage.limit} istek
                      </span>
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link href="/analyze" className="flex-1">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full shadow-md shadow-primary/25"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Hemen Sınırsız AI Analizini Dene
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLogout}
                    leftIcon={<LogOut className="w-4 h-4" />}
                  >
                    Oturumu Kapat
                  </Button>
                </div>
              </div>

              {/* Technical Implementation Overview for Reviewers */}
              <div className="p-6 rounded-3xl bg-surface-container-low border border-surface-container space-y-3">
                <h3 className="text-sm font-bold text-app-text-main flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Teknik Mimari Özeti (Portföy Notu)</span>
                </h3>
                <ul className="text-xs text-app-text-muted space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>
                      <strong>Zamanlama Koruması:</strong> Şifre kontrolü Node.js{" "}
                      <code>crypto.timingSafeEqual</code> ile yapılarak timing-attack saldırıları engellenir.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>
                      <strong>HMAC Oturum Güvenliği:</strong> Başarılı girişte{" "}
                      <code>nutritrack_admin_session</code> adında <code>HttpOnly</code>, <code>Secure</code>,{" "}
                      <code>SameSite=Strict</code> imzalı çerez oluşturulur.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>
                      <strong>Kota Muafiyeti:</strong> Aktif oturumda <code>/api/analyze-meal</code> endpoint&apos;i
                      çağrıları rate limit kotasından düşmez ve 999 kalan hakla döner.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            /* Unauthenticated Login Form */
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-low border border-surface-container space-y-6 shadow-sm">
                <div className="space-y-2 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto shadow-xs">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-app-text-main">
                    Portföy Showcase &amp; Yönetici Girişi
                  </h1>
                  <p className="text-xs sm:text-sm text-app-text-muted max-w-md mx-auto leading-relaxed">
                    İncelemeciler ve işverenlerin kota sınırına takılmadan Gemini AI yemek analizini deneyimleyebilmesi
                    için geliştirilmiş özel oturum ekranı.
                  </p>
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 flex items-center gap-2.5 text-xs font-semibold animate-fade-in"
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="admin-username"
                      className="text-xs font-bold text-app-text-main flex items-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5 text-app-text-muted" />
                      <span>Kullanıcı Adı</span>
                    </label>
                    <input
                      id="admin-username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin"
                      autoComplete="username"
                      className="w-full h-11 px-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container text-xs font-medium text-app-text-main placeholder:text-app-text-muted/60 focus:outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="admin-password"
                      className="text-xs font-bold text-app-text-main flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 text-app-text-muted" />
                      <span>Şifre</span>
                    </label>
                    <input
                      id="admin-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full h-11 px-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container text-xs font-medium text-app-text-main placeholder:text-app-text-muted/60 focus:outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    leftIcon={<Lock className="w-4 h-4" />}
                    className="w-full shadow-md shadow-primary/25 min-h-[44px]"
                  >
                    Yönetici Olarak Giriş Yap
                  </Button>
                </form>

                {/* Reviewer Credentials Hint */}
                <div className="p-4 rounded-2xl bg-primary-soft/60 border border-primary/20 space-y-1.5 text-xs text-app-text-muted">
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Teknik İncelemeci İçin Demo Bilgileri</span>
                  </div>
                  <p className="leading-relaxed text-[11px]">
                    Yerel ve demo ortamı için varsayılan giriş:
                  </p>
                  <div className="font-mono text-[11px] bg-surface-container-lowest px-2.5 py-1.5 rounded-xl border border-primary/20 text-app-text-main w-fit">
                    Kullanıcı Adı: <strong>admin</strong> | Şifre: <strong>admin123</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Container>
      </main>

      <BottomNav />
    </div>
  );
}
