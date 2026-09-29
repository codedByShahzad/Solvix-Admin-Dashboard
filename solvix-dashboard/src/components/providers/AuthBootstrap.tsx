"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { baseApi } from "@/store/api/baseApi";
import { sessionEnded, sessionStarted } from "@/features/auth/authSlice";
import { clearSession, hasTokenCookie, loadSession } from "@/features/auth/session";
import { config } from "@/lib/config";
import { getJwtExpiry, isJwtExpired } from "@/utils/jwt";

/**
 * - Restores the session from storage on first load.
 * - Signs the user out when the JWT expires (timer) or a request returns 401.
 * - Redirects to /login whenever the session ends inside the dashboard.
 */
export function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { status, token, mode, signOutReason } = useAppSelector((s) => s.auth);

  // 1) Hydrate
  useEffect(() => {
    const stored = loadSession();
    const valid =
      stored &&
      hasTokenCookie() &&
      (stored.mode === "demo" ? config.demoEnabled : !isJwtExpired(stored.token));
    if (valid) {
      dispatch(sessionStarted(stored));
    } else {
      clearSession(); // also drops a stray cookie so middleware can't bounce /login ↔ /dashboard
      dispatch(sessionEnded(stored ? "expired" : null));
    }
  }, [dispatch]);

  // 2) Expiry timer
  useEffect(() => {
    if (status !== "authenticated" || !token || mode === "demo") return;
    const exp = getJwtExpiry(token);
    if (!exp) return;
    const ms = exp - Date.now();
    const expire = () => {
      clearSession();
      dispatch(sessionEnded("expired"));
    };
    if (ms <= 0) {
      expire();
      return;
    }
    const t = setTimeout(expire, Math.min(ms, 2_147_000_000));
    return () => clearTimeout(t);
  }, [status, token, mode, dispatch]);

  // 3) Leave the dashboard when the session ends
  useEffect(() => {
    if (status === "unauthenticated" && pathname.startsWith("/dashboard")) {
      dispatch(baseApi.util.resetApiState());
      const next = encodeURIComponent(pathname);
      router.replace(signOutReason === "expired" ? `/login?reason=expired&next=${next}` : `/login?next=${next}`);
    }
  }, [status, pathname, signOutReason, router, dispatch]);

  return null;
}
