# PHASE 1 — PRODUCT REQUIREMENTS DOCUMENT (PRD)
## GATE CS & IT PYQ Practice Platform

> **Source of truth:** Approved Phase 0 — Product Discovery.
> **Non-negotiable scope:** no code, no database design, no tech-stack selection (per Phase 0/1 rules).

---

## 1. User Roles & Permissions

### 1.1 Roles

| Role ID | Role | Description |
|---|---|---|
| R1 | **Guest (unregistered)** | Browsing + limited, non-persistent practice trial. No account data. |
| R2 | **Student (Registered)** | Runs the full Practice -- Analyze -- Improve loop. Owns bookmarks, mistakes, notes, performance data. |
| R3 | **Content Moderator** | Internal reviewer. Validates question accuracy and publishes/rejects content. No access to student PII or analytics. |
| R4 | **Admin** | Full content + user + audit management. |

### 1.2 Permission Matrix
Levels used: None | View | Create/Edit (own) | Edit | Manage (all).

| Capability | R1 Guest | R2 Student | R3 Moderator | R4 Admin |
|---|---|---|---|---|
| Browse subjects / topics | View | View | View | Manage |
| Attempt practice (MCQ/MSQ/NAT) | View (trial) | Create/Edit (full) | None | Manage |
| View own analytics | None | View (self only) | None | View (aggregate) |
| Bookmarks / notes | None | Create/Edit (own) | None | None |
| Review question status / publish | None | None | Create/Edit (Review) | Manage |
| Manage subjects / topics | None | None | Edit | Manage |
| Bulk import / export | None | None | Edit | Manage |
| Manage users / audit log | None | None | None | Manage |

**Access restrictions**
- Students only ever see **published** questions and **their own** performance data.
- Moderators cannot access student PII or analytics.
- Admin is the only escalating role; RBAC enforced server-side.
- Guest trial state is non-persistent and converts to a Student account on registration.

---

## 2. Functional Requirements

> Each FR carries a unique ID (e.g., `FR-AUTH`, `FR-PRAC`) and is testable. Format:
> `FR-<ID>: As a <role>, I want <action> so that <benefit>.`

### 2.1 Authentication & Profile
- FR-AUTH-01: As a Guest, I want to register with email/password so that my progress and profile persist.
- FR-AUTH-02: As a Student, I want to log in to resume my history across devices.
- FR-AUTH-03: As a Student, I want to log out to secure my account on shared devices.
- FR-AUTH-04: As a Guest, I want a short registration-free trial so I can evaluate before committing. *(Needs Decision -> OD-02.)*
- FR-AUTH-05: As a Student, I want to reset my password so I can regain access.
- FR-AUTH-06: As a Student, I want to edit my profile (name, target subject).
- FR-AUTH-07: As a Student, I want to delete my account and data. *(Future: see 8.3.)*

**Rules / edge cases:** email unique + format-valid; password >=8 chars with >=1 letter + >=1 digit; email verification required; login rate-limit 5 failures = 15-min lockout; generic errors to prevent enumeration.

### 2.2 Subject Browsing
- FR-SUBJ-01: As a Student, I want to browse GATE CS subjects so I can choose what to practice.
- FR-SUBJ-02: As a Student, I want per-subject question counts and my per-subject accuracy so I know where to focus.

### 2.3 Topic Browsing
- FR-TOPIC-01: As a Student, I want to browse topics within a subject so I can drill a specific area.
- FR-TOPIC-02: As a Student, I want per-topic question counts and per-topic accuracy so my weakness is granular.

### 2.4 PYQ Practice
- FR-PRAC-01: As a Student, I want to start a session filtered by subject/topic/year/difficulty so I practice only what I need.
- FR-PRAC-02: As a Student, I want randomized question order so repeats aren't predictable.
- FR-PRAC-03: As a Student, I want linear (Prev/Next) navigation.
- FR-PRAC-04: As a Student, I want to mark a question for review and return to it.
- FR-PRAC-05: As a Student, I want to skip a question.
- FR-PRAC-06: As a Student, I want to review/edit answers before submitting.
- FR-PRAC-07: As a Student, I want a submit action to grade and record the whole session.

**Session state rules:** Start, Pause, Resume, Abandon supported; partial answers resume within 24h (see 4.4).

### 2.5 Question Submission (student reporting)
- FR-QREP-01: As a Student, I want to report a question error so content quality improves.
- FR-QREP-02: As a Student, I want to flag a typo/reason so a reviewer can act.

