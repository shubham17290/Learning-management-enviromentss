// PHASE 8 — Application composition (Phase 4 §1, §9, §12)
// Router + middleware chain + global error normalization to the Phase 4 envelope.
import express, { NextFunction, Request, Response } from "express";
import { config } from "./core/config/env";
import { AppError, errors } from "./core/errors";
import { requestId } from "./core/utils/http";

import { authRouter } from "./api/auth/auth.routes";
import { subjectsRouter } from "./api/subjects/subjects.routes";
import { questionsRouter } from "./api/questions/questions.routes";
import { practiceRouter } from "./api/practice/practice.routes";
import { bookmarksRouter } from "./api/bookmarks/bookmarks.routes";
import { analyticsRouter } from "./api/analytics/analytics.routes";
import { adminRouter } from "./api/admin/admin.routes";

const app = express();
app.disable("x-powered-by");

// Request correlation (Phase 4 §9: request-id echoed in header).
app.use((req: Request, res: Response, next: NextFunction) => {
  requestId(req, res);
  next();
});

// Baseline security headers.
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

// CORS for the approved frontend origin; cookie credentials required (API-01).
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", config.corsOrigin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Vary", "Origin");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Request-Id",
  );
  if (req.method === "OPTIONS") {
    res.status(204).send();
    return;
  }
  next();
});

// JSON body parsing; malformed JSON is normalized by the global error handler.
app.use(express.json({ limit: "256kb" }));

// Versioned API root (Phase 4 §12).
const api = express.Router();

api.get("/health", (_req: Request, res: Response) => {
  res.json({ success: true, data: { status: "ok", service: "gate-pyq-backend" } });
});

api.use("/auth", authRouter);
api.use("/subjects", subjectsRouter);
api.use("/questions", questionsRouter);
api.use("/practice-sessions", practiceRouter);
api.use("/bookmarks", bookmarksRouter);
api.use("/", analyticsRouter);
api.use("/admin", adminRouter);

app.use(config.apiPrefix, api);

// Unknown route → normalized 404 (Phase 4 §4: never a bare response).
app.use((_req: Request, res: Response) => {
  const error = errors.notFound();
  res.status(error.status).json({
    success: false,
    error: { code: error.code, message: "Route not found.", details: [] },
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  const id = res.getHeader("X-Request-Id");

  // Malformed JSON body → 400 (Phase 4 §9).
  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    (error as { type?: string }).type === "entity.parse.failed"
  ) {
    const bad = errors.malformed();
    res.status(bad.status).json({ success: false, error: { code: bad.code, message: bad.message, details: [] } });
    return;
  }

  if (error instanceof AppError) {
    for (const [header, value] of Object.entries(error.headers)) res.setHeader(header, value);
    res.status(error.status).json({
      success: false,
      error: { code: error.code, message: error.message, details: error.details },
    });
    return;
  }

  // Unexpected: log server-side only; never leak internals (Phase 4 §9).
  console.error(`[error] request=${String(id)} route=${req.method} ${req.originalUrl}`, error);
  const internal = errors.internal();
  res.status(internal.status).json({
    success: false,
    error: { code: internal.code, message: internal.message, details: [{ field: "request_id", code: String(id ?? "") }] },
  });
});

export default app;

// Entry point when run directly (`npm run dev` / `npm start`).
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`[backend] API listening on http://localhost:${config.port}${config.apiPrefix}`);
  });
}
