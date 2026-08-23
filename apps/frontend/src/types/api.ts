// PHASE 5 §17 — shared DTOs mirroring the Phase 8 API contracts.

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details: Array<{ field: string; code: string; message?: string }>;
  };
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
}

export interface Paginated<T> {
  items: T[];
  meta?: PaginationMeta;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface CurrentUser {
  id: string;
  email: string;
  full_name: string;
  role: "student" | "moderator" | "admin";
  target_subject_id: string | null;
  email_verified: boolean;
  created_at: string;
}

export interface LoginResult {
  access_token: string;
  expires_at: string;
  user: { id: string; email: string; role: CurrentUser["role"] };
}

// ─── Taxonomy ────────────────────────────────────────────────────────────────
export interface SubjectSummary {
  id: string;
  code: string;
  name: string;
  sort_order: number;
  topics_count: number;
  questions_count: number;
  accuracy?: number | null;
}

export interface TopicSummary {
  id: string;
  subject_id: string;
  chapter_id: string | null;
  name: string;
  sort_order: number;
  questions_count: number;
}

// ─── Questions (student view — no answers) ───────────────────────────────────
export type QuestionTypeCode = "mcq" | "msq" | "nat";

export interface PublicQuestion {
  id: string;
  body: string;
  type_code: QuestionTypeCode;
  difficulty: "easy" | "medium" | "hard";
  gate_year: number;
  marks: number;
  negative_marks: number | null;
  subject: { id: string; code: string; name: string };
  topic: { id: string; name: string } | null;
  explanation?: string | null;
  answers?: {
    options: Array<{ id: string; body: string; is_correct: boolean }>;
    numeric_answers: Array<{
      numeric_value: number;
      tolerance_abs: number | null;
      tolerance_rel: number | null;
      unit: string | null;
      precision: number | null;
    }>;
  };
}

// ─── Practice ────────────────────────────────────────────────────────────────
export type SessionStatus = "in_progress" | "submitted" | "completed" | "abandoned";

export interface CreatedSession {
  id: string;
  mode: string;
  timed: boolean;
  total_questions: number;
  status: SessionStatus;
  started_at: string;
}

export interface SessionQuestion {
  id: string;
  body: string;
  type_code: QuestionTypeCode;
  marks: number;
  difficulty: string;
  gate_year: number;
  options: Array<{ id: string; body: string }>;
}

export interface SessionAttemptView {
  attempt_id: string;
  question_id: string | null;
  is_correct: boolean;
  marks: number;
  time_taken_seconds: number;
}

export interface SessionState {
  session_id: string;
  mode: string;
  timed: boolean;
  status: SessionStatus;
  started_at: string;
  total_questions: number;
  questions: SessionQuestion[];
  attempts: SessionAttemptView[];
}

export interface AttemptResponse {
  attempt_id: string;
  question_id: string;
  is_correct: boolean;
  marks: number;
  time_taken_seconds: number;
}

export interface SessionResult {
  session_id: string;
  mode: string;
  timed: boolean;
  status: SessionStatus;
  started_at: string;
  ended_at: string | null;
  score: { total_marks: number; max_marks: number; negative_marks: number };
  summary: { attempted: number; correct: number; incorrect: number; skipped: number };
  per_topic: Array<{ topic_id: string | null; attempted: number; correct: number }>;
  mistakes: string[];
  explanations: Array<{ question_id: string; explanation: string }>;
}

// ─── Analytics / dashboard ───────────────────────────────────────────────────
export interface PerformanceOverview {
  total_attempts: number;
  accuracy: number;
  avg_time_s: number;
  streak_days: number;
  last_session: { id: string; mode: string; status: string; started_at: string } | null;
}

export interface SubjectPerformance {
  subject_id: string;
  subject_name?: string;
  attempts: number;
  correct: number;
  accuracy: number;
  avg_time_s: number;
}

export interface TopicPerformance {
  topic_id: string;
  topic_name?: string;
  subject_id: string;
  subject_name?: string;
  attempts: number;
  correct: number;
  accuracy: number;
  avg_time_s: number;
  weak: boolean;
  last_activity: string | null;
}

export interface WeakTopic {
  topic_id: string;
  topic_name?: string;
  attempts: number;
  accuracy: number;
  weak: boolean;
  priority: number;
  recommendation: { mode: string; filters: { topic_id?: string }; timed: boolean };
}

// ─── Bookmarks / mistakes ────────────────────────────────────────────────────
export interface BookmarkItem {
  id: string;
  created_at: string;
  question: {
    id: string;
    body: string;
    difficulty: string;
    gate_year: number;
    subject: { id: string; code: string; name: string };
    topic: { id: string; name: string } | null;
  };
}

export interface MistakeItem {
  question_id: string;
  last_incorrect_at: string;
}

// ─── Admin ───────────────────────────────────────────────────────────────────
export interface AdminSubject {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTopic {
  id: string;
  subjectId: string;
  chapterId: string | null;
  name: string;
  sortOrder: number;
  isActive: boolean;
  subject: { code: string; name: string };
}

export interface AdminQuestion {
  id: string;
  body: string;
  explanation: string | null;
  marks: number;
  negativeMarks: number | null;
  difficulty: string;
  status: "draft" | "in_review" | "published" | "rejected" | "archived";
  version: number;
  gateYear: number;
  createdAt: string;
  updatedAt: string;
  subject: { code: string; name: string };
  topic: { id: string; name: string } | null;
  questionType: { code: QuestionTypeCode; name: string };
  _count?: { options: number; numericAnswers: number };
}

export interface AuditEntry {
  id: string;
  actor: { id: string; email: string } | null;
  action: string;
  entity_type: string;
  entity_id: string;
  before: unknown;
  after: unknown;
  created_at: string;
}
