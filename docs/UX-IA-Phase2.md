# PHASE 2 — USER FLOW & INFORMATION ARCHITECTURE
## GATE CS & IT PYQ Practice Platform

> **Source of truth:** Approved Phase 0 (Discovery) + Phase 1 (PRD).
> **Non-negotiable scope:** no code, no database design, no tech-stack selection.
> **Referred requirement IDs:** FR-xxx (Phase 1 §2), PM-xxxx (Phase 1 §4.1), MA-xxx (Phase 1 §5), OD-xx (Phase 1 §12).

---

## 1. Site Structure & Page Tree

### 1.0 Page ID convention
`PG-<SECTION>-<NN>` — each page is assigned a stable ID, referenced by the page inventory (§5), navigation (§2), and flows (§3–7).

### 1.1 Public (Guest) pages
```
PUBLIC (Guest, R1 / anonymous)
├─ PG-HOME-LND   Landing page
├─ PG-HOME-ABT   About / How it works        [Future]
├─ PG-AUTH-LGN   Login
├─ PG-AUTH-RGN   Registration
├─ PG-AUTH-RST   Forgot / reset password      [Should Have: FR-AUTH-05]
├─ PG-TRIAL-SES  Trial practice session        [FR-AUTH-04 / OD-02]
└─ PG-LEGAL-PRV  Privacy / terms              [Future]
```

### 1.2 Student areas (R2)
```
STUDENT (Registered, R2)
├─ PG-STD-DSH   Dashboard (home)             FR-DASH-01/02, FR-REC-01/02
├─ PG-STD-SUBJ  Subject browser             FR-SUBJ-01/02
├─ PG-STD-TPLC  Topic browser               FR-TOPIC-01/02
├─ PG-STD-SETP  Practice setup/config       FR-PRAC-01
├─ PG-STD-PRAC  Practice session            FR-PRAC-02..07, FR-EVAL, FR-TIME, FR-EXPL-01, FR-BMARK-01
├─ PG-STD-SMMY  Session result / summary    FR-EVAL-04, FR-EXPL-02
├─ PG-STD-MIST  Mistake review              FR-MIST-01/02
├─ PG-STD-BKM   Bookmarks                    FR-BMARK-01/02
├─ PG-STD-PERF  Performance detail          FR-DASH-01/02; MA-ACC, MA-TTOP, MA-AVG, MA-STRK, MA-TRND
├─ PG-STD-WEAK  Weak-topic list / recommendation  FR-REC-01, MA-WEAK
├─ PG-STD-PROF  Profile                     FR-AUTH-06, FR-AUTH-07 [Future]
├─ PG-STD-NOTES Notes                       FR-NOTE-01/02 [Future]
└─ PG-STD-MOCK  Mock test center            [Future, Mock mode]
```

### 1.3 Real-exam-entry pages (subject→topic giving entrance to practice)

The practice tree below reuses the same subject→topic browse (1.2), routed through setup:

### 1.4 Practice pages (already listed in 1.2)
- Subject → Topic → Setup → Session → Summary — see §3/§4 flows.

### 1.5 Analytics parent
- Dashboard (PG-STD-DSH) is the analytics hub; performance detail (PG-STD-PERF), weak-topic list (PG-STD-WEAK) are child views.

### 1.6 Admin pages (R4 Admin / R3 Moderator)
```
ADMIN
├─ ADM-DASH   Admin dashboard  FR-ADM-09 (metrics), FR-ADM-07, 08
├─ ADM-QUE   Question list / queue       FR-ADM-01, 02, 04
├─ ADM-QEDT   Question editor (create/edit, MCQ/MSQ/NAT)  FR-ADM-01, 02
├─ ADM-RVW   Review queue (publish/reject)   FR-ADM-03
├─ ADM-IMP   Bulk import                    FR-ADM-05 [Should]
├─ ADM-EXP   Bulk export                    FR-ADM-06 [Should]
├─ ADM-SUBJ  Subject management             FR-ADM-07
├─ ADM-TPLC  Topic management               FR-ADM-07
├─ ADM-USER  User/role management           FR-ADM-08 [Should]
└─ ADM-AUDIT Audit log                     FR-ADM-09
```

