// PHASE 8 — Analytics derivation data access (Phase 3 §11; Phase 4 §3.2.11–12)
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export interface AttemptFactRow {
  isCorrect: boolean;
  timeTakenSeconds: number;
  answeredAt: Date;
  subjectId: string;
  topicId: string | null;
}

/** Per-user attempt facts for on-the-fly analytics (no pre-aggregation, Phase 4 §11). */
export async function attemptFactsForUser(userId: string): Promise<AttemptFactRow[]> {
  const rows = await prisma.attempt.findMany({
    where: { userId },
    orderBy: { answeredAt: "asc" },
    take: 20000,
    select: {
      isCorrect: true,
      timeTakenSeconds: true,
      answeredAt: true,
      questionVersion: {
        select: { question: { select: { subjectId: true, topicId: true } } },
      },
    },
  });
  return rows.map((row) => ({
    isCorrect: row.isCorrect,
    timeTakenSeconds: row.timeTakenSeconds,
    answeredAt: row.answeredAt,
    subjectId: row.questionVersion.question.subjectId,
    topicId: row.questionVersion.question.topicId,
  }));
}

export interface LastSessionRow {
  id: string;
  status: string;
  startedAt: Date;
  endedAt: Date | null;
  modeCode: string;
}

export async function lastSessionForUser(userId: string): Promise<LastSessionRow | null> {
  const session = await prisma.practiceSession.findFirst({
    where: { userId },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      status: true,
      startedAt: true,
      endedAt: true,
      mode: { select: { code: true } },
    },
  });
  return session
    ? { id: session.id, status: session.status, startedAt: session.startedAt, endedAt: session.endedAt, modeCode: session.mode.code }
    : null;
}

// ─── Audit log (Phase 3 §6.21) ───────────────────────────────────────────────

export async function writeAuditEntry(input: {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  const data: Prisma.AuditLogUncheckedCreateInput = {
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
  };
  if (input.before !== undefined && input.before !== null) {
    data.before = input.before as Prisma.InputJsonValue;
  }
  if (input.after !== undefined && input.after !== null) {
    data.after = input.after as Prisma.InputJsonValue;
  }
  await prisma.auditLog.create({ data });
}

export async function listAuditEntries(
  filters: { entityType?: string; entityId?: string; actorId?: string },
  page: number,
  pageSize: number,
) {
  const where = {
    ...(filters.entityType ? { entityType: filters.entityType } : {}),
    ...(filters.entityId ? { entityId: filters.entityId } : {}),
    ...(filters.actorId ? { actorId: filters.actorId } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: [{ id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { actor: { select: { id: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total };
}
