import { NextResponse, type NextRequest } from "next/server";

/**
 * Route protection (runs before any page renders).
 *  - /dashboard/*  → requires a session cookie, else /login?next=…
 *  - /login, /register → signed-in users go straight to /dashboard
 *  - admin-only sections → editors are sent to /unauthorized
 *
 * This is a UX guard only. The backend verifies the JWT and role on every request.
 * (Constants are inlined because middleware runs on the Edge runtime.)
 */
const TOKEN_COOKIE = "solvix_token";
const ROLE_COOKIE = "solvix_role";
const ADMIN_ONLY = ["/dashboard/websites", "/dashboard/editors", "/dashboard/settings"];

function tokenIsUsable(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return true; // opaque token — let the backend decide
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4)));
    return typeof payload.exp !== "number" || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const role = req.cookies.get(ROLE_COOKIE)?.value;
  const authed = tokenIsUsable(token);

  if (pathname.startsWith("/dashboard")) {
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("next", pathname + search);
      if (token) url.searchParams.set("reason", "expired");
      const res = NextResponse.redirect(url);
      if (token) {
        res.cookies.delete(TOKEN_COOKIE);
        res.cookies.delete(ROLE_COOKIE);
      }
      return res;
    }
    if (role !== "admin" && ADMIN_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      const url = req.nextUrl.clone();
      url.pathname = "/unauthorized";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if ((pathname === "/login" || pathname === "/register") && authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
