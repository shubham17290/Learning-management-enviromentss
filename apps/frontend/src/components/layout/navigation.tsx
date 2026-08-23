"use client";
// PHASE 5 §6 — Breadcrumb + Pagination.
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/types/api";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 && <span aria-hidden="true">›</span>}
            {item.href ? (
              <Link href={item.href} className="rounded px-0.5 hover:text-primary">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="px-0.5 font-medium text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Pagination({
  meta,
  onPage,
}: {
  meta?: PaginationMeta;
  onPage: (page: number) => void;
}) {
  if (!meta || meta.total <= meta.page_size) return null;
  const pages = Math.ceil(meta.total / meta.page_size);
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3">
      <Button size="sm" variant="secondary" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
        ← Prev
      </Button>
      <span className="text-sm text-muted" aria-live="polite">
        Page {meta.page} of {pages} · {meta.total} items
      </span>
      <Button size="sm" variant="secondary" disabled={meta.page >= pages} onClick={() => onPage(meta.page + 1)}>
        Next →
      </Button>
    </nav>
  );
}
