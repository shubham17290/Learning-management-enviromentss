import { AnalyticsPage } from "@/features/analytics/analytics-page";
import { RequireAuth } from "@/components/layout/guards";

export default function Page() { return <RequireAuth><AnalyticsPage /></RequireAuth>; }