### 1.7 Site map (compact)
```
HOME ─┬─ LOGIN ─ REGISTER ─ RESET
      ├─ SUBJECT ── TOPIC ── SETUP ── SESSION ── SUMMARY
      ├─ DASHBOARD ── PERF ── WEAK
      ├─ MISTAKE
      ├─ BOOKMARK
      ├─ PROFILE
      └─ ADMIN (dash, questions, editor, review, import, export, taxonomy, users, audit)
```

---

## 2. Navigation

### 2.1 Global navigation (top bar, all roles)
| Label | Target | Visible to | Active state | PRD ref |
|---|---|---|---|---|
| Home | PG-HOME-LND | Guest | highlighted when home | — |
| Login | PG-AUTH-LGN | Guest only | — | FR-AUTH-02 |
| Register | PG-AUTH-RGN | Guest only | — | FR-AUTH-01 |
| Dashboard | PG-STD-DSH | Student | highlighted | FR-DASH-01 |
| Practice | PG-STD-SETP | Student | highlighted | FR-PRAC-01 |
| Bookmarks | PG-STD-BKM | Student | highlighted | FR-BMARK-01/02 |
| Mistakes | PG-STD-MIST | Student | highlighted | FR-MIST-01/02 |
| Profile | PG-STD-PROF | Student | highlighted | FR-AUTH-06 |
| Admin | ADM-DASH | Admin/Moderator | highlighted | FR-ADM-xx |

### 2.2 Student navigation (persistent rail)
Bottom tab bar (mobile-first) / left rail (desktop, >=768px):
1. **Practice** → PG-STD-SETP (start flow)
2. **Dashboard** → PG-STD-DSH
3. **Bookmarks** → PG-STD-BKM
4. **Mistakes** → PG-STD-MIST
5. **Profile** → PG-STD-PROF

Visibility rules: visible only when authenticated (R2); hidden on public pages; "Admin" pill additionally appears only for R4/R3.

### 2.3 Admin navigation
Side nav on ADM-* pages: Dashboard → Questions → Review queue → Import/Export → Subjects → Topics → Users → Audit log. Visible only for R4 (Admin); R3 (Moderator) sees Dashboard, Questions, Review queue, Import/Export.

### 2.4 Breadcrumbs
Breadcrumb trail shown on student content pages (>=480px):
`Dashboard → Subject → Topic → Practice`
On admin pages: `Admin → Questions → [QuestionId] → Edit`
Rules: first crumb = home (clickable), current page = last crumb (non-link); trail is consistent with IA hierarchy §6.

### 2.5 Mobile behavior
- Bottom nav remains pinned; content scrolls under it.
- Practice session hides global nav (immersive mode) and shows only session controls (§4).
- Table views collapse to stacked cards at <768px; primary action becomes full-width button.

### 2.6 Contextual / in-session navigation
- **Question palette** (PG-STD-PRAC): grid of question numbers; color-coded by state (answered=blue, marked=amber, unattempted=gray).
- **Session controls:** Prev/Next, Mark for review, Pause, Submit.
- **Filters** (PG-STD-SETP): subject/topic/year/difficulty as chips; "apply" confirms pool.

---

---

## 3. Student User Flows

> Each flow: Trigger / Preconditions / Primary path / Alternate + decision / Edge + error / Postconditions / PRD ref.

