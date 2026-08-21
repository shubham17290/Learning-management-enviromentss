// PHASE 6 — FOUNDATION SERVER
// Base HTTP server only. No business endpoints.
// Application modules (auth, questions, practice, analytics, admin)
// are added in later phases per the Phase 4 architecture under src/api + src/core.

import express from "express";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(express.json());

// Health check only: verifies the server boots. Not application logic.
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gate-pyq-backend" });
});

app.listen(port, () => {
  console.log(`[backend] foundation server listening on http://localhost:${port}`);
});
