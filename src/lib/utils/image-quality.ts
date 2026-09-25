/**
 * NutriTrack AI - Pre-Upload Image Quality Guard & Blur/Darkness Detection
 * 
 * Implements Step 3 of the Stability Roadmap:
 * 1. Millisecond-speed (10-20ms) client-side pixel evaluation on offscreen canvas.
 * 2. Luminance calculation to prevent quota waste on pitch-black or blown-out photos.
 * 3. 3x3 Laplacian variance algorithm for blur and camera shake detection.
 * 4. Ambient light assessment for real-time camera viewfinder guidance.
 */

export type ImageQualityStatus =
  | "excellent"
  | "acceptable"
  | "too_dark"
  | "too_bright"
  | "blurry";

export interface ImageQualityResult {
  score: number; // 0-100 overall quality score
  status: ImageQualityStatus;
  luminance: number; // 0-255 average luma
  blurScore: number; // Laplacian variance / edge energy
  isAcceptable: boolean;
  recommendation?: string;
}

export interface AmbientLightResult {
  luminance: number;
  status: "ideal" | "low_light" | "overexposed";
  label: string;
}

// Calibration thresholds
export const LUMINANCE_TOO_DARK_THRESHOLD = 38;
export const LUMINANCE_TOO_BRIGHT_THRESHOLD = 235;
export const BLUR_VARIANCE_THRESHOLD = 15;

/**
 * Calculates standard CCIR 601 perceptual luminance from RGB components.
 */
export function calculateLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Computes Laplacian variance on a 1D grayscale buffer representing a 2D image.
 * Uses standard 3x3 Laplacian discrete kernel:
 * [  0,  1,  0 ]
 * [  1, -4,  1 ]
 * [  0,  1,  0 ]
 */
export function computeLaplacianVariance(
  grayscale: Float32Array | number[],
  width: number,
  height: number
): number {
  if (width < 3 || height < 3) {
    return 0;
  }

  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    const rowAbove = (y - 1) * width;
    const rowBelow = (y + 1) * width;

    for (let x = 1; x < width - 1; x++) {
      // 3x3 Laplacian convolution
      const center = grayscale[rowOffset + x];
      const lap =
        grayscale[rowAbove + x] +
        grayscale[rowBelow + x] +
        grayscale[rowOffset + (x - 1)] +
        grayscale[rowOffset + (x + 1)] -
        4 * center;

      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }

  if (count === 0) return 0;

  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  return Math.max(0, Math.round(variance * 10) / 10);
}

/**
 * Pure evaluation function on raw RGBA pixel data.
 * SSR and Node.js test friendly.
 */
export function analyzePixelData(
  rgbaData: Uint8ClampedArray | Uint8Array | number[],
  width: number,
  height: number
): ImageQualityResult {
  const pixelCount = width * height;
  if (pixelCount === 0 || rgbaData.length < pixelCount * 4) {
    return {
      score: 0,
      status: "too_dark",
      luminance: 0,
      blurScore: 0,
      isAcceptable: false,
      recommendation: "Görsel verisi okunamadı.",
    };
  }

  const grayscale = new Float32Array(pixelCount);
  let totalLuma = 0;

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const r = rgbaData[idx];
    const g = rgbaData[idx + 1];
    const b = rgbaData[idx + 2];

    const luma = calculateLuminance(r, g, b);
    grayscale[i] = luma;
    totalLuma += luma;
  }

  const avgLuminance = Math.round((totalLuma / pixelCount) * 10) / 10;
  const blurScore = computeLaplacianVariance(grayscale, width, height);

  // 1. Check Darkness
  if (avgLuminance < LUMINANCE_TOO_DARK_THRESHOLD) {
    const score = Math.max(5, Math.min(40, Math.round((avgLuminance / LUMINANCE_TOO_DARK_THRESHOLD) * 40)));
    return {
      score,
      status: "too_dark",
      luminance: avgLuminance,
      blurScore,
      isAcceptable: false,
      recommendation:
        "Görsel biraz karanlık görünüyor. Yapay zekânın doğru tahmin yapabilmesi ve günlük kotanızın boşa gitmemesi için daha aydınlık bir fotoğraf deneyebilirsiniz.",
    };
  }

  // 2. Check Brightness (Overexposure)
  if (avgLuminance > LUMINANCE_TOO_BRIGHT_THRESHOLD) {
    const overage = avgLuminance - LUMINANCE_TOO_BRIGHT_THRESHOLD;
    const score = Math.max(5, Math.min(40, Math.round((1 - overage / (255 - LUMINANCE_TOO_BRIGHT_THRESHOLD)) * 40)));
    return {
      score,
      status: "too_bright",
      luminance: avgLuminance,
      blurScore,
      isAcceptable: false,
      recommendation:
        "Görsel aşırı parlak veya ışık patlaması içeriyor. Yemeğin detaylarını gösterecek şekilde açıyı ayarlayın.",
    };
  }

  // 3. Check Blur / Sharpness
  if (blurScore < BLUR_VARIANCE_THRESHOLD) {
    const score = Math.max(15, Math.min(48, Math.round((blurScore / BLUR_VARIANCE_THRESHOLD) * 48)));
    return {
      score,
      status: "blurry",
      luminance: avgLuminance,
      blurScore,
      isAcceptable: false,
      recommendation:
        "Görsel biraz bulanık veya titrek görünüyor. Yapay zekânın porsiyon ve malzemeleri net ayırt edebilmesi için kamerayı sabit tutarak yeniden çekebilirsiniz.",
    };
  }

  // 4. Acceptable vs Excellent
  // Ideal luminance: between 70 and 190. Higher blurScore indicates rich sharp edges.
  const isOptimalLight = avgLuminance >= 65 && avgLuminance <= 195;
  const isHighSharpness = blurScore >= 35;

  let score = 75;
  if (isOptimalLight && isHighSharpness) {
    score = Math.min(100, 85 + Math.round(Math.min(15, (blurScore - 35) * 0.3)));
  } else if (isOptimalLight || isHighSharpness) {
    score = 80;
  }

  const status: ImageQualityStatus = score >= 85 ? "excellent" : "acceptable";

  return {
    score,
    status,
    luminance: avgLuminance,
    blurScore,
    isAcceptable: true,
    recommendation:
      status === "excellent"
        ? "Görsel kalitesi mükemmel! Yapay zekâ porsiyonları net tespit edebilir."
        : "Görsel kalitesi yeterli. Daha aydınlık bir ortam doğruluğu artırabilir.",
  };
}

