/**
 * NutriTrack AI - Native PWA Service Worker (Roadmap Step 4)
 * 
 * Implements:
 * 1. App Shell Pre-caching for full offline application launch.
 * 2. Strict bypass for dynamic '/api/*' requests (ensuring offline-queue works seamlessly).
 * 3. Cache-First & Stale-While-Revalidate caching for static assets & Next.js chunks.
 * 4. Automatic cache cleanup on version upgrades.
 */

const CACHE_VERSION = "nutritrack-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const EXPECTED_CACHES = [SHELL_CACHE, RUNTIME_CACHE];

const APP_SHELL_ROUTES = [
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

// 1. Install Event: Pre-cache App Shell core routes
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      // Use resilient individual adds so a single missing asset never breaks worker installation
      await Promise.allSettled(
        APP_SHELL_ROUTES.map(async (route) => {
          try {
            await cache.add(new Request(route, { cache: "reload" }));
          } catch (err) {
            console.warn("[NutriTrack SW] Precache notice for route:", route, err);
          }
        })
      );
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Purge old cache stores automatically
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return (
                cacheName.startsWith("nutritrack-") &&
                !EXPECTED_CACHES.includes(cacheName)
              );
            })
            .map((staleCacheName) => {
              console.info("[NutriTrack SW] Eski önbellek siliniyor:", staleCacheName);
              return caches.delete(staleCacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Intelligent routing and caching strategies
self.addEventListener("fetch", (event) => {
  // Only process GET requests (POST/PUT/DELETE must never be cached)
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  // Cross-origin requests (e.g. Firebase, Upstash, Google APIs) bypass Service Worker
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network-First / Strict Bypass for '/api/*' dynamic endpoints
  // If network is offline, let the fetch reject so Step 2's offline-queue catches it!
  if (url.pathname.startsWith("/api/") || url.pathname === "/api") {
    return;
  }

  // Navigation Requests (HTML Pages): Network-first with cache fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(SHELL_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Device is completely offline: Return cached page or fallback to root App Shell
          const cachedPage = await caches.match(event.request);
          if (cachedPage) {
            return cachedPage;
          }
          const rootFallback = await caches.match("/");
          if (rootFallback) {
            return rootFallback;
          }
          return new Response("Çevrimdışı Mod - NutriTrack AI", {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        })
    );
    return;
  }

  // Static Assets (Next.js scripts, styles, images, fonts): Cache-First + Stale-While-Revalidate
  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/brand/") ||
    /\.(?:js|css|png|jpg|jpeg|webp|svg|ico|woff|woff2|ttf)$/i.test(url.pathname);

  if (isStatic) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Fetch from network in background to update cache for next time
        const networkFetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => null);

        // Return cached immediately if available; otherwise wait for network
        return cachedResponse || networkFetchPromise;
      })
    );
    return;
  }

  // Default: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});
