# PHASE 4 — API ARCHITECTURE & BACKEND DESIGN
## GATE CS & IT PYQ Practice Platform

> **Source of truth:** Approved Phase 0 (Discovery), Phase 1 (PRD), Phase 2 (IA/Flow), Phase 3 (DB Design).
> **Referred IDs:** FR-xxx (PRD §2), PM-xxxx (PRD §4.1), MA-xxx (PRD §5), OD-xx, UXD-xx, PG-/ADM-xxx (Phase 2), `table` names (Phase 3).
> **Non-negotiable scope:** design only — no application code, no API files, no repo changes, no installs, no migrations.

---

## 1. Backend Architecture

### 1.1 Responsibilities
Backend: authentication, authorization, input validation, business rules (grading, session lifecycle, analytics derivation), persistence (Phase 3 schema), audit logging, rate limiting, error normalization, API versioning.

Backend does **not**: render UI, manage client state, hold MVP WebSockets (stateless request/response), host file storage (none in MVP).

### 1.2 Application layers
| Layer | Responsibility |
|---|---|
| API Gateway / HTTP Router | route + versioning + middleware chain |
| Authentication middleware | resolve identity from session/token; set `user` + `role` |
| Authorization middleware | role + ownership gates before handler |
| Validation middleware | parse + semantic validation → 422/400 |
| Controller | parse request → service → map response + status |
| Service (domain) | business rules: grading, scoring, session flow, analytics |
| Repository (data access) | parameterized SQL, row↔domain mapping, transactions |
| PostgreSQL | single source of truth (Phase 3) |

### 1.3 Request/response flow
```
Client
  ↓
Gateway / Router
  ↓
Authentication middleware
  ↓
Authorization middleware
  ↓
Validation middleware
  ↓
Controller
  ↓
Service (business logic)
  ↓
Repository / data access
  ↓
PostgreSQL
```

### 1.4 Cross-cutting layer placement
- **Auth:** middleware, before controller.
- **Authorization:** role check in middleware; resource-ownership (row-level) in controller/service after load.
- **Validation:** boundary (schema) + business (service/repo).
- **Business logic:** service layer; grading lives here (one canonical path).
- **Data access:** repository; transactions per operation.
- **Error:** any thrown → global handler → normalized error.

---

## 2. API Modules

> All endpoints are from approved PRD MVP + Should scope; no invented features.

