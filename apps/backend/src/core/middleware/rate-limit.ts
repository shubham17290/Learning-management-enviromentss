// PHASE 8 — In-memory fixed-window rate limiter (Phase 4 §10).
// Single-process MVP; swap for a shared store when horizontally scaled.
import { NextFunction, Request, RequestHandler, Response } from "express";
import { errors } from "../errors";

interface Bucket {
  count: number;
  resetAt: number;
}

export function rateLimiter(options: {
  windowMs: number;
  max: number;
  keyFn?: (req: Request) => string;
}): RequestHandler {
  const buckets = new Map<string, Bucket>();
  let lastSweep = Date.now();

  return (req: Request, _res: Response, next: NextFunction): void => {
    const now = Date.now();
    if (now - lastSweep > options.windowMs) {
      for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
      }
      lastSweep = now;
    }

    const key = options.keyFn ? options.keyFn(req) : req.principal?.id ?? req.ip ?? "anonymous";
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }
    if (bucket.count >= options.max) {
      next(errors.rateLimited((bucket.resetAt - now) / 1000));
      return;
    }
    bucket.count += 1;
    next();
  };
}
