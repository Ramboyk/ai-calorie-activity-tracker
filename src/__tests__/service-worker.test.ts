import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  SW_CACHE_VERSION,
  SW_APP_SHELL_CACHE,
  SW_RUNTIME_CACHE,
  APP_SHELL_ROUTES,
  isApiRoute,
  isAppShellRoute,
  isStaticAsset,
  shouldPurgeCache,
  registerServiceWorker,
} from "@/lib/pwa/register-sw";

describe("Full Offline PWA Service Worker & App Shell Cache (Roadmap Step 4)", () => {
  describe("PWA Cache Constants & App Shell Configuration", () => {
    it("should export versioned cache namespaces", () => {
      expect(SW_CACHE_VERSION).toBe("nutritrack-v1");
      expect(SW_APP_SHELL_CACHE).toBe("nutritrack-v1-shell");
      expect(SW_RUNTIME_CACHE).toBe("nutritrack-v1-runtime");
    });

    it("should include all 5 primary user routes and essential PWA assets in App Shell precache list", () => {
      const requiredRoutes = [
        "/",
        "/analyze",
        "/activity",
        "/weekly",
        "/admin",
        "/manifest.webmanifest",
        "/favicon.ico",
        "/apple-touch-icon.png",
      ];

      for (const route of requiredRoutes) {
        expect(APP_SHELL_ROUTES).toContain(route);
      }
      expect(isAppShellRoute("/")).toBe(true);
      expect(isAppShellRoute("/analyze")).toBe(true);
      expect(isAppShellRoute("/activity")).toBe(true);
      expect(isAppShellRoute("/weekly")).toBe(true);
      expect(isAppShellRoute("/admin")).toBe(true);
      expect(isAppShellRoute("/unknown-subpage")).toBe(false);
    });
  });

  describe("Intelligent Route Classification & API Bypass Rules", () => {
    it("should classify dynamic /api/* endpoints for strict cache bypass", () => {
      expect(isApiRoute("/api/analyze-meal")).toBe(true);
      expect(isApiRoute("/api/admin/login")).toBe(true);
      expect(isApiRoute("/api/admin/status")).toBe(true);
      expect(isApiRoute("/api")).toBe(true);

      // Core pages must NOT be flagged as API
      expect(isApiRoute("/")).toBe(false);
      expect(isApiRoute("/analyze")).toBe(false);
      expect(isApiRoute("/activity")).toBe(false);
    });

    it("should correctly identify static chunks, stylesheets, images, and fonts", () => {
      expect(isStaticAsset("/_next/static/chunks/app-index.js")).toBe(true);
      expect(isStaticAsset("/_next/static/css/global.css")).toBe(true);
      expect(isStaticAsset("/brand/icon-192.png")).toBe(true);
      expect(isStaticAsset("/brand/logo.png")).toBe(true);
      expect(isStaticAsset("/fonts/PlusJakartaSans.woff2")).toBe(true);
      expect(isStaticAsset("/favicon.ico")).toBe(true);

      expect(isStaticAsset("/")).toBe(false);
      expect(isStaticAsset("/api/analyze-meal")).toBe(false);
    });
  });

  describe("Automatic Cache Purge Logic (shouldPurgeCache)", () => {
    it("should identify older NutriTrack caches for cleanup when version upgrades", () => {
      expect(shouldPurgeCache("nutritrack-v0-shell", "nutritrack-v1")).toBe(true);
      expect(shouldPurgeCache("nutritrack-legacy-runtime", "nutritrack-v1")).toBe(true);
      expect(shouldPurgeCache("nutritrack-beta-cache", "nutritrack-v1")).toBe(true);
    });

    it("should keep current version caches intact", () => {
      expect(shouldPurgeCache("nutritrack-v1-shell", "nutritrack-v1")).toBe(false);
      expect(shouldPurgeCache("nutritrack-v1-runtime", "nutritrack-v1")).toBe(false);
    });

    it("should ignore unrelated third-party caches", () => {
      expect(shouldPurgeCache("workbox-precache-v2", "nutritrack-v1")).toBe(false);
      expect(shouldPurgeCache("google-fonts-cache", "nutritrack-v1")).toBe(false);
    });
  });

  describe("Client-side Service Worker Registration (registerServiceWorker)", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it("should return null gracefully if serviceWorker is not supported in navigator", async () => {
      vi.stubGlobal("window", {
        location: { protocol: "https:", hostname: "nutritrack.ai" },
      });
      vi.stubGlobal("navigator", {});

      const result = await registerServiceWorker();
      expect(result).toBeNull();
    });

    it("should return null if protocol is insecure HTTP on a remote domain", async () => {
      vi.stubGlobal("window", {
        location: {
          protocol: "http:",
          hostname: "nutritrack.example.com",
        },
      });
      vi.stubGlobal("navigator", {
        serviceWorker: { register: vi.fn() },
      });

      const result = await registerServiceWorker();
      expect(result).toBeNull();
    });

    it("should successfully register /sw.js on localhost or secure HTTPS origin", async () => {
      const mockRegistration = {
        scope: "http://localhost:3000/",
        addEventListener: vi.fn(),
        installing: null,
      };

      const mockRegister = vi.fn().mockResolvedValue(mockRegistration);

      vi.stubGlobal("window", {
        location: {
          protocol: "http:",
          hostname: "localhost",
        },
      });
      vi.stubGlobal("navigator", {
        serviceWorker: {
          register: mockRegister,
          controller: null,
        },
      });

      const reg = await registerServiceWorker("/sw.js");
      expect(reg).toBe(mockRegistration);
      expect(mockRegister).toHaveBeenCalledWith("/sw.js", { scope: "/" });
    });

    it("should catch and log registration errors without crashing the application", async () => {
      const mockRegister = vi.fn().mockRejectedValue(new Error("SecurityError: Script blocked"));

      vi.stubGlobal("window", {
        location: {
          protocol: "https:",
          hostname: "nutritrack.ai",
        },
      });
      vi.stubGlobal("navigator", {
        serviceWorker: {
          register: mockRegister,
        },
      });

      const reg = await registerServiceWorker("/sw.js");
      expect(reg).toBeNull();
    });
  });
});
