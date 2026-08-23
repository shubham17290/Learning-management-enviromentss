import { PracticeSessionPage } from "@/features/practice/practice-session";
import { RequireAuth } from "@/components/layout/guards";

export default function Page({ params }: { params: { sessionId: string } }) {
  return (
    <RequireAuth>
      <PracticeSessionPage sessionId={params.sessionId} />
    </RequireAuth>
  );
}