### 2.1 Authentication
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/reset-password` (Should). Prefixed `/api/v1`.

### 2.2 Subjects & Topics
- `GET /subjects`, `GET /subjects/{id}`, `GET /subjects/{id}/topics`, `GET /subjects/{id}/topics/{tid}/questions`.

### 2.3 Questions
- `GET /questions/{id}`, `GET /questions` (filter/search).
- Session-driven fetch/eval live under practice sessions (§2.4) — no standalone "question set" endpoint needed.

### 2.4 Practice Sessions
- `POST /practice-sessions` (create), `POST /practice-sessions/{id}/start`, `POST /practice-sessions/{id}/attempts`, `POST /practice-sessions/{id}/complete`, `GET /practice-sessions/{id}`, `GET /practice-sessions/{id}/result`.

### 2.5 Student Features
- **Bookmarks:** `GET /bookmarks`, `POST /bookmarks`, `DELETE /bookmarks/{id}` (FR-BMARK).
- **Notes (Future):** `GET/POST/PUT/DELETE /notes` — wire preserved, marked Future.
- **Mistakes:** `GET /mistakes` (derived from attempts).
- **Performance:** `GET /performance/overview`, `/performance/subjects`, `/performance/topics`.

### 2.6 Dashboard (read-only derived)
- `GET /dashboard/summary`, `GET /dashboard/subjects`, `GET /dashboard/topics`, `GET /dashboard/weak`.

### 2.7 Admin
- **Subjects:** GET/POST/PUT/DELETE `/admin/subjects` (FR-ADM-07).
- **Topics:** GET/POST/PUT/DELETE `/admin/topics` (FR-ADM-07).
- **Questions:** GET/POST/PUT `/admin/questions`, `POST /admin/questions/{id}/publish`, `POST /admin/questions/{id}/reject`, `POST /admin/questions/import` (Should).
- **Users:** `GET /admin/users`, `PATCH /admin/users/{id}` (FR-ADM-08).
- **Audit:** `GET /admin/audit` (FR-ADM-09).

---

## 3. API Specification

### 3.1 Endpoint Summary Table
| Method | Endpoint | Auth | Role | Purpose | PRD Ref |
|---|---|---|---|---|---|
| POST | /api/v1/auth/register | Public | — | create account | FR-AUTH-01 |
| POST | /api/v1/auth/login | Public | — | authenticate | FR-AUTH-02 |
| POST | /api/v1/auth/logout | User | any authenticated | revoke session | FR-AUTH-03 |
| GET | /api/v1/auth/me | User | any | profile + role | FR-AUTH-02 |
| POST | /api/v1/auth/reset-password | Public | — | recovery (Should) | FR-AUTH-05 |
| GET | /api/v1/subjects | Public* | read | list subjects | FR-SUBJ-01 |
| GET | /api/v1/subjects/{id} | Public* | read | subject detail | FR-SUBJ-02 |
| GET | /api/v1/subjects/{id}/topics | User | read | topics list | FR-TOPIC-01 |
| GET | /api/v1/subjects/{id}/topics/{tid}/questions | User | read | Qs by topic | FR-TOPIC-02, FR-PRAC-01 |
| POST | /api/v1/practice-sessions | User | — | create session | FR-PRAC-01 |
| POST | /api/v1/practice-sessions/{id}/start | Owner | — | start session | FR-PRAC-01 |
| POST | /api/v1/practice-sessions/{id}/attempts | Owner | — | record attempt | FR-PRAC, FR-EVAL |
| POST | /api/v1/practice-sessions/{id}/complete | Owner | — | finish + score | FR-PRAC-07 |
| GET | /api/v1/practice-sessions/{id} | Owner | — | resume/review | FR-TIME, FR-PRAC |
| GET | /api/v1/practice-sessions/{id}/result | Owner | — | result + analytics | FR-EVAL-04, FR-EXPL |
| GET | /api/v1/questions/{id} | User | read | single question | FR-PRAC |
| GET | /api/v1/questions | User | read | filter/search | FR-PRAC |
| GET | /api/v1/bookmarks | Owner | — | bookmark list | FR-BMARK-02 |
| POST | /api/v1/bookmarks | User | — | create bookmark | FR-BMARK-01 |
| DELETE | /api/v1/bookmarks/{id} | Owner | — | remove bookmark | FR-BMARK-02 |
| GET | /api/v1/mistakes | Owner | — | mistake history | FR-MIST-01 |
| GET | /api/v1/performance/overview | Owner | — | dashboard metrics | FR-DASH-01 |
| GET | /api/v1/performance/subjects | Owner | — | subject perf | FR-DASH-02 |
| GET | /api/v1/performance/topics | Owner | — | topic perf + weak | FR-DASH-02, MA-WEAK |
| GET | /api/v1/dashboard/summary | Owner | — | dashboard | FR-DASH-01/02, FR-REC |
| GET | /api/v1/dashboard/subjects | Owner | — | subject dashboard | FR-DASH-02 |
| GET | /api/v1/dashboard/topics | Owner | — | topic dashboard | FR-DASH-02 |
| GET | /api/v1/dashboard/weak | Owner | — | weak-topics | FR-REC-01 |
| GET | /api/v1/admin/subjects | Admin | admin | list subjects | FR-ADM-07 |
| POST | /api/v1/admin/subjects | Admin | admin | create subject | FR-ADM-07 |
| PUT | /api/v1/admin/subjects/{id} | Admin | admin | update subject | FR-ADM-07 |
| DELETE | /api/v1/admin/subjects/{id} | Admin | admin | deactivate | FR-ADM-07 |
| GET | /api/v1/admin/topics | Admin | admin | list topics | FR-ADM-07 |
| POST | /api/v1/admin/topics | Admin | admin | create topic | FR-ADM-07 |
| PUT | /api/v1/admin/topics/{id} | Admin | admin | update topic | FR-ADM-07 |
| DELETE | /api/v1/admin/topics/{id} | Admin | admin | deactivate topic | FR-ADM-07 |
| GET | /api/v1/admin/questions | Mod/Admin | mod/admin | review queue | FR-ADM-03 |
| POST | /api/v1/admin/questions | Mod/Admin | mod/admin | create q | FR-ADM-01 |
| PUT | /api/v1/admin/questions/{id} | Mod/Admin | mod/admin | edit q | FR-ADM-02 |
| POST | /api/v1/admin/questions/{id}/publish | Mod/Admin | mod/admin | publish | FR-ADM-03 |
| POST | /api/v1/admin/questions/{id}/reject | Mod/Admin | mod/admin | reject | FR-ADM-03 |
| POST | /api/v1/admin/questions/import | Admin | admin | bulk import (Should) | FR-ADM-05 |
| GET | /api/v1/admin/users | Admin | admin | list users | FR-ADM-08 |
| PATCH | /api/v1/admin/users/{id} | Admin | admin | role/status | FR-ADM-08 |
| GET | /api/v1/admin/audit | Admin | admin | audit log | FR-ADM-09 |

> `*` — subjects listing made public-read for landing/guest trial (matches Phase 2 PG-HOME + guest trial); authenticated students see accuracy, guests see counts only.

---

## 3.2 Detailed Endpoint Specifications

> Full JSON contracts for the core endpoint set. All endpoints share the response envelope from §4. Unless noted, request/response Content-Type is `application/json`; IDs are UUID strings.

### 3.2.1 `POST /api/v1/auth/register`
- **Auth/Role:** Public.
- **Request body (JSON):**
| Field | Type | Required | Constraint |
|---|---|---|---|
| email | string | yes | valid email; unique; lowercase-canonical |
| password | string | yes | 8–72 chars; ≥1 letter + ≥1 digit |
| full_name | string | yes | 2–80 chars |
| target_subject_id | uuid | no | must exist and be active |
- **Validation:** structural (422) → email format, password rules; business (409) → email already registered.
- **Response 201:**
```json
{ "success": true, "data": { "id": "uuid", "email": "...", "full_name": "...", "role": "student", "email_verified": false } }
```
- **Errors:** 400 malformed body; 409 EMAIL_ALREADY_REGISTERED; 422 INVALID_EMAIL / WEAK_PASSWORD; 500 generic.
- **Notes:** creates `users` row (status `active`, role `student`); verification email sent (async).

### 3.2.2 `POST /api/v1/auth/login`
- **Auth/Role:** Public (rate-limited).
- **Request body:** email, password.
- **Validation:** required; rate limit 5/min → 429; account lockout after 5 fails/15min.
- **Response 200:**
```json
{ "success": true, "data": { "access_token": "jwt-or-session", "expires_at": "iso", "user": { "id": "...", "email": "...", "role": "student" } } }
```
- **Errors:** 400 missing fields; 401 AUTH_INVALID_CREDENTIALS; 401 AUTH_ACCOUNT_DISABLED; 429 RATE_LIMITED.

### 3.2.3 `POST /api/v1/auth/logout`
- **Auth:** User; revokes current session token (session row `revoked_at`).
- **Response 200:** `{ "success": true, "data": null }`

### 3.2.4 `GET /api/v1/auth/me`
- **Auth:** User.
- **Response 200:** id, email, full_name, role, target_subject_id, email_verified, created_at. (No password_hash ever.)

### 3.2.5 `POST /api/v1/practice-sessions` (create)
- **Auth:** User.
- **Request body:**
| Field | Type | Required | Constraint |
|---|---|---|---|
| mode | enum | yes | subject\|topic\|year\|difficulty\|mistake\|custom |
| filters | object | yes | subject_id, topic_id, year, difficulty, question_types (≤2 keys active) |
| timed | boolean | no | default false |
| question_count | int | no | 1–50, default 20 |
- **Validation:** filters must reference active subject/topic; count 1–50; ≥1 published question must match (else 422 NO_MATCHING_QUESTIONS).
- **Response 201:**
```json
{ "success": true, "data": { "id": "uuid", "mode": "topic", "timed": false, "total_questions": 12, "status": "in_progress", "started_at": "iso" } }
```
- **PRD:** FR-PRAC-01; creates `practice_sessions` row.

### 3.2.6 `POST /api/v1/practice-sessions/{id}/attempts` (record attempt)
- **Auth:** Owner-only (session.user_id === auth.user).
- **Request body:**
| Field | Type | Required | Constraint |
|---|---|---|---|
| question_id | uuid | yes | must be in session pool |
| answer | object | yes | type-specific: MCQ `{option_id}`; MSQ `{option_ids[]}`; NAT `{value, unit?}` |
| time_taken_seconds | int | yes | ≥0, ≤ 3600 |
- **Validation:** question belongs to live session (`in_progress`); field rules per type; idempotency: re-post for a question updates the attempt (upsert) — see §8.
- **Response 200 / 201:**
```json
{ "success": true, "data": { "attempt_id": "uuid", "question_id": "...", "is_correct": true, "marks": 1, "time_taken_seconds": 45 } }
```
- **Errors:** 403 NOT_OWNER; 404 SESSION_NOT_FOUND; 409 SESSION_NOT_LIVE; 422 INVALID_ANSWER / QUESTION_NOT_IN_SESSION.
- **PRD:** FR-PRAC-06/07, FR-EVAL.

---

### 3.2.7 `POST /api/v1/practice-sessions/{id}/complete`
- **Auth:** Owner.
- **Request body:** `{ "unanswered_policy": "skipped" }` (matches OD-06 default; server authoritative).
- **Validation:** session live; already-completed → 409.
- **Behavior:** finalize grading of any ungraded attempts (NAT not answered → not scored, status `skipped` per OD-06); compute score; set status `completed`; write audit; return result payload.
- **Response 200:** as §3.2.9.
- **Errors:** 403 NOT_OWNER; 404 SESSION_NOT_FOUND; 409 SESSION_NOT_LIVE.

### 3.2.8 `GET /api/v1/practice-sessions/{id}` / `{id}/result`
- **Auth:** Owner.
- **Response 200 (result):**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid", "mode": "topic", "timed": false,
    "status": "completed", "started_at": "iso", "ended_at": "iso",
    "score": { "total_marks": 41.0, "max_marks": 100.0, "negative_marks": -6.0 },
    "summary": { "attempted": 78, "correct": 62, "incorrect": 16, "skipped": 3 },
    "per_topic": [ { "topic_id": "uuid", "attempted": 10, "correct": 7 } ],
    "mistakes": [ "question_id" ],
    "explanations": [ { "question_id": "uuid", "explanation": "..." } ]
  }
}
```
- **Errors:** 403 NOT_OWNER; 404; session not completed → 409 RESULT_NOT_READY.

