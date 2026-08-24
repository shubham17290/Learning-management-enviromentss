import { AdminQuestionEditorPage } from "@/features/admin/admin-question-pages";
import { RequireAdmin } from "@/components/layout/guards";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <RequireAdmin>
      <AdminQuestionEditorPage editId={id} />
    </RequireAdmin>
  );
}
