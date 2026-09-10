import { describe, it, expect } from "vitest";
import {
  createAdminSession,
  verifyAdminSession,
  validateCredentials,
  getAdminCookieOptions,
  ADMIN_SESSION_COOKIE_NAME,
} from "@/lib/auth/session";

describe("Admin HMAC Session & Authentication Security", () => {
  describe("Credential Validation (Timing-Safe)", () => {
    it("should accept default showcase admin credentials", () => {
      // Default credentials configured in session.ts: admin / admin123
      const username = process.env.ADMIN_USERNAME || "admin";
      const password = process.env.ADMIN_PASSWORD || "admin123";

      expect(validateCredentials(username, password)).toBe(true);
    });

    it("should reject incorrect password", () => {
      const username = process.env.ADMIN_USERNAME || "admin";
      expect(validateCredentials(username, "wrong_password_999")).toBe(false);
    });

    it("should reject incorrect username", () => {
      const password = process.env.ADMIN_PASSWORD || "admin123";
      expect(validateCredentials("imposter_user", password)).toBe(false);
    });

    it("should reject empty or missing credentials safely", () => {
      expect(validateCredentials("", "")).toBe(false);
      expect(validateCredentials("admin", "")).toBe(false);
      expect(validateCredentials("", "admin123")).toBe(false);
    });
  });

  describe("HMAC Session Token Creation & Verification", () => {
    it("should generate a valid token that passes verification", () => {
      const token = createAdminSession();
      expect(typeof token).toBe("string");
      expect(token).toContain(".");

      const [timestampStr, signature] = token.split(".");
      expect(Number(timestampStr)).toBeGreaterThan(0);
      expect(signature).toHaveLength(64); // SHA-256 hex digest length

      const isValid = verifyAdminSession(token);
      expect(isValid).toBe(true);
    });
  });

  describe("Anti-Tamper Signature Protection", () => {
    it("should reject token if HMAC signature is tampered by even a single character", () => {
      const validToken = createAdminSession();
      const [timestampStr, signature] = validToken.split(".");

      // Flip the last character of the signature
      const lastChar = signature.slice(-1);
      const flippedChar = lastChar === "a" ? "b" : "a";
      const tamperedSignature = signature.slice(0, -1) + flippedChar;
      const tamperedToken = `${timestampStr}.${tamperedSignature}`;

      expect(verifyAdminSession(tamperedToken)).toBe(false);
    });

    it("should reject token if timestamp is altered with the original signature", () => {
      const validToken = createAdminSession();
      const [, signature] = validToken.split(".");

      // Shift timestamp by 10 seconds
      const alteredTimestamp = (Date.now() - 10000).toString();
      const forgedToken = `${alteredTimestamp}.${signature}`;

      expect(verifyAdminSession(forgedToken)).toBe(false);
    });
  });

  describe("Session Expiration and Future Timestamp Guards", () => {
    it("should reject tokens older than 7 days (SESSION_TTL_MS)", () => {
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
      // Synthesize a token with old timestamp
      const expiredToken = `${eightDaysAgo}.dummy_signature`;
      expect(verifyAdminSession(expiredToken)).toBe(false);
    });

    it("should reject tokens with future timestamps (> now + 60s)", () => {
      const futureTime = Date.now() + 5 * 60 * 1000; // 5 minutes in future
      const futureToken = `${futureTime}.dummy_signature`;
      expect(verifyAdminSession(futureToken)).toBe(false);
    });
  });

  describe("Malformed Token Guards", () => {
    it("should safely reject undefined, null, and non-string inputs", () => {
      expect(verifyAdminSession(undefined)).toBe(false);
      expect(verifyAdminSession(null)).toBe(false);
      expect(verifyAdminSession("" as unknown as string)).toBe(false);
    });

    it("should reject malformed token strings without dots or with multiple dots", () => {
      expect(verifyAdminSession("just_a_random_string")).toBe(false);
      expect(verifyAdminSession("part1.part2.part3")).toBe(false);
    });

    it("should reject tokens with non-numeric timestamps", () => {
      expect(verifyAdminSession("invalid_timestamp.abcdef")).toBe(false);
      expect(verifyAdminSession("-100.abcdef")).toBe(false);
    });
  });

  describe("Admin Cookie Security Attributes", () => {
    it("should return hardened HttpOnly SameSite=Strict cookie options", () => {
      const options = getAdminCookieOptions();
      expect(options.name).toBe(ADMIN_SESSION_COOKIE_NAME);
      expect(options.httpOnly).toBe(true);
      expect(options.sameSite).toBe("strict");
      expect(options.path).toBe("/");
      expect(options.maxAge).toBe(60 * 60 * 24 * 7);
    });
  });
});
