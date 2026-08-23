"use client";
// ADM-QUE / ADM-QDT / ADM-REV — question list, typed editor, publish/reject review.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { ApiError } from "@/lib/api";
import { adminService, type AdminQuestion } from "@/services";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, NumberInput } from "@/components/ui/field";
import { Modal, useToast } from "@/components/ui/overlay";
import { Breadcrumb } from "@/components/layout/navigation";
import { SkeletonList } from "@/components/ui/states";

const statusTone = {
  draft: "neutral",
  in_review: "warning",
  published: "success",
  rejected: "danger",
  archived: "neutral",
} as const;

export function AdminQuestionsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const list = useApi(() => adminService.questions({ status: statusFilter || undefined, page: 1 }), [statusFilter]);
  const toast = useToast();
  const [rejecting, setRejecting] = useState<AdminQuestion | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function publish(question: AdminQuestion) {
    setBusy(true);
    try {
      await adminService.publishQuestion(question.id);
      toast.notify("Question published ✓", "success");
      list.retry();
    } catch (error) {
      toast.notify(error instanceof ApiError ? error.message : "Publish failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!rejecting) return;
    setBusy(true);
    try {
      await adminService.rejectQuestion(rejecting.id, reason);
      toast.notify("Question rejected", "info");
      setRejecting(null);
      setReason("");
      list.retry();
    } catch (error) {
      toast.notify(error instanceof ApiError ? error.message : "Reject failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-8">
      <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Questions" }]} />
      <div className="mb-4 mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Questions</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted" htmlFor="q-status">Status</label>
          <select
            id="q-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="touch-target rounded-sm2 border border-line bg-surface px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {["draft", "in_review", "published", "rejected", "archived"].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <Link href="/admin/questions/new" className="touch-target inline-flex items-center rounded-md2 bg-primary px-4 text-sm font-medium text-white">
            New question
          </Link>
        </div>
      </div>

      {list.loading ? (
        <SkeletonList rows={5} />
      ) : list.error ? (
        <div role="alert" className="rounded-md2 bg-danger-soft p-4 text-danger">{list.error.message}</div>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="px-4 py-3">Question</th>
                <th scope="col" className="px-4 py-3">Type</th>
                <th scope="col" className="px-4 py-3">Year</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(list.data?.items ?? []).map((question) => (
                <tr key={question.id}>
                  <td className="max-w-sm px-4 py-3">
                    <p className="line-clamp-1 font-medium">{question.body}</p>
                    <span className="text-xs text-muted">{question.subject.name}{question.topic ? ` · ${question.topic.name}` : ""}</span>
                  </td>
                  <td className="px-4 py-3">{question.questionType.code.toUpperCase()}</td>
                  <td className="px-4 py-3">{question.gateYear}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone[question.status]}>{question.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/questions/${question.id}/edit`} className="rounded px-2 text-sm font-medium text-primary">
                      Edit
                    </Link>
                    {(question.status === "draft" || question.status === "in_review") && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void publish(question)}
                          className="ml-1 rounded px-2 text-sm font-medium text-success disabled:opacity-50"
                        >
                          Publish
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejecting(question)}
                          className="ml-1 rounded px-2 text-sm font-medium text-danger"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={Boolean(rejecting)} title="Reject question" onClose={() => setRejecting(null)}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void reject();
          }}
          className="flex flex-col gap-3"
        >
          <Input
            label="Reason (10–500 characters)"
            required
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            hint="Shared with the author to fix the question."
          />
          <Button type="submit" variant="danger" loading={busy}>Reject question</Button>
        </form>
      </Modal>
    </div>
  );
}

interface OptionDraft {
  body: string;
  is_correct: boolean;
}
interface NumericDraft {
  numeric_value: string;
  tolerance_abs: string;
  unit: string;
}

export function AdminQuestionEditorPage({ editId }: { editId?: string }) {
  return editId ? <EditQuestion id={editId} /> : <NewQuestion />;
}

function NewQuestion() {
  return <EditorForm title="Add question" subjectId="" initial={null} onSubmit={adminService.createQuestion} />;
}

function EditQuestion({ id }: { id: string }) {
  const detail = useApi(() => adminService.questions({ page: 1 }), [id]);
  const existing = (detail.data?.items ?? []).find((item) => item.id === id);
  // Editor loads from the list payload; full option/answer editing is supported on drafts via PUT.
  if (detail.loading) return <div className="mx-auto max-w-content p-6"><SkeletonList rows={6} /></div>;
  if (!existing) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center text-muted">
        Question not found in the current page.{" "}
        <Link className="font-medium text-primary" href="/admin/questions">Back to questions</Link>.
      </div>
    );
  }
  return <EditorForm key={existing.id} title="Edit question" subjectId="" initial={existing} onSubmit={(body) => adminService.updateQuestion(id, body)} />;
}

type SubmitFn = (body: Record<string, unknown>) => Promise<unknown>;

function EditorForm({
  title,
  subjectId: _subjectId,
  initial,
  onSubmit,
}: {
  title: string;
  subjectId?: string;
  initial: AdminQuestion | null;
  onSubmit: SubmitFn;
}) {
  void _subjectId;
  const router = useRouter();
  const { notify } = useToast();
  const [formSubjectId, setFormSubjectId] = useState(initial?.subject.code ?? "");
  const subjects = useApi(() => adminService.subjects(1), []);
  const topics = useApi(
    () => (formSubjectId ? adminService.topics({ subject_id: formSubjectId }) : Promise.resolve(null)),
    [formSubjectId],
  );

  const [topicId, setTopicId] = useState(initial?.topic?.id ?? "");
  const [typeCode, setTypeCode] = useState<AdminQuestion["questionType"]["code"]>(initial?.questionType.code ?? "mcq");
  const [body, setBody] = useState(initial?.body ?? "");
  const [explanation, setExplanation] = useState(initial?.explanation ?? "");
  const [marks, setMarks] = useState(String(initial?.marks ?? 1));
  const [negativeMarks, setNegativeMarks] = useState(initial?.negativeMarks != null ? String(initial.negativeMarks) : "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? "medium");
  const [gateYear, setGateYear] = useState(String(initial?.gateYear ?? new Date().getFullYear()));
  const [options, setOptions] = useState<OptionDraft[]>([
    { body: "", is_correct: false },
    { body: "", is_correct: false },
  ]);
  const [numericAnswers, setNumericAnswers] = useState<NumericDraft[]>([
    { numeric_value: "", tolerance_abs: "0", unit: "" },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function validate(): Record<string, string> {
    const found: Record<string, string> = {};
    if (body.trim().length < 5) found["body"] = "At least 5 characters.";
    if (!formSubjectId) found["subject"] = "Pick a subject.";
    const yearNumber = Number(gateYear);
    if (!Number.isInteger(yearNumber) || yearNumber < 1990) found["gate_year"] = "Enter a valid year (1990+).";
    const marksNumber = Number(marks);
    if (!Number.isFinite(marksNumber) || marksNumber < 0 || marksNumber > 100) found["marks"] = "0–100.";
    if ((typeCode === "mcq" || typeCode === "msq") && options.some((option) => !option.body.trim())) {
      found["options"] = "Every option needs text.";
    }
    if (typeCode === "mcq" && options.filter((option) => option.is_correct).length !== 1) {
      found["options"] = "MCQ needs exactly one correct option.";
    }
    if (typeCode === "msq" && options.every((option) => !option.is_correct)) {
      found["options"] = "MSQ needs at least one correct option.";
    }
    if (typeCode === "nat") {
      const values = numericAnswers.filter((key) => key.numeric_value.trim() !== "");
      if (values.length === 0) found["numeric_answers"] = "Provide at least one accepted value.";
    }
    return found;
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await onSubmit({
        type_code: typeCode,
        subject_id: formSubjectId,
        topic_id: topicId || undefined,
        body,
        explanation: explanation || null,
        marks: Number(marks),
        negative_marks: negativeMarks === "" ? null : Number(negativeMarks),
        difficulty,
        gate_year: Number(gateYear),
        ...(typeCode === "nat"
          ? {
              numeric_answers: numericAnswers
                .filter((key) => key.numeric_value.trim() !== "")
                .map((key) => ({
                  numeric_value: Number(key.numeric_value),
                  tolerance_abs: key.tolerance_abs === "" ? 0 : Number(key.tolerance_abs),
                  unit: key.unit || null,
                })),
            }
          : {
              options: options.map((option, index) => ({ ...option, sort_order: index + 1 })),
            }),
      });
      notify("Question saved ✓", "success");
      router.push("/admin/questions");
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fieldErrors);
      notify(error instanceof ApiError ? error.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Questions", href: "/admin/questions" }, { label: title }]} />
      <h1 className="mb-6 mt-3 text-2xl font-bold">{title}</h1>

      <form onSubmit={onSave} noValidate className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Subject"
            required
            value={formSubjectId}
            onChange={(event) => {
              setFormSubjectId(event.target.value);
              setTopicId("");
            }}
            error={errors["subject"]}
          >
            <option value="">Select…</option>
            {(subjects.data?.items ?? []).map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </Select>
          <Select label="Topic" value={topicId} onChange={(event) => setTopicId(event.target.value)} disabled={!formSubjectId}>
            <option value="">None</option>
            {(topics.data?.items ?? []).map((topic) => (
              <option key={topic.id} value={topic.id}>{topic.name}</option>
            ))}
          </Select>
          <Select label="Type" required value={typeCode} onChange={(event) => setTypeCode(event.target.value as typeof typeCode)}>
            <option value="mcq">MCQ — single correct</option>
            <option value="msq">MSQ — multiple correct</option>
            <option value="nat">NAT — numeric answer</option>
          </Select>
          <Select label="Difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
          <NumberInput
            label="GATE year"
            required
            value={gateYear}
            onChange={(event) => setGateYear(event.target.value.replace(/\D/g, "").slice(0, 4))}
            error={errors["gate_year"]}
          />
          <Input
            label="Marks"
            inputMode="decimal"
            value={marks}
            onChange={(event) => setMarks(event.target.value)}
            error={errors["marks"]}
          />
          <Input
            label="Negative marks (optional)"
            inputMode="decimal"
            value={negativeMarks}
            onChange={(event) => setNegativeMarks(event.target.value)}
            hint="e.g. 0.33 for GATE official −⅓"
          />
        </div>

        <label className="block text-sm font-medium">
          Question text
          <textarea
            required
            rows={4}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className={`mt-1 w-full rounded-sm2 border px-3 py-2 ${errors["body"] ? "border-danger" : "border-line"}`}
          />
          {errors["body"] && <span role="alert" className="text-xs text-danger">{errors["body"]}</span>}
        </label>

        {(typeCode === "mcq" || typeCode === "msq") && (
          <fieldset className="rounded-md2 border border-line p-4">
            <legend className="px-1 text-sm font-semibold">Options</legend>
            {errors["options"] && <p role="alert" className="mb-2 text-xs text-danger">{errors["options"]}</p>}
            <ul className="flex flex-col gap-2">
              {options.map((option, index) => (
                <li key={index} className="flex items-center gap-2">
                  <input
                    type={typeCode === "mcq" ? "radio" : "checkbox"}
                    name="correct-option"
                    aria-label={`Option ${index + 1} is correct`}
                    checked={option.is_correct}
                    onChange={() =>
                      setOptions((current) =>
                        current.map((item, position) =>
                          typeCode === "mcq"
                            ? { ...item, is_correct: position === index }
                            : position === index
                              ? { ...item, is_correct: !item.is_correct }
                              : item,
                        ),
                      )
                    }
                    className="size-4 accent-[color:var(--primary)]"
                  />
                  <input
                    value={option.body}
                    onChange={(event) =>
                      setOptions((current) =>
                        current.map((item, position) => (position === index ? { ...item, body: event.target.value } : item)),
                      )
                    }
                    placeholder={`Option ${index + 1}`}
                    aria-label={`Option ${index + 1} text`}
                    className="touch-target w-full rounded-sm2 border border-line px-3 py-2"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      aria-label={`Remove option ${index + 1}`}
                      onClick={() => setOptions((current) => current.filter((_, position) => position !== index))}
                      className="touch-target text-lg text-danger"
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="mt-2"
              onClick={() => setOptions((current) => [...current, { body: "", is_correct: false }])}
            >
              + Add option
            </Button>
          </fieldset>
        )}

        {typeCode === "nat" && (
          <fieldset className="rounded-md2 border border-line p-4">
            <legend className="px-1 text-sm font-semibold">Accepted numeric answers</legend>
            {errors["numeric_answers"] && <p role="alert" className="mb-2 text-xs text-danger">{errors["numeric_answers"]}</p>}
            <ul className="flex flex-col gap-2">
              {numericAnswers.map((key, index) => (
                <li key={index} className="grid grid-cols-[2fr_1fr_1fr_auto] items-end gap-2">
                  <Input
                    label="Value"
                    mono
                    value={key.numeric_value}
                    onChange={(event) =>
                      setNumericAnswers((current) =>
                        current.map((item, position) => (position === index ? { ...item, numeric_value: event.target.value } : item)),
                      )
                    }
                  />
                  <Input
                    label="± Tolerance"
                    mono
                    value={key.tolerance_abs}
                    onChange={(event) =>
                      setNumericAnswers((current) =>
                        current.map((item, position) => (position === index ? { ...item, tolerance_abs: event.target.value } : item)),
                      )
                    }
                  />
                  <Input
                    label="Unit"
                    value={key.unit}
                    onChange={(event) =>
                      setNumericAnswers((current) =>
                        current.map((item, position) => (position === index ? { ...item, unit: event.target.value } : item)),
                      )
                    }
                  />
                  {numericAnswers.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Remove answer ${index + 1}`}
                      onClick={() => setNumericAnswers((current) => current.filter((_, position) => position !== index))}
                      className="touch-target text-lg text-danger"
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="mt-2"
              onClick={() => setNumericAnswers((current) => [...current, { numeric_value: "", tolerance_abs: "0", unit: "" }])}
            >
              + Add accepted value
            </Button>
          </fieldset>
        )}

        <label className="block text-sm font-medium">
          Explanation (shown after submission)
          <textarea
            rows={3}
            value={explanation}
            onChange={(event) => setExplanation(event.target.value)}
            className="mt-1 w-full rounded-sm2 border border-line px-3 py-2"
          />
        </label>

        <div className="flex justify-end gap-2">
          <Link href="/admin/questions"><Button variant="secondary" type="button">Cancel</Button></Link>
          <Button type="submit" loading={saving}>Save question</Button>
        </div>
      </form>
    </div>
  );
}
