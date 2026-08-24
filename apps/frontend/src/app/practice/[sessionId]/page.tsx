import { PracticeSessionPage } from "@/features/practice/practice-session";
import { RequireAuth } from "@/components/layout/guards";

export default async function Page({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;

  return (
    <RequireAuth>
      <PracticeSessionPage sessionId={sessionId} />
    </RequireAuth>
  );
}
