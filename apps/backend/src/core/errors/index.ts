// PHASE 8 — Typed errors + global handler + error-code registry (Phase 4 §4, §9)

export interface ErrorDetail {
  field: string;
  code: string;
  message?: string;
}

const ErrorCodes = {
  MALFORMED_REQUEST: "MALFORMED_REQUEST",
  AUTH_UNAUTHENTICATED: "AUTH_UNAUTHENTICATED",
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_ACCOUNT_DISABLED: "AUTH_ACCOUNT_DISABLED",
  FORBIDDEN_ROLE: "FORBIDDEN_ROLE",
  FORBIDDEN_NOT_OWNER: "FORBIDDEN_NOT_OWNER",
  FORBIDDEN_AUTHOR_CANNOT_PUBLISH: "FORBIDDEN_AUTHOR_CANNOT_PUBLISH",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  QUESTION_NOT_FOUND: "QUESTION_NOT_FOUND",
  EMAIL_ALREADY_REGISTERED: "EMAIL_ALREADY_REGISTERED",
  ALREADY_BOOKMARKED: "ALREADY_BOOKMARKED",
  CONFLICT_SESSION_NOT_LIVE: "CONFLICT_SESSION_NOT_LIVE",
  CONFLICT_RESULT_NOT_READY: "CONFLICT_RESULT_NOT_READY",
  CONFLICT_STATE_INVALID: "CONFLICT_STATE_INVALID",
  CONFLICT_CODE_EXISTS: "CONFLICT_CODE_EXISTS",
  NO_MATCHING_QUESTIONS: "NO_MATCHING_QUESTIONS",
  QUESTION_NOT_IN_SESSION: "QUESTION_NOT_IN_SESSION",
  INVALID_ANSWER: "INVALID_ANSWER",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: ErrorDetail[] = [],
    readonly headers: Record<string, string> = {},
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errors = {
  malformed(msg = "Request body is not valid JSON."): AppError {
    return new AppError(400, ErrorCodes.MALFORMED_REQUEST, msg);
  },
  unauthenticated(msg = "Authentication required."): AppError {
    return new AppError(401, ErrorCodes.AUTH_UNAUTHENTICATED, msg);
  },
  invalidCredentials(): AppError {
    return new AppError(401, ErrorCodes.AUTH_INVALID_CREDENTIALS, "Email or password is incorrect.");
  },
  accountDisabled(): AppError {
    return new AppError(401, ErrorCodes.AUTH_ACCOUNT_DISABLED, "This account has been disabled.");
  },
  role(msg = "You do not have permission to perform this action."): AppError {
    return new AppError(403, ErrorCodes.FORBIDDEN_ROLE, msg);
  },
  notOwner(msg = "You do not own this resource."): AppError {
    return new AppError(403, ErrorCodes.FORBIDDEN_NOT_OWNER, msg);
  },
  authorCannotPublish(): AppError {
    return new AppError(
      403,
      ErrorCodes.FORBIDDEN_AUTHOR_CANNOT_PUBLISH,
      "The author of a question cannot publish or reject it.",
    );
  },
  notFound(code: string = ErrorCodes.RESOURCE_NOT_FOUND, msg = "Resource not found."): AppError {
    return new AppError(404, code, msg);
  },
  conflict(code: string, msg: string): AppError {
    return new AppError(409, code, msg);
  },
  validation(details: ErrorDetail[], msg = "Validation failed."): AppError {
    return new AppError(422, "VALIDATION_ERROR", msg, details);
  },
  noMatchingQuestions(): AppError {
    return new AppError(422, ErrorCodes.NO_MATCHING_QUESTIONS, "No published questions match the given filters.");
  },
  questionNotInSession(): AppError {
    return new AppError(422, ErrorCodes.QUESTION_NOT_IN_SESSION, "Question is not part of this session pool.");
  },
  rateLimited(retryAfterSeconds: number): AppError {
    return new AppError(429, ErrorCodes.RATE_LIMITED, "Too many requests. Please retry later.", [], {
      "Retry-After": String(Math.max(1, Math.ceil(retryAfterSeconds))),
    });
  },
  internal(): AppError {
    return new AppError(500, ErrorCodes.INTERNAL_ERROR, "An unexpected error occurred.");
  },
};
