import { describe, it, expect } from "vitest";
import {
  anonymizeIp,
  AI_DAILY_LIMIT,
  GLOBAL_AI_DAILY_LIMIT,
} from "@/lib/rate-limit/limiter";

describe("IP Anonymization & Quota Hash Security", () => {
  describe("Deterministic Hash Behavior", () => {
    it("should produce the exact same hash for the same IP consistently", () => {
      const ip = "192.168.1.105";
      const hash1 = anonymizeIp(ip);
      const hash2 = anonymizeIp(ip);
      const hash3 = anonymizeIp(ip);

      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
      expect(typeof hash1).toBe("string");
      expect(hash1.length).toBe(32);
    });

    it("should ignore leading and trailing whitespace", () => {
      const cleanIp = "85.105.42.19";
      const dirtyIp = "   85.105.42.19  ";

      expect(anonymizeIp(dirtyIp)).toBe(anonymizeIp(cleanIp));
    });
  });

  describe("Distinct Outputs for Distinct Inputs (Collision Resistance)", () => {
    it("should produce distinctly different hashes for different IPv4 addresses", () => {
      const ipA = "192.168.1.1";
      const ipB = "192.168.1.2";
      const ipC = "10.0.0.1";

      const hashA = anonymizeIp(ipA);
      const hashB = anonymizeIp(ipB);
      const hashC = anonymizeIp(ipC);

      expect(hashA).not.toBe(hashB);
      expect(hashB).not.toBe(hashC);
      expect(hashA).not.toBe(hashC);
    });

    it("should correctly handle and differentiate IPv6 addresses", () => {
      const ipv6A = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
      const ipv6B = "2001:0db8:85a3:0000:0000:8a2e:0370:7335";

      const hashA = anonymizeIp(ipv6A);
      const hashB = anonymizeIp(ipv6B);

      expect(hashA).toHaveLength(32);
      expect(hashB).toHaveLength(32);
      expect(hashA).not.toBe(hashB);
    });
  });

  describe("Irreversibility and Security Compliance (KVKK / GDPR)", () => {
    it("should generate a 32-character hexadecimal digest matching SHA-256 slice", () => {
      const ip = "176.240.12.8";
      const hash = anonymizeIp(ip);

      // Must be valid hex string [0-9a-f]{32}
      expect(hash).toMatch(/^[0-9a-f]{32}$/);
    });

    it("should never leak the raw IP address or salt delimiter in the digest", () => {
      const rawIp = "212.58.244.20";
      const hash = anonymizeIp(rawIp);

      expect(hash).not.toContain(rawIp);
      expect(hash).not.toContain(":");
      expect(hash).not.toContain("nutritrack");
    });

    it("should fallback safely to standard localhost representation when given empty or null-like string", () => {
      const emptyHash = anonymizeIp("");
      const localHash = anonymizeIp("127.0.0.1");

      expect(emptyHash).toBe(localHash);
      expect(emptyHash).toHaveLength(32);
    });
  });

  describe("Configured Quota Guard Constants", () => {
    it("should export positive and rational daily rate limits", () => {
      expect(AI_DAILY_LIMIT).toBeGreaterThan(0);
      expect(GLOBAL_AI_DAILY_LIMIT).toBeGreaterThanOrEqual(AI_DAILY_LIMIT);
    });
  });
});
