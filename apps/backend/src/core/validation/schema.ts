// PHASE 8 — Structural validation toolkit (Phase 4 §6).
// Boundary validation fails fast with 422 VALIDATION_ERROR + per-field details.
import { ErrorDetail, errors } from "../errors";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Pragmatic RFC5322-lite; avoids catastrophic backtracking.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function isEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_RE.test(value);
}

type PrimitiveOptions = {
  required?: boolean;
  min?: number;
  max?: number;
  email?: boolean;
  lowercase?: boolean;
};

type IntOptions = {
  required?: boolean;
  min?: number;
  max?: number;
};

export class Validator {
  private readonly details: ErrorDetail[] = [];

  constructor(private readonly body: unknown) {}

  private raw(key: string, required: boolean): { value: unknown; skip: boolean } {
    const body = this.body;
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      this.details.push({ field: "body", code: "VALIDATION_INVALID_BODY", message: "A JSON object is required." });
      return { value: undefined, skip: true };
    }
    const record = body as Record<string, unknown>;
    const value = record[key];
    if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
      if (required) this.details.push({ field: key, code: "VALIDATION_REQUIRED", message: `"${key}" is required.` });
      return { value: undefined, skip: true };
    }
    return { value, skip: false };
  }

  string(key: string, options: PrimitiveOptions & { required: true }): string;
  string(key: string, options?: PrimitiveOptions): string | undefined;
  string(key: string, options: PrimitiveOptions = {}): string | undefined {
    const { value, skip } = this.raw(key, options.required === true);
    if (skip) return undefined;
    let str = typeof value === "string" ? value : undefined;
    if (str === undefined) {
      this.details.push({ field: key, code: "VALIDATION_INVALID_STRING", message: `"${key}" must be a string.` });
      return undefined;
    }
    str = str.trim();
    if (options.lowercase) str = str.toLowerCase();
    if (options.min !== undefined && str.length < options.min) {
      this.details.push({ field: key, code: "VALIDATION_TOO_SHORT", message: `"${key}" must be at least ${options.min} characters.` });
    }
    if (options.max !== undefined && str.length > options.max) {
      this.details.push({ field: key, code: "VALIDATION_TOO_LONG", message: `"${key}" must be at most ${options.max} characters.` });
    }
    if (options.email && !isEmail(str)) {
      this.details.push({ field: key, code: "VALIDATION_INVALID_EMAIL", message: `"${key}" must be a valid email address.` });
    }
    return str;
  }

  uuid(key: string, options: PrimitiveOptions & { required: true }): string;
  uuid(key: string, options?: PrimitiveOptions): string | undefined;
  uuid(key: string, options: PrimitiveOptions = {}): string | undefined {
    const value = this.string(key, options);
    if (value !== undefined && !isUuid(value)) {
      this.details.push({ field: key, code: "VALIDATION_INVALID_UUID", message: `"${key}" must be a UUID.` });
      return undefined;
    }
    return value;
  }

  int(key: string, options: IntOptions & { required: true }): number;
  int(key: string, options?: IntOptions): number | undefined;
  int(key: string, options: IntOptions = {}): number | undefined {
    const { value, skip } = this.raw(key, options.required === true);
    if (skip) return undefined;
    const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
    if (!Number.isInteger(parsed)) {
      this.details.push({ field: key, code: "VALIDATION_INVALID_INT", message: `"${key}" must be an integer.` });
      return undefined;
    }
    if (options.min !== undefined && parsed < options.min) {
      this.details.push({ field: key, code: "VALIDATION_TOO_SMALL", message: `"${key}" must be >= ${options.min}.` });
    }
    if (options.max !== undefined && parsed > options.max) {
      this.details.push({ field: key, code: "VALIDATION_TOO_LARGE", message: `"${key}" must be <= ${options.max}.` });
    }
    return parsed;
  }

  boolean(key: string, options: { required: true }): boolean;
  boolean(key: string, options?: { required?: boolean }): boolean | undefined;
  boolean(key: string, options: { required?: boolean } = {}): boolean | undefined {
    const { value, skip } = this.raw(key, options.required === true);
    if (skip) return undefined;
    if (typeof value !== "boolean") {
      this.details.push({ field: key, code: "VALIDATION_INVALID_BOOLEAN", message: `"${key}" must be a boolean.` });
      return undefined;
    }
    return value;
  }

  enumOf<T extends string>(key: string, allowed: readonly T[], options: { required: true }): T;
  enumOf<T extends string>(key: string, allowed: readonly T[], options?: { required?: boolean }): T | undefined;
  enumOf<T extends string>(key: string, allowed: readonly T[], options: { required?: boolean } = {}): T | undefined {
    const value = this.string(key, options as PrimitiveOptions);
    if (value === undefined) return undefined;
    if (!(allowed as readonly string[]).includes(value)) {
      this.details.push({
        field: key,
        code: "VALIDATION_INVALID_VALUE",
        message: `"${key}" must be one of: ${allowed.join(", ")}.`,
      });
      return undefined;
    }
    return value as T;
  }

  stringArray(key: string, options: { required?: boolean; minItems?: number; unique?: boolean }): string[] | undefined {
    const { value, skip } = this.raw(key, options.required === true);
    if (skip) return undefined;
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
      this.details.push({ field: key, code: "VALIDATION_INVALID_ARRAY", message: `"${key}" must be an array of strings.` });
      return undefined;
    }
    const items = value as string[];
    if (options.minItems !== undefined && items.length < options.minItems) {
      this.details.push({ field: key, code: "VALIDATION_TOO_FEW", message: `"${key}" must contain at least ${options.minItems} item(s).` });
    }
    if (options.unique && new Set(items).size !== items.length) {
      this.details.push({ field: key, code: "VALIDATION_DUPLICATE", message: `"${key}" must not contain duplicates.` });
    }
    return items;
  }

  /** Rejects unknown/extra fields (Phase 4 §10: strict payloads). */
  strictKeys(allowed: readonly string[]): void {
    const body = this.body;
    if (typeof body !== "object" || body === null || Array.isArray(body)) return;
    const record = body as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (!allowed.includes(key)) {
        this.details.push({ field: key, code: "VALIDATION_UNKNOWN_FIELD", message: `Unknown field "${key}".` });
      }
    }
  }

  /** Nested-object strictness helper for answer payloads etc. */
  static subObject(parent: unknown, key: string): { ok: true; value: Record<string, unknown> } | { ok: false } {
    if (typeof parent !== "object" || parent === null) return { ok: false };
    const value = (parent as Record<string, unknown>)[key];
    if (typeof value !== "object" || value === null || Array.isArray(value)) return { ok: false };
    return { ok: true, value: value as Record<string, unknown> };
  }

  finish(): void {
    if (this.details.length > 0) throw errors.validation(this.details);
  }

  get errorDetails(): ErrorDetail[] {
    return this.details;
  }
}
