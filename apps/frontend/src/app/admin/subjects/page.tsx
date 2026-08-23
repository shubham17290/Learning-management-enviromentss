import { AdminSubjectsPage } from "@/features/admin/admin-taxonomy-pages";
import { RequireAdmin } from "@/components/layout/guards";

export default function Page() { return <RequireAdmin><AdminSubjectsPage /></RequireAdmin>; }
