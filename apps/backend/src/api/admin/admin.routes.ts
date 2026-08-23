// PHASE 8 — Admin API: taxonomy CRUD, question lifecycle, users, audit (Phase 4 §2.7, §3.1)
import { Router } from "express";
import { authorize, requirePrincipal } from "../../core/middleware/auth";
import { ROLE_CODES } from "../../core/config/env";
import { errors } from "../../core/errors";
import * as contentService from "../../core/services/content.service";
import {
  adminListQuestions,
  findQuestionById,
} from "../../core/repositories/questions.repo";
import { adminListSubjects, adminListTopics } from "../../core/repositories/taxonomy.repo";
import { listUsers, revokeAllSessions, updateUserAsAdmin } from "../../core/repositories/users.repo";
import { listAuditEntries, writeAuditEntry } from "../../core/repositories/analytics.repo";
import { asyncHandler, ok, pageParams, paginationMeta } from "../../core/utils/http";
import { isUuid, Validator } from "../../core/validation/schema";

export const adminRouter = Router();

// Moderator: read + review + publish/reject questions only (Phase 4 §5.2).
const modOrAdmin = authorize("moderator", "admin");
const adminOnly = authorize("admin");

function uuidParamOr404(value: string | undefined, label: string): string {
  if (!value || !isUuid(value)) throw errors.notFound("RESOURCE_NOT_FOUND", `${label} not found.`);
  return value;
}

function jsonRecord(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) throw errors.malformed();
  return body as Record<string, unknown>;
}

// ─── Subjects ────────────────────────────────────────────────────────────────

adminRouter.get(
  "/subjects",
  adminOnly,
  asyncHandler(async (req, res) => {
    const v = new Validator(req.query);
    v.strictKeys(["page", "page_size"]);
    v.finish();
    const query = pageParams(req.query["page"], req.query["page_size"]);
    const { items, total } = await adminListSubjects(query.page, query.pageSize);
    ok(res, 200, { items, meta: paginationMeta(query, total) });
  }),
);

adminRouter.post(
  "/subjects",
  adminOnly,
  asyncHandler(async (req, res) => {
    const principal = requirePrincipal(req);
    const v = new Validator(req.body);
    v.strictKeys(["code", "name", "sort_order"]);
    const code = v.string("code", { required: true, min: 2, max: 40, lowercase: true });
    const name = v.string("name", { required: true, min: 2, max: 80 });
    const sortOrder = v.int("sort_order", { min: 0 });
    v.finish();
    const subject = await contentService.createSubjectValidated(principal.id, {
      code: code as string,
      name: name as string,
      ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
    });
    ok(res, 201, subject);
  }),
);

adminRouter.put(
  "/subjects/:id",
  adminOnly,
  asyncHandler(async (req, res) => {
    const principal = requirePrincipal(req);
    const id = uuidParamOr404(req.params["id"], "Subject");
    const v = new Validator(req.body);
    v.strictKeys(["name", "sort_order", "is_active"]);
    const name = v.string("name", { min: 2, max: 80 });
    const sortOrder = v.int("sort_order", { min: 0 });
    const isActive = v.boolean("is_active");
    v.finish();
    ok(res, 200, await contentService.updateSubjectValidated(principal.id, id, {
      ...(name !== undefined ? { name } : {}),
      ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
      ...(isActive !== undefined ? { is_active: isActive } : {}),
    }));
  }),
);

adminRouter.delete(
  "/subjects/:id",
  adminOnly,
  asyncHandler(async (req, res) => {
    const principal = requirePrincipal(req);
    const id = uuidParamOr404(req.params["id"], "Subject");
    await contentService.deactivateSubjectValidated(principal.id, id);
    ok(res, 200, null);
  }),
);

// ─── Topics ──────────────────────────────────────────────────────────────────

adminRouter.get(
  "/topics",
  adminOnly,
  asyncHandler(async (req, res) => {
    const v = new Validator(req.query);
    v.strictKeys(["subject_id", "page", "page_size"]);
    const subjectId = v.uuid("subject_id");
    v.finish();
    const query = pageParams(req.query["page"], req.query["page_size"]);
    const { items, total } = await adminListTopics(subjectId, query.page, query.pageSize);
    ok(res, 200, { items, meta: paginationMeta(query, total) });
  }),
);

