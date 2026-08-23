import { ProfilePage } from "@/features/student/student-pages";
import { RequireAuth } from "@/components/layout/guards";

export default function Page() { return <RequireAuth><ProfilePage /></RequireAuth>; }
