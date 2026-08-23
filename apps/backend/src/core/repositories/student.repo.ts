// PHASE 8 — Student features (bookmarks, mistakes) data access (Phase 3 §6.18–6.19)
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// ─── Bookmarks ───────────────────────────────────────────────────────────────

export async function listBookmarks(userId: string, page: number, pageSize: number) {
  const where: Prisma.BookmarkWhereInput = { userId };
  const [items, total] = await prisma.$transaction([
    prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        question: {
          select: {
            id: true,
            body: true,
            difficulty: true,
            gateYear: true,
            subject: { select: { id: true, code: true, name: true } },
            topic: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.bookmark.count({ where }),
  ]);
  return { items, total };
}

export async function findBookmarkById(id: string) {
  return prisma.bookmark.findUnique({ where: { id }, select: { id: true, userId: true, questionId: true } });
}

export async function bookmarkExists(userId: string, questionId: string): Promise<boolean> {
  const found = await prisma.bookmark.findFirst({ where: { userId, questionId }, select: { id: true } });
  return found !== null;
}

export async function createBookmark(userId: string, questionId: string) {
  return prisma.bookmark.create({ data: { userId, questionId } });
}

/** Owner-scoped delete (Phase 4 §5.3). Returns number of rows removed. */
export async function deleteBookmarkOwned(id: string, userId: string): Promise<number> {
  const result = await prisma.bookmark.deleteMany({ where: { id, userId } });
  return result.count;
}

// ─── Mistakes (derived; Phase 4 §3.2.10) ─────────────────────────────────────

export interface IncorrectAttemptRow {
  questionId: string;
  answeredAt: Date;
  topicId: string | null;
  subjectId: string;
}

export async function incorrectAttemptsForUser(
  userId: string,
  filters: { topicId?: string; subjectId?: string },
): Promise<IncorrectAttemptRow[]> {
  const where: Prisma.AttemptWhereInput = { userId, isCorrect: false };
  if (filters.topicId || filters.subjectId) {
    where.questionVersion = {
      question: {
        ...(filters.topicId ? { topicId: filters.topicId } : {}),
        ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
      },
    };
  }
  const rows = await prisma.attempt.findMany({
    where,
    orderBy: { answeredAt: "desc" },
    take: 1000,
    select: {
      answeredAt: true,
      questionVersion: {
        select: { question: { select: { id: true, topicId: true, subjectId: true } } },
      },
    },
  });
  // Distinct by question, newest occurrence first.
  const seen = new Set<string>();
  const out: IncorrectAttemptRow[] = [];
  for (const row of rows) {
    const questionId = row.questionVersion.question.id;
    if (seen.has(questionId)) continue;
    seen.add(questionId);
    out.push({
      questionId,
      answeredAt: row.answeredAt,
      topicId: row.questionVersion.question.topicId,
      subjectId: row.questionVersion.question.subjectId,
    });
  }
  return out;
}