### 3.1 Registration
- **Trigger:** Guest clicks "Register" (PG-AUTH-RGN).
- **Preconditions:** valid session; no existing account with that email.
- **Primary:** email → set password → confirm → email verification → auto-login → onboarding selector (target subject) → Dashboard.
- **Alternate:** social signup (if enabled); guest trial finish → prompt to register (converts trial).
- **Edge:** duplicate email, weak password, expired verify link, verification resend (cooldown 60s).
- **Postconditions:** account + profile persisted; verified=true. **PRD:** FR-AUTH-01, FR-AUTH-02, OD-02.

### 3.2 Login
- **Trigger:** Guest clicks "Login".
- **Primary:** email + password → verify → Dashboard (with saved progress).
- **Edge cases:** lockout after 5 fails/15min; "Forgot password" → PG-AUTH-RST (FR-AUTH-05, Should); generic error (no enumeration).
- **Postconditions:** authenticated session; data restored.
- **PRD:** FR-AUTH-02, FR-AUTH-03.

### 3.3 Guest trial
- **Trigger:** landing "Try without account".
- **Primary:** pick subject → 5-question pool → answer → immediate grading (no persistence).
- **End:** CTA "Create account to save progress" → converts to register flow.
- **PRD:** FR-AUTH-04, OD-02.

### 3.4 Dashboard → Subject → Topic → Practice (entry)
- **Trigger:** Dashboard "Start practice" or practice rail item.
- **Primary:** Dashboard → tap Subject card → subject page (PG-STD-SUBJ) → tap Topic → topic page (PG-STD-TPLC) → tap "Practice" → setup (PG-STD-SETP) prefilled subject+topic.
- **Alt:** enter via weak-topic recommendation (3.12) → prefil weakest topic.
- **Edges:** empty subject/topic (state in §10); no question matches filter → empty-state guidance.
- **Postconditions:** setup page holds filter chips; pool is previewable.
- **PRD:** FR-SUBJ-01/02, FR-TOPIC-01/02, FR-PRAC-01.

### 3.5 Starting a practice session
- **Trigger:** PG-STD-SETP "Start session".
- **Preconditions:** >=1 published question matches filter; auth (R2).
- **Primary:** select mode → choose timed/untimed → confirm → session created → first question.
- **Alt paths:** resume in-progress session; timers default.
- **Edges:** 0 questions → non-dismissible empty state; network failure on start → retry (state S-LOADING).
- **Postconditions:** session IN_PROGRESS; timer running if timed.
- **PRD:** FR-PRAC-01, FR-TIME-01.

### 3.6 Solving a question
- **Trigger:** question rendered (state S-UNANS).
- **Primary:** select MCQ option / tick >=1 MSQ / type NAT → "Save" → Next (or palette jump).
- **Alt:** Prev; Mark for review; Skip.
- **Edges:** NAT invalid input → inline error, block; timer expired → auto-advance marks answered.
- **Postconditions:** attempt saved; state -> S-ANS (or S-MARKED).
- **PRD:** FR-PRAC-03/04/05/06, FR-TIME-01/02.

### 3.7 Submitting / grading
- **Trigger:** "Submit session".
- **Primary:** review screen (answers + marked) → confirm submit → grading.
- **Decision nodes:** unanswered policy (OD-06); timed mode shows score at end, learning mode shows immediate feedback per question when answered (FR-EVAL-04).
- **Edges:** submit with unanswered → confirm dialog (policy per OD-06).
- **Postconditions:** attempts recorded; summary built.
- **PRD:** FR-PRAC-07, FR-EVAL-01..04.

### 3.8 Viewing explanations
- **Trigger:** after grading (learning mode) or in summary (timed mode).
- **Primary:** expand explanation panel per question; traverse all via summary list.
- **Alt:** bookmark the question from the explanation panel.
- **Edges:** explanation missing (rare, authored) → "No explanation" placeholder, still show correct answer.
- **Postconditions:** explanation consumed; bookmark optional.
- **PRD:** FR-EXPL-01, FR-EXPL-02 (summary), FR-EVAL-04.