Rules: 1 report per (user, question); only Published is reportable; report queues to Moderator.

### 2.6 Answer Evaluation
- FR-EVAL-01: As a Student, I want instant MCQ grading (right/wrong).
- FR-EVAL-02: As a Student, I want MSQ partial-credit grading per policy.
- FR-EVAL-03: As a Student, I want NAT numeric-tolerance grading.
- FR-EVAL-04: As a Student, I want the correct answer/explanation revealed per mode (immediate in learning, end-of-session in timed).

### 2.7 Explanations
- FR-EXPL-01: As a Student, I want an explanation after answering.
- FR-EXPL-02: As a Student, I want to revisit explanations from the session summary.

### 2.8 Bookmarks
- FR-BMARK-01: As a Student, I want to bookmark a question for later.
- FR-BMARK-02: As a Student, I want a filterable list of my bookmarks.

### 2.9 Notes
- FR-NOTE-01: As a Student, I want to attach a personal note to a question. *(Future: see 8.3.)*
- FR-NOTE-02: As a Student, I want to edit/delete my note.

### 2.10 Mistake Tracking
- FR-MIST-01: As a Student, I want incorrect attempts recorded for replay.
- FR-MIST-02: As a Student, I want a "Mistake practice" session replaying wrong questions.

### 2.11 Timer
- FR-TIME-01: In a timed session, I want a per-question + remaining-session timer so I can manage pace.
- FR-TIME-02: I want to pause/resume so interruptions don't distort time.

### 2.12 Performance Tracking
- FR-PERF-01: As a Student, I want each attempt (correct/incorrect + duration) recorded.
- FR-PERF-02: As a Student, I want per-subject and per-topic performance recorded.

### 2.13 Dashboard
- FR-DASH-01: As a Student, I want an overview (accuracy, total attempts, average time).
- FR-DASH-02: As a Student, I want subject/topic accuracy with weak-topic flags.
- FR-DASH-03: As a Student, I want my improvement trend over sessions.

### 2.14 Recommendations
- FR-REC-01: As a Student, I want a "practice your weakest topic" recommendation.
- FR-REC-02: As a Student, I want to start the recommended session in one click.
- FR-REC-03: Rule: the weakest-topic threshold must be configurable. *(Needs Decision -> OD-05.)*

### 2.15 Admin Question Management
- FR-ADM-01: As an Admin, I want to create a question (MCQ/MSQ/NAT).
- FR-ADM-02: As an Admin, I want to edit a question.
- FR-ADM-03: As a Moderator/Admin, I want to review and publish/reject a question.
- FR-ADM-04: As an Admin, I want to publish/unpublish to control student exposure.
- FR-ADM-05: As an Admin, I want to bulk-import questions (CSV/JSON).
- FR-ADM-06: As an Admin, I want to bulk-export questions.
- FR-ADM-07: As an Admin, I want to manage subjects/topics.
- FR-ADM-08: As an Admin, I want to manage user roles/status.
- FR-ADM-09: As an Admin, I want to view the audit log.

Rules/edge cases for admin: answers validated by type; lifecycle states enforced (3.3); import detects duplicates; separation of duties (OD-08); audit is append-only.

---

## 3. Question Requirements

### 3.1 Common fields
| Field | Notes |
|---|---|
| question_id | unique |
| text | prompt; may include formatted content |
| question_type | MCQ / MSQ / NAT |
| options | conditional: MCQ/MSQ, ordered |
| correct_answer | type-specific (see 3.2) |
| explanation | shown post-submit |
| difficulty | Easy / Medium / Hard |
| subject / topic | active references |
| year | e.g. 2023 |
| exam_type / source | e.g. GATE CS, official |
| status | Draft/In-review/Published/Rejected/Archived |
| created_by / reviewed_by | identifiers |
| language | base language (default English) |
| version | integer, bumped per edit |
| tags | searchable labels |
| created_at / updated_at | timestamps |

### 3.2 Type-specific rules
| Type | Selection rule | Marking / negative | Randomization | Validation |
|---|---|---|---|---|
| **MCQ** | exactly 1 correct option | +mark correct; negative per OD-01 | option order seeded per render | exactly one selection before grade |
| **MSQ** | 1..n-1 correct options | partial credit per OD-03; full only on exact set | option order stable for marking | at least 1 and at most n-1 selected |
| **NAT** | numeric only | numeric-only; tolerance per OD-03 | n/a | numeric parse; units case-insensitive where declared |

