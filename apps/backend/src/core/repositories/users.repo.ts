// PHASE 8 — User/session data access (Phase 3 §6.1–6.4)
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  fullName: string;
  roleId: string;
  targetSubjectId?: string;
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { role: { select: { code: true } } },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { role: { select: { code: true } } },
  });
}

export async function createUser(input: CreateUserInput) {
  const data: Prisma.UserCreateInput = {
    email: input.email,
    passwordHash: input.passwordHash,
    fullName: input.fullName,
    role: { connect: { id: input.roleId } },
    ...(input.targetSubjectId ? { targetSubject: { connect: { id: input.targetSubjectId } } } : {}),
  };
  return prisma.user.create({ data, include: { role: { select: { code: true } } } });
}

/** Lookup tables are extensible sets (Phase 3 §13.2): get-or-create by code keeps the app
 *  functional without product seed data. */
export async function ensureRole(code: string, name?: string): Promise<{ id: string; code: string }> {
  const existing = await prisma.role.findUnique({ where: { code } });
  if (existing) return existing;
  return prisma.role.create({ data: { code, name: name ?? code.charAt(0).toUpperCase() + code.slice(1) } });
}

export interface AdminUserPatch {
  status?: "active" | "disabled";
  roleCode?: string;
}

export async function updateUserAsAdmin(id: string, patch: AdminUserPatch) {
  const data: Prisma.UserUpdateInput = {};
  if (patch.status !== undefined) data.status = patch.status;
  if (patch.roleCode !== undefined) data.role = { connect: { id: (await ensureRole(patch.roleCode)).id } };
  return prisma.user.update({ where: { id }, data, include: { role: { select: { code: true } } } });
}

export async function listUsers(page: number, pageSize: number) {
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        createdAt: true,
        deletedAt: true,
        role: { select: { code: true, name: true } },
      },
    }),
    prisma.user.count(),
  ]);
  return { items, total };
}

export async function revokeAllSessions(userId: string): Promise<number> {
  const result = await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count;
}
