"use client";
// ADM-DASH / ADM-AUDIT — admin overview stats + audit log table.
import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { adminService } from "@/services";
import { Card, CardTitle, StatCard, Badge } from "@/components/ui/card";
import { Breadcrumb } from "@/components/layout/navigation";
import { SkeletonList } from "@/components/ui/states";
import { formatDateTime } from "@/utils/format";

export function AdminDashboardPage() {
  const questions = useApi(() => adminService.questions({ page: 1 }), []);
  const published = useApi(() => adminService.questions({ status: "published", page: 1 }), []);
  const users = useApi(() => adminService.users(1), []);
  const audit = useApi(() => adminService.audit({ page: 1 }), []);

  const loading = questions.loading || users.loading;
  const totalQuestions = questions.data?.meta?.total ?? 0;
  const publishedTotal = published.data?.meta?.total ?? 0;
  const totalUsers = users.data?.meta?.total ?? 0;

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-8">
      <h1 className="text-2xl font-bold">Admin</h1>
      <p className="mt-1 text-sm text-muted">Platform content and governance.</p>

      <nav aria-label="Admin sections" className="mt-4 flex flex-wrap gap-2">
        {[
          { href: "/admin/subjects", label: "Subjects" },
          { href: "/admin/topics", label: "Topics" },
          { href: "/admin/questions", label: "Questions" },
          { href: "/admin/audit", label: "Audit log" },
        ].map((item) => (
          <a key={item.href} href={item.href} className="touch-target rounded-md2 border border-line bg-surface px-4 py-2 text-sm font-medium hover:border-primary">
            {item.label}
          </a>
        ))}
      </nav>

      {loading ? (
        <div className="mt-6"><SkeletonList rows={3} /></div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Questions" value={totalQuestions} />
          <StatCard
            label="Published"
            value={totalQuestions > 0 ? `${Math.round((publishedTotal / totalQuestions) * 100)}%` : "—"}
            sub={`${publishedTotal} of ${totalQuestions}`}
            emphasis
          />
          <StatCard label="Users" value={totalUsers} />
          <StatCard label="Recent actions" value={audit.data?.meta?.total ?? 0} sub="audit entries" />
        </div>
      )}

      <Card className="mt-6">
        <CardTitle>Latest audit activity</CardTitle>
        <ul className="divide-y divide-line">
          {(audit.data?.items ?? []).slice(0, 6).map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <span>
                <Badge tone="info">{entry.action}</Badge>{" "}
                <span className="text-muted">by {entry.actor?.email ?? "system"}</span>
              </span>
              <span className="text-xs text-muted">{formatDateTime(entry.created_at)}</span>
            </li>
          ))}
          {(audit.data?.items ?? []).length === 0 && (
            <li className="py-4 text-center text-sm text-muted">No audit entries yet.</li>
          )}
        </ul>
        <a href="/admin/audit" className="mt-2 inline-block text-sm font-medium text-primary">
          View full audit log →
        </a>
      </Card>
    </div>
  );
}

export function AdminAuditPage() {
  const [entityType, setEntityType] = useState("");
  const list = useApi(() => adminService.audit({ entity_type: entityType || undefined, page: 1 }), [entityType]);

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-8">
      <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Audit log" }]} />
      <div className="mb-4 mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Audit log</h1>
        <select
          aria-label="Filter by entity type"
          value={entityType}
          onChange={(event) => setEntityType(event.target.value)}
          className="touch-target rounded-sm2 border border-line bg-surface px-3 py-2 text-sm"
        >
          <option value="">All entities</option>
          {["questions", "subjects", "topics", "users", "practice_sessions"].map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="px-4 py-3">When</th>
              <th scope="col" className="px-4 py-3">Actor</th>
              <th scope="col" className="px-4 py-3">Action</th>
              <th scope="col" className="px-4 py-3">Entity</th>
              <th scope="col" className="px-4 py-3">After</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line font-mono text-xs">
            {(list.data?.items ?? []).map((entry) => (
              <tr key={entry.id}>
                <td className="whitespace-nowrap px-4 py-2.5">{formatDateTime(entry.created_at)}</td>
                <td className="max-w-[180px] truncate px-4 py-2.5">{entry.actor?.email ?? "—"}</td>
                <td className="px-4 py-2.5">{entry.action}</td>
                <td className="px-4 py-2.5">{entry.entity_type}</td>
                <td className="max-w-[240px] truncate px-4 py-2.5 text-muted">
                  {entry.after ? JSON.stringify(entry.after) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.loading && <p className="py-6 text-center text-sm text-muted">Loading…</p>}
        {!list.loading && (list.data?.items ?? []).length === 0 && (
          <p className="py-8 text-center text-sm text-muted">No audit entries match.</p>
        )}
      </Card>
    </div>
  );
}