### 3.9 Completing a session
- **Trigger:** submit / timer end.
- **Primary:** session summary (PG-STD-SMMY): score, accuracy, topics, avg time, mistake list, explanation links.
- **Decision:** unanswered → count per OD-06; "Create mistake session" CTA.
- **Edges:** re-submission locked; session marked COMPLETED.
- **Postconditions:** analytics updated; wrong questions appended to mistake pool.
- **PRD:** FR-PRAC-07, FR-EVAL-04, FR-EXPL-02, FR-PERF-01/02.

### 3.10 Reviewing mistakes
- **Trigger:** Mistakes rail or summary CTA.
- **Primary:** mistake list (PG-STD-MIST) → question status (answered-correct again removes) → "Practice these" → session with mistake pool.
- **Alt paths:** filter by subject/topic; mark resolved without replay.
- **Edges:** empty mistakes → empty-state (all clear).
- **Postconditions:** re-practiced flag set; weak signal recomputed.
- **PRD:** FR-MIST-01/02, MA-MIST.

### 3.11 Bookmarking questions
- **Trigger:** bookmark icon in session / summary / explanation panel.
- **Primary:** tap bookmark → saved; open Bookmarks (PG-STD-BKM) → filterable list → jump into session or open.
- **Edges:** unbookmark; guest trial can't persist bookmarks (OD-02).
- **Postconditions:** bookmark persists to profile.
- **PRD:** FR-BMARK-01/02.

### 3.12 Viewing performance / finding weak topics
- **Trigger:** Dashboard "Analytics" or Weak card.
- **Primary:** dashboard overview (accuracy, attempts, avg time) → drill to per-subject → per-topic accuracy (PG-STD-PERF) → weak topics flagged (PG-STD-WEAK) → "Practice weakest" → prefill setup (3.4 alt).
- **Alt:** click any subject/topic to filter performance; trend view (MA-TRND).
- **Edges:** no data yet → dashboard empty-state; no weak topic (above threshold) → "no weak topics flagged" state.
- **Postconditions:** MA-REC exposed; one-click session prefill.
- **PRD:** FR-DASH-01/02/03, FR-REC-01/02, MA-ACC/MA-TTOP/MA-WEAK/MA-REC/MA-TRND.

---

---

## 4. Practice Flow (end-to-end)

### 4.1 Pipeline
```
SELECT → CONFIGURE → START → SOLVE → SUBMIT → REVIEW → RESULT
(Filters) (Setup)  (Session) (Q states) (Grading) (Summary) (Analytics)
```

### 4.2 Question-level states (within one attempt / session)
| State | User sees | Available actions | Transition | Timer | Feedback |
|---|---|---|---|---|---|
| **S-LOADING** | skeleton / spinner | wait / retry | → any state once loaded | keeps elapsed | "Preparing question…" |
| **S-UNANS** | question + options | Save, Skip, Mark, Prev, Next, palette | → S-ANS / S-MARKED / next | counts down (timed) | none until save |
| **S-ANS** | saved answer | Edit, Mark, Prev/Next | → S-MARKED / edit | counts | shows "Saved" |
| **S-MARKED** | amber tag = review | unmark, Save, Next | → S-ANS / S-UNANS | counts | flag in palette |
| **S-CORRECT** | green, after grading | view explanation, bookmark | — | — | marks=full per policy |
| **S-INCORRECT** | red | retry (new attempt within unmet else), explanation | — | — | negative/zero per policy |
| **S-TIMED-OUT** | expired | (graded as unanswered) auto-advance | → next / result | shows "time up" | policy OD-06 |
| **S-COMPLETED** | summary | revisit, restart pool, mistake CTA | — | ended | final score |

