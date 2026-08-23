"use client";
// Client guards as components (Phase 5 §2 protected routes).
import { Spinner } from "@/components/ui/states";
import { useRequireAuth, useRequireRole } from "@/hooks/use-guards";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = useRequireAuth();
  if (auth.status !== "authenticated") {
    return auth.status === "guest" ? null : <Spinner label="Checking your session" />;
  }
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const auth = useRequireRole(["admin", "moderator"]);
  if (auth.status !== "authenticated") {
    return auth.status === "guest" ? null : <Spinner label="Checking your session" />;
  }
  if (auth.user?.role !== "admin" && auth.user?.role !== "moderator") {
    return (
      <div role="alert" className="mx-auto max-w-md p-10 text-center">
        <p className="text-3xl" aria-hidden="true">🔒</p>
        <h1 className="mt-2 text-xl font-bold">You don&apos;t have access</h1>
        <p className="mt-1 text-sm text-muted">This area is restricted to moderators and admins.</p>
      </div>
    );
  }
  return <>{children}</>;
}
