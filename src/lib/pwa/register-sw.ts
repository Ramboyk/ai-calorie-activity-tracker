/**
 * NutriTrack AI - PWA Service Worker Constants & Registration Utilities
 * 
 * Implements Step 4 of the Stability Roadmap:
 * 1. App Shell Pre-caching configuration.
 * 2. Route classification (API bypass vs App Shell vs Static Assets).
 * 3. Cache versioning and automatic purge validation.
 * 4. Safe client-side service worker registration with update detection.
 */

export const SW_CACHE_VERSION = "nutritrack-v1";
export const SW_APP_SHELL_CACHE = `${SW_CACHE_VERSION}-shell`;
export const SW_RUNTIME_CACHE = `${SW_CACHE_VERSION}-runtime`;

export const APP_SHELL_ROUTES = [
  "/",
  "/analyze",
  "/activity",
  "/weekly",
  "/admin",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/brand/icon-192.png",
  "/brand/icon-512.png",
  "/brand/logo.png",
];

const STATIC_EXTENSIONS = [
  ".js",
  ".css",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
];

/**
 * Determines whether a URL is a dynamic API request that must bypass the SW cache.
 * When offline, API requests must fail directly so Step 2's offline-queue intercepts them.
 */
export function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/") || pathname === "/api";
}

/**
 * Checks whether a URL is part of the core pre-cached App Shell routes.
 */
export function isAppShellRoute(pathname: string): boolean {
  return APP_SHELL_ROUTES.includes(pathname);
}

/**
 * Checks if a request path matches static asset files (scripts, stylesheets, fonts, icons).
 */
export function isStaticAsset(pathname: string): boolean {
  if (pathname.startsWith("/_next/static/") || pathname.startsWith("/brand/")) {
    return true;
  }
  return STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

/**
 * Determines if a cache key belongs to an older version and should be purged.
 */
export function shouldPurgeCache(cacheKey: string, currentVersion = SW_CACHE_VERSION): boolean {
  if (!cacheKey.startsWith("nutritrack-")) {
    return false;
  }
  return !cacheKey.startsWith(currentVersion);
}

/**
 * Client-side helper to register the native Service Worker safely.
 */
export async function registerServiceWorker(
  swPath = "/sw.js"
): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".localhost");

  // Service workers require HTTPS in production
  if (window.location.protocol !== "https:" && !isLocalhost) {
    console.warn("[NutriTrack PWA] Service Worker registration skipped: insecure origin");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: "/",
    });

    registration.addEventListener("updatefound", () => {
      const installingWorker = registration.installing;
      if (installingWorker) {
        installingWorker.addEventListener("statechange", () => {
          if (
            installingWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            console.info("[NutriTrack PWA] Yeni sürüm hazır; sonraki açılışta aktifleşecek.");
          }
        });
      }
    });

    console.info("[NutriTrack PWA] Service Worker başarıyla kaydedildi. Kapsam:", registration.scope);
    return registration;
  } catch (err) {
    console.warn("[NutriTrack PWA] Service Worker kayıt hatası:", err);
    return null;
  }
}
