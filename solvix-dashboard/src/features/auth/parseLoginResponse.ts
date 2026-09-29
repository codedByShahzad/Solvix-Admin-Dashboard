/**
 * Extract { token, user } from the POST /auth/login response.
 *
 * The exact response shape NEEDS BACKEND CONFIRMATION, so this accepts the
 * common variants: token | accessToken | access_token | jwt, at the top level
 * or under `data`; user under `user` / `data.user` / `data`. If the response
 * has no user object, the user is read from the JWT payload.
 */
import { normalizeRole, normalizeUser } from "@/lib/api/normalize";
import { decodeJwt } from "@/utils/jwt";
import type { User } from "@/types";

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

function findToken(o: Obj): string | undefined {
  for (const k of ["token", "accessToken", "access_token", "jwt"]) {
    if (typeof o[k] === "string") return o[k] as string;
  }
  return undefined;
}

export type LoginParseResult =
  | { ok: true; token: string; user: User }
  | { ok: false; reason: "no-token" | "unsupported-role" };

export function parseLoginResponse(res: unknown): LoginParseResult {
  const root = isObj(res) ? res : {};
  const data = isObj(root.data) ? root.data : {};
  const token = findToken(root) ?? findToken(data) ?? (isObj(data.tokens) ? findToken(data.tokens) : undefined);
  if (!token) return { ok: false, reason: "no-token" };

  const payload = decodeJwt(token) ?? {};
  const candidates: unknown[] = [root.user, data.user, isObj(data) && "email" in data ? data : undefined];
  let user: User | null = null;

  for (const c of candidates) {
    if (!isObj(c)) continue;
    const withRole = c.role ? c : { ...c, role: payload.role };
    user = normalizeUser(withRole);
    if (user) break;
  }

  if (!user) {
    const role = normalizeRole(payload.role);
    if (!role) return { ok: false, reason: "unsupported-role" };
    user = {
      id: String(payload.id ?? payload._id ?? payload.userId ?? payload.sub ?? ""),
      name: String(payload.name ?? (typeof payload.email === "string" ? payload.email.split("@")[0] : "User")),
      email: String(payload.email ?? ""),
      role,
    };
  }

  return { ok: true, token, user };
}