/**
 * Analyzes an image File or Blob on the client side using an OffscreenCanvas or lightweight canvas.
 * Scales down to 160x160 to execute in ~5-15 milliseconds without memory overhead.
 */
export async function analyzeImageQuality(file: File | Blob): Promise<ImageQualityResult> {
  // SSR or test fallback
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      score: 80,
      status: "acceptable",
      luminance: 120,
      blurScore: 40,
      isAcceptable: true,
    };
  }

  return new Promise<ImageQualityResult>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const SAMPLE_SIZE = 160;
        const canvas = document.createElement("canvas");
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve({
            score: 80,
            status: "acceptable",
            luminance: 128,
            blurScore: 30,
            isAcceptable: true,
          });
          return;
        }

        ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const imgData = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

        const result = analyzePixelData(imgData.data, SAMPLE_SIZE, SAMPLE_SIZE);

        // Memory cleanup
        canvas.width = 0;
        canvas.height = 0;
        resolve(result);
      } catch (err) {
        console.warn("[NutriTrack Quality] Quality assessment error:", err);
        resolve({
          score: 80,
          status: "acceptable",
          luminance: 120,
          blurScore: 30,
          isAcceptable: true,
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        score: 0,
        status: "too_dark",
        luminance: 0,
        blurScore: 0,
        isAcceptable: false,
        recommendation: "Görsel yüklenemedi.",
      });
    };

    img.src = objectUrl;
  });
}

/**
 * Samples a video frame from a live HTMLVideoElement to calculate ambient lighting.
 * Used for the real-time camera viewfinder light indicator.
 */
export function analyzeAmbientLight(video: HTMLVideoElement): AmbientLightResult {
  try {
    const SAMPLE_SIZE = 32;
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return { luminance: 128, status: "ideal", label: "Işık İdeal" };
    }

    ctx.drawImage(video, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const imgData = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const data = imgData.data;

    let totalLuma = 0;
    const count = SAMPLE_SIZE * SAMPLE_SIZE;

    for (let i = 0; i < count; i++) {
      const idx = i * 4;
      totalLuma += calculateLuminance(data[idx], data[idx + 1], data[idx + 2]);
    }

    canvas.width = 0;
    canvas.height = 0;

    const avgLuma = Math.round(totalLuma / count);

    if (avgLuma < LUMINANCE_TOO_DARK_THRESHOLD) {
      return { luminance: avgLuma, status: "low_light", label: "Işık Yetersiz" };
    }
    if (avgLuma > LUMINANCE_TOO_BRIGHT_THRESHOLD) {
      return { luminance: avgLuma, status: "overexposed", label: "Aşırı Parlak" };
    }
    return { luminance: avgLuma, status: "ideal", label: "Işık İdeal" };
  } catch {
    return { luminance: 128, status: "ideal", label: "Işık İdeal" };
  }
}
