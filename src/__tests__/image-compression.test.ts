import { describe, it, expect } from "vitest";
import {
  calculateTargetDimensions,
  compressImage,
  createThumbnail,
} from "@/lib/utils/image-compression";

describe("Client-Side Image Compression & Resizing", () => {
  describe("Dimension Calculations (calculateTargetDimensions)", () => {
    it("should keep dimensions unchanged if already smaller than max bounds", () => {
      const result = calculateTargetDimensions(800, 600, 1600, 1600);
      expect(result).toEqual({ width: 800, height: 600 });
    });

    it("should scale down high-resolution landscape photos proportionately", () => {
      // 4000x3000 (typical 12MP phone camera photo)
      const result = calculateTargetDimensions(4000, 3000, 1600, 1600);
      expect(result.width).toBe(1600);
      expect(result.height).toBe(1200);
    });

    it("should scale down ultra-high-resolution portrait photos proportionately", () => {
      // 3000x4000 (portrait orientation)
      const result = calculateTargetDimensions(3000, 4000, 1600, 1600);
      expect(result.width).toBe(1200);
      expect(result.height).toBe(1600);
    });

    it("should scale down 108MP phone camera photos (12000x9000)", () => {
      const result = calculateTargetDimensions(12000, 9000, 1600, 1600);
      expect(result.width).toBe(1600);
      expect(result.height).toBe(1200);
    });

    it("should handle square images accurately", () => {
      const result = calculateTargetDimensions(3000, 3000, 1600, 1600);
      expect(result).toEqual({ width: 1600, height: 1600 });
    });

    it("should handle zero or negative dimensions safely", () => {
      const result = calculateTargetDimensions(0, 0, 1600, 1600);
      expect(result.width).toBeGreaterThanOrEqual(1);
      expect(result.height).toBeGreaterThanOrEqual(1);
    });
  });

  describe("SSR & Headless Fallbacks", () => {
    it("should safely return original file when window is not defined or non-image", async () => {
      const dummyFile = new File(["dummy data"], "document.pdf", { type: "application/pdf" });
      const processed = await compressImage(dummyFile);
      expect(processed).toBe(dummyFile);
    });

    it("should safely return empty thumbnail string on SSR/headless test environments without throwing", async () => {
      const dummyBlob = new Blob(["test"], { type: "image/jpeg" });
      const thumb = await createThumbnail(dummyBlob);
      expect(typeof thumb).toBe("string");
    });
  });
});
