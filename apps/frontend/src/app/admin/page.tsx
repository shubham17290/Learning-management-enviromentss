import { AdminDashboardPage } from "@/features/admin/admin-dashboard-pages";
import { RequireAdmin } from "@/components/layout/guards";

export default function Page() { return <RequireAdmin><AdminDashboardPage /></RequireAdmin>; }
