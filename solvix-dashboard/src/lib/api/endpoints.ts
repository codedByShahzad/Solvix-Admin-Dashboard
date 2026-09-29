/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  BACKEND ROUTE REGISTRY — the ONLY place backend paths live.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Paths are relative to NEXT_PUBLIC_API_URL (which already ends in /api/v1).
 *
 *  `null` = NEEDS BACKEND ROUTE CONFIRMATION.
 *  Unconfirmed endpoints make no network call; the UI shows a clear
 *  "Backend route pending" state instead of guessing a URL.
 *
 *  To connect an endpoint, replace `null` with the exact route from the
 *  Express router, using `:param` placeholders, e.g.
 *
 *      "blogs.get": { method: "GET", path: "/blogs/:id" },
 *
 *  Settings → Backend connection lists which endpoints are still pending.
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface EndpointDef {
  method: HttpMethod;
  path: string;
  /** false = do not attach the dashboard JWT (external integration routes). */
  auth?: boolean;
}

export type EndpointKey =
  // /api/v1/auth
  | "auth.login"
  | "auth.me"
  | "auth.changePassword"
  // /api/v1/websites
  | "websites.list"
  | "websites.get"
  | "websites.create"
  | "websites.update"
  | "websites.delete"
  // /api/v1/blogs
  | "blogs.list"
  | "blogs.get"
  | "blogs.create"
  | "blogs.update"
  | "blogs.delete"
  // /api/v1/media
  | "media.list"
  | "media.get"
  | "media.upload"
  | "media.update"
  | "media.delete"
  // /api/v1/admin (editor management)
  | "editors.list"
  | "editors.get"
  | "editors.create"
  | "editors.update"
  | "editors.delete"
  // /api/v1/website-integrations
  | "integrations.list"
  | "integrations.create"
  | "integrations.revoke"
  // /api/v1/integration (external, X-API-Key / X-API-Secret)
  | "integration.blogs";

export const ENDPOINTS: Record<EndpointKey, EndpointDef | null> = {
  // ── Confirmed ─────────────────────────────────────────────────────────────
  "auth.login": { method: "POST", path: "/auth/login", auth: false },
  "integration.blogs": { method: "GET", path: "/integration/blogs", auth: false },

  // ── NEEDS BACKEND ROUTE CONFIRMATION ──────────────────────────────────────
  "auth.me": null,
  "auth.changePassword": null,

  "websites.list": null,
  "websites.get": null,
  "websites.create": null,
  "websites.update": null,
  "websites.delete": null,

  "blogs.list": null,
  "blogs.get": null,
  "blogs.create": null,
  "blogs.update": null,
  "blogs.delete": null,

  "media.list": null,
  "media.get": null,
  "media.upload": null,
  "media.update": null,
  "media.delete": null,

  "editors.list": null,
  "editors.get": null,
  "editors.create": null,
  "editors.update": null,
  "editors.delete": null,

  "integrations.list": null,
  "integrations.create": null,
  "integrations.revoke": null,
};

/** Which route group each endpoint belongs to (for the Settings overview). */
export const ENDPOINT_GROUPS: Record<string, { label: string; prefix: string; keys: EndpointKey[] }> = {
  auth: { label: "Authentication", prefix: "/auth", keys: ["auth.login", "auth.me", "auth.changePassword"] },
  websites: {
    label: "Websites",
    prefix: "/websites",
    keys: ["websites.list", "websites.get", "websites.create", "websites.update", "websites.delete"],
  },
  blogs: { label: "Blogs", prefix: "/blogs", keys: ["blogs.list", "blogs.get", "blogs.create", "blogs.update", "blogs.delete"] },
  media: { label: "Media", prefix: "/media", keys: ["media.list", "media.get", "media.upload", "media.update", "media.delete"] },
  editors: {
    label: "Editors",
    prefix: "/admin",
    keys: ["editors.list", "editors.get", "editors.create", "editors.update", "editors.delete"],
  },
  integrations: {
    label: "Website integrations",
    prefix: "/website-integrations",
    keys: ["integrations.list", "integrations.create", "integrations.revoke"],
  },
  integration: { label: "External integration", prefix: "/integration", keys: ["integration.blogs"] },
};

/**
 * Multipart field name the media upload route expects (multer `upload.single(...)`).
 * NEEDS BACKEND ROUTE CONFIRMATION.
 */
export const MEDIA_UPLOAD_FIELD = "file";

export function isEndpointConfigured(key: EndpointKey): boolean {
  return ENDPOINTS[key] !== null;
}

export function resolvePath(path: string, params?: Record<string, string | number>): string {
  if (!params) return path;
  return path.replace(/:([A-Za-z_]\w*)/g, (_, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`Missing path param "${name}" for ${path}`);
    return encodeURIComponent(String(value));
  });
}