### 3.2.9 `POST /api/v1/bookmarks`
- **Auth:** User.
- **Body:** `{ "question_id": "uuid" }`.
- **Validation:** question exists + published (404/422); duplicate → 409 ALREADY_BOOKMARKED.
- **Response 201:** bookmark id + question_id. `DELETE /bookmarks/{id}` → 204 (owner).
- **PRD:** FR-BMARK-01/02.

### 3.2.10 `GET /api/v1/mistakes`
- **Auth:** Owner.
- **Query:** `topic_id?`, `subject_id?`, `page`.
- **Response 200:** list of question_ids answered incorrectly (derived from attempts where `is_correct=false`), newest first; paginated.
- **PRD:** FR-MIST-01; used by PM-MIST mode.

### 3.2.11 `GET /api/v1/performance/overview | subjects | topics`
- **Auth:** Owner.
- Derives from `attempts` joins (§11 analytics). Subject/topic endpoints support `page`.
- **Response shape (topics):**
```json
{ "success": true, "data": { "items": [ { "topic_id": "uuid", "attempts": 5, "correct": 1, "accuracy": 0.2, "avg_time_s": 60, "weak": true } ], "meta": { "page": 1, "page_size": 20, "total": 14 } } }
```
- Default derived threshold for weak = accuracy < 0.45 AND attempts ≥ 5 (OD-05 default).

