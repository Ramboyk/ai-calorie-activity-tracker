import { describe, it, expect } from "vitest";
import { validateImageMagicBytes } from "@/lib/validation/image";

describe("Binary File Signature (Magic Bytes) Security Validation", () => {
  describe("Valid Genuine Image Payloads", () => {
    it("should accept valid JPEG header (FF D8 FF)", () => {
      // 12 bytes with standard JPEG SOI (Start of Image) marker
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      ]);

      const result = validateImageMagicBytes(jpegBuffer);
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe("image/jpeg");
    });

    it("should accept valid PNG header (89 50 4E 47)", () => {
      // Standard 8-byte PNG header + chunk length
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      ]);

      const result = validateImageMagicBytes(pngBuffer);
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe("image/png");
    });

    it("should accept valid WEBP header (RIFF....WEBP)", () => {
      // WEBP header: "RIFF" (0x52, 0x49, 0x46, 0x46) + 4 bytes file size + "WEBP" (0x57, 0x45, 0x42, 0x50)
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x24, 0x00, 0x00, 0x00, // Size
        0x57, 0x45, 0x42, 0x50, // WEBP
        0x56, 0x50, 0x38, 0x20, // VP8 chunk
      ]);

      const result = validateImageMagicBytes(webpBuffer);
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe("image/webp");
    });
  });

  describe("Malicious and Disguised File Rejection", () => {
    it("should reject disguised PDF files (%PDF magic bytes: 25 50 44 46)", () => {
      const pdfBuffer = Buffer.from([
        0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xd0, 0xd4,
      ]);

      const result = validateImageMagicBytes(pdfBuffer);
      expect(result.valid).toBe(false);
      expect(result.detectedMime).toBeUndefined();
    });

    it("should reject Windows executable/DLL binaries (MZ magic bytes: 4D 5A)", () => {
      const exeBuffer = Buffer.from([
        0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00,
      ]);

      const result = validateImageMagicBytes(exeBuffer);
      expect(result.valid).toBe(false);
      expect(result.detectedMime).toBeUndefined();
    });

    it("should reject bash scripts or shell code (#!/bin/sh: 23 21 2F 62)", () => {
      const scriptBuffer = Buffer.from("#!/bin/bash\necho 'malicious'", "utf-8");

      const result = validateImageMagicBytes(scriptBuffer);
      expect(result.valid).toBe(false);
      expect(result.detectedMime).toBeUndefined();
    });

    it("should reject HTML or SVG markup disguised as images", () => {
      const htmlBuffer = Buffer.from("<!DOCTYPE html><html><body>", "utf-8");

      const result = validateImageMagicBytes(htmlBuffer);
      expect(result.valid).toBe(false);
      expect(result.detectedMime).toBeUndefined();
    });

    it("should reject RIFF container files that are NOT WEBP (e.g. WAV audio: RIFF....WAVE)", () => {
      const wavBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x24, 0x00, 0x00, 0x00, // Size
        0x57, 0x41, 0x56, 0x45, // WAVE (not WEBP!)
        0x66, 0x6d, 0x74, 0x20,
      ]);

      const result = validateImageMagicBytes(wavBuffer);
      expect(result.valid).toBe(false);
    });
  });

  describe("Boundary and Truncated Buffer Guards", () => {
    it("should reject truncated buffers with fewer than 12 bytes safely", () => {
      const tinyBuffer = Buffer.from([0xff, 0xd8, 0xff]); // Only 3 bytes of JPEG
      const result = validateImageMagicBytes(tinyBuffer);
      expect(result.valid).toBe(false);
    });

    it("should reject zero-length buffers without throwing", () => {
      const emptyBuffer = Buffer.alloc(0);
      const result = validateImageMagicBytes(emptyBuffer);
      expect(result.valid).toBe(false);
    });

    it("should reject arbitrary random byte noise", () => {
      const noiseBuffer = Buffer.from([
        0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
      ]);
      const result = validateImageMagicBytes(noiseBuffer);
      expect(result.valid).toBe(false);
    });
  });
});