adminRouter.post(
  "/topics",
  adminOnly,
  asyncHandler(async (req, res) => {
    const principal = requirePrincipal(req);
    const v = new Validator(req.body);
    v.strictKeys(["subject_id", "chapter_id", "name", "sort_order"]);
    const subjectId = v.uuid("subject_id", { required: true });
    const chapterId = v.uuid("chapter_id");
    const name = v.string("name", { required: true, min: 2, max: 120 });
    const sortOrder = v.int("sort_order", { min: 0 });
    v.finish();
    const topic = await contentService.createTopicValidated(principal.id, {
      subject_id: subjectId as string,
      name: name as string,
      ...(chapterId ? { chapter_id: chapterId } : {}),
      ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
    });
    ok(res, 201, topic);
  }),
);

adminRouter.put(
  "/topics/:id",
  adminOnly,
  asyncHandler(async (req, res) => {
    const principal = requirePrincipal(req);
    const id = uuidParamOr404(req.params["id"], "Topic");
    const v = new Validator(req.body);
    v.strictKeys(["name", "sort_order", "is_active"]);
    const name = v.string("name", { min: 2, max: 120 });
    const sortOrder = v.int("sort_order", { min: 0 });
    const isActive = v.boolean("is_active");
    v.finish();
    ok(res, 200, await contentService.updateTopicValidated(principal.id, id, {
      ...(name !== undefined ? { name } : {}),
      ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
      ...(isActive !== undefined ? { is_active: isActive } : {}),
    }));
  }),
);

adminRouter.delete(
  "/topics/:id",
  adminOnly,
  asyncHandler(async (req, res) => {
    const principal = requirePrincipal(req);
    const id = uuidParamOr404(req.params["id"], "Topic");
    await contentService.deactivateTopicValidated(principal.id, id);
    ok(res, 200, null);
  }),
);

// ─── Questions ───────────────────────────────────────────────────────────────

adminRouter.get(
  "/questions",
  modOrAdmin,
  asyncHandler(async (req, res) => {
    const v = new Validator(req.query);
    v.strictKeys(["status", "subject_id", "topic_id", "page", "page_size"]);
    const status = v.enumOf("status", ["draft", "in_review", "published", "rejected", "archived"] as const);
    const subjectId = v.uuid("subject_id");
    const topicId = v.uuid("topic_id");
    v.finish();
    const query = pageParams(req.query["page"], req.query["page_size"]);
    const { items, total } = await adminListQuestions(
      {
        ...(status ? { status } : {}),
        ...(subjectId ? { subjectId } : {}),
        ...(topicId ? { topicId } : {}),
      },
      query.page,
      query.pageSize,
    );
    ok(res, 200, { items, meta: paginationMeta(query, total) });
  }),
);

adminRouter.post(
  "/questions",
  modOrAdmin,
  asyncHandler(async (req, res) => {
    const principal = requirePrincipal(req);
    const created = await contentService.createQuestionValidated(principal.id, jsonRecord(req.body));
    const question = await findQuestionById(created.id);
    ok(res, 201, question);
  }),
);

adminRouter.put(
  "/questions/:id",
  modOrAdmin,
  asyncHandler(async (req, res) => {
    const principal = requirePrincipal(req);
    const id = uuidParamOr404(req.params["id"], "Question");
    await contentService.updateQuestionValidated(principal.id, id, jsonRecord(req.body));
    ok(res, 200, await findQuestionById(id));
  }),
);

adminRouter.post(
  "/questions/:id/publish",
  modOrAdmin,
  asyncHandler(async (req, res) => {
    const principal = requirePrincipal(req);
    const id = uuidParamOr404(req.params["id"], "Question");
    ok(res, 200, await contentService.publishQuestionValidated(principal.id, id));
  }),
);

