// PHASE 8 — Crypto helpers: PBKDF2 password hashing + session tokens (Phase 3 §14.1, Phase 4 §5)
import { createHash, randomBytes, pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { config } from "../config/env";

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = pbkdf2Sync(password, salt, config.password.iterations, config.password.keyLength, config.password.digest);
  return `pbkdf2$${config.password.iterations}$${salt}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  const salt = parts[2];
  const expected = Buffer.from(parts[3], "hex");
  if (!Number.isFinite(iterations) || iterations < 1 || salt.length === 0 || expected.length === 0) return false;
  const derived = pbkdf2Sync(password, salt, iterations, expected.length, config.password.digest);
  return timingSafeEqual(derived, expected);
}

/** Opaque bearer value for the client; only its SHA-256 is persisted (Phase 3 sessions.token_hash). */
export function newSessionToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: sha256Hex(raw) };
}