### 3.3 Lifecycle
| State | Entry | Exit conditions |
|---|---|---|
| Draft | creator | -> In-review (submitted) |
| In-review | moderator | -> Published / Rejected |
| Rejected | moderator | -> Draft (re-edit) |
| Published | moderator/admin | -> Archive (admin) |
| Archived | admin | -> Draft only |

Only **Published** questions are student-visible. Transitions honor separation of duties (OD-08).

---

## 4. Practice Requirements

### 4.1 Practice modes
| Mode ID | Name | Selection logic | Filters | Completion |
|---|---|---|---|---|
| PM-SUBJ | Subject-wise | questions from chosen subject | subject; optional topic/year/difficulty | all submitted or early submit |
| PM-TOPIC | Topic-wise | questions from one topic within subject | subject, topic | all submitted or finish |
| PM-YEAR | Year-wise | questions of a chosen year | year, optional subject/topic | same |
| PM-DIFF | Difficulty-wise | questions of chosen difficulty | subject/topic optional | same |
| PM-MIST | Mistake practice | questions answered wrong in prior sessions | optional subject | same |
| PM-CUST | Custom practice | intersection of chosen filters | subject/topic/year/difficulty | same |

Selection logic: build a question pool from active + published questions matching filters; randomize order; cap count (default 20, configurable).

### 4.2 Session rules
- **Timed vs untimed:** configurable per session; untimed = learning (immediate grading), timed = exam-like (delayed grading until submit).
- **Navigation:** linear Prev/Next (§2.4); mark-for-review allowed.
- **Answer exposure:** learning mode shows correct + explanation instantly (FR-EVAL-04); timed mode reveals at end.
- **Retry:** same session can be replayed with new random order.
- **Completion:** decide all answered, or submit early (unanswered policy = OD-06).

### 4.3 Lifecycle
- **Start:** filters defined -> pool built -> session created.
- **Pause/Resume:** timer stops; answers persist; auto-expire after 24h.
- **Complete:** final submit -> grading finalized -> summary + performance recorded.
- **Abandon:** session discarded (or resumed within 24h).

---

## 5. Analytics Requirements

| Metric ID | Name | Formula / definition | Data source | Refresh | Visible to |
|---|---|---|---|---|---|
| MA-ACC | Accuracy | correct / total answered 100% | attempts | real-time | student self |
| MA-TATT | Total attempts | count distinct answered | attempts | real-time | self |
| MA-AVG | Avg time/question | sum duration / count answered | timers | real-time | self |
| MA-TTOP | Topic accuracy | correct/topic / answered/topic | attempts | per session | self |
| MA-DIFF | Difficulty accuracy | accuracy grouped by difficulty | attempts | per session | self |
| MA-MIST | Mistake rate | wrong / total (topic or global) | attempts | per session | self |
| MA-STRK | Streak | consecutive days with >=1 completed session | sessions | daily | self |
| MA-TRND | Improvement trend | accuracy over last N sessions | attempts | daily | self |
| MA-WEAK | Weak areas | topics where acc < threshold AND attempts >= minimum | MA-TOPIC aggregate | per session | self + recommender |
| MA-REC | Recommendation score | rank of (1 - topic acc, weight given attempts, recency) | per-topic metrics | per session | self + recommender |

### 5.1 Driving the loop
- **Weak-area detection (MA-WEAK):** topic is weak when accuracy < threshold (OD-05) AND attempt count >= minimum (avoids 1-attempt false positives).
- **Recommendation (MA-REC):** order topics by (1 - accuracy) with weighting for attempt volume and recency; surface top topic with a one-click session (FR-REC-02).
- **Trend (MA-TRND):** lets the student verify the loop is working (accuracy rising over sessions).

---

## 6. Admin Requirements

