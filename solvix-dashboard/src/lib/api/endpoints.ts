/**
 * BACKEND ROUTE REGISTRY — the only place backend paths live.
 *
 * Every route below was traced from server/src/routes/*.ts.
 * Paths are relative to NEXT_PUBLIC_API_URL (which already ends in /api/v1).
 *
 * auth: true  → the dashboard JWT is sent as `Authorization: Bearer <token>`
 * auth: false → no JWT (public routes, or the X-API-Key/X-API-Secret routes)
 */

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface EndpointDef {
  method: HttpMethod;
  path: string;
  auth: boolean;
  /** Who the backend allows. Shown in Settings; the backend enforces it. */
  access: "public" | "admin" | "admin+editor" | "api-key";
}

export const ENDPOINTS = {
  // auth.routes.ts
  "auth.register": { method: "POST", path: "/auth/register", auth: false, access: "public" },
  "auth.login": { method: "POST", path: "/auth/login", auth: false, access: "public" },
  "auth.me": { method: "GET", path: "/auth/me", auth: true, access: "admin+editor" },

  // admin.routes.ts
  "admin.editors": { method: "GET", path: "/admin/editors", auth: true, access: "admin" },

  // website.routes.ts
  "websites.list": { method: "GET", path: "/websites", auth: true, access: "admin+editor" },
  "websites.get": { method: "GET", path: "/websites/:id", auth: true, access: "admin+editor" },
  "websites.create": { method: "POST", path: "/websites", auth: true, access: "admin" },
  "websites.update": { method: "PATCH", path: "/websites/:id", auth: true, access: "admin" },
  "websites.delete": { method: "DELETE", path: "/websites/:id", auth: true, access: "admin" },
  "websites.assignEditor": { method: "PATCH", path: "/websites/:id/assign-editor", auth: true, access: "admin" },
  "websites.transferOwnership": { method: "PATCH", path: "/websites/:id/owner", auth: true, access: "admin" },

  // blog.routes.ts
  "blogs.list": { method: "GET", path: "/blogs", auth: true, access: "admin+editor" },
  "blogs.get": { method: "GET", path: "/blogs/:id", auth: true, access: "admin+editor" },
  "blogs.create": { method: "POST", path: "/blogs", auth: true, access: "admin+editor" },
  "blogs.update": { method: "PATCH", path: "/blogs/:id", auth: true, access: "admin+editor" },
  "blogs.delete": { method: "DELETE", path: "/blogs/:id", auth: true, access: "admin+editor" },

  // media.routes.ts (multipart field: "image")
  "media.list": { method: "GET", path: "/media", auth: true, access: "admin+editor" },
  "media.get": { method: "GET", path: "/media/:id", auth: true, access: "admin+editor" },
  "media.upload": { method: "POST", path: "/media", auth: true, access: "admin+editor" },
  "media.update": { method: "PATCH", path: "/media/:id", auth: true, access: "admin+editor" },
  "media.delete": { method: "DELETE", path: "/media/:id", auth: true, access: "admin" },

  // websiteIntegration.routes.ts
  "integrations.create": { method: "POST", path: "/website-integrations", auth: true, access: "admin" },
  "integrations.get": { method: "GET", path: "/website-integrations/:websiteId", auth: true, access: "admin" },
  "integrations.update": { method: "PATCH", path: "/website-integrations/:websiteId", auth: true, access: "admin" },
  "integrations.delete": { method: "DELETE", path: "/website-integrations/:websiteId", auth: true, access: "admin" },
  "integrations.test": { method: "POST", path: "/website-integrations/:websiteId/test", auth: true, access: "admin" },

  // integration.routes.ts (X-API-Key + X-API-Secret, no JWT)
  "integration.blogs": { method: "GET", path: "/integration/blogs", auth: false, access: "api-key" },
  "integration.blog": { method: "GET", path: "/integration/blogs/:blogId", auth: false, access: "api-key" },
  "integration.media": { method: "GET", path: "/integration/media", auth: false, access: "api-key" },
  "integration.mediaItem": { method: "GET", path: "/integration/media/:mediaId", auth: false, access: "api-key" },
} as const satisfies Record<string, EndpointDef>;

export type EndpointKey = keyof typeof ENDPOINTS;

export const ENDPOINT_GROUPS: { label: string; keys: EndpointKey[] }[] = [
  { label: "Authentication", keys: ["auth.register", "auth.login", "auth.me"] },
  { label: "Admin", keys: ["admin.editors"] },
  {
    label: "Websites",
    keys: [
      "websites.list",
      "websites.get",
      "websites.create",
      "websites.update",
      "websites.delete",
      "websites.assignEditor",
      "websites.transferOwnership",
    ],
  },
  { label: "Blogs", keys: ["blogs.list", "blogs.get", "blogs.create", "blogs.update", "blogs.delete"] },
  { label: "Media", keys: ["media.list", "media.get", "media.upload", "media.update", "media.delete"] },
  {
    label: "Website integrations",
    keys: ["integrations.create", "integrations.get", "integrations.update", "integrations.delete", "integrations.test"],
  },
  {
    label: "External integration API",
    keys: ["integration.blogs", "integration.blog", "integration.media", "integration.mediaItem"],
  },
];

/** Multipart field name expected by `upload.single("image")` in media.routes.ts. */
export const MEDIA_UPLOAD_FIELD = "image";

export function resolvePath(path: string, params?: Record<string, string | number>): string {
  if (!params) return path;
  return path.replace(/:([A-Za-z_]\w*)/g, (_, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`Missing path param "${name}" for ${path}`);
    return encodeURIComponent(String(value));
  });
}
