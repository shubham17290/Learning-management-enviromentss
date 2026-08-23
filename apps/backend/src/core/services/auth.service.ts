// PHASE 8 — Auth domain service (Phase 4 §3.2.1–3.2.5, §5, §6)
import { Prisma } from "@prisma/client";
import { config } from "../config/env";
import { errors } from "../errors";
import { hashPassword, newSessionToken, sha256Hex, verifyPassword } from "../utils/crypto";
import * as usersRepo from "../repositories/users.repo";
import * as sessionsRepo from "../repositories/sessions.repo";

// ─── Brute-force protection (Phase 4 §6 login row) ───────────────────────────
const failCounts = new Map<string, { count: number; windowStart: number }>();

function recordFailure(key: string): void {
  const now = Date.now();
  const entry = failCounts.get(key);
  if (!entry || now - entry.windowStart > config.lockout.windowMs) {
    failCounts.set(key, { count: 1, windowStart: now });
    return;
  }
  entry.count += 1;
}

function isLockedOut(key: string): boolean {
  const entry = failCounts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.windowStart > config.lockout.windowMs) {
    failCounts.delete(key);
    return false;
  }
  return entry.count >= config.lockout.maxFails;
}

function clearFailures(key: string): void {
  failCounts.delete(key);
}

export function assertNotLockedOut(emailKey: string): void {
  if (isLockedOut(emailKey)) throw errors.rateLimited(config.lockout.windowMs / 1000);
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  targetSubjectId?: string;
}

export async function register(input: RegisterInput): Promise<{
  id: string;
  email: string;
  fullName: string;
  role: string;
}> {
  if (
    input.password.length < 8 ||
    input.password.length > 72 ||
    !/[a-zA-Z]/.test(input.password) ||
    !/\d/.test(input.password)
  ) {
    throw errors.validation(
      [{ field: "password", code: "VALIDATION_WEAK_PASSWORD", message: "Password must be 8-72 chars with at least 1 letter and 1 digit." }],
    );
  }

  const role = await usersRepo.ensureRole("student", "Student");

  try {
    const user = await usersRepo.createUser({
      email: input.email,
      passwordHash: hashPassword(input.password),
      fullName: input.fullName,
      roleId: role.id,
      targetSubjectId: input.targetSubjectId,
    });
    return { id: user.id, email: user.email, fullName: user.fullName, role: user.role.code };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw errors.conflict("EMAIL_ALREADY_REGISTERED", "An account with this email already exists.");
    }
    throw error;
  }
}

export async function login(input: {
  email: string;
  password: string;
  ip: string | null;
}): Promise<{ accessToken: string; expiresAt: Date; user: { id: string; email: string; roleCode: string } }> {
  const key = input.email.toLowerCase();
  assertNotLockedOut(key);

  const user = await usersRepo.findUserByEmail(input.email);
  const passwordOk = user ? verifyPassword(input.password, user.passwordHash) : false;

  if (!user || !passwordOk) {
    recordFailure(key);
    throw errors.invalidCredentials();
  }
  clearFailures(key);

  if (user.status !== "active" || user.deletedAt !== null) {
    throw errors.accountDisabled();
  }

  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + config.session.ttlMs);
  await sessionsRepo.createAuthSession({
    userId: user.id,
    tokenHash: token.hash,
    ip: input.ip,
    expiresAt,
  });

  return { accessToken: token.raw, expiresAt, user: { id: user.id, email: user.email, roleCode: user.role.code } };
}

export async function logout(sessionId: string | undefined): Promise<void> {
  if (sessionId) await sessionsRepo.revokeSession(sessionId);
}

/** FR-AUTH-05 (Should). Response is always generic to prevent account enumeration. */
export async function requestPasswordReset(rawTokenSink: (token: string) => void, email: string): Promise<void> {
  const user = await usersRepo.findUserByEmail(email);
  if (user && user.status === "active" && user.deletedAt === null) {
    const raw = `${email}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const token = sha256Hex(raw).slice(0, 43);
    await sessionsRepo.createPasswordResetToken({
      userId: user.id,
      tokenHash: sha256Hex(token),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    rawTokenSink(token); // delivery hook (email transport out of MVP scope)
  }
}