adminRouter.post(
  "/questions/:id/reject",
  modOrAdmin,
  asyncHandler(async (req, res) => {
    const principal = requirePrincipal(req);
    const id = uuidParamOr404(req.params["id"], "Question");
    const v = new Validator(req.body);
    v.strictKeys(["reason"]);
    const reason = v.string("reason", { required: true, min: 10, max: 500 });
    v.finish();
    ok(res, 200, await contentService.rejectQuestionValidated(principal.id, id, reason as string));
  }),
);

adminRouter.post(
  "/questions/import",
  adminOnly,
  asyncHandler(async (req, res) => {
    const principal = requirePrincipal(req);
    const body = jsonRecord(req.body);
    const v = new Validator(body);
    v.strictKeys(["items"]);
    v.finish();
    const items = body["items"];
    if (!Array.isArray(items)) {
      throw errors.validation([{ field: "items", code: "VALIDATION_INVALID_ARRAY", message: '"items" must be an array.' }]);
    }
    ok(res, 200, await contentService.importQuestions(principal.id, items as Array<Record<string, unknown>>));
  }),
);

// ─── Users ───────────────────────────────────────────────────────────────────

adminRouter.get(
  "/users",
  adminOnly,
  asyncHandler(async (req, res) => {
    const v = new Validator(req.query);
    v.strictKeys(["page", "page_size"]);
    v.finish();
    const query = pageParams(req.query["page"], req.query["page_size"]);
    const { items, total } = await listUsers(query.page, query.pageSize);
    ok(res, 200, {
      items: items.map((user) => ({
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        role: user.role.code,
        status: user.status,
        created_at: user.createdAt.toISOString(),
        deleted_at: user.deletedAt ? user.deletedAt.toISOString() : null,
      })),
      meta: paginationMeta(query, total),
    });
  }),
);

adminRouter.patch(
  "/users/:id",
  adminOnly,
  asyncHandler(async (req, res) => {
    const principal = requirePrincipal(req);
    const id = uuidParamOr404(req.params["id"], "User");
    const v = new Validator(req.body);
    v.strictKeys(["status", "role_code"]);
    const status = v.enumOf("status", ["active", "disabled"] as const);
    const roleCode = v.enumOf("role_code", ROLE_CODES);
    v.finish();
    if (status === undefined && roleCode === undefined) {
      throw errors.validation([
        { field: "status", code: "VALIDATION_REQUIRED", message: 'Provide "status" and/or "role_code".' },
      ]);
    }

    const updated = await updateUserAsAdmin(id, {
      ...(status !== undefined ? { status } : {}),
      ...(roleCode !== undefined ? { roleCode } : {}),
    });

    // Disabling an account revokes all active sessions (Phase 4 §5.1).
    let revokedSessions = 0;
    if (status === "disabled") revokedSessions = await revokeAllSessions(id);

    await writeAuditEntry({
      actorId: principal.id,
      action: "user.update",
      entityType: "users",
      entityId: id,
      after: { status: updated.status, role: updated.role.code, revoked_sessions: revokedSessions },
    });

    ok(res, 200, {
      id: updated.id,
      email: updated.email,
      full_name: updated.fullName,
      role: updated.role.code,
      status: updated.status,
    });
  }),
);

// ─── Audit log ───────────────────────────────────────────────────────────────

adminRouter.get(
  "/audit",
  adminOnly,
  asyncHandler(async (req, res) => {
    const v = new Validator(req.query);
    v.strictKeys(["entity_type", "entity_id", "actor_id", "page", "page_size"]);
    const entityType = v.string("entity_type", { max: 60 });
    const entityId = v.uuid("entity_id");
    const actorId = v.uuid("actor_id");
    v.finish();
    const query = pageParams(req.query["page"], req.query["page_size"]);
    const { items, total } = await listAuditEntries(
      {
        ...(entityType ? { entityType } : {}),
        ...(entityId ? { entityId } : {}),
        ...(actorId ? { actorId } : {}),
      },
      query.page,
      query.pageSize,
    );
    ok(res, 200, {
      items: items.map((entry) => ({
        id: entry.id.toString(),
        actor: entry.actor ? { id: entry.actor.id, email: entry.actor.email } : null,
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        before: entry.before ?? null,
        after: entry.after ?? null,
        created_at: entry.createdAt.toISOString(),
      })),
      meta: paginationMeta(query, total),
    });
  }),
);
