// PHASE 8 — Typed configuration (Phase 4 §13 core/config)
// Values are defaults; secrets never live here (read from process.env only).

function positiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export const config = {
  env: process.env.NODE_ENV ?? "development",
  isProd: process.env.NODE_ENV === "production",
  port: positiveInt(process.env.PORT, 4000),
  apiPrefix: "/api/v1",

  corsOrigin: (() => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL;
    try {
      return base ? new URL(base).origin : "http://localhost:3000";
    } catch {
      return "http://localhost:3000";
    }
  })(),

  session: {
    cookieName: "gate_pyq_session",
    ttlMs: positiveInt(process.env.SESSION_TTL_HOURS, 24 * 30) * 60 * 60 * 1000,
  },

  rateLimit: {
    loginPerMinute: positiveInt(process.env.RATE_LIMIT_LOGIN_PER_MIN, 5),
    globalPerMinute: positiveInt(process.env.RATE_LIMIT_GLOBAL_PER_MIN, 120),
    windowMs: 60 * 1000,
  },

  lockout: {
    maxFails: positiveInt(process.env.AUTH_LOCKOUT_MAX_FAILS, 5),
    windowMs: positiveInt(process.env.AUTH_LOCKOUT_WINDOW_MIN, 15) * 60 * 1000,
  },

  pagination: {
    defaultPage: 1,
    defaultPageSize: positiveInt(process.env.PAGE_SIZE_DEFAULT, 20),
    maxPageSize: positiveInt(process.env.PAGE_SIZE_MAX, 100),
  },

  practice: {
    minQuestions: 1,
    maxQuestions: 50,
    defaultQuestions: positiveInt(process.env.PRACTICE_DEFAULT_COUNT, 20),
    abandonWindowMs: positiveInt(process.env.PRACTICE_ABANDON_HOURS, 24) * 60 * 60 * 1000,
  },

  analytics: {
    weakAccuracyBelow: 0.45, // OD-05 default
    weakMinAttempts: 5, // OD-05 default
    weakDefaultLimit: 5,
    weakMaxLimit: 20,
  },

  password: {
    iterations: positiveInt(process.env.PBKDF2_ITERATIONS, 310_000),
    keyLength: 64,
    digest: "sha512" as const,
  },

  audit: {
    enabled: process.env.AUDIT_DISABLED !== "true",
  },
} as const;

export const ROLE_CODES = ["student", "moderator", "admin"] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

export const QUESTION_TYPE_CODES = ["mcq", "msq", "nat"] as const;
export type QuestionTypeCode = (typeof QUESTION_TYPE_CODES)[number];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const QUESTION_STATUSES = [
  "draft",
  "in_review",
  "published",
  "rejected",
  "archived",
] as const;

export const PRACTICE_MODE_CODES = [
  "subject",
  "topic",
  "year",
  "difficulty",
  "mistake",
  "custom",
] as const;

export const SESSION_STATUSES = [
  "in_progress",
  "submitted",
  "completed",
  "abandoned",
] as const;
