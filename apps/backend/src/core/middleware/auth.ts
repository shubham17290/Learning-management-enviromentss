// PHASE 8 — Authentication & authorization middleware (Phase 4 §5).
// Cookie-session transport (API-01): raw token in HttpOnly cookie; SHA-256 in `sessions`.
import { NextFunction, Request, RequestHandler, Response } from "express";
import { config, RoleCode } from "../config/env";
import { AppError, errors } from "../errors";
import { prisma } from "../repositories/prisma";
import { parseCookies } from "../utils/http";
import { sha256Hex } from "../utils/crypto";

export interface Principal {
  id: string;
  email: string;
  roleCode: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      principal?: Principal;
      sessionId?: string;
    }
  }
}

async function resolvePrincipal(req: Request): Promise<{ principal: Principal; sessionId: string } | null> {
  const cookies = parseCookies(req.headers.cookie);
  const raw = cookies[config.session.cookieName];
  if (!raw) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256Hex(raw) },
    select: {
      id: true,
      expiresAt: true,
      revokedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          status: true,
          deletedAt: true,
          role: { select: { code: true } },
        },
      },
    },
  });
  if (!session || session.revokedAt !== null || session.expiresAt.getTime() <= Date.now()) return null;
  if (session.user.deletedAt !== null || session.user.status !== "active") return null;

  return {
    principal: { id: session.user.id, email: session.user.email, roleCode: session.user.role.code },
    sessionId: session.id,
  };
}

export const authenticate: RequestHandler = (req: Request, _res: Response, next: NextFunction): void => {
  resolvePrincipal(req)
    .then((resolved) => {
      if (!resolved) {
        next(errors.unauthenticated());
        return;
      }
      req.principal = resolved.principal;
      req.sessionId = resolved.sessionId;
      next();
    })
    .catch(next);
};

/** Resolves the session when present; never rejects (public* endpoints, Phase 4 §3.1). */
export const optionalAuthenticate: RequestHandler = (req: Request, _res: Response, next: NextFunction): void => {
  resolvePrincipal(req)
    .then((resolved) => {
      if (resolved) {
        req.principal = resolved.principal;
        req.sessionId = resolved.sessionId;
      }
      next();
    })
    .catch(next);
};

export function authorize(...allowedRoles: RoleCode[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const principal = req.principal;
    if (!principal) {
      next(errors.unauthenticated());
      return;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(principal.roleCode as RoleCode)) {
      next(errors.role());
      return;
    }
    next();
  };
}

/** Any authenticated user. */
export const requireAuth: RequestHandler = authorize();

/** Ownership gate helper (Phase 4 §5.3): violation → 403 FORBIDDEN_NOT_OWNER. */
export function assertOwnership(resourceUserId: string, req: Request): void {
  if (resourceUserId !== req.principal?.id) throw errors.notOwner();
}

export function requirePrincipal(req: Request): Principal {
  if (!req.principal) throw new AppError(401, "AUTH_UNAUTHENTICATED", "Authentication required.");
  return req.principal;
}
