"use client";
// PG-STD-SETP — Practice setup: mode chips → filters → Start session (Phase 5 §4.5).
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { ApiError } from "@/lib/api";
import { practiceService, subjectsService } from "@/services";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { ErrorState } from "@/components/ui/states";
import { useToast } from "@/components/ui/overlay";

const MODES = [
  { value: "topic", label: "Topic" },
  { value: "subject", label: "Subject" },
  { value: "year", label: "Year" },
  { value: "difficulty", label: "Difficulty" },
  { value: "mistake", label: "Mistakes" },
  { value: "custom", label: "Custom" },
] as const;

export function PracticeSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notify } = useToast();

  const subjectsQuery = useApi(() => subjectsService.list(), []);
  const [mode, setMode] = useState(searchParams.get("mode") ?? "topic");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState(searchParams.get("topic_id") ?? "");
  const [year, setYear] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [typeCodes, setTypeCodes] = useState<string[]>([]);
  const [count, setCount] = useState(20);
  const [timed, setTimed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [formError, setFormError] = useState("");

  const topicsQuery = useApi(
    () => (subjectId ? subjectsService.topics(subjectId) : Promise.resolve(null)),
    [subjectId],
  );

  const activeFilters = useMemo(() => {
    const filters: Record<string, unknown> = {};
    if (mode === "mistake") return filters;
    if (subjectId) filters["subject_id"] = subjectId;
    if (mode === "topic" || topicId) {
      if (topicId && (mode === "topic" || mode === "custom")) filters["topic_id"] = topicId;
    }
    if ((mode === "year" || mode === "custom") && year) filters["year"] = Number(year);
    if ((mode === "difficulty" || mode === "custom") && difficulty) filters["difficulty"] = difficulty;
    if (mode === "custom" && typeCodes.length > 0) filters["question_types"] = typeCodes;
    return filters;
  }, [mode, subjectId, topicId, year, difficulty, typeCodes]);

  const canStart =
    !subjectsQuery.loading &&
    (mode === "mistake" ||
      (mode === "topic" ? Boolean(topicId) : mode === "subject" ? Boolean(subjectId) : mode === "year" ? Boolean(year) : mode === "difficulty" ? Boolean(difficulty) : true));

  async function onStart() {
    setStarting(true);
    setFormError("");
    try {
      // ≤2 active filter keys enforced server-side too (Phase 4 §3.2.5).
      const session = await practiceService.create({
        mode,
        filters: activeFilters as never,
        timed,
        question_count: count,
      });
      await practiceService.start(session.id);
      notify(`Session ready — ${session.total_questions} questions`, "success");
      router.push(`/practice/${session.id}`);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Could not start the session.");
      setStarting(false);
    }
  }

  const subjects = subjectsQuery.data?.items ?? [];
  const topics = topicsQuery.data?.items ?? [];

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-8">
      <h1 className="text-2xl font-bold">Set up practice</h1>
      <p className="mt-1 text-sm text-muted">Pick what you want to drill today.</p>

      <Card className="mt-6">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Mode</legend>
          <div className="flex flex-wrap gap-2">
            {MODES.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={mode === item.value}
                onClick={() => {
                  setMode(item.value);
                  if (item.value !== "topic") setTopicId("");
                  if (item.value !== "subject") setSubjectId("");
                }}
                className={`touch-target rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  mode === item.value
                    ? "border-primary bg-[color:var(--primary-soft)] text-primary"
                    : "border-line bg-surface text-muted hover:border-primary"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 flex flex-col gap-4">
          {(mode === "topic" || mode === "custom") && (
            <>
              <Select
                label="Subject"
                required={mode === "topic"}
                value={subjectId}
                onChange={(event) => {
                  setSubjectId(event.target.value);
                  setTopicId("");
                }}
                error={subjectsQuery.error?.message}
              >
                <option value="">Select a subject…</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </Select>
              <Select
                label="Topic"
                required={mode === "topic"}
                value={topicId}
                onChange={(event) => setTopicId(event.target.value)}
                disabled={!subjectId}
                hint={subjectId ? undefined : "Choose a subject first"}
              >
                <option value="">Select a topic…</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>{topic.name}</option>
                ))}
              </Select>
            </>
          )}

          {mode === "subject" && (
            <Select label="Subject" required value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
              <option value="">Select a subject…</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </Select>
          )}

          {(mode === "year" || mode === "custom") && (
            <Input
              label="GATE year"
              inputMode="numeric"
              placeholder="e.g. 2023"
              value={year}
              onChange={(event) => setYear(event.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          )}

          {(mode === "difficulty" || mode === "custom") && (
            <Select label="Difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
              <option value="">Any difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
          )}

          {mode === "custom" && (
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium">Question types</legend>
              <div className="flex gap-4">
                {["mcq", "msq", "nat"].map((code) => (
                  <label key={code} className="inline-flex touch-target items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={typeCodes.includes(code)}
                      onChange={(event) =>
                        setTypeCodes((current) =>
                          event.target.checked ? [...current, code] : current.filter((value) => value !== code),
                        )
                      }
                      className="size-4 accent-[color:var(--primary)]"
                    />
                    {code.toUpperCase()}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <Input
            label="Questions"
            inputMode="numeric"
            value={String(count)}
            onChange={(event) => {
              const parsed = Number(event.target.value.replace(/\D/g, ""));
              setCount(Math.min(50, Math.max(1, Number.isFinite(parsed) && parsed > 0 ? parsed : 20)));
            }}
            hint="1–50 questions"
          />

          <label className="inline-flex touch-target items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={timed}
              onChange={(event) => setTimed(event.target.checked)}
              className="size-4 accent-[color:var(--primary)]"
            />
            Timed session (tracks elapsed time)
          </label>

          {mode === "mistake" && (
            <p className="rounded-md2 bg-warning-soft px-3 py-2 text-xs text-warning">
              Mistake mode replays your previously incorrect questions.
            </p>
          )}
          {formError && (
            <p role="alert" className="rounded-md2 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{formError}</p>
          )}
          <Button size="lg" disabled={!canStart} loading={starting} onClick={() => void onStart()}>
            Start session
          </Button>
        </div>
      </Card>
    </div>
  );
}
