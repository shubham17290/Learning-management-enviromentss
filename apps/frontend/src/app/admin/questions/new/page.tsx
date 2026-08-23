import { AdminQuestionEditorPage } from "@/features/admin/admin-question-pages";
import { RequireAdmin } from "@/components/layout/guards";

export default function Page() { return <RequireAdmin><AdminQuestionEditorPage /></RequireAdmin>; }
