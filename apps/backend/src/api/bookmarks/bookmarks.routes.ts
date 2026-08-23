// PHASE 8 — Bookmarks API (Phase 4 §2.5, §3.2.9)
import { Router } from "express";
import { requireAuth } from "../../core/middleware/auth";
import { errors } from "../../core/errors";
import * as bookmarkService from "../../core/services/bookmark.service";
import { listBookmarks } from "../../core/repositories/student.repo";
import { asyncHandler, ok, pageParams, paginationMeta } from "../../core/utils/http";
import { Validator, isUuid } from "../../core/validation/schema";

export const bookmarksRouter = Router();

bookmarksRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const v = new Validator(req.query);
    v.strictKeys(["page", "page_size"]);
    v.finish();
    const query = pageParams(req.query["page"], req.query["page_size"]);

    const { items, total } = await listBookmarks(req.principal?.id as string, query.page, query.pageSize);
    ok(res, 200, {
      items: items.map((bookmark) => ({
        id: bookmark.id,
        created_at: bookmark.createdAt.toISOString(),
        question: {
          id: bookmark.question.id,
          body: bookmark.question.body,
          difficulty: bookmark.question.difficulty,
          gate_year: bookmark.question.gateYear,
          subject: bookmark.question.subject,
          topic: bookmark.question.topic,
        },
      })),
      meta: paginationMeta(query, total),
    });
  }),
);

bookmarksRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const v = new Validator(req.body);
    v.strictKeys(["question_id"]);
    const questionId = v.uuid("question_id", { required: true });
    v.finish();

    const bookmark = await bookmarkService.addBookmark(req.principal?.id as string, questionId as string);
    ok(res, 201, bookmark);
  }),
);

bookmarksRouter.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = req.params["id"];
    if (!id || !isUuid(id)) throw errors.notFound("RESOURCE_NOT_FOUND", "Bookmark not found.");

    // IDOR check first (Phase 4 §5.3): existence vs ownership reported distinctly.
    const bookmark = await bookmarkService.getOwnedBookmark(id);
    if (!bookmark) throw errors.notFound("RESOURCE_NOT_FOUND", "Bookmark not found.");
    if (bookmark.userId !== (req.principal?.id as string)) throw errors.notOwner();

    await bookmarkService.removeBookmark(id, req.principal?.id as string);
    res.status(204).send();
  }),
);
