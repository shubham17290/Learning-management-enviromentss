"use client";
// PG-STD-PERF / PG-STD-WEAK — Analytics: overview, subject/topic bars, weak topics (Phase 5 §10).
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { analyticsService } from "@/services";
import { Card, CardTitle, StatCard } from "@/components/ui/card";
import { ErrorState, SkeletonList } from "@/components/ui/states";
import { formatAccuracy, formatSeconds } from "@/utils/format";

export function AnalyticsPage() {
  const overview = useApi(() => analyticsService.overview(), []);
  const subjects = useApi(() => analyticsService.subjects(1), []);
  const topics = useApi(() => analyticsService.topics(1), []);
  const weak = useApi(() => analyticsService.dashboardWeak(10), []);

  const loading = overview.loading || subjects.loading || topics.loading;
  const error = overview.error;

  if (loading) return <div className="mx-auto max-w-content p-6"><SkeletonList rows={6} /></div>;
  if (error) {
    return <div className="mx-auto max-w-xl p-6"><ErrorState error={error} retry={overview.retry} /></div>;
  }

  const subjectItems = (subjects.data?.items ?? []).map((subject) => ({
    id: subject.subject_id,
    label: subject.subject_name ?? "Subject",
    accuracy: subject.accuracy,
    attempts: subject.attempts,
    extra: `avg ${formatSeconds(subject.avg_time_s)}`,
  }));

  const topicItems = [...(topics.data?.items ?? [])]
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 15)
    .map((topic) => ({
      id: topic.topic_id,
      label: topic.topic_name ?? topic.topic_id.slice(0, 12),
      accuracy: topic.accuracy,
      attempts: topic.attempts,
      extra: `${topic.attempts}Q · avg ${formatSeconds(topic.avg_time_s)}`,
    }));

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-8">
      <h1 className="text-2xl font-bold">Performance</h1>
      <p className="mt-1 text-sm text-muted">Where you stand and what to fix next.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Overall accuracy" value={formatAccuracy(overview.data?.accuracy)} emphasis />
        <StatCard label="Total attempts" value={overview.data?.total_attempts ?? 0} />
        <StatCard label="Avg time / Q" value={formatSeconds(overview.data?.avg_time_s)} />
        <StatCard label="Streak" value={`${overview.data?.streak_days ?? 0} days`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Subject-wise accuracy</CardTitle>
          <BarRows items={subjectItems} />
          {subjectItems.length === 0 && <p className="py-4 text-center text-sm text-muted">No data yet.</p>}
        </Card>

        <Card>
          <CardTitle>Topic-wise accuracy (weakest first)</CardTitle>
          <BarRows items={topicItems} />
          {topicItems.length === 0 && <p className="py-4 text-center text-sm text-muted">No data yet.</p>}
        </Card>
      </div>

      <Card className="mt-6 border-warning/40">
        <CardTitle>Weak topics &amp; recommendations</CardTitle>
        <ul className="flex flex-col gap-2">
          {(weak.data ?? []).map((topic) => (
            <li key={topic.topic_id} className="flex flex-col justify-between gap-2 rounded-md2 border border-line bg-bg p-3 sm:flex-row sm:items-center">
              <div>
                <p className="font-medium">{topic.topic_name ?? "Topic"}</p>
                <p className="text-xs text-muted">
                  {formatAccuracy(topic.accuracy)} over {topic.attempts} attempts
                </p>
              </div>
              <Link
                href={`/practice?mode=topic&topic_id=${topic.topic_id}`}
                className="touch-target inline-flex items-center rounded-md2 bg-primary px-4 py-2 text-center text-sm font-medium text-white"
              >
                Practice this topic →
              </Link>
            </li>
          ))}
          {(weak.data ?? []).length === 0 && (
            <li className="rounded-md2 border border-dashed border-line py-6 text-center text-sm text-muted">
              No weak topics detected — keep practicing to stay sharp!
            </li>
          )}
        </ul>
        {/* Trend line chart deferred: backend exposes no weekly trend endpoint yet (see Phase 9 report). */}
      </Card>
    </div>
  );
}

function BarRows({
  items,
}: {
  items: Array<{ id: string; label: string; accuracy: number; attempts: number; extra?: string }>;
}) {
  return (
    <ul className="flex flex-col gap-3" role="list">
      {items.map((item) => {
        const percent = Math.round(item.accuracy * 100);
        return (
          <li key={item.id}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="min-w-0 truncate font-medium">{item.label}</span>
              <span aria-hidden="true" className="shrink-0 text-xs text-muted">
                {percent}%{item.extra ? ` · ${item.extra}` : ""}
              </span>
            </div>
            <div
              role="img"
              aria-label={`${item.label}: ${percent}% accuracy`}
              className="h-2 overflow-hidden rounded-full bg-line"
            >
              <div
                className={`h-full rounded-full ${percent >= 60 ? "bg-success" : percent >= 45 ? "bg-warning" : "bg-danger"}`}
                style={{ width: `${Math.max(percent, item.attempts > 0 ? 2 : 0)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
