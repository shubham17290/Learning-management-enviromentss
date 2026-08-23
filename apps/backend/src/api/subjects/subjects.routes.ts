// PHASE 8 — Subjects & taxonomy API (Phase 4 §2.2; public* read per API-04)
import { Router } from "express";
import { optionalAuthenticate, requireAuth } from "../../core/middleware/auth";
import * as taxonomyRepo from "../../core/repositories/taxonomy.repo";
import { listPublishedQuestions, type QuestionFilters } from "../../core/repositories/questions.repo";
import { attemptFactsForUser } from "../../core/repositories/analytics.repo";
import { errors } from "../../core/errors";
import { asyncHandler, ok, pageParams, paginationMeta } from "../../core/utils/http";
import { Validator, isUuid } from "../../core/validation/schema";

export const subjectsRouter = Router();

function uuidParamOr404(value: string | undefined, label: string): string {
  if (!value || !isUuid(value)) throw errors.notFound("RESOURCE_NOT_FOUND", `${label} not found.`);
  return value;
}

subjectsRouter.get(
  "/",
  optionalAuthenticate,
  asyncHandler(async (req, res) => {
    const v = new Validator(req.query);
    v.strictKeys([]);
    v.finish();

    const subjects = await taxonomyRepo.listActiveSubjects();
    const items = subjects.map((subject) => ({
      id: subject.id,
      code: subject.code,
      name: subject.name,
      sort_order: subject.sortOrder,
      topics_count: subject._count.topics,
      questions_count: subject._count.questions,
      accuracy: null as number | null,
    }));

    // Authenticated students additionally see personal accuracy (Phase 4 §3.1 note).
    if (req.principal) {
      const facts = await attemptFactsForUser(req.principal.id);
      for (const item of items) {
        const rows = facts.filter((fact) => fact.subjectId === item.id);
        item.accuracy =
          rows.length === 0 ? null : Math.round((rows.filter((row) => row.isCorrect).length / rows.length) * 100) / 100;
      }
    }
    ok(res, 200, { items });
  }),
);

subjectsRouter.get(
  "/:id",
  optionalAuthenticate,
  asyncHandler(async (req, res) => {
    const id = uuidParamOr404(req.params["id"], "Subject");
    const subject = await taxonomyRepo.findSubjectById(id);
    if (!subject) throw errors.notFound("RESOURCE_NOT_FOUND", "Subject not found.");
    ok(res, 200, {
      id: subject.id,
      code: subject.code,
      name: subject.name,
      sort_order: subject.sortOrder,
      topics_count: subject._count.topics,
      questions_count: subject._count.questions,
    });
  }),
);

subjectsRouter.get(
  "/:id/topics",
  requireAuth,
  asyncHandler(async (req, res) => {
    const v = new Validator(req.query);
    v.strictKeys([]);
    v.finish();

    const subjectId = uuidParamOr404(req.params["id"], "Subject");
    const subject = await taxonomyRepo.findSubjectById(subjectId);
    if (!subject) throw errors.notFound("RESOURCE_NOT_FOUND", "Subject not found.");
    const topics = await taxonomyRepo.listTopicsForSubject(subject.id);
    ok(res, 200, {
      items: topics.map((topic) => ({
        id: topic.id,
        subject_id: topic.subjectId,
        chapter_id: topic.chapterId,
        name: topic.name,
        sort_order: topic.sortOrder,
        questions_count: topic._count.questions,
      })),
    });
  }),
);

subjectsRouter.get(
  "/:id/topics/:topicId/questions",
  requireAuth,
  asyncHandler(async (req, res) => {
    const v = new Validator(req.query);
    v.strictKeys(["page", "page_size"]);
    const query = pageParams(req.query["page"], req.query["page_size"]);
    v.finish();

    const subjectId = uuidParamOr404(req.params["id"], "Subject");
    const topicId = uuidParamOr404(req.params["topicId"], "Topic");

    const topic = await taxonomyRepo.findTopicInSubject(subjectId, topicId);
    if (!topic) throw errors.notFound("RESOURCE_NOT_FOUND", "Topic not found in this subject.");

    const filters: QuestionFilters = { topicId };
    const { items, total } = await listPublishedQuestions(filters, query.page, query.pageSize, [
      { gateYear: "desc" },
      { id: "asc" },
    ]);
    ok(res, 200, { items: items.map(publicQuestionView), meta: paginationMeta(query, total) });
  }),
);

/** Student view: never exposes correct answers or explanations (FR-EVAL-04). */
export function publicQuestionView(question: {
  id: string;
  body: string;
  marks: unknown;
  negativeMarks?: unknown;
  difficulty: string;
  gateYear: number;
  subject: { id: string; code: string; name: string };
  topic: { id: string; name: string } | null;
  questionType: { code: string; name: string };
}): Record<string, unknown> {
  return {
    id: question.id,
    body: question.body,
    type_code: question.questionType.code,
    type_name: question.questionType.name,
    difficulty: question.difficulty,
    gate_year: question.gateYear,
    marks: Number(question.marks),
    negative_marks:
      question.negativeMarks === null || question.negativeMarks === undefined ? null : Number(question.negativeMarks),
    subject: { id: question.subject.id, code: question.subject.code, name: question.subject.name },
    topic: question.topic ? { id: question.topic.id, name: question.topic.name } : null,
  };
}