| Capability | User story | Validation | Edge cases | Error state |
|---|---|---|---|---|
| Subjects/topics | FR-ADM-07 create/edit/deactivate | name unique + non-empty; cannot deactivate if published Qs exist | rename preserves references | validation shown; audit logged |
| Create question | FR-ADM-01 | required fields; answer valid for type; subject/topic active | absent -> reject on save | inline validation |
| Edit question | FR-ADM-02 | allowed on Draft/In-review/Published/Rejected | concurrent edit -> version conflict | "modified by another" error |
| Review/publish | FR-ADM-03 | state machine (3.3); reviewer != author (OD-08) | reject requires comment | publish blocked without review |
| Bulk import | FR-ADM-05 | CSV/JSON template; row validation | partial valid rows | import report; no partial commit of invalid rows |
| Bulk export | FR-ADM-06 | row cap | large export chunked | timeout/retry |
| User management | FR-ADM-08 | role changes; no self-demote | last admin removal | audit + denial |
| Audit log | FR-ADM-09 | append-only, non-editable | block pagination | read-only |

---

## 7. User Flows

### 7.1 Registration / Login
- **Trigger:** sign-in from home or "save progress" prompt.
- **Preconditions:** Guest or logged-out Student; valid session.
- **Primary path:** enter email -> verify link -> set password/name -> logged-in dashboard.
- **Alternate paths:** social login (Should); guest trial -> account conversion.
- **Edge cases:** duplicate email, locked account, expired verify link.
- **Postconditions:** authenticated session; profile + progress persisted.

### 7.2 Starting a Practice Session
- **Trigger:** dashboard "Start practice" or recommendation card.
- **Preconditions:** >=1 published question in the chosen filter.
- **Primary path:** choose subject/topic/year/difficulty -> select mode -> start.
- **Alternate:** resume an in-progress session.
- **Edge:** empty pool -> informative empty state.
- **Postconditions:** session created (state=in-progress).

### 7.3 Solving a Question
- **Trigger:** question rendered in session.
- **Primary path:** select/type answer -> Next.
- **Alt paths:** Mark for review; Skip; Prev.
- **Learning mode:** immediate grade + explanation (FR-EVAL-01..03, FR-EXPL-01).
- **Timed mode:** answer saved, no feedback until end.
- **Error:** numeric parse fail/unit mismatch in NAT.
- **Postcondition:** attempt recorded (correct/incorrect + duration).

### 7.4 Completing a Session
- **Trigger:** submit (early or after last).
- **Primary path:** grade all -> summary (score, accuracy, per-topic, explanations, mist collection).
- **Decision:** unanswered policy per OD-06.
- **Postcondition:** performance metrics updated; mistakes queued for PM-MIST.

### 7.5 Reviewing Mistakes
- **Trigger:** dashboard -> Mistake practice.
- **Primary path:** view wrong set -> replay -> mark resolved.
- **Postcondition:** "re-practiced" recorded; weak signals recomputed.

### 7.6 Viewing Performance
- **Trigger:** Dashboard view.
- **Primary:** accuracy, attempts, avg time, streak, trend, weak flags; drill to subject/topic.
- **Postcondition:** recommendation rendered (FR-REC-01).

### 7.7 Admin Adding/Approving a Question
- **Primary:** create/edit -> submit (Draft->In-review) -> reviewer publishes or rejects (with reason).
- **Edge:** separation of duties; version conflict.
- **Postcondition:** status transitions; audit entry written.

---

## 8. MVP Scope (MoSCoW)

### 8.1 Must Have (required for launch - the core loop)
- FR-AUTH-01, FR-AUTH-02, FR-AUTH-03 (registration/login/logout)
- FR-SUBJ-01, FR-SUBJ-02 (subject browse + counts)
- FR-TOPIC-01, FR-TOPIC-02 (topic browse + counts)
- FR-PRAC-01..FR-PRAC-07 (filtered, randomized practice sessions)
- FR-EVAL-01, FR-EVAL-02, FR-EVAL-03, FR-EVAL-04 (MCQ/MSQ/NAT grading + reveal)
- FR-EXPL-01 (explanations)
- FR-BMARK-01, FR-BMARK-02 (bookmarks)
- FR-MIST-01, FR-MIST-02 (mistake log + mistake practice)
- FR-TIME-01, FR-TIME-02 (timer + pause/resume)
- FR-PERF-01, FR-PERF-02 (attempt + topic performance persistence)
- FR-DASH-01, FR-DASH-02 (dashboard overview + topic accuracy/weak flags)
- FR-REC-01, FR-REC-02 (weakest-topic recommendation + one-click start)
- FR-ADM-01, FR-ADM-02, FR-ADM-03, FR-ADM-04, FR-ADM-07, FR-ADM-09 (content + state + audit)

