import { BookmarksPage } from "@/features/student/student-pages";
import { RequireAuth } from "@/components/layout/guards";

export default function Page() { return <RequireAuth><BookmarksPage /></RequireAuth>; }
