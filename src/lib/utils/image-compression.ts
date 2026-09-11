/**
 * Client-Side Image Compression & Optimization Utility
 * 
 * Solves mobile browser "Out of Memory" (Bellek yetersiz) issues by:
 * 1. Scaling down ultra-high resolution camera photos (e.g. 108MP, 20MB) to optimal AI resolution (max 1600px, ~300KB-600KB).
 * 2. Creating lightweight persistent base64 thumbnails (max 320px, ~15KB) for safe localStorage saving.
 * 3. Cleaning up offscreen canvas contexts and object URLs to avoid memory leaks on mobile devices.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: "image/jpeg" | "image/webp";
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.82,
  mimeType: "image/jpeg",
};

/**
 * Calculates new dimensions while strictly maintaining original aspect ratio.
 */
export function calculateTargetDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (originalWidth <= 0 || originalHeight <= 0) {
    return { width: Math.max(1, maxWidth), height: Math.max(1, maxHeight) };
  }

  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
  return {
    width: Math.max(1, Math.round(originalWidth * ratio)),
    height: Math.max(1, Math.round(originalHeight * ratio)),
  };
}

/**
 * Compresses an image file on the client side using an offscreen HTML5 Canvas.
 * Safely handles mobile memory limits and returns an optimized File object.
 */
export async function compressImage(
  file: File,
  options?: CompressionOptions
): Promise<File> {
  // If not in browser (SSR or node tests without canvas support), return original
  if (typeof window === "undefined" || typeof document === "undefined") {
    return file;
  }

  // Non-image files bypass compression
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const opts: Required<CompressionOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  return new Promise<File>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const { width: targetWidth, height: targetHeight } = calculateTargetDimensions(
          img.naturalWidth || img.width,
          img.naturalHeight || img.height,
          opts.maxWidth,
          opts.maxHeight
        );

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
          return;
        }

        // Draw with white background to ensure no black/transparent artifact in JPEG
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            // Free canvas memory
            canvas.width = 0;
            canvas.height = 0;

            if (!blob) {
              resolve(file);
              return;
            }

            const baseName = file.name.replace(/\.[^/.]+$/, "");
            const ext = opts.mimeType === "image/webp" ? ".webp" : ".jpg";
            const compressedFile = new File([blob], `${baseName}_opt${ext}`, {
              type: opts.mimeType,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          opts.mimeType,
          opts.quality
        );
      } catch (err) {
        console.warn("[NutriTrack AI] Görsel sıkıştırma sırasında hata oluştu, orijinal dosya kullanılıyor:", err);
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Creates a lightweight base64 thumbnail (~15KB) suitable for permanent localStorage persistence.
 */
export async function createThumbnail(
  fileOrBlob: File | Blob,
  maxDimension: number = 320
): Promise<string> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "";
  }

  return new Promise<string>((resolve) => {
    const objectUrl = URL.createObjectURL(fileOrBlob);
    const img = new Image();

    img.onload = () => {
      try {
        const { width, height } = calculateTargetDimensions(
          img.naturalWidth || img.width,
          img.naturalHeight || img.height,
          maxDimension,
          maxDimension
        );

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve(objectUrl);
          return;
        }

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        URL.revokeObjectURL(objectUrl);
        canvas.width = 0;
        canvas.height = 0;
        resolve(dataUrl);
      } catch (err) {
        console.warn("[NutriTrack AI] Thumbnail oluşturulamadı:", err);
        URL.revokeObjectURL(objectUrl);
        resolve("");
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve("");
    };

    img.src = objectUrl;
  });
}