### 4.3 Session states (whole session lifecycle)
| State | Meaning | Actions | Timer | Complete |
|---|---|---|---|---|
| **SS-CONFIG** | setup filters | pick mode/time | not started | — |
| **SS-PREVIEW** | pool ready to preview | start / edit filters | — | — |
| **SS-LIVE** | in-progress | solve loop, pause | running | all answered / submit |
| **SS-PAUSED** | paused | resume / abandon | stopped | resume within 24h |
| **SS-REVIEWING** | pre-submit review | confirm submit / back | stopped | submit |
| **SS-GRADING** | grading in progress | wait | — | done |
| **SS-COMPLETE** | result + summary | review, retry, mistake | — | completed & recorded |
| **SS-ABANDONED** | expired / discarded | resume (<=24h) or clear | — | cleared |

### 4.4 Feedback & validation
- **Immediate (learning mode):** each answered question grades instantly (FR-EVAL-04).
- **Delayed (timed mode):** grade at end of SS-GRADING only.
- **Validation:** NAT inline numeric check; MSQ warns if invalid selection count at submit.
- **Retry:** same session re-solvable with a new randomized order (FR-PRAC-02).

---

## 5. Page Inventory

| Page ID | Name | Purpose | Primary user | Entry points | Exit points | MVP/Future | PRD ref | Key screen states |
|---|---|---|---|---|---|---|---|---|
| PG-HOME-LND | Landing | market + enter | Guest | URL | Login/Reg/Trial | MVP | FR-AUTH | loading, error |
| PG-AUTH-LGN | Login | authenticate | Guest | nav | Dashboard | MVP | FR-AUTH-02 | loading, error, lockout |
| PG-AUTH-RGN | Register | create account | Guest | nav | Dashboard | MVP | FR-AUTH-01 | validation, error |
| PG-AUTH-RST | Reset password | recover access | Guest | login | login | Should | FR-AUTH-05 | sent/sent-error |
| PG-TRIAL-SES | Trial practice | evaluate | Guest | landing | register CTA | MVP | FR-AUTH-04, OD-02 | session states |
| PG-STD-DSH | Dashboard | overview + entry | Student | login/nav | sub/browse | MVP | FR-DASH-01/02 | loading, empty, error |
| PG-STD-SUBJ | Subject browser | pick subject | Student | dash | topic | MVP | FR-SUBJ-01/02 | empty (no Qs) |
| PG-STD-TPLC | Topic browser | pick topic | Student | subject | setup | MVP | FR-TOPIC-01/02 | empty |
| PG-STD-SETP | Practice setup | configure filters | Student | dash/topic/weak | session | MVP | FR-PRAC-01 | no-match |
| PG-STD-PRAC | Session solve | practice questions | Student | setup | summary | MVP | FR-PRAC-02..07 | 8 states §4.2 |
| PG-STD-SMMY | Session summary | review results | Student | session | mistake/perf | MVP | FR-EVAL-04, FR-EXPL-02 | success, empty |
| PG-STD-MIST | Mistake review | replay wrong | Student | dash/nav/summary | setup | MVP | FR-MIST-01/02 | empty (all clear) |
| PG-STD-BKM | Bookmarks | manage bookmarks | Student | nav | session | MVP | FR-BMARK-01/02 | empty |
| PG-STD-PERF | Performance detail | analytics drill | Student | dash | topic/weak | MVP | FR-DASH-01/02 | no-data |
| PG-STD-WEAK | Weak topics | recommendation | Student | dash | setup | MVP | FR-REC-01/02 | no-weak |
| PG-STD-PROF | Profile | edit profile | Student | nav | dashboard | MVP(06)/Future(07) | FR-AUTH-06/07 | unauthorized |
| PG-STD-NOTES | Notes | personal notes | Student | nav | summary | Future | FR-NOTE-01/02 | empty |
| PG-STD-MOCK | Mock center | mock exams | Student | dash | session | Future | Mock (Q5) | — |
| ADM-DASH | Admin dashboard | metrics/enter | Admin | admin | — | MVP | FR-ADM-09 | no-data |
| ADM-QUE | Question list | manage list | Admin/Mod | nav | editor | MVP | FR-ADM-01/04 | empty |
| ADM-QEDT | Question editor | create/edit | Admin/Mod | que | ADM-RVW | MVP | FR-ADM-01/02 | validation |
| ADM-RVW | Review queue | publish/reject | moderator | que | published | MVP | FR-ADM-03 | empty |
| ADM-IMP | Bulk import | import CSV/JSON | Admin | que | ADM-QUE | Should | FR-ADM-05 | report-err |
| ADM-EXP | Bulk export | export | Admin | que | file | Should | FR-ADM-06 | timeout |
| ADM-SUBJ | Subject mgmt | taxonomy | Admin | nav | — | MVP | FR-ADM-07 | — |
| ADM-TPLC | Topic mgmt | taxonomy | Admin | subj | — | MVP | FR-ADM-07 | — |
| ADM-USER | User mgmt | roles/status | Admin | nav | — | Should | FR-ADM-08 | — |
| ADM-AUDIT | Audit log | accountability | Admin | nav | — | MVP | FR-ADM-09 | empty |

