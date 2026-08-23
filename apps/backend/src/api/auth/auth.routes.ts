// PHASE 8 — Auth API (Phase 4 §2.1, §3.2.1–3.2.5)
import { Router } from "express";
import { authenticate } from "../../core/middleware/auth";
import { rateLimiter } from "../../core/middleware/rate-limit";
import { config } from "../../core/config/env";
import { errors } from "../../core/errors";
import * as authService from "../../core/services/auth.service";
import { findSubjectById } from "../../core/repositories/taxonomy.repo";
import { findUserById } from "../../core/repositories/users.repo";
import { asyncHandler, clearSessionCookie, clientIp, ok, setSessionCookie } from "../../core/utils/http";
import { Validator } from "../../core/validation/schema";

export const authRouter = Router();

const loginLimiter = rateLimiter({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.loginPerMinute,
  keyFn: (req) => `${req.ip ?? "ip"}:${typeof req.body?.email === "string" ? req.body.email.toLowerCase() : "-"}`,
});

const resetLimiter = rateLimiter({ windowMs: 60_000, max: 3 });

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const v = new Validator(req.body);
    v.strictKeys(["email", "password", "full_name", "target_subject_id"]);
    const email = v.string("email", { required: true, max: 254, email: true, lowercase: true });
    const password = v.string("password", { required: true, min: 8, max: 72 });
    const fullName = v.string("full_name", { required: true, min: 2, max: 80 });
    const targetSubjectId = v.uuid("target_subject_id");
    v.finish();

    if (targetSubjectId) {
      const subject = await findSubjectById(targetSubjectId);
      if (!subject) {
        throw errors.validation([
          { field: "target_subject_id", code: "VALIDATION_UNKNOWN_SUBJECT", message: "Target subject does not exist or is inactive." },
        ]);
      }
    }

    const user = await authService.register({ email: email as string, password: password as string, fullName: fullName as string, targetSubjectId });
    ok(res, 201, { id: user.id, email: user.email, full_name: user.fullName, role: user.role, email_verified: false });
  }),
);

authRouter.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const v = new Validator(req.body);
    v.strictKeys(["email", "password"]);
    const email = v.string("email", { required: true, max: 254, lowercase: true });
    const password = v.string("password", { required: true, max: 72 });
    v.finish();

    const result = await authService.login({ email: email as string, password: password as string, ip: clientIp(req) });
    setSessionCookie(res, result.accessToken);
    ok(res, 200, {
      access_token: result.accessToken,
      expires_at: result.expiresAt.toISOString(),
      user: { id: result.user.id, email: result.user.email, role: result.user.roleCode },
    });
  }),
);

authRouter.post(
  "/logout",
  authenticate,
  asyncHandler(async (req, res) => {
    await authService.logout(req.sessionId);
    clearSessionCookie(res);
    ok(res, 200, null);
  }),
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await findUserById(req.principal?.id as string);
    if (!user || user.deletedAt !== null || user.status !== "active") throw errors.unauthenticated();
    ok(res, 200, {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role.code,
      target_subject_id: user.targetSubjectId,
      email_verified: user.emailVerifiedAt !== null,
      created_at: user.createdAt.toISOString(),
    });
  }),
);

authRouter.post(
  "/reset-password",
  resetLimiter,
  asyncHandler(async (req, res) => {
    const v = new Validator(req.body);
    v.strictKeys(["email"]);
    const email = v.string("email", { required: true, max: 254, email: true, lowercase: true });
    v.finish();
    await authService.requestPasswordReset(() => {
      // Delivery transport (email) is out of MVP scope; token persisted for the flow.
    }, email as string);
    ok(res, 200, null);
  }),
);
