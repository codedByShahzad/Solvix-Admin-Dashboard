/**
 * In-browser request handler for the demo preview. It mirrors a typical
 * Express JSON envelope ({ success, data }) so the real normalizers and UI
 * states are exercised. Data lives in memory and resets on page reload.
 */
import type { ApiRequest } from "@/lib/api/baseQuery";
import type { ApiError } from "@/lib/api/errors";
import type { User } from "@/types";
import { demoBlogs, demoEditors, demoIntegrations, demoMedia, demoWebsites, artwork } from "./data";

type Obj = Record<string, unknown>;
type Result = { data: unknown; error?: undefined } | { error: ApiError; data?: undefined };

const db = {
  websites: structuredClone(demoWebsites),
  blogs: structuredClone(demoBlogs),
  media: structuredClone(demoMedia),
  editors: structuredClone(demoEditors),
  integrations: structuredClone(demoIntegrations),
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ok = (data: unknown): Result => ({ data: { success: true, data } });
const fail = (status: number, message: string, req: ApiRequest): Result => ({
  error: { status, message, endpoint: req.endpoint },
});
const newId = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const nowIso = () => new Date().toISOString();
const idOf = (v: unknown) => (typeof v === "string" ? v : ((v as Obj | undefined)?._id as string | undefined));

function websiteRef(id: unknown) {
  const w = db.websites.find((x) => x._id === id);
  return w ? { _id: w._id, name: w.name, domain: w.domain } : undefined;
}

function allowedWebsiteIds(user: User | null): string[] | null {
  if (!user || user.role === "admin") return null;
  return (user.websites ?? []).map((w) => w.id);
}

function crud(
  collection: keyof typeof db,
  op: string,
  req: ApiRequest,
  user: User | null,
  prefix: string,
  prepare: (body: Obj, existing?: Obj) => Obj = (b) => b,
): Result {
  const list = db[collection];
  const id = req.pathParams?.id as string | undefined;
  const allowed = allowedWebsiteIds(user);
  const scoped = (o: Obj) => !allowed || allowed.includes(idOf(o.website) ?? "");

  switch (op) {
    case "list":
      return ok(list.filter(scoped));
    case "get": {
      const item = list.find((x) => x._id === id);
      if (!item) return fail(404, "Not found.", req);
      if (!scoped(item)) return fail(403, "You don't have access to this website.", req);
      return ok(item);
    }
    case "create": {
      const body = (req.body ?? {}) as Obj;
      if (allowed && body.website && !allowed.includes(String(body.website))) {
        return fail(403, "You don't have permission to perform this action.", req);
      }
      const item = { _id: newId(prefix), ...prepare(body), createdAt: nowIso(), updatedAt: nowIso() };
      list.unshift(item);
      return ok(item);
    }
    case "update": {
      const idx = list.findIndex((x) => x._id === id);
      if (idx < 0) return fail(404, "Not found.", req);
      if (!scoped(list[idx])) return fail(403, "You don't have permission to perform this action.", req);
      list[idx] = { ...list[idx], ...prepare((req.body ?? {}) as Obj, list[idx]), updatedAt: nowIso() };
      return ok(list[idx]);
    }
    case "delete": {
      const idx = list.findIndex((x) => x._id === id);
      if (idx < 0) return fail(404, "Not found.", req);
      if (!scoped(list[idx])) return fail(403, "You don't have permission to perform this action.", req);
      list.splice(idx, 1);
      return ok({ deleted: true });
    }
  }
  return fail(404, "Not found.", req);
}

export async function demoRequest(req: ApiRequest, user: User | null): Promise<Result> {
  await delay(req.endpoint.endsWith(".list") ? 450 : 300);
  const [group, op] = req.endpoint.split(".");
  const isAdmin = user?.role === "admin";

  switch (group) {
    case "auth":
      if (op === "me") return ok(user);
      if (op === "changePassword") return ok({ changed: true });
      return fail(400, "Use the demo buttons to sign in.", req);

    case "websites":
      if (!isAdmin) return fail(403, "Forbidden", req);
      if (op === "create") {
        const body = (req.body ?? {}) as Obj;
        const dup = db.websites.some((w) => String(w.domain).toLowerCase() === String(body.domain).toLowerCase());
        if (dup) return fail(409, "A website with this domain already exists.", req);
      }
      if (op === "delete") {
        const id = req.pathParams?.id;
        db.blogs = db.blogs.filter((b) => idOf(b.website) !== id);
        db.media = db.media.filter((m) => idOf(m.website) !== id);
      }
      return crud("websites", op, req, user, "web", (b) => ({ ...b, owner: { _id: user?.id, name: user?.name } }));

    case "blogs": {
      const prepare = (b: Obj, existing?: Obj) => {
        const website = b.website ?? existing?.website;
        return {
          ...b,
          website: websiteRef(idOf(website)) ?? website,
          author: existing?.author ?? { _id: user?.id, name: user?.name },
        };
      };
      if (op === "create" || op === "update") {
        const body = (req.body ?? {}) as Obj;
        const id = req.pathParams?.id;
        const clash = db.blogs.some(
          (x) => x._id !== id && x.slug === body.slug && idOf(x.website) === String(body.website ?? idOf(x.website)),
        );
        if (body.slug && clash) return fail(409, "A blog with this slug already exists on this website.", req);
      }
      return crud("blogs", op, req, user, "blog", prepare);
    }

    case "media": {
      if (op === "upload") {
        const form = req.body as FormData;
        const file = form.get("file");
        if (!(file instanceof File)) return fail(400, "No file received.", req);
        const websiteId = form.get("website") as string | null;
        const allowed = allowedWebsiteIds(user);
        if (allowed && websiteId && !allowed.includes(websiteId)) return fail(403, "Forbidden", req);
        const isImage = file.type.startsWith("image/");
        const item: Obj = {
          _id: newId("media"),
          url: isImage ? URL.createObjectURL(file) : artwork(db.media.length, file.name, 1200, 800),
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
          format: file.name.split(".").pop(),
          size: file.size,
          alt: (form.get("alt") as string) || file.name.replace(/\.[^.]+$/, ""),
          website: websiteRef(websiteId) ?? (allowed ? websiteRef(allowed[0]) : undefined),
          blog: form.get("blog") ? { _id: form.get("blog"), title: db.blogs.find((b) => b._id === form.get("blog"))?.title } : undefined,
          uploadedBy: { _id: user?.id, name: user?.name },
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        db.media.unshift(item);
        return ok(item);
      }
      return crud("media", op, req, user, "media", (b, existing) => ({
        ...b,
        website: websiteRef(idOf(b.website)) ?? existing?.website,
        blog: b.blog ? { _id: b.blog, title: db.blogs.find((x) => x._id === b.blog)?.title } : b.blog === null ? undefined : existing?.blog,
      }));
    }

    case "editors": {
      if (!isAdmin) return fail(403, "Forbidden", req);
      if (op === "create") {
        const body = (req.body ?? {}) as Obj;
        if (db.editors.some((e) => e.email === body.email)) return fail(409, "An account with this email already exists.", req);
      }
      return crud("editors", op, req, user, "ed", (b) => {
        const { password: _pw, ...rest } = b;
        void _pw;
        return {
          ...rest,
          role: "editor",
          websites: Array.isArray(b.websites) ? b.websites.map((id) => websiteRef(id)).filter(Boolean) : rest.websites,
        };
      });
    }

    case "integrations": {
      if (!isAdmin) return fail(403, "Forbidden", req);
      if (op === "list") return ok(db.integrations);
      if (op === "create") {
        const websiteId = (req.body as Obj)?.website;
        const site = websiteRef(websiteId);
        const item = {
          _id: newId("int"),
          website: site,
          apiKey: `sk_live_${String(site?.name ?? "site").toLowerCase()}_${Math.random().toString(16).slice(2, 10)}`,
          apiSecret: `ss_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`,
          isActive: true,
          createdAt: nowIso(),
        };
        db.integrations.unshift(item);
        return ok(item);
      }
      if (op === "revoke") {
        const item = db.integrations.find((i) => i._id === req.pathParams?.id);
        if (!item) return fail(404, "Not found.", req);
        item.isActive = false;
        return ok(item);
      }
      break;
    }

    case "integration": {
      const key = req.headers?.["X-API-Key"];
      const integ = db.integrations.find((i) => i.apiKey === key && i.isActive);
      if (!integ || !req.headers?.["X-API-Secret"]) return fail(401, "Invalid API credentials.", req);
      const siteId = idOf(integ.website);
      return ok(db.blogs.filter((b) => idOf(b.website) === siteId && b.status === "published"));
    }
  }

  return fail(404, "Not found.", req);
}
