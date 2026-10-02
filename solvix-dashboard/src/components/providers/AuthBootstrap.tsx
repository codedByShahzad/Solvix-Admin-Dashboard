"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { baseApi } from "@/store/api/baseApi";
import { useGetMeQuery } from "@/store/api/authApi";
import { sessionEnded, sessionStarted, userRefreshed } from "@/features/auth/authSlice";
import { clearSession, hasTokenCookie, loadSession, saveSession } from "@/features/auth/session";
import { getJwtExpiry, isJwtExpired } from "@/utils/jwt";

/**
 * - Restores the session from storage on first load, then re-validates it
 *   with GET /auth/me (a 401 there signs the user out via baseQuery).
 * - Signs the user out when the JWT expires.
 * - Redirects to /login whenever the session ends inside the dashboard.
 */
export function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { status, token, user, signOutReason } = useAppSelector((s) => s.auth);

  // 1) Hydrate from storage
  useEffect(() => {
    const stored = loadSession();
    if (stored && hasTokenCookie() && !isJwtExpired(stored.token)) {
      dispatch(sessionStarted(stored));
    } else {
      clearSession(); // also drops a stray cookie so middleware can't bounce /login ↔ /dashboard
      dispatch(sessionEnded(stored ? "expired" : null));
    }
  }, [dispatch]);

  // 2) Re-validate against the backend and pick up role / name / isActive changes
  const me = useGetMeQuery(undefined, { skip: status !== "authenticated" });
  useEffect(() => {
    if (!me.data || !token) return;
    if (!me.data.isActive) {
      clearSession();
      dispatch(sessionEnded("logout"));
      return;
    }
    if (JSON.stringify(me.data) !== JSON.stringify(user)) {
      dispatch(userRefreshed(me.data));
      saveSession({ token, user: me.data });
    }
  }, [me.data, token, user, dispatch]);

  // 3) Expiry timer
  useEffect(() => {
    if (status !== "authenticated" || !token) return;
    const exp = getJwtExpiry(token);
    if (!exp) return;
    const expire = () => {
      clearSession();
      dispatch(sessionEnded("expired"));
    };
    const ms = exp - Date.now();
    if (ms <= 0) {
      expire();
      return;
    }
    const t = setTimeout(expire, Math.min(ms, 2_147_000_000));
    return () => clearTimeout(t);
  }, [status, token, dispatch]);

  // 4) Leave the dashboard when the session ends
  useEffect(() => {
    if (status === "unauthenticated" && pathname.startsWith("/dashboard")) {
      dispatch(baseApi.util.resetApiState());
      const next = encodeURIComponent(pathname);
      // Deliberate logout → plain /login; expired/missing session → remember where the user was.
      router.replace(signOutReason === "logout" ? "/login" : signOutReason === "expired" ? `/login?reason=expired&next=${next}` : `/login?next=${next}`);
    }
  }, [status, pathname, signOutReason, router, dispatch]);

  return null;
}
