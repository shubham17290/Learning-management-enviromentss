import { ResultPage } from "@/features/practice/result-page";
import { RequireAuth } from "@/components/layout/guards";

export default function Page() { return <RequireAuth><ResultPage /></RequireAuth>; }
