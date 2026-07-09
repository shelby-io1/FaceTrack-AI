"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo } from "react";
import api from "./api";

export interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "teacher" | "student";
  phone: string | null;
  age: number | null;
  address: string | null;
  cnic: string | null;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getTokens() {
  if (typeof window === "undefined") return { access: null, refresh: null };
  return {
    access: localStorage.getItem("access_token"),
    refresh: localStorage.getItem("refresh_token"),
  };
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { access } = getTokens();
      if (!access) return null;
      const res = await api.get<User>("/auth/me", {
        headers: { Authorization: `Bearer ${access}` },
      });
      return res.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const neonRes = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const neonData = await neonRes.json();
      if (!neonRes.ok) throw new Error(neonData.error?.message || "Sign in failed");

      const exRes = await fetch("/api/auth/exchange-token", { method: "POST" });
      if (!exRes.ok) throw new Error("Token exchange failed");
      const exData = await exRes.json();
      setTokens(exData.access_token, exData.refresh_token);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, name, role }: { email: string; password: string; name: string; role: string }) => {
      const neonRes = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const neonData = await neonRes.json();
      if (!neonRes.ok) {
        const msg = neonData.error?.message || "";
        if (!msg.toLowerCase().includes("already")) {
          throw new Error(msg || "Registration failed");
        }
      }

      await api.post("/auth/register", { email, password, name, role });
    },
  });

  const login = useCallback(
    async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password });
    },
    [loginMutation]
  );

  const register = useCallback(
    async (email: string, password: string, name: string, role: string) => {
      await registerMutation.mutateAsync({ email, password, name, role });
    },
    [registerMutation]
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/sign-out", { method: "POST" }).catch(() => {});
    clearTokens();
    queryClient.setQueryData(["auth", "me"], null);
    queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user: user ?? null,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
