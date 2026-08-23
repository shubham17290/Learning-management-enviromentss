import { TopicsPage } from "@/features/subjects/subject-pages";
import { RequireAuth } from "@/components/layout/guards";

export default function Page() { return <RequireAuth><TopicsPage /></RequireAuth>; }
