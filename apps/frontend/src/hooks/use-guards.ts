"use client";
// Route guards (Phase 5 §2): protected student routes + admin/mod role gates.
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./use-auth";

export function useRequireAuth(): ReturnType<typeof useAuth> {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (auth.status === "guest") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [auth.status, router, pathname]);

  return auth;
}

export function useRequireRole(roles: Array<"student" | "moderator" | "admin">): ReturnType<typeof useAuth> {
  const auth = useRequireAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "authenticated" && !roles.includes(auth.user?.role ?? "student")) {
      router.replace("/dashboard");
    }
  }, [auth.status, auth.user?.role, roles, router]);

  return auth;
}