> Every page above appears in §1 tree and §2 navigation; orphans none.

---

## 6. Information Architecture

### 6.1 Content hierarchy
```
Subject → [Chapter] → Topic → [Subtopic] → Question
```
Per PRD OD-04, MVP ships **2-level (Subject → Topic)**; Chapter and Subtopic are **Future** expansion levels, shown bracketed. The hierarchy is owned by Admin (FR-ADM-07) and consumed by Student browsing (FR-SUBJ-XX, FR-TOPIC-XX).

### 6.2 Navigation rules through hierarchy
- Browse: Subject list → Topic list → "Practice" prefill; breadcrumb `Dashboard › Subject › Topic`.
- Filtering/sorting within level: counts (published Qs), accuracy (own) as sort keys; MCQ/MSQ/NAT + year + difficulty as faceted filters at Topic level.
- Deep linking: subject/topic pages addressable; session resume keyed by session id (not taxonomy).
- Back nav: browser back preserves hierarchy; breadcrumb clicks always retreat one level.
- Mapping to PRD: PM-SUBJ pool = subject filter; PM-TOPIC = topic filter; PM-YEAR/DIFF = additional filters (§4.1 PRD).

### 6.3 Conceptual route structure (no implementation)
- `/subjects`, `/subjects/{subject}/topics`, `/practice` (setup), `/practice/session/{id}`, `/summary/{id}`, `/dashboard`, `/performance`, `/weak`, `/bookmarks`, `/mistakes`.
- Admin: `/admin/questions`, `/admin/questions/new`, `/admin/review`, `/admin/subjects`, `/admin/topics`, `/admin/users`, `/admin/audit`.
- Keep URL/card structure conceptually equivalent to the page IDs in §5 (for wireframe/sitemap), without dictating a stack.

> Net: hierarchy consistent with PRD taxonomy (Subject → Topic), and all practice filtering refers back to the approved subject/topic counts for correctness.

---

## 7. Admin Flows

### 7.1 Admin login → content → add/edit → validate → publish
**Steps:** ADM login (R4) → ADM-QUE → create (ADM-QEDT) → enter MCQ/MSQ/NAT → validate type-specific → submit (Draft→In-review) → ADM-RVW (reviewer, R3/R4) → publish/reject.
- **Preconditions / permissions:** creator = writer; publisher ≠ author (OD-07).
- **Validation:** required fields; answer valid for type; subject/topic active; publish requires reviewed_by + (for reject) a comment.
- **Errors:** missing field inline; version conflict on concurrent edit; cannot publish own without reviewer.
- **Audit:** create/edit/review/publish/archive all logged (FR-ADM-09).
- **PRD:** FR-ADM-01/02/03/04/09; lifecycle §3-3 PRD.