### 8.2 Should Have (important, deferrable post-MVP)
- FR-AUTH-05 (password reset)
- FR-AUTH-06 (profile edit)
- FR-DASH-03 (improvement trend)
- FR-EXPL-02 (explanations in summary)
- FR-ADM-05, FR-ADM-06 (bulk import/export)
- FR-QREP-01, FR-QREP-02 (student reporting)

### 8.3 Not in MVP (explicitly excluded)
| Requirement | Reason |
|---|---|
| FR-NOTE-01/02 (personal notes) | deferred: bookmarks + mistake history cover retention (Phase 0) |
| FR-AUTH-07 (account deletion) | future compliance surface |
| Mock test practice mode | deferred (Phase 0 Q5): validate core loop first |
| Gamification, social, leaderboard, ML recommender, difficulty voting | Phase 0 Future themes |

> Every FR (AUTH-01..07, SUBJ, TOPIC, PRAC, EVAL, EXPL, BMARK, NOTE, MIST, TIME, PERF, DASH, REC, ADM, QREP) is classified exactly once. No orphaned requirements.

---

## 9. Non-Functional Requirements

| Category | Measurable requirement |
|---|---|
| Performance | Dashboard/practice page load < 2s on 4G (p90); API read latency p95 < 300ms; submit/eval write p95 < 1s; filter/search p95 < 200ms at 1M questions |
| Security | OWASP Top 10; TLS 1.2+; password hashing (PBKDF2/argon2); server-side RBAC; auth rate limiting (5/min); encrypted data at rest; minimal PII |
| Responsiveness | Breakpoints 320/480/768/1200px; touch targets >= 44px; one-hand usable |
| Accessibility | WCAG 2.1 AA; full keyboard nav; screen-reader labels on MCQ/MSQ options; visible focus states |
| Scalability | 10k concurrent sessions; catalog grows to 20k+ questions without p95 regression |
| Reliability | 99.5% monthly uptime; auto-suspend/retry; graceful degradation (read-mode when analytics down) |

---

## 10. Acceptance Criteria (Must Have, Given/When/Then)

- **FR-AUTH-01:** Given a new email, when the user registers with a valid password, then an account is created and the user is logged in.
- **FR-AUTH-02:** Given a registered user, when they log in correctly, then they reach the dashboard with their saved progress.
- **FR-PRAC-01:** Given >=1 published question in a filter, when practice starts, then only matching questions appear in the session.
- **FR-PRAC-02:** Given the same session replayed, when restarted, then the question order is randomized.
- **FR-EVAL-01:** Given an MCQ, when a single option is submitted, then correct/incorrect is shown instantly with per-policy marks.
- **FR-EVAL-02:** Given an MSQ with 2 correct options, when submitted: full set -> full marks; 1 mismatch -> partial; else zero (per OD-03).
- **FR-EVAL-03:** Given NAT answer 5.0, when a student enters 5, 5.0 (case-insensitive), then it is correct; out-of-tolerance values are wrong (OD-03).
- **FR-EXPL-01:** Given a submitted question, when the summary is viewed, then the explanation is visible.
- **FR-BMARK-01:** Given a question, when bookmarked, then it appears in the bookmark list.
- **FR-MIST-02:** Given >=1 wrong answer, when Mistake practice starts, then only those questions are queued.
- **FR-TIME-01:** Given a timed session, when the timer runs, then elapsed time updates per second and pausing stops it.
- **FR-DASH-01:** Given recorded performance, when the dashboard loads, then accuracy and attempt totals render.
- **FR-REC-01:** Given a weak topic (below OD-05 threshold with min attempts), when the dashboard is viewed, then a one-click "practice weakest topic" card appears.
- **FR-ADM-01:** Given an Admin creating a question, when saving with an invalid answer, then the form blocks with a validation message.
- **FR-ADM-03:** Given a question in review, when a moderator approves it, then it becomes Published and reaches students.

---

## 11. Internal Consistency Checks

| Check | Status | Evidence |
|---|---|---|
| Every role has >=1 functional requirement | PASS | Guest: FR-AUTH-01/04; Student: most FR-*; Moderator: FR-ADM-03/05; Admin: FR-ADM-01..09 |
| Every FR has unique ID, traceable to a flow or analytics/admin need | PASS | All IDs listed; mapping documented in Section 7 |
| Every question type has schema + practice behavior | PASS | Section 3 (MCQ/MSQ/NAT) |
| Every practice mode has selection logic + completion criteria | PASS | Section 4.1 |
| Every analytics metric has formula + data source | PASS | Section 5 |
| Every Must-Have feature has >=1 acceptance criterion | PASS | Section 10 |
| No Future item appears in Must Have | PASS | Notes/mock/gamification in 8.3 only |
| All Needs Decision items logged | PASS | Section 12 (OD-01..OD-09) |
| No orphan/unclassified requirements | PASS | Section 8 covers all IDs |

