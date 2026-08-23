"use client";
// PG-HOME-LND — Landing: hero + subject preview grid (guest sees counts only).
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { subjectsService } from "@/services";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState, SkeletonList } from "@/components/ui/states";

export function LandingPage() {
  const { data, loading, error, retry } = useApi(() => subjectsService.list(), []);
  const { status } = useAuth();

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-8">
      <section className="rounded-lg2 bg-gradient-to-br from-[color:var(--primary-soft)] to-surface p-8 text-center sm:p-14">
        <h1 className="mx-auto max-w-2xl text-3xl font-bold leading-tight text-ink sm:text-4xl">
          Master GATE CS &amp; IT with real previous-year questions
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Practice subject-wise and year-wise PYQs with instant grading, detailed explanations,
          and weak-topic insights that tell you exactly what to study next.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/practice" tabIndex={status === "authenticated" ? 0 : -1}>
            <Button size="lg">Try without account →</Button>
          </Link>
          <Link href="/register" tabIndex={status === "authenticated" ? 0 : -1}>
            <Button size="lg" variant="secondary">Create free account</Button>
          </Link>
        </div>
        {status === "guest" && (
          <p className="mt-3 text-xs text-muted">
            Trial runs in the browser — create an account to save progress.
          </p>
        )}
      </section>

      <section aria-labelledby="subjects-heading" className="mt-12">
        <h2 id="subjects-heading" className="text-xl font-semibold">GATE CS &amp; IT subjects</h2>
        {loading ? (
          <div className="mt-4"><SkeletonList rows={3} /></div>
        ) : error ? (
          <div className="mt-4"><ErrorState error={error} retry={retry} /></div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.items ?? []).map((subject) => (
              <Card key={subject.id} className="flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold">{subject.name}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {subject.questions_count} questions · {subject.topics_count} topics
                  </p>
                </div>
                {status === "authenticated" ? (
                  <Link
                    href={`/subjects/${subject.id}/topics`}
                    className="mt-4 inline-flex touch-target items-center font-medium text-primary"
                  >
                    Browse topics →
                  </Link>
                ) : (
                  <p className="mt-4 text-xs text-muted">Log in to practice this subject</p>
                )}
              </Card>
            ))}
            {(data?.items ?? []).length === 0 && (
              <p className="col-span-full rounded-md2 border border-dashed border-line p-8 text-center text-muted">
                No subjects published yet — check back soon.
              </p>
            )}
          </div>
        )}
      </section>

      <footer className="mt-16 border-t border-line pt-6 text-center text-xs text-muted">
        GATE CS &amp; IT PYQ Practice Platform · Built for aspirants, by aspirants.
      </footer>
    </div>
  );
}