### 7.2 Subjects & topics management
- **Steps:** ADM-SUBJ/ADM-TPLC → create/edit/deactivate.
- **Validation:** name unique + non-empty; cannot deactivate subject with published Qs.
- **Error:** deactivation failure surfaced; audit.
- **PRD:** FR-ADM-07.

### 7.3 Bulk import/export
- **Success:** choose file (CSV/JSON) → validation → preview → commit valid rows; export filtered set.
- **Edge:** partial-valid import rows → report; atomic (no partial commit); large export chunking / timeout retry.
- **PRD:** FR-ADM-05/06 (Should Have).

### 7.4 User & audit management
- **Steps:** ADM-USER (list → edit role/disable) → ADM-AUDIT (read-only timeseries).
- **Constraints:** no self-demote; cannot remove last admin; audit append-only.
- **PRD:** FR-ADM-08 (Should), FR-ADM-09.

---

## 8. UX Principles

### 8.1 Question-solving interface
- One question per view on mobile; single column; MCQ = radio cards, MSQ = checkbox cards, NAT = numeric input.
- Timer top-right in timed mode; question palette opens as a sheet overlay.
- Primary action (Next/Save) reachable within one thumb-swipe.

### 8.2 Dashboard
- Three headline metrics above the fold (accuracy, attempts, avg time); subject list below.
- Weak-topic card visually distinct (color + icon) with a single CTA "Practice this topic".

### 8.3 Navigation
- Persistent student rail; current page active state high-contrast; back-to-dashboard always reachable.

### 8.4 Mobile experience
- Breakpoints 320/480/768/1200px.
- **Touch targets ≥ 44×44px**; min tap spacing 8px.
- Bottom nav pinned; session immersive hides it (UXD-01).

### 8.5 Error states
- Inline, adjacent to field, plain-language fix + retry where actionable.
- Idempotent retry with backoff for network/write failures.

### 8.6 Empty states
- Every empty state carries an icon, a what-to-do-next message, and a CTA (e.g., "No mistakes yet — great job!").

### 8.7 Loading states
- Skeleton shimmer (not spinner) for content lists; question view also skeleton.
- **Latency feedback:** perceived action < 300ms; spinner by 1s; progress bar over 3s.

### 8.8 Feedback & confirmation
- Save gives inline "Saved"; submit shows a pre-submit summary + confirm dialog (complete/destructive only).
- Destructive actions (abandon, delete) require explicit confirm.

### 8.9 Accessibility (WCAG 2.1 AA)
- **Contrast:** ≥4.5:1 normal text, ≥3:1 large/UI components.
- **Keyboard:** full tab order, visible focus ring, modals trap focus + Escape to close.
- **Screen reader:** landmarks; MCQ/MSQ grouped in `<fieldset>`; `aria-live` announces score/timer; alt on icons.
- **Not color-only:** states also use icons/text (✓/✗/flag).

---

## 9. UX Acceptance Criteria (major MVP flows, GWT)

- **Registration:** Given a new email, when the user completes register + verification, then they land on the Dashboard and any trial progress is carried over.
- **Start practice:** Given ≥1 published matching question, when the user taps "Start session", then a session is created, the first question renders <1.5s, and the timer begins (timed mode).
- **Solve question:** Given the MCQ/MSQ/NAT input, when the user saves an answer, then it persists, the palette marks it answered, and the user can navigate to the next question.
- **Submit session (timed):** Given at least one answered question, when the user confirms submit, then grading starts and the final summary displays within 2s with score/accuracy/topic breakdown.
- **Mistake replay:** Given ≥1 mistake, when the user starts mistake practice, then the pool contains only previously-wrong questions (randomized).
- **Bookmark:** Given a question, when the user taps the bookmark icon, then it appears in the bookmark list; tapping again removes it.
- **Weak-topic rec:** Given a weak topic, when the Dashboard loads, then a "Practice weakest topic" card is shown and starts a session in one click.
- **Admin publish:** Given a question in-review, when the moderator approves, then it becomes Published and is student-visible; the audit log records the transition.

