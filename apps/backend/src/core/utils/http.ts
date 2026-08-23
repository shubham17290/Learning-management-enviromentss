// PHASE 8 — HTTP helpers: envelope, cookies, pagination, async wrapper (Phase 4 §4, §11)
import { NextFunction, Request, RequestHandler, Response } from "express";
import { randomUUID } from "node:crypto";
import { config } from "../config/env";
import { AppError } from "../errors";

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

export function requestId(req: Request, res: Response): string {
  const incoming = req.header("x-request-id");
  const id = incoming && incoming.length <= 64 ? incoming : randomUUID();
  res.setHeader("X-Request-Id", id);
  return id;
}

export function ok(res: Response, status: number, data: unknown): void {
  res.status(status).json({ success: true, data });
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

export function setSessionCookie(res: Response, rawToken: string): void {
  res.cookie(config.session.cookieName, rawToken, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + config.session.ttlMs),
  });
}

export function clearSessionCookie(res: Response): void {
  res.cookie(config.session.cookieName, "", {
    httpOnly: true,
    secure: config.isProd,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export interface PageQuery {
  page: number;
  pageSize: number;
}

export function pageParams(rawPage: unknown, rawSize: unknown): PageQuery {
  const page = normalizeInt(rawPage, config.pagination.defaultPage);
  let pageSize = normalizeInt(rawSize, config.pagination.defaultPageSize);
  if (pageSize < 1) pageSize = config.pagination.defaultPageSize;
  if (pageSize > config.pagination.maxPageSize) pageSize = config.pagination.maxPageSize;
  return { page: Math.max(1, page), pageSize };
}

function normalizeInt(value: unknown, fallback: number): number {
  const parsed = typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function paginationMeta(query: PageQuery, total: number): {
  page: number;
  page_size: number;
  total: number;
} {
  return { page: query.page, page_size: query.pageSize, total };
}

export function clientIp(req: Request): string | null {
  const forwarded = req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim() || null;
  return req.ip ?? null;
}

export function assertFound<T>(value: T, code?: string, message?: string): NonNullable<T> {
  if (value === null || value === undefined) {
    throw new AppError(404, code ?? "RESOURCE_NOT_FOUND", message ?? "Resource not found.");
  }
  return value;
}