### 3.2.12 `GET /api/v1/dashboard/summary` + `/weak`
- **Auth:** Owner.
- **Response summary:** accuracy (overall), total_attempts, avg_time_s, streak_days, last_session.
- **Response weak:** ranked weak topics with `recommendation` (one-click target prefill); supports `limit` (default 5, max 20).
- **PRD:** FR-DASH-01/02, FR-REC-01/02.

### 3.2.13 `POST/PUT /api/v1/admin/questions` + `publish/reject`
- **Auth:** Mod/Admin (publish/reject requires role); separation of duties: author ≠ publisher (OD-07) → 403 AUTHOR_CANNOT_PUBLISH.
- **Form validation (§6):** type-specific answer; fields required; active subject/topic.
- **POST /publish:** transitions `in_review → published`, increments version, writes snapshot + audit.
- **POST /reject:** body requires `reason` (`text`, 10–500 chars); → `rejected`.
- **PRD:** FR-ADM-01/02/03/04.

### 3.2.14 `GET /api/v1/questions` (+ filter)
Query params: `subject_id`, `topic_id`, `year`, `difficulty`, `type`, `page`, `sort`. Sort allowlist: `year`, `difficulty`, `id`; default `id asc`. Returns **without** correct answers/explanations unless `include_answer=true` (admin only) — student view hides answers (FR-EVAL-04).

---

## 4. Response Format

### 4.1 Envelope (adopted)
Success:
```json
{ "success": true, "data": {} }
```
Error (with details):
```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human-readable message", "details": [] } }
```
- **Why this shape:** one visual + machine-verifiable success flag; `error` isolated from `data`; stable `code` for client branching; `details` array carries per-field errors (e.g., `[{ "field": "email", "code": "INVALID_EMAIL" }]`) without inventing a second format.
- **Pagination metadata** lives in `data.meta`: `{ "page", "page_size", "total", "next_offset?" }`.
- **Empty results:** `{ "success": true, "data": { "items": [], "meta": {...} } }` — never 404 for a list.
- **Partial success:** none expected (create/update are atomic via transactions); if a bulk import has partial rows, it returns **200 with `data.report`** (`imported`, `failed`, `errors[]`) — explicit blended result, not a mixed HTTP code.
- **Error code convention:** `<DOMAIN>_<CONDITION>` uppercase snake, e.g. `AUTH_INVALID_CREDENTIALS`, `RESOURCE_NOT_FOUND`, `VALIDATION_INVALID_EMAIL`, `RATE_LIMITED`, `CONFLICT_EMAIL_EXISTS`, `CONFLICT_ALREADY_BOOKMARKED`.

---