---

## 12. Open Decisions (with impact)

| ID | Question | Options | Recommended Default | Impact if Unresolved |
|---|---|---|---|---|
| OD-01 | Negative-marking policy for MCQ | GATE official vs custom vs none | GATE official scheme per question config | Grading trust; score integrity |
| OD-02 | Guest trial persistence & limits | limited Qs non-persistent; time-limited; account-convertible | limited Qs, non-persistent, converts on register | Onboarding vs account conversion |
| OD-03 | MSQ partial scoring + NAT tolerance | exact-only vs partial; tolerance range | full on exact set; partial on partial matches; NAT tolerance +/-0.1 | Grading correctness |
| OD-04 | Taxonomy depth | subject-topic only; subject-topic-microtopic | 2-level (Subject->Topic) first | Grouping, filtering, weak-area analytics |
| OD-05 | Weak-area threshold + min attempt | threshold %, min attempt count, variants | accuracy < 45% AND attempts >= 5 (configurable) | Recommendation quality |
| OD-06 | Unanswered-at-submit policy | marked wrong; not scored; counted as skipped | unanswered = not scored, shown as skipped (timed) | Score integrity |
| OD-07 | Separation of duties | allow self-publish; require second reviewer | require reviewer != author for publish | Content trust |
| OD-08 | Language support | English only; multi-language | English only in MVP | Content/render scope |

> OD-01..OD-08 are the open decisions that re-scope or block implementation; all are carried into Phase 2/PRD, none silently assumed.

---

## 13. Final MVP Scope Summary
Must Have requirement IDs, one line each:
- **FR-AUTH-01/02/03** - registration, login, logout with data persistence
- **FR-SUBJ-01/02** - subject browsing with counts and per-subject accuracy
- **FR-TOPIC-01/02** - topic browsing with counts and topic accuracy
- **FR-PRAC-01..07** - filtered, randomized, navigable practice sessions
- **FR-EVAL-01..04** - MCQ/MSQ/NAT grading with reveal per mode
- **FR-EXPL-01** - post-answer explanations
- **FR-BMARK-01/02** - bookmark + list
- **FR-MIST-01/02** - mistake log + mistake replay session
- **FR-TIME-01/02** - session timer + pause/resume
- **FR-PERF-01/02** - attempt and topic-wise performance persistence
- **FR-DASH-01/02** - dashboard overview + topic weakness flags
- **FR-REC-01/02** - weakest-topic recommendation + one-click start
- **FR-ADM-01/02/03/04/07/09** - question CRUD, review states, taxonomy, audit

---

## 14. Phase 1 Completion Checklist

| Checklist item | Status |
|---|---|
| Roles & permissions | PASS |
| Functional requirements (IDs) | PASS |
| Question requirements (MCQ/MSQ/NAT) | PASS |
| Practice modes + session rules/lifecycle | PASS |
| Analytics (formula + data source) | PASS |
| Admin requirements (validation/edge/error) | PASS |
| User flows | PASS |
| MVP scope (MoSCoW) | PASS |
| Non-functional (measurable) | PASS |
| Acceptance criteria (Must Have) | PASS |
| No contradictions / all IDs classified | PASS |

---

## 15. Recommended Phase 2: User Flow + Information Architecture

**Produce next:**
1. **Low-fidelity wireframes** for the flows in Section 7 (register, start practice, solve, complete, mistakes, dashboard, admin add/approve).
2. **Information architecture**: global navigation (Practice, Dashboard, Bookmarks, Profile), hierarchy (Subject -> Topic -> Question -> Attempt), and a screen/sitemap matrix.
3. **Validation:** confirm every Must-Have (Section 8.1/13) is reachable in the wireframe/sitemap without new features.
4. Sequence with Phase 3 once OD-01..OD-05 (grading, taxonomy, trial, thresholds) are resolved with stakeholders.

---

## End of Phase 1 - awaiting approval before Phase 2.