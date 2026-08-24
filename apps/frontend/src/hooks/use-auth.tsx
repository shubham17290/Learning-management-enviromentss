"use client";
// PHASE 5 §13 — lightweight global auth context (UI-02: React Context).
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services";
import { ApiError } from "@/lib/api";
import type { CurrentUser } from "@/types/api";

interface AuthContextValue {
  user: CurrentUser | null;
  status: "loading" | "authenticated" | "guest";
  login: (email: string, password: string) => Promise<CurrentUser["role"]>;
  register: (body: { email: string; password: string; full_name: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const me = await authService.me();
      setUser(me);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("guest");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authService.login({ email, password });
      await refresh();
      return result.user.role;
    },
    [refresh]
  );

  const register = useCallback(
    async (body: { email: string; password: string; full_name: string }) => {
      await authService.register(body);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) throw error;
    }
    setUser(null);
    setStatus("guest");
    router.push("/login");
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout, refresh }),
    [user, status, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
