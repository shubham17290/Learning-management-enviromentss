# PHASE 5 — FRONTEND ARCHITECTURE & UI/UX DESIGN SYSTEM
## GATE CS & IT PYQ Practice Platform

> **Source of truth:** Approved Phase 0 (Discovery), Phase 1 (PRD), Phase 2 (IA/Flows), Phase 3 (DB), Phase 4 (API/Backend).
> **Referred IDs:** FR-xxx (PRD §2), PM-xxxx (PRD §4.1), MA-xxx (PRD §5), PG-/ADM-xxx (Phase 2 pages), `table` names (Phase 3), API endpoints (Phase 4 §3).
> **Non-negotiable scope:** design only — no application code, no files, no repo changes, no installs, no API changes.

---

## 1. Frontend Architecture

### 1.1 Organization model: feature-based modules on a shared design-system core
The frontend is organized as **independent feature modules** (auth, subjects, practice, analytics, bookmarks, mistakes, admin) that each own their routes, screens, and API calls, layered over a **shared core** (design tokens, reusable components, API client, auth/session state). This mirrors the backend module boundaries (Phase 4 §2/§13) and keeps each feature self-contained.

### 1.2 Separation of concerns
| Layer | Responsibility |
|---|---|
| **Presentation** | screens + components; no fetch/business logic inside views |
| **Feature logic** | per-module page/component assemblies + typed route/action helpers |
| **Client services** | typed API functions (one per Phase 4 endpoint), response unwrapping, error mapping to UX states |
| **Shared core** | theme, design tokens, base components, auth/session, navigation shell, error/empty/loading primitives |

### 1.3 Reusability
- Design-system components (Button, Card, Badge, Modal, Toast, ProgressBar…) are shared and variant-driven, reused across student + admin.
- Question-solving components (OptionCard, NumericInput, QuestionPalette, TimerChip) are built once and reused by practice + mistake replay.
- Chart components (BarChart, LineChart, DonutChart) reused across dashboard + analytics.

### 1.4 Data flow (API → UI)
```
API (Phase 4)
  ↓
Client services (typed contracts, unwrap envelope + errors)
  ↓
Feature data layer (use/hooks, loading/empty/error state)
  ↓
Screens / components (render + user action)
  ↓
Back to service (mutations: attempt, bookmark, complete)
```
Never raw-fetch in views; a single client unwraps `{success,data,error}` (Phase 4 §4).

### 1.5 State management approach (high level)
Global auth + current user at core; per-screen local state (form, question answer); practice session state held in a server-owned session + local cache (Phase 4 §8). Detailed in §13.

---

## 2. Route Structure

### 2.1 Public routes
| Route | Page purpose | Access | MVP/Future | Ref |
|---|---|---|---|---|
| `/` | Landing (marketing, trial CTA) | Guest | MVP | PG-HOME-LND |
| `/login` | Login | Guest | MVP | PG-AUTH-LGN |
| `/register` | Register | Guest | MVP | PG-AUTH-RGN |
| `/reset-password` | Forgot/reset | Guest | **Should** | PG-AUTH-RST, FR-AUTH-05 |

### 2.2 Student routes (protected, role=student+)
| Route | Page | Purpose | MVP | Ref |
|---|---|---|---|---|
| `/dashboard` | Dashboard overview + weak rec | MVP | PG-STD-DSH |
| `/subjects` | Subject list | MVP | PG-STD-SUBJ |
| `/subjects/{subjectId}/topics` | Topic browser | MVP | PG-STD-TPLC |
| `/practice` | Practice setup/config | MVP | PG-STD-SETP |
| `/practice/:sessionId` | Active practice / question session | MVP | PG-STD-PRAC |
| `/results/:sessionId` | Session result/summary | MVP | PG-STD-SMMY |
| `/analytics` | Performance detail + weak topics | MVP | PG-STD-PERF, PG-STD-WEAK |
| `/bookmarks` | Bookmarks | MVP | PG-STD-BKM |
| `/mistakes` | Mistake review | MVP | PG-STD-MIST |
| `/profile` | Edit profile | MVP(06)/Future(07) | PG-STD-PROF |
| `/notes` | Personal notes | **Future** | PG-STD-NOTES |
| `/mock-tests` | Mock tests | **Future** | PG-STD-MOCK |

