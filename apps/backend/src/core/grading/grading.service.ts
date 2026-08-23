// PHASE 8 — Canonical MCQ/MSQ/NAT evaluation (Phase 4 §7).
// Single source of truth used by attempt recording AND session completion.
// Grading always runs against the immutable version snapshot (Phase 3 §13.5).
import { AppError, ErrorDetail, errors } from "../errors";

export interface SnapshotOption {
  id: string;
  body: string;
  is_correct: boolean;
}

export interface SnapshotNumericKey {
  numeric_value: string;
  tolerance_abs?: string | null;
  tolerance_rel?: string | null;
  unit?: string | null;
}

export interface QuestionSnapshot {
  question_id: string;
  type_code: "mcq" | "msq" | "nat";
  marks: number;
  negative_marks: number | null;
  options?: SnapshotOption[];
  numeric_answers?: SnapshotNumericKey[];
}

/** Type-specific student answer (Phase 4 §3.2.6). */
export interface AnswerInput {
  option_id?: unknown;
  option_ids?: unknown;
  value?: unknown;
  unit?: unknown;
}

export interface GradeResult {
  isCorrect: boolean;
  marksAwarded: number;
}

function invalidAnswer(message: string, field = "answer"): never {
  const details: ErrorDetail[] = [{ field, code: "VALIDATION_INVALID_ANSWER", message }];
  throw new AppError(422, "INVALID_ANSWER", message, details);
}

function negativePenalty(snapshot: QuestionSnapshot): number {
  return snapshot.negative_marks === null || snapshot.negative_marks === undefined ? 0 : -snapshot.negative_marks;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ─── MCQ (§7.1): exactly one submitted option id ────────────────────────────
function gradeMcq(snapshot: QuestionSnapshot, answer: AnswerInput): GradeResult {
  const options = snapshot.options ?? [];
  const submitted = answer.option_id;
  if (typeof submitted !== "string" || submitted.length === 0) {
    invalidAnswer('MCQ answer must be {"option_id": "<uuid>"}.');
  }
  const chosen = options.find((option) => option.id === submitted);
  if (!chosen) {
    invalidAnswer("Submitted option does not belong to this question.");
  }
  const isCorrect = chosen.is_correct === true;
  return { isCorrect, marksAwarded: isCorrect ? round2(snapshot.marks) : negativePenalty(snapshot) };
}

// ─── MSQ (§7.2): set comparison with partial credit (OD-03 / API-03) ────────
function gradeMsq(snapshot: QuestionSnapshot, answer: AnswerInput): GradeResult {
  const options = snapshot.options ?? [];
  const raw = answer.option_ids;
  if (!Array.isArray(raw) || raw.length === 0 || raw.some((id) => typeof id !== "string")) {
    invalidAnswer('MSQ answer must be {"option_ids": ["<uuid>", ...]}.');
  }
  const submitted = raw as string[];
  if (new Set(submitted).size !== submitted.length) {
    invalidAnswer("MSQ answer must not contain duplicate options.");
  }
  const correctSet = new Set(options.filter((option) => option.is_correct).map((option) => option.id));
  const submittedSet = new Set(submitted);

  for (const id of submittedSet) {
    if (!options.some((option) => option.id === id)) {
      invalidAnswer("Submitted option does not belong to this question.");
    }
  }

  // Exact-set match → full marks (is_correct true).
  let hits = 0;
  for (const id of submittedSet) if (correctSet.has(id)) hits += 1;
  const exact = submittedSet.size === correctSet.size && hits === correctSet.size;

  if (exact) return { isCorrect: true, marksAwarded: round2(snapshot.marks) };

  // Proper non-empty subset of the correct set → partial credit (OD-03 default),
  // proportional floor(|submitted∩correct| / |correct| × marks); API-03 quantum.
  const properSubset = hits > 0 && submittedSet.size < correctSet.size && hits === submittedSet.size;
  if (properSubset && correctSet.size > 0) {
    const partial = round2(Math.floor((hits / correctSet.size) * snapshot.marks * 100) / 100);
    return { isCorrect: false, marksAwarded: Math.max(0, partial) };
  }

  return { isCorrect: false, marksAwarded: negativePenalty(snapshot) };
}

// ─── NAT (§7.3): numeric parse + abs/rel tolerance + optional unit ──────────
export function normalizeNatValue(raw: string): number {
  const trimmed = String(raw).trim().replace(/^\+/, "");
  if (trimmed.length === 0) {
    invalidAnswer('NAT answer must be {"value": "<number>", "unit"?}.');
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    invalidAnswer("NAT value must be a finite number (decimals or scientific notation allowed).");
  }
  return parsed;
}

function natMatches(key: SnapshotNumericKey, submittedValue: number, submittedUnit: string | undefined): boolean {
  const keyValue = Number(key.numeric_value);
  if (!Number.isFinite(keyValue)) return false;

  if (key.unit !== null && key.unit !== undefined && key.unit.trim() !== "") {
    if (submittedUnit === undefined || submittedUnit.trim().toUpperCase() !== key.unit.trim().toUpperCase()) {
      return false;
    }
  }

  const diff = Math.abs(submittedValue - keyValue);
  const tolAbs = key.tolerance_abs === null || key.tolerance_abs === undefined ? 0 : Number(key.tolerance_abs);
  if (Number.isFinite(tolAbs) && diff <= tolAbs) return true;

  const tolRel = key.tolerance_rel === null || key.tolerance_rel === undefined ? 0 : Number(key.tolerance_rel);
  if (Number.isFinite(tolRel) && tolRel > 0 && diff <= tolRel * Math.abs(keyValue)) return true;

  return diff === 0;
}

function gradeNat(snapshot: QuestionSnapshot, answer: AnswerInput): GradeResult {
  if (typeof answer.value !== "string" && typeof answer.value !== "number") {
    invalidAnswer('NAT answer must be {"value": "<number>", "unit"?}.');
  }
  const value = normalizeNatValue(String(answer.value));
  const unit = typeof answer.unit === "string" ? answer.unit : undefined;

  const keys = snapshot.numeric_answers ?? [];
  if (keys.length === 0) {
    throw errors.internal(); // NAT question without keys is a content defect
  }
  const isCorrect = keys.some((key) => natMatches(key, value, unit));
  return { isCorrect, marksAwarded: isCorrect ? round2(snapshot.marks) : negativePenalty(snapshot) };
}

export function gradeAnswer(snapshot: QuestionSnapshot, answer: AnswerInput): GradeResult {
  switch (snapshot.type_code) {
    case "mcq":
      return gradeMcq(snapshot, answer);
    case "msq":
      return gradeMsq(snapshot, answer);
    case "nat":
      return gradeNat(snapshot, answer);
    default:
      throw errors.internal();
  }
}
