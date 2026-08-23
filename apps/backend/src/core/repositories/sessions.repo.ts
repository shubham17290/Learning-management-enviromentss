// PHASE 8 — Auth session + password reset data access (Phase 3 §6.3–6.4)
import { prisma } from "./prisma";

export async function createAuthSession(input: {
  userId: string;
  tokenHash: string;
  ip: string | null;
  expiresAt: Date;
}) {
  return prisma.session.create({ data: input });
}

export async function findActiveSessionByTokenHash(tokenHash: string) {
  return prisma.session.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, revokedAt: true },
  });
}

export async function revokeSession(id: string): Promise<void> {
  await prisma.session.updateMany({
    where: { id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function createPasswordResetToken(input: { userId: string; tokenHash: string; expiresAt: Date }) {
  return prisma.passwordResetToken.create({ data: input });
}
