import { createHmac, timingSafeEqual } from "crypto";

/**
 * Admin Authentication and HMAC-SHA256 Session Management.
 * Designed to provide secure portfolio reviewer & admin bypass
 * with timing-attack resistant authentication.
 */

export const ADMIN_SESSION_COOKIE_NAME = "nutritrack_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "admin123",
    secret: process.env.ADMIN_SESSION_SECRET || "nutritrack_admin_showcase_secret_key_2026",
  };
}

/**
 * Compares two strings in constant time (timing-attack resistant).
 */
function safeStringCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    // Prevent short-circuit timing leak by comparing bufA with itself
    timingSafeEqual(bufA, bufA);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

/**
 * Validates admin login credentials using timing-safe comparison.
 */
export function validateCredentials(username: string, password: string): boolean {
  const { username: expectedUser, password: expectedPassword } = getAdminCredentials();

  if (!username || !password) {
    return false;
  }

  const isUserValid = safeStringCompare(username.trim(), expectedUser);
  const isPassValid = safeStringCompare(password.trim(), expectedPassword);

  return isUserValid && isPassValid;
}

/**
 * Generates an HMAC-SHA256 signature for a given payload.
 */
function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Creates a signed admin session token with timestamp: `${timestamp}.${signature}`.
 */
export function createAdminSession(): string {
  const { secret } = getAdminCredentials();
  const timestamp = Date.now().toString();
  const payload = `nutritrack_admin_session:${timestamp}`;
  const signature = signPayload(payload, secret);

  return `${timestamp}.${signature}`;
}

/**
 * Verifies the validity, signature, and expiration of an admin session token.
 */
export function verifyAdminSession(token: string | undefined | null): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [timestampStr, receivedSignature] = parts;
  const timestamp = Number(timestampStr);

  if (isNaN(timestamp) || timestamp <= 0) {
    return false;
  }

  // Check expiration (7 days)
  const now = Date.now();
  if (now - timestamp > SESSION_TTL_MS || timestamp > now + 60000) {
    return false; // Expired or future timestamp
  }

  const { secret } = getAdminCredentials();
  const expectedPayload = `nutritrack_admin_session:${timestampStr}`;
  const expectedSignature = signPayload(expectedPayload, secret);

  return safeStringCompare(receivedSignature, expectedSignature);
}

/**
 * Standard cookie configuration options for admin session.
 */
export function getAdminCookieOptions() {
  return {
    name: ADMIN_SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  };
}
