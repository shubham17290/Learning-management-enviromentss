// PHASE 8 — Analytics API: mistakes, performance, dashboard (Phase 4 §2.5–2.6, §3.2.10–12)
import { Router } from "express";
import { requireAuth } from "../../core/middleware/auth";
import { config } from "../../core/config/env";
import * as analyticsService from "../../core/services/analytics.service";
import { incorrectAttemptsForUser } from "../../core/repositories/student.repo";
import { asyncHandler, ok, pageParams, paginationMeta } from "../../core/utils/http";
import { Validator } from "../../core/validation/schema";

export const analyticsRouter = Router();

function commonFilters(v: Validator): { topicId?: string; subjectId?: string } {
  const topicId = v.uuid("topic_id");
  const subjectId = v.uuid("subject_id");
  v.finish();
  return {
    ...(topicId ? { topicId } : {}),
    ...(subjectId ? { subjectId } : {}),
  };
}

analyticsRouter.get(
  "/mistakes",
  requireAuth,
  asyncHandler(async (req, res) => {
    const v = new Validator(req.query);
    v.strictKeys(["topic_id", "subject_id", "page", "page_size"]);
    const filters = commonFilters(v);
    const query = pageParams(req.query["page"], req.query["page_size"]);

    const all = await incorrectAttemptsForUser(req.principal?.id as string, filters);
    ok(res, 200, {
      items: all
        .slice((query.page - 1) * query.pageSize, query.page * query.pageSize)
        .map((row) => ({ question_id: row.questionId, last_incorrect_at: row.answeredAt.toISOString() })),
      meta: paginationMeta(query, all.length),
    });
  }),
);

analyticsRouter.get(
  "/performance/overview",
  requireAuth,
  asyncHandler(async (req, res) => {
    const v = new Validator(req.query);
    v.strictKeys([]);
    v.finish();
    ok(res, 200, await analyticsService.performanceOverview(req.principal?.id as string));
  }),
);

analyticsRouter.get(
  "/performance/subjects",
  requireAuth,
  asyncHandler(async (req, res) => {
    const v = new Validator(req.query);
    v.strictKeys(["page", "page_size"]);
    v.finish();
    const query = pageParams(req.query["page"], req.query["page_size"]);
    const result = await analyticsService.performanceSubjects(req.principal?.id as string, query.page, query.pageSize);
    ok(res, 200, { items: result.items, meta: paginationMeta(query, result.meta.total) });
  }),
);

analyticsRouter.get(
  "/performance/topics",
  requireAuth,
  asyncHandler(async (req, res) => {
    const v = new Validator(req.query);
    v.strictKeys(["topic_id", "subject_id", "page", "page_size"]);
    void commonFilters(v);
    const query = pageParams(req.query["page"], req.query["page_size"]);
    const result = await analyticsService.performanceTopics(req.principal?.id as string, query.page, query.pageSize);
    ok(res, 200, { items: result.items, meta: paginationMeta(query, result.meta.total) });
  }),
);

analyticsRouter.get(
  "/dashboard/summary",
  requireAuth,
  asyncHandler(async (req, res) => {
    const v = new Validator(req.query);
    v.strictKeys([]);
    v.finish();
    ok(res, 200, await analyticsService.performanceOverview(req.principal?.id as string));
  }),
);

analyticsRouter.get(
  "/dashboard/subjects",
  requireAuth,
  asyncHandler(async (req, res) => {
    const v = new Validator(req.query);
    v.strictKeys(["page", "page_size"]);
    v.finish();
    const query = pageParams(req.query["page"], req.query["page_size"]);
    const result = await analyticsService.performanceSubjects(req.principal?.id as string, query.page, query.pageSize);
    ok(res, 200, { items: result.items, meta: paginationMeta(query, result.meta.total) });
  }),
);

analyticsRouter.get(
  "/dashboard/topics",
  requireAuth,
  asyncHandler(async (req, res) => {
    const v = new Validator(req.query);
    v.strictKeys(["page", "page_size"]);
    v.finish();
    const query = pageParams(req.query["page"], req.query["page_size"]);
    const result = await analyticsService.performanceTopics(req.principal?.id as string, query.page, query.pageSize);
    ok(res, 200, { items: result.items, meta: paginationMeta(query, result.meta.total) });
  }),
);

analyticsRouter.get(
  "/dashboard/weak",
  requireAuth,
  asyncHandler(async (req, res) => {
    const v = new Validator(req.query);
    v.strictKeys(["limit"]);
    let limit = v.int("limit", { min: 1 }) ?? config.analytics.weakDefaultLimit;
    v.finish();
    if (limit > config.analytics.weakMaxLimit) limit = config.analytics.weakMaxLimit;
    ok(res, 200, await analyticsService.dashboardWeakTopics(req.principal?.id as string, limit));
  }),
);
