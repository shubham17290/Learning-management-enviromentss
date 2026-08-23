"use client";
// PHASE 5 §6 — Card, Badge, StatCard, ProgressBar.
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-md2 border border-line bg-surface p-5 shadow-low ${className}`}>
      {children}
    </section>
  );
}

export function CardTitle({ children, as: Tag = "h2" }: { children: ReactNode; as?: "h1" | "h2" | "h3" }) {
  return <Tag className="mb-3 text-lg font-semibold text-ink">{children}</Tag>;
}

type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClass: Record<BadgeTone, string> = {
  neutral: "bg-gray-100 text-muted",
  info: "bg-blue-50 text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClass[tone]}`}>
      {children}
    </span>
  );
}

export function difficultyTone(difficulty: string): BadgeTone {
  if (difficulty === "easy") return "success";
  if (difficulty === "hard") return "danger";
  return "warning";
}

export function StatCard({
  label,
  value,
  sub,
  emphasis = false,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-md2 border bg-surface p-4 shadow-low ${emphasis ? "border-primary/40 bg-[color:var(--primary-soft)]" : "border-line"}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${emphasis ? "text-primary" : "text-ink"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

/** Segment progress bar (Phase 5 §8.2): per-question state coloring. */
export function SegmentProgress({
  states,
}: {
  states: Array<"answered" | "correct" | "incorrect" | "marked" | "unanswered">;
}) {
  return (
    <div className="flex gap-1" role="img" aria-label={`${states.filter((s) => s !== "unanswered").length} of ${states.length} answered`}>
      {states.map((state, index) => {
        const color =
          state === "answered" || state === "correct"
            ? "bg-primary"
            : state === "marked"
              ? "bg-warning"
              : state === "incorrect"
                ? "bg-danger"
                : "bg-line";
        return <span key={index} className={`h-1.5 flex-1 rounded-full ${color}`} />;
      })}
    </div>
  );
}