## 5. Authentication & Authorization

### 5.1 Strategy: **HTTP-only cookie session (server-side)**
Chosen over pure stateless JWT: logout/token revocation is fully server-side (matches Phase 3 `sessions` table + `revoked_at`), no client-side secret handling, dead-simple revocation exactly aligns with PRD logout (FR-AUTH-03) and lockout.
- Session stored in `sessions` (token_hash), cookie `HttpOnly; Secure; SameSite=Lax; Path=/`.
- **Token lifecycle:** issue at login (30-day sliding window), refresh by re-login; logout sets `revoked_at`; account disable revokes all active sessions (admin action).
- **CSRF:** SameSite=Lax + (where cookie auth is used) double-submit origin token for cross-site mutations if the backend is cookie-only.

> **Deviating from stateless JWT** is a deliberate decision, logged as Needs Decision API-01 (JWT bearer vs cookie-session) with cookie-session as recommended default.

### 5.2 Role-based authorization (roles from Phase 1)
- `student` (R2), `moderator` (R3), `admin` (R4). Guest (R1) uses public endpoints only.
- Middleware: `authenticate()` → resolves user; `authorize(role[])` → gate handler.
- **Public endpoints:** register, login, reset-password, list subjects (read).
- **Protected (any authenticated):** subjects/topics read, questions read, practice create/start, bookmarks, questions.
- **Owner-only:** practice session lifecycle, attempts, mistakes, performance, dashboard, bookmarks.
- **Admin-only:** `/admin/*` (moderator gets read + review + publish + reject on questions, but **not** users/audit/import — those are admin-only, per PRD matrix).

### 5.3 IDOR prevention (student cannot read another's data)
- **Rule:** every per-user resource resolves owner from the **authenticated principal**; resource id from path is joined with `user_id = {auth.user}` in the repository query (e.g., `SELECT ... WHERE id=? AND user_id=?`).
- **Defense in depth:** ownership check in Service before any mutation/read; never trust `user_id` from request body; RLS policy on `practice_sessions`, `attempts`, `bookmarks`, `notes` as last-line (Phase 3 §14.1).
- Violations → **403 NOT_OWNER** (not 404, so existence is not leaked).

---

## 6. Validation Strategy

> Two gates: **structural** (request schema, at API boundary → 422) and **business** (service/repo, uniqueness, lifecycle → 409/422).

| Input | Field rules (boundary) | Business rules (service) | Location |
|---|---|---|---|
| **Register** | email format + unique-check-trigger; password 8–72 chars, 1 letter + 1 digit; full_name 2–80 | email uniqueness → 409; target_subject exists & active | middleware + service |
| **Login** | email + password required | rate limit 5/min → 429; lockout on 5 fails → 401/429; account status active | middleware + auth service |
| **Question submission (student attempt)** | answer shape per type (see §7); time_taken 0–3600 | question in session pool; session live; upsert (idempotent) | service (attempt) |
| **Practice config (create session)** | mode enum; filters object; count 1–50 | ≥1 published match; active subject/topic | service |
| **Notes** (Future) | body 1–1000 chars; trim; no control chars | owned, question exists | service |
| **Bookmarks** | question_id uuid | question published; no duplicate → 409 | service |
| **Admin question create/edit** | type enum; body ≥5 chars; marks 0–100; year int 1990–current+1; difficulty enum; subject/topic active; answer per type (`option_id` for MCQ, `option_ids[>=1]` MSQ, `numeric_value` NAT) | MCQ exactly 1 correct option; MSQ ≥1 correct; NAT ≥1 numeric value with tolerance | middleware + service |
| **Admin publish/reject** | reject requires reason 10–500 | author ≠ publisher (OD-07); lifecycle state valid | service |

- **Where:** structural validation runs in middleware (fast-fail before controller); business validation runs in service (needs DB); both return the §4 envelope.
- **HTTP status:** 422 for structural/semantic validity; **409** for conflicts (duplicate email/bookmark, lifecycle wrong); **400** only for malformed JSON.

---

## 7. Question Submission Logic (evaluation per type)

> Single canonical **grading service** used by attempt recording AND session completion. No alternate paths.

