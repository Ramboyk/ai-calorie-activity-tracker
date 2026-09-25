import { describe, it, expect } from "vitest";
import {
  calculateLuminance,
  computeLaplacianVariance,
  analyzePixelData,
  LUMINANCE_TOO_DARK_THRESHOLD,
  LUMINANCE_TOO_BRIGHT_THRESHOLD,
  BLUR_VARIANCE_THRESHOLD,
} from "@/lib/utils/image-quality";

describe("Pre-Upload Image Quality Guard & Blur/Darkness Detection (Roadmap Step 3)", () => {
  describe("Mathematical Luminance Calculations", () => {
    it("should correctly compute luminance for pure black, pure white, and primary colors", () => {
      expect(calculateLuminance(0, 0, 0)).toBe(0);
      expect(calculateLuminance(255, 255, 255)).toBeCloseTo(255, 1);

      // Standard CCIR 601 perceptual weights: 0.299 R, 0.587 G, 0.114 B
      expect(calculateLuminance(255, 0, 0)).toBeCloseTo(76.245, 1);
      expect(calculateLuminance(0, 255, 0)).toBeCloseTo(149.685, 1);
      expect(calculateLuminance(0, 0, 255)).toBeCloseTo(29.07, 1);
    });

    it("should export strict Roadmap thresholds", () => {
      expect(LUMINANCE_TOO_DARK_THRESHOLD).toBe(38);
      expect(LUMINANCE_TOO_BRIGHT_THRESHOLD).toBe(235);
      expect(BLUR_VARIANCE_THRESHOLD).toBe(15);
    });
  });

  describe("Laplacian Variance & Blur Calculation", () => {
    it("should return zero variance for a flat, featureless image", () => {
      const width = 10;
      const height = 10;
      const flatGrayscale = new Float32Array(width * height).fill(128);

      const variance = computeLaplacianVariance(flatGrayscale, width, height);
      expect(variance).toBe(0);
    });

    it("should return zero variance for dimensions smaller than 3x3 kernel size", () => {
      expect(computeLaplacianVariance([10, 20, 30, 40], 2, 2)).toBe(0);
    });

    it("should compute significant variance for high-contrast sharp edges and patterns", () => {
      const width = 10;
      const height = 10;
      const sharpGrayscale = new Float32Array(width * height);

      // Create high-contrast alternating checkerboard
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          sharpGrayscale[y * width + x] = (x + y) % 2 === 0 ? 240 : 20;
        }
      }

      const variance = computeLaplacianVariance(sharpGrayscale, width, height);
      expect(variance).toBeGreaterThan(BLUR_VARIANCE_THRESHOLD);
    });
  });

  describe("Pixel Data Quality Assessment (analyzePixelData)", () => {
    it("should detect excessively dark images (luma < 38) and flag as too_dark", () => {
      const width = 8;
      const height = 8;
      const pixelCount = width * height;
      const rgba = new Uint8ClampedArray(pixelCount * 4);

      // Fill with very dark pixels (e.g. RGB = 15, 15, 15)
      for (let i = 0; i < pixelCount * 4; i += 4) {
        rgba[i] = 15;     // R
        rgba[i + 1] = 15; // G
        rgba[i + 2] = 15; // B
        rgba[i + 3] = 255;
      }

      const result = analyzePixelData(rgba, width, height);
      expect(result.status).toBe("too_dark");
      expect(result.isAcceptable).toBe(false);
      expect(result.luminance).toBeLessThan(38);
      expect(result.score).toBeLessThanOrEqual(40);
      expect(result.recommendation).toContain("karanlık");
    });

    it("should detect overexposed / excessively bright images (luma > 235) and flag as too_bright", () => {
      const width = 8;
      const height = 8;
      const pixelCount = width * height;
      const rgba = new Uint8ClampedArray(pixelCount * 4);

      // Fill with blown-out bright pixels (e.g. RGB = 248, 248, 248)
      for (let i = 0; i < pixelCount * 4; i += 4) {
        rgba[i] = 248;
        rgba[i + 1] = 248;
        rgba[i + 2] = 248;
        rgba[i + 3] = 255;
      }

      const result = analyzePixelData(rgba, width, height);
      expect(result.status).toBe("too_bright");
      expect(result.isAcceptable).toBe(false);
      expect(result.luminance).toBeGreaterThan(235);
      expect(result.score).toBeLessThanOrEqual(40);
      expect(result.recommendation).toContain("aşırı parlak");
    });

    it("should detect blurry / smooth images where luminance is fine but sharpness is deficient", () => {
      const width = 16;
      const height = 16;
      const pixelCount = width * height;
      const rgba = new Uint8ClampedArray(pixelCount * 4);

      // Uniform mid-gray (luma = 130, well within acceptable light, but completely blurry/flat)
      for (let i = 0; i < pixelCount * 4; i += 4) {
        rgba[i] = 130;
        rgba[i + 1] = 130;
        rgba[i + 2] = 130;
        rgba[i + 3] = 255;
      }

      const result = analyzePixelData(rgba, width, height);
      expect(result.status).toBe("blurry");
      expect(result.isAcceptable).toBe(false);
      expect(result.blurScore).toBeLessThan(BLUR_VARIANCE_THRESHOLD);
      expect(result.recommendation).toContain("bulanık veya titrek");
    });

    it("should identify clear, well-lit, high-contrast meal images as acceptable or excellent", () => {
      const width = 20;
      const height = 20;
      const pixelCount = width * height;
      const rgba = new Uint8ClampedArray(pixelCount * 4);

      // Pattern simulating food textures and plate contrast (mean luma ~ 125, sharp edges)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const isPlateEdge = (x % 4 === 0) || (y % 4 === 0);
          const val = isPlateEdge ? 210 : 80;
          rgba[idx] = val;
          rgba[idx + 1] = val - 10;
          rgba[idx + 2] = val + 5;
          rgba[idx + 3] = 255;
        }
      }

      const result = analyzePixelData(rgba, width, height);
      expect(result.isAcceptable).toBe(true);
      expect(["excellent", "acceptable"]).toContain(result.status);
      expect(result.score).toBeGreaterThanOrEqual(75);
      expect(result.luminance).toBeGreaterThanOrEqual(38);
      expect(result.luminance).toBeLessThanOrEqual(235);
      expect(result.blurScore).toBeGreaterThanOrEqual(BLUR_VARIANCE_THRESHOLD);
    });

    it("should handle empty or corrupt data gracefully without throwing", () => {
      const emptyResult = analyzePixelData(new Uint8ClampedArray(0), 0, 0);
      expect(emptyResult.isAcceptable).toBe(false);
      expect(emptyResult.score).toBe(0);
    });
  });
});
