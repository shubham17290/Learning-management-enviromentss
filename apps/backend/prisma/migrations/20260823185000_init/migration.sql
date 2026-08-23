-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "target_subject_id" TEXT,
    "email_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "ip" INET,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "chapter_id" TEXT,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subtopics" (
    "id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "subtopics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "has_options" BOOLEAN NOT NULL,
    "has_numeric" BOOLEAN NOT NULL,
    "supports_multiple" BOOLEAN NOT NULL,

    CONSTRAINT "question_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "exam_year" INTEGER NOT NULL,
    "paper_number" TEXT,
    "shift" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "question_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "question_type_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "topic_id" TEXT,
    "body" TEXT NOT NULL,
    "explanation" TEXT,
    "marks" DECIMAL(4,1) NOT NULL DEFAULT 1,
    "negative_marks" DECIMAL(4,1) DEFAULT 0,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "gate_year" INTEGER NOT NULL,
    "source_id" TEXT,
    "created_by" TEXT NOT NULL,
    "reviewed_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_versions" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "reason" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_numeric_answers" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "numeric_value" DECIMAL(20,8) NOT NULL,
    "tolerance_abs" DECIMAL(20,8) DEFAULT 0,
    "tolerance_rel" DECIMAL(5,4) DEFAULT 0,
    "unit" TEXT,
    "precision" INTEGER,

    CONSTRAINT "question_numeric_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_modes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "practice_modes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mode_id" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "timed" BOOLEAN NOT NULL DEFAULT false,
    "total_questions" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ,
    "abandoned_at" TIMESTAMPTZ,
    "score" DECIMAL(8,2),

    CONSTRAINT "practice_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempts" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_version_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "selected_answers" JSONB NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "marks" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "time_taken_seconds" INTEGER NOT NULL,
    "answered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "response_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_reports" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "reporter_user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "detail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolution" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" BIGSERIAL NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_roles_code" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_email" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "uq_sessions_token_hash" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "ix_sessions_user_id" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_password_reset_tokens_token_hash" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "uq_subjects_code" ON "subjects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "uq_subjects_name" ON "subjects"("name");

-- CreateIndex
CREATE INDEX "ix_topics_subject_id" ON "topics"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_question_types_code" ON "question_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "uq_question_sources_name" ON "question_sources"("name");

-- CreateIndex
CREATE INDEX "ix_questions_status_published_topic" ON "questions"("status", "topic_id", "gate_year");

-- CreateIndex
CREATE INDEX "ix_questions_subject_status" ON "questions"("subject_id", "status");

-- CreateIndex
CREATE INDEX "ix_question_versions_question_id" ON "question_versions"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_question_versions_question_id_version" ON "question_versions"("question_id", "version");

-- CreateIndex
CREATE INDEX "ix_question_options_question_id" ON "question_options"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_practice_modes_code" ON "practice_modes"("code");

-- CreateIndex
CREATE INDEX "ix_attempts_user_id_answered_at" ON "attempts"("user_id", "answered_at");

-- CreateIndex
CREATE INDEX "ix_attempts_question_version_id" ON "attempts"("question_version_id");

-- CreateIndex
CREATE INDEX "ix_attempts_session_id" ON "attempts"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_bookmarks_user_question" ON "bookmarks"("user_id", "question_id");

-- CreateIndex
CREATE INDEX "ix_question_reports_status" ON "question_reports"("status");

-- CreateIndex
CREATE INDEX "ix_audit_log_actor_id" ON "audit_log"("actor_id");

-- CreateIndex
CREATE INDEX "ix_audit_log_entity_type_entity_id" ON "audit_log"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_target_subject_id_fkey" FOREIGN KEY ("target_subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtopics" ADD CONSTRAINT "subtopics_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtopics" ADD CONSTRAINT "subtopics_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_question_type_id_fkey" FOREIGN KEY ("question_type_id") REFERENCES "question_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "question_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_numeric_answers" ADD CONSTRAINT "question_numeric_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_mode_id_fkey" FOREIGN KEY ("mode_id") REFERENCES "practice_modes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "practice_sessions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_question_version_id_fkey" FOREIGN KEY ("question_version_id") REFERENCES "question_versions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_reports" ADD CONSTRAINT "question_reports_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "question_reports" ADD CONSTRAINT "question_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- ═════════════════════════════════════════════════════════════
-- PHASE 3 MANUAL CONSTRAINTS (not expressible in Prisma schema)
-- Source: docs/DB-Model-Phase3.md §2, §6.2, §8
-- ═════════════════════════════════════════════════════════════

-- §6.2: users.email is citext (case-insensitive canonical login, uq_users_email)
-- NOTE: requires privileges to create extensions. If not available, keep TEXT
-- and enforce lowercasing application-side.
CREATE EXTENSION IF NOT EXISTS citext;
ALTER TABLE "users" ALTER COLUMN "email" TYPE citext USING ("email"::citext);

-- §8: CHECK constraints.
-- ck_questions_onepositive and ck_attempts_marks_nonneg are enforced
-- application-side by design (Phase 3 §8) and are intentionally absent here.
ALTER TABLE "users" ADD CONSTRAINT "ck_users_status" CHECK ("status" IN ('active', 'disabled'));
ALTER TABLE "questions" ADD CONSTRAINT "ck_questions_difficulty" CHECK ("difficulty" IN ('easy', 'medium', 'hard'));
ALTER TABLE "questions" ADD CONSTRAINT "ck_questions_status" CHECK ("status" IN ('draft', 'in_review', 'published', 'rejected', 'archived'));
ALTER TABLE "questions" ADD CONSTRAINT "ck_questions_gate_year_pos" CHECK ("gate_year" > 1990);
ALTER TABLE "practice_sessions" ADD CONSTRAINT "ck_practice_sessions_status" CHECK ("status" IN ('in_progress', 'submitted', 'completed', 'abandoned'));
ALTER TABLE "practice_sessions" ADD CONSTRAINT "ck_practice_sessions_total_pos" CHECK ("total_questions" > 0);
ALTER TABLE "question_reports" ADD CONSTRAINT "ck_question_reports_status" CHECK ("status" IN ('open', 'reviewed', 'resolved', 'dismissed'));

-- §2 naming conventions: primary keys as pk_<table>
ALTER TABLE "roles" RENAME CONSTRAINT "roles_pkey" TO "pk_roles";
ALTER TABLE "users" RENAME CONSTRAINT "users_pkey" TO "pk_users";
ALTER TABLE "sessions" RENAME CONSTRAINT "sessions_pkey" TO "pk_sessions";
ALTER TABLE "password_reset_tokens" RENAME CONSTRAINT "password_reset_tokens_pkey" TO "pk_password_reset_tokens";
ALTER TABLE "subjects" RENAME CONSTRAINT "subjects_pkey" TO "pk_subjects";
ALTER TABLE "chapters" RENAME CONSTRAINT "chapters_pkey" TO "pk_chapters";
ALTER TABLE "topics" RENAME CONSTRAINT "topics_pkey" TO "pk_topics";
ALTER TABLE "subtopics" RENAME CONSTRAINT "subtopics_pkey" TO "pk_subtopics";
ALTER TABLE "question_types" RENAME CONSTRAINT "question_types_pkey" TO "pk_question_types";
ALTER TABLE "question_sources" RENAME CONSTRAINT "question_sources_pkey" TO "pk_question_sources";
ALTER TABLE "questions" RENAME CONSTRAINT "questions_pkey" TO "pk_questions";
ALTER TABLE "question_versions" RENAME CONSTRAINT "question_versions_pkey" TO "pk_question_versions";
ALTER TABLE "question_options" RENAME CONSTRAINT "question_options_pkey" TO "pk_question_options";
ALTER TABLE "question_numeric_answers" RENAME CONSTRAINT "question_numeric_answers_pkey" TO "pk_question_numeric_answers";
ALTER TABLE "practice_modes" RENAME CONSTRAINT "practice_modes_pkey" TO "pk_practice_modes";
ALTER TABLE "practice_sessions" RENAME CONSTRAINT "practice_sessions_pkey" TO "pk_practice_sessions";
ALTER TABLE "attempts" RENAME CONSTRAINT "attempts_pkey" TO "pk_attempts";
ALTER TABLE "bookmarks" RENAME CONSTRAINT "bookmarks_pkey" TO "pk_bookmarks";
ALTER TABLE "notes" RENAME CONSTRAINT "notes_pkey" TO "pk_notes";
ALTER TABLE "question_reports" RENAME CONSTRAINT "question_reports_pkey" TO "pk_question_reports";
ALTER TABLE "audit_log" RENAME CONSTRAINT "audit_log_pkey" TO "pk_audit_log";

-- §2 naming conventions: foreign keys as fk_<child>_<parent>
ALTER TABLE "users" RENAME CONSTRAINT "users_role_id_fkey" TO "fk_users_roles";
ALTER TABLE "users" RENAME CONSTRAINT "users_target_subject_id_fkey" TO "fk_users_subjects";
ALTER TABLE "sessions" RENAME CONSTRAINT "sessions_user_id_fkey" TO "fk_sessions_users";
ALTER TABLE "password_reset_tokens" RENAME CONSTRAINT "password_reset_tokens_user_id_fkey" TO "fk_password_reset_tokens_users";
ALTER TABLE "chapters" RENAME CONSTRAINT "chapters_subject_id_fkey" TO "fk_chapters_subjects";
ALTER TABLE "topics" RENAME CONSTRAINT "topics_subject_id_fkey" TO "fk_topics_subjects";
ALTER TABLE "topics" RENAME CONSTRAINT "topics_chapter_id_fkey" TO "fk_topics_chapters";
ALTER TABLE "subtopics" RENAME CONSTRAINT "subtopics_topic_id_fkey" TO "fk_subtopics_topics";
ALTER TABLE "subtopics" RENAME CONSTRAINT "subtopics_subject_id_fkey" TO "fk_subtopics_subjects";
ALTER TABLE "questions" RENAME CONSTRAINT "questions_question_type_id_fkey" TO "fk_questions_question_types";
ALTER TABLE "questions" RENAME CONSTRAINT "questions_subject_id_fkey" TO "fk_questions_subjects";
ALTER TABLE "questions" RENAME CONSTRAINT "questions_topic_id_fkey" TO "fk_questions_topics";
ALTER TABLE "questions" RENAME CONSTRAINT "questions_source_id_fkey" TO "fk_questions_question_sources";
ALTER TABLE "questions" RENAME CONSTRAINT "questions_created_by_fkey" TO "fk_questions_users_created_by";
ALTER TABLE "questions" RENAME CONSTRAINT "questions_reviewed_by_fkey" TO "fk_questions_users_reviewed_by";
ALTER TABLE "question_versions" RENAME CONSTRAINT "question_versions_question_id_fkey" TO "fk_question_versions_questions";
ALTER TABLE "question_versions" RENAME CONSTRAINT "question_versions_created_by_fkey" TO "fk_question_versions_users";
ALTER TABLE "question_options" RENAME CONSTRAINT "question_options_question_id_fkey" TO "fk_question_options_questions";
ALTER TABLE "question_numeric_answers" RENAME CONSTRAINT "question_numeric_answers_question_id_fkey" TO "fk_question_numeric_answers_questions";
ALTER TABLE "practice_sessions" RENAME CONSTRAINT "practice_sessions_user_id_fkey" TO "fk_practice_sessions_users";
ALTER TABLE "practice_sessions" RENAME CONSTRAINT "practice_sessions_mode_id_fkey" TO "fk_practice_sessions_practice_modes";
ALTER TABLE "attempts" RENAME CONSTRAINT "attempts_session_id_fkey" TO "fk_attempts_practice_sessions";
ALTER TABLE "attempts" RENAME CONSTRAINT "attempts_user_id_fkey" TO "fk_attempts_users";
ALTER TABLE "attempts" RENAME CONSTRAINT "attempts_question_version_id_fkey" TO "fk_attempts_question_versions";
ALTER TABLE "bookmarks" RENAME CONSTRAINT "bookmarks_user_id_fkey" TO "fk_bookmarks_users";
ALTER TABLE "bookmarks" RENAME CONSTRAINT "bookmarks_question_id_fkey" TO "fk_bookmarks_questions";
ALTER TABLE "notes" RENAME CONSTRAINT "notes_user_id_fkey" TO "fk_notes_users";
ALTER TABLE "notes" RENAME CONSTRAINT "notes_question_id_fkey" TO "fk_notes_questions";
ALTER TABLE "question_reports" RENAME CONSTRAINT "question_reports_question_id_fkey" TO "fk_question_reports_questions";
ALTER TABLE "question_reports" RENAME CONSTRAINT "question_reports_reporter_user_id_fkey" TO "fk_question_reports_users";
ALTER TABLE "audit_log" RENAME CONSTRAINT "audit_log_actor_id_fkey" TO "fk_audit_log_users";