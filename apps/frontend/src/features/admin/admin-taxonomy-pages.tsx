"use client";
// ADM-SUBJ / ADM-TLC — Subject & topic CRUD tables with confirm modals (Phase 5 §16).
import { useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { ApiError } from "@/lib/api";
import { adminService, type AdminSubject, type AdminTopic } from "@/services";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Modal, useToast } from "@/components/ui/overlay";
import { Breadcrumb } from "@/components/layout/navigation";

export function AdminSubjectsPage() {
  const { notify } = useToast();
  const list = useApi(() => adminService.subjects(1), []);
  const [editing, setEditing] = useState<AdminSubject | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<AdminSubject | null>(null);

  async function run(action: () => Promise<unknown>, successMessage: string) {
    setBusy(true);
    try {
      await action();
      notify(successMessage, "success");
      list.retry();
      setEditing(null);
      setCreating(false);
      setConfirmingDelete(null);
    } catch (error) {
      notify(error instanceof ApiError ? error.message : "Request failed.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-8">
      <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Subjects" }]} />
      <div className="mb-6 mt-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subjects</h1>
        <Button onClick={() => { setCreating(true); setCode(""); setName(""); }}>New subject</Button>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="px-4 py-3">Code</th>
              <th scope="col" className="px-4 py-3">Name</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(list.data?.items ?? []).map((subject) => (
              <tr key={subject.id}>
                <td className="px-4 py-3 font-mono">{subject.code}</td>
                <td className="px-4 py-3 font-medium">{subject.name}</td>
                <td className="px-4 py-3">
                  <Badge tone={subject.isActive ? "success" : "danger"}>{subject.isActive ? "active" : "inactive"}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="touch-target rounded px-2 text-sm font-medium text-primary"
                    onClick={() => {
                      setEditing(subject);
                      setName(subject.name);
                    }}
                  >
                    Edit
                  </button>
                  {subject.isActive && (
                    <button
                      type="button"
                      className="ml-2 touch-target rounded px-2 text-sm font-medium text-danger"
                      onClick={() => setConfirmingDelete(subject)}
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.loading && <p className="py-6 text-center text-sm text-muted">Loading…</p>}
        {list.error && <div className="p-4"><ErrorInline error={list.error} retry={list.retry} /></div>}
      </Card>

      <Modal open={creating} title="Create subject" onClose={() => setCreating(false)}>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void run(() => adminService.createSubject({ code, name }), "Subject created");
          }}
        >
          <Input label="Code" required value={code} onChange={(event) => setCode(event.target.value)} hint="lowercase letters/numbers, e.g. algorithms" mono />
          <Input label="Name" required value={name} onChange={(event) => setName(event.target.value)} />
          <Button type="submit" loading={busy}>Create</Button>
        </form>
      </Modal>

      <Modal open={Boolean(editing)} title="Edit subject" onClose={() => setEditing(null)}>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!editing) return;
            void run(
              () =>
                adminService.updateSubject(editing.id, {
                  name,
                  is_active: !confirmingDelete,
                }),
              "Subject updated",
            );
          }}
        >
          <Input label="Name" required value={name} onChange={(event) => setName(event.target.value)} />
          <Button type="submit" loading={busy}>Save changes</Button>
        </form>
      </Modal>

      <Modal open={Boolean(confirmingDelete)} title="Deactivate subject?" onClose={() => setConfirmingDelete(null)}>
        <p className="text-sm text-muted">
          “{confirmingDelete?.name}” will be hidden from students. Existing data is preserved.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmingDelete(null)}>Cancel</Button>
          <Button
            variant="danger"
            loading={busy}
            onClick={() => confirmingDelete && void run(() => adminService.deactivateSubject(confirmingDelete.id), "Subject deactivated")}
          >
            Deactivate
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function AdminTopicsPage() {
  const { notify } = useToast();
  const list = useApi(() => adminService.topics({ page: 1 }), []);
  const subjects = useApi(() => adminService.subjects(1), []);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminTopic | null>(null);
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-8">
      <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Topics" }]} />
      <div className="mb-6 mt-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Topics</h1>
        <Button onClick={() => { setCreating(true); setName(""); setSubjectId(""); }}>New topic</Button>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="px-4 py-3">Topic</th>
              <th scope="col" className="px-4 py-3">Subject</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(list.data?.items ?? []).map((topic) => (
              <tr key={topic.id}>
                <td className="px-4 py-3 font-medium">{topic.name}</td>
                <td className="px-4 py-3 text-muted">{topic.subject.name}</td>
                <td className="px-4 py-3"><Badge tone={topic.isActive ? "success" : "danger"}>{topic.isActive ? "active" : "inactive"}</Badge></td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="touch-target rounded px-2 text-sm font-medium text-primary"
                    onClick={() => {
                      setEditing(topic);
                      setName(topic.name);
                    }}
                  >
                    Edit
                  </button>
                  {topic.isActive && (
                    <button
                      type="button"
                      className="ml-2 touch-target rounded px-2 text-sm font-medium text-danger"
                      onClick={() => void (async () => {
                        try {
                          await adminService.deactivateTopic(topic.id);
                          notify("Topic deactivated", "success");
                          list.retry();
                        } catch (error) {
                          notify(error instanceof ApiError ? error.message : "Failed", "error");
                        }
                      })()}
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.loading && <p className="py-6 text-center text-sm text-muted">Loading…</p>}
      </Card>

      <Modal open={creating} title="Create topic" onClose={() => setCreating(false)}>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setBusy(true);
            adminService.createTopic({ subject_id: subjectId, name })
              .then(() => {
                notify("Topic created", "success");
                list.retry();
                setCreating(false);
              })
              .catch((error) => notify(error instanceof ApiError ? error.message : "Failed", "error"))
              .finally(() => setBusy(false));
          }}
        >
          <select
            required
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            aria-label="Subject"
            className="touch-target w-full rounded-sm2 border border-line bg-surface px-3 py-2 text-sm"
          >
            <option value="">Select subject…</option>
            {(subjects.data?.items ?? []).map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
          <Input label="Topic name" required value={name} onChange={(event) => setName(event.target.value)} />
          <Button type="submit" loading={busy} disabled={!subjectId}>Create</Button>
        </form>
      </Modal>

      <Modal open={Boolean(editing)} title="Rename topic" onClose={() => setEditing(null)}>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!editing) return;
            setBusy(true);
            adminService.updateTopic(editing.id, { name })
              .then(() => {
                notify("Topic updated", "success");
                list.retry();
                setEditing(null);
              })
              .catch((error) => notify(error instanceof ApiError ? error.message : "Failed", "error"))
              .finally(() => setBusy(false));
          }}
        >
          <Input label="Topic name" required value={name} onChange={(event) => setName(event.target.value)} />
          <Button type="submit" loading={busy}>Save</Button>
        </form>
      </Modal>
    </div>
  );
}

function ErrorInline({ error, retry }: { error: { code: string; message: string }; retry: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-2 rounded-md2 bg-danger-soft px-3 py-2 text-sm text-danger">
      <span>{error.message}</span>
      <Link href="#" onClick={(event) => { event.preventDefault(); retry(); }} className="font-semibold underline">
        Retry
      </Link>
    </div>
  );
}