### 7.1 MCQ
```
input  : question_version, submitted_option_id
correct: option_id where is_correct = true
grade  : correct = (submitted_option_id == correct_option_id)
marks  : if correct: +marks
         else if negative policy enabled: -negative_marks (OD-01)
         else 0
response: is_correct, correct_option_id (per FR-EVAL-04 timing), explanation (post-submit)
validation: exactly one option_id required; option must belong to question
```
### 7.2 MSQ
```
input   : question_version, submitted_option_id_set
correct : set of option_ids where is_correct = true (size k)
grade   : submitted must be subset of question options; no duplicates
          if correct == submitted            →  full marks
          else if submitted ⊂ correct (proper) → partial marks (OD-03 default: partial credit)
          else                                 →  zero (or negative per policy, OD-01)
response: is_correct, correct set, explanation
validation: 1 ≤ |submitted| ≤ n-1; every id belongs to question
```
### 7.3 NAT
```
input   : submitted_value (string), optional unit
normalize: trim; parse numeric (decimals, scientific notation e.g. 1.5e3, sign);
           uppercase unit compare (case-insensitive) if question has unit
compare : |submitted - numeric_value| <= tolerance_abs
          OR |submitted - numeric_value| <= tolerance_rel * |numeric_value|   (if set)
          unit must match if declared
grade   : Boolean correct; no partial
response: is_correct, correct_value (reveal timing per FR-EVAL-04), explanation
validation: must parse to finite number; unit optional if no unit declared
```
**Edge cases:** multiple accepted NAT values → correct if any key matches; precision never affects grading (tolerance only); scientific notation normalized server-side; negative values and leading zeros accepted.

---

## 8. Practice Session Logic

### 8.1 Lifecycle
```
POST /practice-sessions            → create (row: status=in_progress, config)
POST /practice-sessions/{id}/start → pool built + first question, timer anchor (server clock)
GET  /practice-sessions/{id}       → restore question pool + attempts (resume)
POST /practice-sessions/{id}/attempts → record/upsert answer + grade (per §7)
POST /practice-sessions/{id}/complete → normalize unanswered per OD-06, compute score, status=completed
GET  /practice-sessions/{id}/result   → grades + per-topic + mistakes + explanations
```
Server is authoritative for the clock and state; client is a thin renderer of `practice_sessions` + `attempts`.

### 8.2 Edge cases
| Case | Behavior |
|---|---|
| **Question left unanswered** | `complete` records it as `skipped` (OD-06 default); not scored; still shown in result. User CAN go back and answer before submit (client + server allow update until `complete`). |
| **Refresh mid-session** | Session persists server-side (`in_progress`); `GET practice-sessions/{id}` restores pool + saved attempts; timer recomputes from server anchor (elapsed = now − started_at − sum_pauses). |
| **Time limit expiry** | On `complete` called after `deadline`, server marks time-expired; unanswered policy applies (OD-06); partial answers preserved. If a timer were to auto-finalize server-side: mark status `completed`, unanswered = skipped (flagged as **Needs Decision API-02** — auto-submit vs student-submit-only). |
| **Same question attempted again (retry)** | Within one session: attempts are **upserted per question** (unique session_id+question_version_id); duplicate post updates, does not create a second row. Across sessions: each session is independent (PM modes build own pools; deliberate repeat allowed). |
| **Answer submitted twice** | Idempotent upsert; second identical body returns 200 with same attempt; a changed answer **before complete** updates the row; after `complete` → 409 SESSION_NOT_LIVE. |
| **Network failure during submission** | Client retry with same body; server upsert makes retries safe (idempotent key = session+question). No partial writes (transaction per attempt). |
| **Session abandoned** | Status `abandoned` after 24h without `complete` (Phase 2 24h window); history preserved; resume window honored by `GET`. |

### 8.3 State + result calculation
- **State** is **server-side** (`practice_sessions.status` + attempts rows); client keeps no source of truth.
- **Progress saved** per attempt row as it happens (per-question).
- **Results** computed **at completion** from recorded attempts (score rollup); no incremental aggregate.
- **Analytics refresh:** derived on read (performance/dashboard endpoints compute from attempts). Optionally mark a future cache refresh hook at completion — **deferred** (Phase 3 §11.3).

---

## 9. Error Handling

| Code | Used when | Response |
|---|---|---|
| 400 | malformed JSON, wrong content-type, missing top-level fields | `{success:false, error:{code:'MALFORMED_REQUEST', message, details}}` |
| 401 | no/invalid/expired session; bad credentials | `AUTH_UNAUTHENTICATED` / `AUTH_INVALID_CREDENTIALS` |
| 403 | role insufficient; not owner; author cannot publish | `FORBIDDEN_ROLE` / `FORBIDDEN_NOT_OWNER` / `FORBIDDEN_AUTHOR_CANNOT_PUBLISH` |
| 404 | resource id not found (scoped) | `RESOURCE_NOT_FOUND` |
| 409 | duplicate email, duplicate bookmark, session not live, result not ready | `CONFLICT_EMAIL_EXISTS`, `CONFLICT_ALREADY_BOOKMARKED`, `CONFLICT_STATE_*` |
| 422 | semantic validation failed | `VALIDATION_*` with `details[field]` |
| 429 | rate limit | `RATE_LIMITED` (include `Retry-After`) |
| 500 | unexpected error | `INTERNAL_ERROR` — generic; no stack/SQL/path |

