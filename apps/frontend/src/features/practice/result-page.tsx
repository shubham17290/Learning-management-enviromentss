"use client";
// PG-STD-SMMY — Session result: score band, summary, per-topic, mistakes, explanations (Phase 5 §4.7).
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { questionsService, practiceService } from "@/services";
import type { PublicQuestion } from "@/types/api";
import { Card, CardTitle, StatCard, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState, SkeletonList } from "@/components/ui/states";
import { Breadcrumb } from "@/components/layout/navigation";
import { formatAccuracy } from "@/utils/format";

export function ResultPage({ sessionId }: { sessionId?: string }) {
  const params = useParams<{ sessionId: string }>();
  const id = sessionId ?? params.sessionId;
  const { data, loading, error, retry } = useApi(() => {
    if (!id) return Promise.reject(new Error("Missing session"));
    return practiceService.result(id);
  }, [id]);

  const mistakes = useApi(async () => {
    if (!data || data.mistakes.length === 0) return [] as PublicQuestion[];
    const settled = await Promise.allSettled(data.mistakes.slice(0, 20).map((questionId) => questionsService.get(questionId)));
    return settled
      .filter((entry): entry is PromiseFulfilledResult<PublicQuestion> => entry.status === "fulfilled")
      .map((entry) => entry.value);
  }, [data]);

  const [openExplanation, setOpenExplanation] = useState<string | null>(null);

  if (loading) return <div className="mx-auto max-w-content p-6"><SkeletonList rows={6} /></div>;
  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <ErrorState error={error ?? { code: "UNKNOWN", message: "Result unavailable." }} retry={retry} />
      </div>
    );
  }

  const accuracy = data.summary.attempted > 0 ? data.summary.correct / data.summary.attempted : 0;

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-8">
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Session result" }]} />

      {/* Summary band */}
      <section className={`mt-3 rounded-lg2 border p-6 text-center ${accuracy >= 0.6 ? "border-success/40 bg-success-soft" : accuracy >= 0.45 ? "border-warning/40 bg-warning-soft" : "border-danger/40 bg-danger-soft"}`}>
        <h1 className="text-xl font-bold">
          {accuracy >= 0.8 ? "Outstanding! 🏆" : accuracy >= 0.6 ? "Well done! 🎉" : accuracy >= 0.45 ? "Good effort 💪" : "Keep practicing 📚"}
        </h1>
        <p className="mt-1 text-sm text-muted">Session · {new Date(data.started_at).toLocaleString()}</p>
        <p className="mt-3 text-5xl font-extrabold tracking-tight">{formatAccuracy(accuracy)}</p>
        <p className="text-sm text-muted">
          {data.summary.correct} correct of {data.summary.attempted} attempted ({data.summary.skipped} skipped)
        </p>
      </section>

      {/* Score + stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Score" value={`${data.score.total_marks}`} sub={`of ${data.score.max_marks} max`} emphasis />
        <StatCard label="Negative marks" value={data.score.negative_marks} />
        <StatCard label="Attempted" value={data.summary.attempted} sub={`${data.summary.incorrect} incorrect`} />
        <StatCard label="Mode" value={data.mode} sub={data.timed ? "timed" : "untimed"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Per-topic breakdown */}
        <Card>
          <CardTitle>Per-topic breakdown</CardTitle>
          <ul className="flex flex-col gap-3">
            {data.per_topic.map((topic, index) => {
              const percent = topic.attempted > 0 ? Math.round((topic.correct / topic.attempted) * 100) : 0;
              return (
                <li key={topic.topic_id ?? index}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{topic.topic_id ? `Topic ${topic.topic_id.slice(0, 8)}…` : "Unassigned"}</span>
                    <span className="text-muted">{topic.correct}/{topic.attempted}</span>
                  </div>
                  <div role="img" aria-label={`${percent}% correct`} className="h-2 overflow-hidden rounded-full bg-line">
                    <div className={`h-full ${percent >= 60 ? "bg-success" : percent >= 45 ? "bg-warning" : "bg-danger"}`} style={{ width: `${percent}%` }} />
                  </div>
                </li>
              );
            })}
            {data.per_topic.length === 0 && <li className="py-2 text-center text-sm text-muted">No attempts recorded.</li>}
          </ul>
        </Card>

        {/* Mistakes */}
        <Card>
          <CardTitle>Review your mistakes</CardTitle>
          {mistakes.loading ? (
            <SkeletonList rows={2} />
          ) : (mistakes.data ?? []).length === 0 ? (
            <p className="rounded-md2 border border-dashed border-line py-6 text-center text-sm text-muted">
              No mistakes — flawless session! ✨
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {(mistakes.data ?? []).slice(0, 5).map((question) => (
                <li key={question.id}>
                  <button
                    type="button"
                    onClick={() => setOpenExplanation(openExplanation === question.id ? null : question.id)}
                    aria-expanded={openExplanation === question.id}
                    className="w-full rounded-md2 border border-line bg-bg p-3 text-left hover:border-primary"
                  >
                    <p className="line-clamp-2 text-sm font-medium">{question.body}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone="info">{question.type_code.toUpperCase()}</Badge>
                      <Badge tone="neutral">{question.difficulty}</Badge>
                    </div>
                  </button>
                  {openExplanation === question.id && (
                    <div className="mt-2 rounded-md2 bg-[color:var(--primary-soft)] p-3 text-sm">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Explanation</p>
                      <p>{data.explanations.find((item) => item.question_id === question.id)?.explanation ?? question.explanation ?? "Explanation will be available soon."}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Explanations for all attempted questions */}
      <Card className="mt-6">
        <CardTitle>Explanations</CardTitle>
        {data.explanations.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted">No explanations available for this session.</p>
        ) : (
          <ul className="divide-y divide-line">
            {data.explanations.map((entry, index) => (
              <li key={entry.question_id} className="py-3">
                <details open={index === 0}>
                  <summary className="cursor-pointer touch-target text-sm font-medium">
                    Explanation #{index + 1}
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{entry.explanation}</p>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/practice?mode=mistake"><Button size="lg">Practice mistakes again</Button></Link>
        <Link href="/dashboard"><Button size="lg" variant="secondary">Back to dashboard</Button></Link>
      </div>
    </div>
  );
}
