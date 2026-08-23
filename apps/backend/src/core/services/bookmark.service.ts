// PHASE 8 — Bookmark service (Phase 4 §3.2.9; FR-BMARK-01/02)
import { errors } from "../errors";
import * as studentRepo from "../repositories/student.repo";

export async function addBookmark(userId: string, questionId: string) {
  const { prisma } = await import("../repositories/prisma");
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true, status: true },
  });
  if (!question) throw errors.notFound("QUESTION_NOT_FOUND", "Question not found.");
  if (question.status !== "published") {
    throw errors.validation([
      { field: "question_id", code: "VALIDATION_NOT_PUBLISHED", message: "Only published questions can be bookmarked." },
    ]);
  }
  if (await studentRepo.bookmarkExists(userId, questionId)) {
    throw errors.conflict("ALREADY_BOOKMARKED", "This question is already bookmarked.");
  }
  const bookmark = await studentRepo.createBookmark(userId, questionId);
  return { id: bookmark.id, question_id: bookmark.questionId };
}

export async function removeBookmark(bookmarkId: string, userId: string): Promise<boolean> {
  return (await studentRepo.deleteBookmarkOwned(bookmarkId, userId)) > 0;
}

export async function getOwnedBookmark(bookmarkId: string) {
  return studentRepo.findBookmarkById(bookmarkId);
}
