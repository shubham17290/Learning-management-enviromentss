"use client";
// PHASE 5 §15 — UX state primitives: EmptyState, ErrorState, Spinner, SkeletonList.
import { Button } from "./button";

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 py-8 text-muted">
      <span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-line border-t-primary" />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton h-16 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({
  icon = "🗂",
  message,
  cta,
  onCta,
}: {
  icon?: string;
  message: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md2 border border-dashed border-line bg-surface px-6 py-12 text-center">
      <span aria-hidden="true" className="text-4xl">{icon}</span>
      <p className="text-muted">{message}</p>
      {cta && onCta && (
        <Button onClick={onCta}>{cta}</Button>
      )}
    </div>
  );
}

export function ErrorState({ error, retry }: { error: { code: string; message: string }; retry?: () => void }) {
  const forbidden = error.code === "FORBIDDEN_ROLE" || error.code === "FORBIDDEN_NOT_OWNER";
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-md2 border border-danger/30 bg-danger-soft px-6 py-10 text-center">
      <span aria-hidden="true" className="text-3xl">{forbidden ? "🔒" : "⚠️"}</span>
      <p className="font-medium text-danger">{error.message}</p>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          Retry
        </Button>
      )}
    </div>
  );
}
