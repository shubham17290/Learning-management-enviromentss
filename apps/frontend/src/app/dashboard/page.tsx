import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { RequireAuth } from "@/components/layout/guards";

export default function Page() { return <RequireAuth><DashboardPage /></RequireAuth>; }