### 2.3 Admin routes (protected, admin, +moderator view for question review)
| Route | Page | Purpose | MVP |
|---|---|---|---|
| `/admin` | Admin dashboard (stats, audit shortcut) | MVP | ADM-DASH |
| `/admin/subjects` | Subject CRUD | MVP | ADM-SUBJ |
| `/admin/topics` | Topic CRUD | MVP | ADM-TLC |
| `/admin/questions` | Question list/review queue | MVP | ADM-QUE |
| `/admin/questions/new` | Add question | MVP | ADM-QDT |
| `/admin/questions/:id/edit` | Edit question | MVP | ADM-QDT |
| `/admin/users` | User management | **Should** | ADM-USR |
| `/admin/audit` | Audit log | MVP | ADM-AUDIT |

> Routes match Phase 2 §1/§5 page IDs; session route always carries `:sessionId` so interrupted sessions resume directly.

---

## 3. Page Inventory

| Page ID | Name | Purpose | Primary user | Key components | MVP/Future | PRD ref | API ref |
|---|---|---|---|---|---|---|---|
| PG-HOME-LND | Landing | market + entry | Guest | Navbar, Hero, SubjectPreview, CTA | MVP | FR-AUTH | GET /subjects |
| PG-AUTH-LGN | Login | authenticate | Guest | Form, Input, Button | MVP | FR-AUTH-02 | POST /auth/login |
| PG-AUTH-RGN | Register | create account | Guest | Form, Input, Button | MVP | FR-AUTH-01 | POST /auth/register |
| PG-AUTH-RST | Reset password | recover | Guest | Form, Input | Should | FR-AUTH-05 | POST /auth/reset-password |
| PG-STD-DSH | Dashboard | overview + rec | Student | StatCard, Cardinal, Badge, WeakCard | MVP | FR-DASH-01/02 | GET /dashboard/* |
| PG-STD-SUBJ | Subject browser | pick subject | Student | Grid, SubjectCard | MVP | FR-SUBJ-01/02 | GET /subjects |
| PG-STD-TLC | Topic browser | pick topic | Student | List, TopicCard, ProgressBar | MVP | FR-TOPIC-01/02 | GET /subjects/{id}/topics |
| PG-STD-SETP | Practice setup | configure | Student | FilterChips, Select, NumberInput, Button | MVP | FR-PRAC-01 | POST /practice-sessions |
| PG-STD-PRAC | Active practice | solve questions | Student | QuestionPane, OptionCard, Palette, TimerChip | MVP | FR-PRAC-02..07 | POST /practice-sessions/**/attempts |
| PG-STD-SMMY | Session result | review | Student | StatCards, Breakdown, MistakesList | MVP | FR-EVAL-04 | GET /practice-sessions/{id}/result |
| PG-STD-BKM | Bookmarks | manage bookmarks | Student | List, BookmarkCard, Badge | MVP | FR-BMARK-02 | GET /bookmarks |
| PG-STD-MIST | Mistake review | replay wrong | Student | List, QuizCard, Button | MVP | FR-MIST-01/02 | GET /mistakes |
| PG-STD-PRF | Analytics | performance detail | Student | LineChart, BarChart, DonutChart | MVP | FR-DASH-02/03 | GET /performance/* |
| PG-STD-WEAK | Weak topics | recommendations | Student | WeakCard, Badge, ProgressBar | MVP | FR-REC-01/02 | GET /dashboard/weak |
| PG-STD-PRF | Profile | edit profile | Student | Form, Input | MVP(06) | FR-AUTH-06 | GET /auth/me, PATCH profile |
| PG-STD-TES | Notes | personal notes | Student | List, NoteCard, Editor | **Future** | FR-NOTE | — |
| ADM-DASH | Admin dashboard | stats + enter | Admin | StatCard, Table, AuditList | MVP | FR-ADM-09 | GET /admin/audit |
| ADM-SUBJ | Subjects | manage subjects | Admin | Table, Form, Dialog | MVP | FR-ADM-07 | GET/POST/PUT/DELETE /admin/subjects |
| ADM-TLC | Topics | manage topics | Admin | Table, Form | MVP | FR-ADM-07 | /admin/topics |
| ADM-QUE | Question list | review | Admin/Mod | Table, FilterBar, Badge | MVP | FR-ADM-01..04 | GET /admin/questions |
| ADM-QDT | Question editor | add/edit | Admin/Mod | Form, OptionEditor, NAT field | MVP | FR-ADM-01/02 | POST/PUT /admin/questions |
| ADM-REV | Review queue | publish/reject | Admin/Mod | Table, Modal, Badge | MVP | FR-ADM-03 | POST /admin/questions/{id}/publish, /reject |
| ADM-TUS | Users | user management | Admin | Table, Select(role), Switch | **Should** | FR-ADM-08 | GET /admin/users, PATCH /admin/users/{id} |
| ADM-AUD | Audit log | security trail | Admin | Table, FilterBar | MVP | FR-ADM-09 | GET /admin/audit |

> All MVP pages from Phase 2 mapped; every row links to a Phase 4 endpoint.

---

## 4. Page-by-Page UI Design

> Template per page: purpose / layout / sections / components / primary CTA / secondary actions / data / states / mobile. Student + admin pages covered.

### 4.1 Landing (PG-HOME-LND)
- Layout: single column, top navbar + hero band + subject grid.
- Sections: navbar (brand, Login/Register); hero (tagline + "Try without account" + "Create free account"); "GATE CS & IT" subject cards (counts only, guests see counts — API-04).
- Primary CTA: "Try without account" (trial). Secondary: "Create free account".
- Data: `GET /subjects` (public, counts only for guest).

### 4.2 Login / Register (PG-AUTH-LGN/RGN)
- Layout: centered card, single column.
- Components: Input (email), Password, Button(primary), inline validation error (422), link to alternate (login↔register).
- CTA: "Log in" / "Create account". Errors under fields, described by `aria-describedby`.

### 4.3 Dashboard (PG-STD-DSH)
- Layout: two-column desktop (semantic cards + sidebar recommendation card); stacked on mobile.
- Sections: greeting + last session; stat cards (accuracy %, attempts, avg time, streak); subject performance list; **weak topic card** (distinct, "Practice weak topics" primary).
- Data: `GET /dashboard/summary`, `GET /dashboard/weak`.

### 4.4 Subject → Topic browser (PG-STD-SUBJ / TPLC)
- Layout: responsive grid; each SubjectCard/TopicCard shows name + accuracy + question count.
- CTA: tap card → drill. Breadcrumb `Dashboard › Subject` / `…› Topic`.
- Empty: "No questions published for this subject yet."

### 4.5 Practice setup (PG-STD-SETP)
- Layout: single column form with filter chips (mode, subject/topic, year, difficulty, question count, timed toggle).
- Primary CTA: "Start session" (disabled until valid selection).
- Data post: `POST /practice-sessions`. Validation errors inline.

### 4.6 Active practice (PG-STD-PRAC) — see §7/§8 for full detail.

### 4.7 Session result (PG-STD-SMMY)
- Layout: summary band (score, accuracy, time) + per-topic breakdown + question results + mistakes list + explanations (accordion).
- CTA: "Attempt mistakes again" + "Back to dashboard". Data: `GET /practice-sessions/{id}/result`.

### 4.8 Bookmarks (PG-STD-BKM)
- List of BookmarkCards (question preview + topic badge); empty state CTA. Data: `GET /bookmarks`.

### 4.9 Mistakes (PG-STD-MIST)
- List of missed questions + "Practice mistakes" CTA (starts PM-MIST). Empty: "No mistakes — keep it up!". Data: `GET /mistakes`.

### 4.10 Analytics (PG-STD-PRF) — see §10.

### 4.11 Weak topics (PG-STD-WEAK)
- WeakCard list with accuracy + "Practice" one-click prefill. Data: `GET /dashboard/weak`.

### 4.12 Profile (PG-STD-PRF)
- Form (name, target subject); save (PATCH). Update toast.

### 4.13 Admin pages (ADM-*) — see §16.

> **All pages** share: loading = skeleton (list/content) or inline spinner (buttons), empty = icon+message+CTA, error = error state with retry (Phase 2 §8.5–8.7).

---

## 5. Design System

### 5.1 Typography
| Token | Size | Weight | Line height | Use |
|---|---|---|---|---|
| H1 | 28–32px | 700 | 1.2 | page titles |
| H2 | 22–24px | 600 | 1.25 | section headers |
| H3 | 18–20px | 600 | 1.3 | card/sub-panel titles |
| Body | 15–16px | 400 | 1.5 | paragraphs, questions |
| Small / label | 12–14px | 500 | 1.4 | badges, captions |
| Mono | 13–14px | 400 | 1.5 | NAT input, code-like content, math |
- **Family suggestion:** `system-ui` stack for UI text + a monospace fallback (`ui-monospace`) for NAT/numeric and code-like expressions. Long GATE questions use body line-height ~1.6 for readability.

### 5.2 Colors (minimal, WCAG AA)
| Token | Use | Notes |
|---|---|---|
| bg | near-white (e.g. #FAFAFA) | app background |
| surface | white (#FFFFFF) | cards, panels |
| primary | deep indigo (e.g. #3B5BDB) | buttons, links, focus | ≥3:1 contrast on bg |
| secondary | neutral gray-blue | secondary buttons |
| text | near-black (#1A1A1A) | ≥7:1 body on white |
| muted | mid-gray (#6B6B6B) | labels/metadata; ≥4.5:1 on white |
| success | green (#1F8A4C) | correct / saved |
| warning | amber | in-review / caution |
| error / incorrect | red (#C6363A) | errors / wrong answers |
| correct answer | green (above) | correct option highlight |
| info | blue | informational (sparing) |
- Contrast: normal text ≥4.5:1, large text/UI ≥3:1; states not color-only (also icons/✓/✗/flag, Phase 2 §8.9).

### 5.3 Spacing scale
`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 px`.
- 4px micro, 8–12px compact spacing in dense lists, 16–24px default padding/margins between sections, 32–40px between major regions, 64px page padding (desktop).

### 5.4 Border radius
| Token | Radius | Use |
|---|---|---|
| small | 4–6px | inputs, badges, chips |
| medium | 8px | cards, buttons |
| large | 16px | modals, hero | 
| pill | full | tabs, tags |

### 5.5 Shadows (subtle elevations)
| Level | Use |
|---|---|
| none | default surfaces, flat |
| low | cards, sticky headers on scroll |
| medium | modals, dropdowns |
| high | critical overlays (rare) |
Shadows always soft, low opacity; no heavy box-shadow decoration.

---

## 6. Core Components

| Component | Purpose | Variants | Used on |
|---|---|---|---|
| **Navbar** | global top nav / brand + auth state | guest, student, admin | all pages |
| **Sidebar** | secondary nav rail (student)/admin nav | student, admin | dashboard, admin |
| **Breadcrumb** | hierarchy position + back step | default | subject/topic/practice/admin |
| **Button** | primary CTA + hierarchy | primary, secondary, danger, ghost; size sm/md/lg, loading+disabled | all |
| **Input / Select / NumberInput** | forms | label error/helper; validation state | auth, setup, profile, admin forms |
| **Modal** | confirm / prompt | default | submit confirm, admin dialogs |
| **Card** | content grouping | default, stat, quiz | dashboard, subject, result |
| **Badge** | meta: type, year, status | neutral, info, success, warning, danger | question, admin |
| **ProgressBar** | progress within session/dashboard | segment (per-question states) | practice, topic |
| **Tabs** | switch views | underline (desktop), chips (mobile) | analytics |
| **Dropdown** | menu / select | default | setup, admin |
| **Toast** | transient feedback | success, error, info; `aria-live` polite | global |
| **Pagination** | list paging | default; Prev/Next + page numbers | results, admin, bookmarks |
| **Empty / Loading / Error** primitives | consistent UX states (see §15) | default | everywhere |

**Accessibility for components:** all interactive use native controls where possible; buttons have `aria-label` when icon-only; inputs `label` + `aria-describedby`; modals trap focus + Escape close; toast announces via `aria-live`.

---

## 7. Question-Solving UI (most important)

### 7.1 Header meta row (sticky)
Badges show: **Subject · Topic · GATE year · Marks · Difficulty · type (MCQ/MSQ/NAT)**. Right: **TimerChip** (remaining/elapsed, turns red under 30s) + **bookmark button**.

### 7.2 Question body
- Full-width single column. Question text rendered large (body 16px). Math/code in mono.
- Never clutter with ads/inline UI. One question per view (mobile priority, Phase 2 §8.1).

### 7.3 Input per type
| Type | Input | Behavior |
|---|---|---|
| **MCQ** | Clickable OptionCards (radio semantics) | single select; tap toggles; clear allowed |
| **MSQ** | OptionCards with checkboxes | multiple select; min 1; hint "Select one or more”; live count |
| **NAT** | NumericInput (mono, keyboard numeric) | accepts decimals + scientific notation; optional unit field; inline numeric validation |

### 7.4 Visual states of an option/input
| State | Appearance |
|---|---|
| Selected (MCQ/MSQ) | primary border + filled check/radio |
| Correct (after submit) | green background + ✓ |
| Incorrect selected | red background + ✗ |
| Correct but unselected | green outline (MSQ reveal) |
| Unanswered | default |
| Disabled (post-submit / lock) | reduced opacity, non-interactive |
| Marked for review | amber flag badge in palette + card corner |

### 7.5 Question navigation
- **Prev / Next** buttons (bottom, mobile = full-width arrows) + **Question palette** (grid of question numbers) color-coded: answered=primary, marked=warning, unanswered=neutral, visiting=current ring.
- **Mark for review** toggle per question; palette + review list at submit.

### 7.6 Timer behavior
- Session timer chip shows remaining (timed) or elapsed (untimed). **Pause/Resume** control (server-authoritative, Phase 4 §8). Auto-scale to red under threshold.

### 7.7 Submission
- Per-question **Save** in learning (untimed) mode → immediate grade + explanation (FR-EVAL-04).
- In **timed** mode, Save stores answer; final **Submit** at end (results revealed).
- **Submit confirm** modal (unanswered summary) before final submission.
- After submit, options disable; palette shows correct/incorrect and lead to **Results** screen.

> References: FR-PRAC-02..07, FR-TIME-01/02, FR-EVAL-01..04, FR-EXPL-01, FR-BMARK-01, PG-STD-PRAC.

---

## 8. Practice Session UI

### 8.1 Flow states
| Step | UI |
|---|---|
| **Configure** | coach: mode chips (Subject/Topic/Year/Difficulty/Custom/Mistake) → filters (subject/topic/year/difficulty) + question count + timed toggle → "Start session" |
| **Start** | create session → first question; progress resets (Question 1 of N) |
| **Question** | §7 Q-solving with palette + timer + progress bar |
| **Submit** | per-question save (learning mode immediate grade; timed store-only) |
| **Next** | palette/nav; mark/return allowed |
| **Complete** | submit confirmation (unanswered modal) → grading |
| **Result** | summary band + per-topic + per-question + mistakes + explanations (§4.7) |

### 8.2 Progress indicator
- **Question counter** "Question 3 of 12" + **segment progress bar** (answered/logged segments colored by state — answered=primary, marked=warning, current=ring).

### 8.3 Handling edge states
| Case | UI behavior |
|---|---|
| **Unanswered** | at submit modal "3 unanswered — They will show as skipped (not scored)." (OD-06); user can return via palette before final submit |
| **Time expired** | timer deep-red nudging; on submit-after-deadline apply policy; still show result (auto-submit is Future, API-02) |
| **Session abandoned / left** | if user leaves mid-session → auto-return prompt "Resume where you left off" (server-persisted, Phase 4 §8) |
| **Resuming** | `/practice/{sessionId}` restores palette state + prior answers + elapsed time from server anchor |

---

## 9. Dashboard UI

Focused, clutter-free. Sections (top→bottom):
| Section | Visual | Data (API) |
|---|---|---|
| **Greeting + last session** | text + "Resume" button (if in-progress) | GET /dashboard/summary |
| **Headline stat cards** (accuracy %, total attempts, avg time, streak) | 4 StatCards; accuracy dominant | GET /dashboard/summary |
| **Subject performance** | horizontal bar per subject (accuracy% + n attempts) | GET /performance/subjects |
| **Topic leaderboard** | top topics by accuracy/attempt volume | GET /performance/topics |
| **Weak topics card** (distinct, amber) | WeakCard list + one-click "Practice weak topics" | GET /dashboard/weak |

- Purpose: communicate prep status in seconds. **No chart clutter**; bar lists + colors carry meaning. Accuracy always a derived % (MA-ACC).

---

## 10. Analytics UI

Every chart has an analytical purpose — no decorative charts.
| Visualization | Communicates | Chart | Why it helps improve |
|---|---|---|---|
| Overall accuracy trend | progress over time | **LineChart** (accuracy/attempts by week) | confirm the improve-loop working (MA-TRND) |
| Subject-wise accuracy | relative strength by subject | **BarChart** | prioritize subject study |
| Topic-wise accuracy | drill-down granularity | **BarChart** (horizontal, sorted) | target weak topics |
| Difficulty-wise | easy/medium/hard performance | **Bar/grouped** | know where you lose points |
| Type-wise (MCQ/MSQ/NAT) | skill by question type | **Donut** | practice weaker type (MSQ/NAT) |
| Avg solving time | pace per topic/type | **Bar** | reveal pace bottlenecks |
| Trend (moving average) | 7/30-day accuracy | **Line** | detect plateaus/slumps |

---

## 11. Responsive Strategy
| Breakpoint | Layout behavior | Fonts | Touch targets |
|---|---|---|---|
| **Mobile (<768px)** | single column; bottom nav; session = full-screen immersive (UXD-01) with sticky timer + palette sheet; **option buttons full-width**; touch ≥44px | body 16px; headings compressed | buttons full-width |
| **Tablet (768–1023px)** | 2-col dashboards; table→stacked card; palette drawer | body 15–16px | ≥44px |
| **Desktop (≥1024px)** | 2–3 col; persistent left rail; table views; filter bar | body 15–16px, H1 28px | ≥44px |
- Question screen special: timer+progress always visible sticky top; palette/Prev/Next sticky bottom (mobile) so no scroll to navigate (Phase 2 §8.4).

---

## 12. Accessibility Strategy
| Requirement | Implementation |
|---|---|
| **Keyboard navigation** | all controls focusable; Tab order logical (question→options→nav); arrows inside palette; Escape closes modal/dropdown |
| **Focus states** | visible focus ring on all interactive; never `outline:none` without replacement |
| **Color contrast** | ≥4.5:1 normal, ≥3:1 large; tokens enforced (Phase 5 §5) |
| **Labels** | every Input/Select has visible + programmatic `label`; icon buttons `aria-label` |
| **Screen reader** | MCQ/MSQ option groups in `fieldset/legend`; timer/score `aria-live`; alt on images; landmarks (`nav`, `main`) |
| **Form errors** | per-field `aria-describedby` + `role="alert"` summary; not color-only |
| **Touch targets** | ≥44×44px on all interactive, ≥8px spacing |
| **Reduced motion** | `prefers-reduced-motion`: disable non-essential transitions/animations |

---

## 13. Frontend State Management

| State | Where held | Notes |
|---|---|---|
| **Authentication (current user, session)** | Core global (single source) | from `GET /auth/me`; drives protected routes |
| **Practice session** (id, question list, current index, answers, timer) | Server-owned (Phase 4 §8) + **client local cache** keyed by sessionId | restore on refresh; marks + current index local |
| **Current question** (selected answer, mark flag) | Local component state | sent to server on Save |
| **Timer** | Server anchor + local countdown | pause/resume to server |
| **Loading / error state** | Per-request hook state | skeletons/spinners, retry |
| **User preferences** (target subject, theme) | Server (profile) | minimal |

### 13.1 Simplest suitable approach (recommended)
Given the small MVP scale and mostly per-screen state, a **lightweight global context (React Context / plain store) for `auth + currentUser`**, and **server-owned session state** for practice with a thin local cache — vs a full store for everything.
- Justification: only auth and session are shared/cross-screen; everything else is page-local. Avoids over-engineering (no need for a heavy global store/WASM).
- If the project grows mock tests, move session timer/cache to the same provider.

> This is a recommendation; exact library choice is logged as an Open Decision (UI-04).

---

## 14. API-to-UI Mapping

| Frontend screen | API endpoint(s) | Data required | Method |
|---|---|---|---|
| Landing | GET /subjects | subject list (counts) | GET |
| Login | POST /auth/login | access/session + user | POST |
| Register | POST /auth/register | account | POST |
| Reset | POST /auth/reset-password | — | POST |
| Dashboard | GET /dashboard/summary, /weak | overview + weak | GET |
| Subject browse | GET /subjects | list | GET |
| Topic browse | GET /subjects/{id}/topics | topics | GET |
| Practice setup | POST /practice-sessions | create | POST |
| Active practice | GET /practice-sessions/{id}; POST .../attempts; POST .../complete | session + attempts | GET/POST |
| Session result | GET /practice-sessions/{id}/result | result | GET |
| Bookmarks | GET /bookmarks, POST /bookmarks, DELETE /bookmarks/{id} | list/add/remove | GET/POST/DELETE |
| Mistakes | GET /mistakes | list | GET |
| Analytics | GET /performance/* | breaks | GET |
| Weak topics | GET /dashboard/weak | rec list | GET |
| Profile | GET /auth/me, PATCH profile | user | GET/PATCH |
| Admin subjects | GET/POST/PUT/DELETE /admin/subjects | CRUD | — |
| Admin topics | GET/POST/PUT/DELETE /admin/topics | CRUD | — |
| Admin questions | GET/POST/PUT /admin/questions | list/create/edit | — |
| Admin review | POST /admin/questions/{id}/publish, /reject | state | POST |
| Admin users | GET /admin/users, PATCH /admin/users/{id} | list/edit | GET/PATCH |
| Admin audit | GET /admin/audit | audit | GET |

---

## 15. UX States
| State | What the user sees | Actions |
|---|---|---|
| Loading | skeleton shimmer (lists) or inline spinner (button) | none (or cancel) |
| Empty | icon + message + CTA (e.g., "No bookmark yet") | primary CTA |
| Error | error panel + message + "Retry" | retry / back |
| Success | toast ("Answer saved", "Published") | continue |
| Unauthorized | redirect to /login with return-to | log in |
| Forbidden | 403 panel "You don't have access" | back / contact |
| Not found | 404 page "This page doesn't exist" | home |
| Network failure | offline/retry panel + retry, queue local restore | retry / resume |

> All states share consistent primitives so messaging is predictable (§6, Phase 2 §8.5–8.7).

---

## 16. Admin UI
Keep functional: tables, bars, forms. Map each to Phase 4 endpoints.
| Area | UI | Backend action |
|---|---|---|
| **Dashboard (ADM-DASH)** | stat cards (total questions, users, published %) + recent audit snapshot | GET /admin/audit |
| **Subject mgmt** | table (code, name, q-count, active), create/edit modal, deactivate confirm | GET/POST/PUT/DELETE /admin/subjects |
| **Topic mgmt** | table (name, subject, sort), inline modal | /admin/topics |
| **Question list (ADM-QUE)** | filterable table (type, subject, year, status, tags), status badges; filter bar | GET /admin/questions |
| **Question editor (ADM-QDT)** | typed form: MCQ (options + correct radio), MSQ (checkboxes), NAT (numeric answers + tolerance + unit); inline validation per §6 | POST/PUT /admin/questions |
| **Review (ADM-REV)** | queue table → "Publish"/"Reject(reason)" confirm modals (separation-of-duties guard note) | POST /{id}/publish, /reject |
| **Users (ADM-TUS, Should)** | table + role select + enable/disable switch | GET /admin/users, PATCH /admin/users/{id} |
| **Audit (ADM-AUD)** | read-only filtered table (actor, action, entity, timestamp, diff) | GET /admin/audit |

- All admin mutations trigger a confirm modal + success/error toast; destructive actions (deactivate/delete) require explicit confirm.

---

## 17. Frontend Folder Architecture (conceptual, framework-agnostic)
```
src/
  app/            # app shell: routing, layout, providers (auth, notification)
  features/
    auth/         # login, register, reset
    subjects/     # subject + topic browsing
    practice/     # setup, session, result
    analytics/    # dashboard, performance, weak
    bookmarks/
    mistakes/
    admin/        # subjects, topics, questions, review, users, audit
  components/     # shared design-system components (buttons, cards, modal, badge...)
  lib/            # API client (unwraps envelope), errors
  hooks/          # request/state helpers
  services/       # typed API functions (one per Phase 4 endpoint)
  types/          # shared types (envelope, resource DTOs)
  utils/          # format (accuracy, time), colors, date
  styles/         # design tokens, themes
```
Responsibilities: `lib/` low-level HTTP; `services/` typed per endpoint; `features/` owns screens + local state; `components/` reusable; `styles/` design tokens; `hooks/` reusable request state (loading/error). High-level; no files created.

---

## 18. UX Consistency Check
| Check | Status |
|---|---|
| Same components reused across pages | PASS (shared system components) |
| Navigation consistent | PASS (Navbar/Sidebar/Breadcrumb shell) |
| Typography consistent | PASS (§5.1 tokens) |
| Semantic colors used consistently | PASS (§5.2) |
| Forms behave consistently | PASS (same error/validation pattern) |
| Errors handled consistently | PASS (§15 UX states) |
| Mobile behavior defined for key pages | PASS (§11) |
| Question UI distraction-free | ✅ (immersive, no clutter) |
| Every MVP requirement has a screen/component | PASS (page inventory §3 ↔ FR-*) |
| All Needs Decision logged | PASS (§19) |

---

## 19. Open Decisions & Assumptions
| ID | Question | Options | Recommended Default | Impact |
|---|---|---|---|---|
| UI-01 | Client framework | React / Vue / Svelte / Angular | **React** (component reuse + ecosystem) | App structure |
| UI-02 | State library for auth+session | React Context / Zustand / Redux | **React Context or Zustand (light)** | complexity |
| UI-03 | Charting lib | Recharts / Chart.js / custom CSS bars | **Recharts** (accessibility) if interactive needed | analytics |
| UI-04 | Design token approach (CSS vars vs styled engine) | CSS variables / Tailwind / styled engine | CSS variables (token-driven, WCAG) | theming |
| UI-05 | Typography family | system-ui vs Google Fonts | system-ui + ui-monospace (fast, offline-safe) | load |
| UI-06 | Number/math rendering | plain text / KaTeX restricted | **Restricted KaTeX** only for GATE math | effort vs fidelity |

**Assumptions carried:** single-tenant; API cookie-session (API-01); server-owned session state (Phase 4); design decision 8 from Phase 4; notes/mock/import remain Future; each page's data via Phase 4 endpoints (no changes).

---

## 20. Recommended Phase 6: Project Setup & Development Environment
Next (after this phase is approved):
1. Choose + validate the frontend framework + token system (resolve UI-01..UI-06).
2. Provision dev environment: version control, local Postgres (Phase 3), API scaffold (Phase 4 folder layout), shared conventions.
3. Set up the API client + response envelope + example screens for landing/login/dashboard.
4. Define CI + lint + a11y checks baseline before feature build.

---

## End of Phase 5 — design only, nothing implemented. Next phase: Phase 6 (Project Setup & Development Environment) once approved.