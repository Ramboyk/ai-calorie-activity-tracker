/**
 * Inspects buffer headers (magic bytes) to verify genuine image payloads.
 * - JPEG: FF D8 FF
 * - PNG: 89 50 4E 47
 * - WEBP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
 */
export interface ImageValidationResult {
  valid: boolean;
  detectedMime?: "image/jpeg" | "image/png" | "image/webp";
}

export function validateImageMagicBytes(buffer: Buffer): ImageValidationResult {
  if (!buffer || buffer.length < 12) {
    return { valid: false };
  }

  // Check JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedMime: "image/jpeg" };
  }

  // Check PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { valid: true, detectedMime: "image/png" };
  }

  // Check WEBP: RIFF (bytes 0..3) and WEBP (bytes 8..11)
  const isRiff =
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
  const isWebp =
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
  if (isRiff && isWebp) {
    return { valid: true, detectedMime: "image/webp" };
  }

  return { valid: false };
}
