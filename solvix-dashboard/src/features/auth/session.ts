/**
 * Session persistence.
 *  - localStorage keeps { token, user, mode } so a refresh restores the user.
 *  - JS-readable cookies (token + role) let src/middleware.ts protect routes
 *    before any page renders. The backend still verifies every request.
 */
import { COOKIE_KEYS, STORAGE_KEYS } from "@/lib/config";
import { getJwtExpiry } from "@/utils/jwt";
import type { User } from "@/types";

export type SessionMode = "live" | "demo";

export interface StoredSession {
  token: string;
  user: User;
  mode: SessionMode;
}

function setCookie(name: string, value: string, expires?: Date) {
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  const exp = expires ? `; Expires=${expires.toUTCString()}` : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax${exp}${secure}`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function saveSession(session: StoredSession) {
  try {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  } catch {
    /* storage unavailable — cookies still carry the session for this tab */
  }
  const exp = getJwtExpiry(session.token);
  const expires = exp ? new Date(exp) : undefined;
  setCookie(COOKIE_KEYS.token, session.token, expires);
  setCookie(COOKIE_KEYS.role, session.user.role, expires);
}

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.token || !parsed?.user?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEYS.session);
  } catch {
    /* ignore */
  }
  clearCookie(COOKIE_KEYS.token);
  clearCookie(COOKIE_KEYS.role);
}

export function hasTokenCookie(): boolean {
  return document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE_KEYS.token}=`));
}
