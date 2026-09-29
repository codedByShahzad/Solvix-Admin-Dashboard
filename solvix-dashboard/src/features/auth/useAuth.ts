"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { baseApi } from "@/store/api/baseApi";
import { sessionEnded, sessionStarted } from "./authSlice";
import { clearSession, saveSession, type SessionMode } from "./session";
import type { Role, User } from "@/types";

export function useAuth() {
  const auth = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const signIn = useCallback(
    (token: string, user: User, mode: SessionMode = "live") => {
      dispatch(baseApi.util.resetApiState());
      saveSession({ token, user, mode });
      dispatch(sessionStarted({ token, user, mode }));
    },
    [dispatch],
  );

  const signOut = useCallback(
    (reason: "logout" | "expired" = "logout") => {
      clearSession();
      dispatch(sessionEnded(reason));
      dispatch(baseApi.util.resetApiState());
      router.replace(reason === "expired" ? "/login?reason=expired" : "/login");
    },
    [dispatch, router],
  );

  return {
    ...auth,
    isAuthenticated: auth.status === "authenticated",
    isDemo: auth.mode === "demo",
    signIn,
    signOut,
  };
}

export function useCurrentUser(): User | null {
  return useAppSelector((s) => s.auth.user);
}

export function useRole(): Role | undefined {
  return useAppSelector((s) => s.auth.user?.role);
}

export function hasRole(user: Pick<User, "role"> | null | undefined, ...roles: Role[]): boolean {
  return !!user && roles.includes(user.role);
}

export function useIsAdmin(): boolean {
  return useRole() === "admin";
}