**Global handler behavior:**
- Any thrown/typed error is caught centrally; mapped to the §4 envelope; context (stack, query) is written to **server logs only** (structured, request-id correlation).
- Logging: request-id header echoed in `error.details`/response header; structured logs include route, principal id, latency, outcome; sanitized (no PII/secrets/raw SQL).
- Never expose internal identifiers, traces, or file paths in client responses.

---

## 10. Security

| Threat | API-level control |
|---|---|
| Unauthorized access | `authenticate()` middleware on all non-public endpoints; session cookie revocable |
| IDOR | owner-scoped queries (`WHERE ... user_id = principal`), service-level ownership check, RLS last-line |
| SQL injection | parameterized queries only (repository); no string-built SQL from user input |
| XSS | server-side output encoding of question text/answers; `Content-Type: application/json`; no HTML in API responses |
| Brute-force | login rate limit (5/min per user+IP), progressive lockout, generic failure messages |
| Excessive requests | global per-user rate limit (e.g., 120 req/min, burst 30) on AUth + analytics; `Retry-After` on 429 |
| Malicious admin requests | RBAC + audit logging of every admin mutation (audit_log row) |
| Invalid payloads | strict JSON schema validation middleware; reject unknown/extra fields; enforce charset |

---

## 11. Performance Strategy

| Concern | Strategy |
|---|---|
| **Pagination** | Offset pagination (`page`,`page_size`), `page_size` 1–50 default 20, `max=100`; `meta.next_offset` for cursor-less paging. Keyset (cursor) reserved for very large lists (Future). |
| **Filtering** | Query params allowlist: `subject_id`, `topic_id`, `year`, `difficulty`, `type`; unknown param → 422 (strict) |
| **Sorting** | Allowlisted columns only (`year`, `difficulty`, `id`); else 422 |
| **Search** | MVP = filter by subject/topic/year/difficulty (no free-text). Full-text search deferred (Phase 3 §9 defers GIN index), documented as Future |
| **Question retrieval** | Session pool fetched in **one** indexed query (`ix_questions_status_published_topic`); options/answers fetched with a single `IN` join; no N+1 |
| **Dashboard queries** | On-the-fly group-by over `attempts` using `ix_attempts_user_id_answered_at`; no pre-aggregation (MVP scale) |
| **Analytics** | Same; derive at read. Materialized view / `topic_stats_cache` only if p95 > ~100ms and measured (Phase 3 §11.3) |
| **Caching** | Only genuinely static: subjects/topics list (short TTL, e.g., 60s, invalidated on admin change). **Never cache** user-owned data or live sessions. |

---

## 12. API Versioning

- **Recommended: version from day one** at `/api/v1`.
- **Why now:** cheap to do at the router prefix; prevents breaking clients during MVP iteration; unambiguous contract boundary between app + API.
- **Convention:** `/api/v1/<resource>`; breaking changes → `/api/v2` while v1 stays live (with sunset policy). Non-breaking additions (new optional fields/endpoints) do not bump.
- **If deferred:** would still adopt prefix later via `Accept`-based negotiation or a new router root; but from day one is the zero-cost, safer default.

---

## 13. Backend Folder Architecture

```
src/
  api/
    auth/          # register, login, logout, me, reset-password
    subjects/      # list, detail, topics, topic-questions
    questions/     # get, filter/search, (grading logic delegated to core/grading)
    practice/      # create, start, attempts, complete, result
    bookmarks/
    notes/         # Future (wire preserved)
    analytics/     # mistakes, performance/*, dashboard/*
    admin/         # subjects CRUD, topics CRUD, questions CRUD/publish/reject/import,
                   # users, audit
  core/
    middleware/    # authenticate, authorize(roles), validate(schema), rate-limit
    errors/        # typed errors + global handler + error-code registry
    validation/    # request schemas (JSON schema), business rules
    grading/       # canonical MCQ/MSQ/NAT evaluation (single implementation)
    services/      # domain: session lifecycle, analytics derivation, bookmark rules
    repositories/  # parameterized data access, transactions (Phase 3 tables)
    config/        # env/typed config, feature flags
    utils/         # pagination, sorting, ids, time, logging
  migrations/      # (versioned SQL, forward-only — Phase 3 §14.4)  [designed, not written]
```

**Responsibilities:** `api/*` thin HTTP; `core/grading` single source of truth for evaluation (§7); `core/services` business rules; `core/repositories` map Phase 3 tables; `core/errors` normalizes everything to the §4 envelope; `config` holds version flag, rate-limit limits, weak-topic thresholds (configurable — OD-05).

---

## 14. API Security & Data Ownership Matrix