---

## Internal Consistency Checks

| Check | Status |
|---|---|
| Every page in inventory appears in structure + navigation | PASS (§1 ↔ §5 ↔ §2) |
| Every student flow references PRD IDs + screen states | PASS (§3; states §4.2) |
| Practice flow covers all question + session states start→result | PASS (§4.2, §4.3) |
| IA hierarchy consistent with PRD subject/topic | PASS (§6.1; OD-04 2-level declared) |
| Admin flows cover all admin PRD requirements | PASS (§7 → FR-ADM-01..09) |
| No MVP screen missing; none over-added | ✅ inventory == §1 tree |
| Future scopes marked and excluded from MVP flows | ✅ notes/mock/password/import-export marked |
| Navigation supports all flows; no orphan pages | ✅ |

---

## Final Output

### 1. Complete Site Map
See §1 tree + §5 inventory (Grouped Public / Student / Admin; 25 pages).

### 2. Complete User Flows
- Student §3.1–3.12 · Practice §4 (Select→Config→Start→Solve→Submit→Review→Result) · Admin §7.

### 3. Page Inventory
§5 table (25 pages).

### 4. Navigation Structure
§2 global / student rail / admin nav / breadcrumbs / mobile / in-session palette.

### 5. MVP Screen List
**Public:** PG-HOME-LND, PG-AUTH-LGN, PG-AUTH-RGN, PG-TRIAL-SES.
**Student:** PG-STD-DSH, PG-STD-SUBJ, PG-STD-TPLC, PG-STD-SETP, PG-STD-PRAC, PG-STD-SMMY, PG-STD-MIST, PG-STD-BKM, PG-STD-PERF, PG-STD-WEAK, PG-STD-PROF.
**Admin:** ADM-DASH, ADM-QUE, ADM-QEDT, ADM-RVW, ADM-AUDIT, ADM-SUBJ, ADM-TPLC.
*(Future / Should: PG-AUTH-RST, PG-STD-NOTES, PG-STD-MOCK, ADM-IMP, ADM-EXP, ADM-USER.)*

---

### Open UX Decisions
| ID | Question | Options | Recommended Default | Impact if Unresolved |
|---|---|---|---|---|
| UXD-01 | Practice session immersive on mobile (hide global nav)? | Full immersive; immersive + persistent exit | Immersive + always-visible exit | Session disorientation |
| UXD-02 | Unanswered-at-submit wording | "Skipped"; "Not answered"; "Marked wrong" | "Skipped" (neutral, OD-06) | Score clarity |
| UXD-03 | New-session time default | Untimed-default; timed-default | Untimed (learning) default | Pace vs comfort |
| UXD-04 | Palette trigger on mobile | always-on header; toggle sheet | Toggle sheet | Palette reachability |
| UXD-05 | Bookmark affordance location | top-right icon; under options | Top-right, filled state | Discoverability |
| UXD-06 | Weak-topic card depth | topic only; topic+acc+count | Topic + accuracy + count | Rec trust/action |
| UXD-07 | Landing emphasis | trial-first; register-first; explain-first | Trial-first CTA, register secondary | Conversion |
| UXD-08 | Guest trial question count | 5 / 10 / 15 | 5 (OD-02) | Trial abuse vs conversion |

---

## Recommended Phase 3: Database & Data Model Design
Design the data model covering: identity & roles (Guest/Student/Moderator/Admin), taxonomy (Subject→Topic, 2-level, OD-04), Question (MCQ/MSQ/NAT; lifecycle/versioning), practice session + attempts, analytics (per subject/topic metrics), bookmarks, mistake pool, recommendations, admin content + audit. Derived from the MVP screens/flows here and the PRD — pending OD-xx (Phase 1) and UXD-xx decisions.

---

## End of Phase 2 — awaiting approval before Phase 3.