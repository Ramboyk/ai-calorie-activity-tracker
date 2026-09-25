"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa/register-sw";

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Register service worker after window load to avoid delaying initial render
    if (typeof window !== "undefined") {
      if (document.readyState === "complete") {
        void registerServiceWorker("/sw.js");
      } else {
        const handleLoad = () => {
          void registerServiceWorker("/sw.js");
        };
        window.addEventListener("load", handleLoad);
        return () => window.removeEventListener("load", handleLoad);
      }
    }
  }, []);

  return null;
}

export default ServiceWorkerRegister;
