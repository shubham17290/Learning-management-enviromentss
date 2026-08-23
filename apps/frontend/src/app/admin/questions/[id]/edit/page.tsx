import { AdminQuestionEditorPage } from "@/features/admin/admin-question-pages";
import { RequireAdmin } from "@/components/layout/guards";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <RequireAdmin>
      <AdminQuestionEditorPage editId={params.id} />
    </RequireAdmin>
  );
}
