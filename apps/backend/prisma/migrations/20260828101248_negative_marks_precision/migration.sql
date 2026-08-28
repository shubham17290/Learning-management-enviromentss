-- AlterTable: allow exact GATE negative marks (e.g. +/-1/3 = 0.333).
ALTER TABLE "questions" ALTER COLUMN "marks" SET DATA TYPE DECIMAL(6,3);
ALTER TABLE "questions" ALTER COLUMN "negative_marks" SET DATA TYPE DECIMAL(6,3);