| Resource | Student | Admin | Moderator | Owner only? |
|---|---|---|---|---|
| `users` (profile) | read own; edit own (Should) | read/list; manage role/status (FR-ADM-08) | none | **yes** (own only) |
| `subjects`, `topics` | read (counts/accuracy for self) | CRUD (FR-ADM-07) | read | no (public read; admin manage) |
| `questions` | read published only | CRUD + publish/reject/import | read + review + publish/reject (not author) | n/a (global) |
| `practice_sessions` | create own, run own, read own | none (admin read in future) | none | **yes** |
| `attempts` | create/read own | none (aggregate-only in future) | none | **yes** |
| `bookmarks` | create/list/delete own | none | none | **yes** |
| `notes` | create/edit/delete own (Future) | none | none | **yes** |
| `mistakes` | read own (derived) | none | none | **yes** |
| `performance` | read own | none | none | **yes** |
| `audit_log` | none | read (FR-ADM-09) | none | n/a (global) |
| `question_reports` | create (report), none else | resolve (Should) | review | report rows keyed to reporter; resolution by moderator/admin |

> Per PRD §1.2: moderator cannot access student PII/analytics; admin sees aggregate-only analytics (no per-user exposure in dashboard endpoints). Guest uses public endpoints only (no persistence).

---

## 15. Final API Consistency Checklist

- [x] Every MVP user flow (Phase 2 §3, §4) has endpoints: register/login, subject→topic→setup→session→result, mistakes, bookmarks, dashboard+recommendation, admin add/approve.
- [x] Every endpoint maps to a PRD requirement; no extra endpoints (admin import/user/password-reset are Should-scope).
- [x] No unnecessary endpoints — subject/topics/questions/practice/bookmarks/dashboard/admin only.
- [x] Auth enforced: public = auth/register/login/reset/subjects-read; everything else authenticated; owner gates on per-user resources.
- [x] IDOR protection: principal-derived user_id + owner-scoped queries + RLS (§5.3, §14).
- [x] MCQ/MSQ/NAT evaluation defined (canonical grading service, §7).
- [x] Interrupted sessions recoverable: server-persisted + restore endpoint (§8.2/8.3).
- [x] Response format consistent (§4 envelope) across everything.
- [x] Errors predictable, standard codes, no internals leaked (§9).
- [x] Matches Phase 3 schema (sessions/attempts/question_versions/question_types/numeric_answers/audit_log/bookmarks all referenced).
- [x] Validation covers all inputs (§6).
- [x] Rate limiting on auth + analytics (§10).
- [x] All "Needs Decision" items logged (§16).

---

## 16. Open Decisions & Assumptions

| ID | Question | Options | Recommended Default | Impact |
|---|---|---|---|---|
| API-01 | Auth transport | Stateless JWT bearer vs server-side cookie-session | **Cookie-session** (revocable, Phase 3 `sessions`) | CSRF surface, mobile-client ergonomics |
| API-02 | Time-limit expiry auto-finalize | auto-submit at deadline vs student-submit-only | Student-submit-only MVP; auto-submit as Future | Session correctness at deadlines |
| API-03 | MSQ partial-marking amounts (ties to OD-03) | full-on-exact / configurable partial | Per-question authored `partial_marks` (default 0 if unset) | Grading fairness |
| API-04 | Subject listing visibility for guests | public read vs auth-only | Public read (landing, trial) with counts-only | Onboarding vs data leak from accuracy |
| API-05 | Free-text question search in MVP | SQL LIKE/iLIKE (bounded) | Exclude from MVP; filters only | Content discoverability |
| API-06 | Pagination style | offset vs keyset cursor | Offset (page/page_size) for MVP | Deep-page perf at scale |

**Assumptions carried from prior phases:** single-tenant; OD-06 unanswered=skipped; OD-07 author≠publisher; weak-accuracy thresholds from OD-05; notes/mock/import remain Future/Should (not new features); response envelope (§4) chosen and fixed.

---

## 17. Recommended Phase 5: Frontend Architecture + UI/UX Design System

Next deliverable (after this phase is approved):
1. **Frontend architecture** layered consistently with the API: state/data-fetch strategy (RFC-style contract per endpoint §3), session client (immutable question view + attempt submission with retry), and error/empty/loading state maps aligned with §4/§9.
2. **Design system tokens + components** to implement Phase 2's UX principles (§8 Phase 2): typography, WCAG 2.1 AA color contrast, touch targets ≥44px, spacing scale, form components (MCQ/MSQ/NAT inputs), dashboard data-viz components.
3. **Screen → endpoint traceability map** proving every PG-/ADM- screen (Phase 2 §5) is covered by Phase 4 endpoints.
4. **Auth client flow**: cookie-session handling, 401 refresh, idempotent retry of attempts on network failure.

---

## End of Phase 4 — design only, nothing implemented. Next phase: Phase 5 (Frontend Architecture + UI/UX Design System) once approved.