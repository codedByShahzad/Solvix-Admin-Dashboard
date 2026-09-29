/**
 * Response normalizers.
 *
 * The backend's exact response envelope and field names still need
 * confirmation, so these helpers accept the common Express/Mongoose shapes:
 *
 *   { data: [...] } · { data: { items|docs|results: [...] } } · [...]
 *   _id or id · populated refs or plain ObjectId strings
 *
 * Once the backend is confirmed, tighten these to its real shape if you like —
 * pages only ever see the normalized types from src/types.
 */
import type {
  Blog,
  ContentBlock,
  ContentBlockType,
  Editor,
  ListResult,
  Media,
  Ref,
  Role,
  User,
  Website,
  WebsiteIntegration,
} from "@/types";

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === "string" && v.length ? v : undefined);
const num = (v: unknown): number | undefined => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
};
const strArr = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : typeof v === "string" && v.length
      ? v.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

export function idOf(v: unknown): string {
  if (typeof v === "string") return v;
  if (isObj(v)) return str(v.id) ?? str(v._id) ?? "";
  return "";
}

/** Unwrap `{ data: X }` / `{ result: X }` envelopes. */
export function extractItem(res: unknown): Obj {
  let cur: unknown = res;
  for (let i = 0; i < 3 && isObj(cur); i++) {
    const inner = cur.data ?? cur.result ?? cur.item;
    if (isObj(inner)) cur = inner;
    else break;
  }
  return isObj(cur) ? cur : {};
}

export function extractList(res: unknown): { items: unknown[]; total?: number } {
  const findArray = (v: unknown, depth = 0): unknown[] | undefined => {
    if (Array.isArray(v)) return v;
    if (!isObj(v) || depth > 3) return undefined;
    for (const key of ["data", "items", "docs", "results", "rows", "list"]) {
      const found = findArray(v[key], depth + 1);
      if (found) return found;
    }
    return undefined;
  };
  const findTotal = (v: unknown, depth = 0): number | undefined => {
    if (!isObj(v) || depth > 3) return undefined;
    const direct = num(v.total) ?? num(v.totalDocs) ?? num(v.count) ?? num(v.totalItems);
    if (direct !== undefined) return direct;
    for (const key of ["meta", "pagination", "data"]) {
      const found = findTotal(v[key], depth + 1);
      if (found !== undefined) return found;
    }
    return undefined;
  };
  return { items: findArray(res) ?? [], total: findTotal(res) };
}

export function toListResult<T>(res: unknown, map: (raw: Obj) => T): ListResult<T> {
  const { items, total } = extractList(res);
  const mapped = items.filter(isObj).map(map);
  return { items: mapped, total: total ?? mapped.length };
}

export function normalizeRef(v: unknown): Ref | null {
  if (!v) return null;
  if (typeof v === "string") return { id: v };
  if (!isObj(v)) return null;
  const id = idOf(v);
  if (!id) return null;
  return {
    id,
    name: str(v.name) ?? str(v.title) ?? str(v.fullName),
    domain: str(v.domain) ?? str(v.url),
  };
}

export function normalizeRole(v: unknown): Role | null {
  const r = typeof v === "string" ? v.toLowerCase() : "";
  return r === "admin" || r === "editor" ? r : null;
}

export function normalizeUser(raw: Obj): User | null {
  const role = normalizeRole(raw.role);
  if (!role) return null;
  const websitesRaw = raw.websites ?? raw.assignedWebsites ?? raw.allowedWebsites;
  return {
    id: idOf(raw) || str(raw.userId) || "",
    name: str(raw.name) ?? str(raw.fullName) ?? str(raw.username) ?? str(raw.email)?.split("@")[0] ?? "User",
    email: str(raw.email) ?? "",
    role,
    avatar: str(raw.avatar) ?? str(raw.image),
    websites: Array.isArray(websitesRaw) ? websitesRaw.map(normalizeRef).filter((x): x is Ref => !!x) : undefined,
  };
}

export function normalizeWebsite(raw: Obj): Website {
  return {
    id: idOf(raw),
    name: str(raw.name) ?? str(raw.title) ?? "Untitled website",
    domain: str(raw.domain) ?? str(raw.url) ?? "",
    slug: str(raw.slug),
    description: str(raw.description),
    status: str(raw.status) ?? (raw.isActive === false ? "inactive" : "active"),
    logo: str(raw.logo) ?? str(raw.logoUrl),
    owner: normalizeRef(raw.owner ?? raw.createdBy),
    createdAt: str(raw.createdAt),
    updatedAt: str(raw.updatedAt),
  };
}

const BLOCK_TYPES: ContentBlockType[] = ["heading", "paragraph", "quote", "image", "list"];

function normalizeBlocks(v: unknown): ContentBlock[] {
  if (typeof v === "string") {
    return v
      .split(/\n{2,}/)
      .filter(Boolean)
      .map((text, i) => ({ id: `b${i}`, type: "paragraph", text }));
  }
  if (!Array.isArray(v)) return [];
  return v.map((b, i): ContentBlock => {
    if (typeof b === "string") return { id: `b${i}`, type: "paragraph", text: b };
    const o = isObj(b) ? b : {};
    const t = str(o.type) as ContentBlockType | undefined;
    const level = num(o.level);
    return {
      id: str(o.id) ?? str(o._id) ?? `b${i}`,
      type: t && BLOCK_TYPES.includes(t) ? t : "paragraph",
      text: str(o.text) ?? str(o.content) ?? str(o.value),
      level: level === 3 ? 3 : 2,
      src: str(o.src) ?? str(o.url),
      alt: str(o.alt),
      caption: str(o.caption),
      items: Array.isArray(o.items) ? strArr(o.items) : undefined,
    };
  });
}

export function normalizeBlog(raw: Obj): Blog {
  const website = normalizeRef(raw.website ?? raw.websiteId);
  return {
    id: idOf(raw),
    websiteId: website?.id ?? "",
    website,
    slug: str(raw.slug) ?? "",
    title: str(raw.title) ?? "Untitled",
    subtitle: str(raw.subtitle),
    heroImage: str(raw.heroImage) ?? (isObj(raw.heroImage) ? str(raw.heroImage.url) : undefined),
    category: str(raw.category),
    publishDate: str(raw.publishDate) ?? str(raw.publishedAt),
    readingTime: num(raw.readingTime),
    canonicalPath: str(raw.canonicalPath),
    seoTitle: str(raw.seoTitle) ?? (isObj(raw.seo) ? str(raw.seo.title) : undefined),
    seoDescription: str(raw.seoDescription) ?? (isObj(raw.seo) ? str(raw.seo.description) : undefined),
    keywords: strArr(raw.keywords ?? (isObj(raw.seo) ? raw.seo.keywords : undefined)),
    ogImage: str(raw.ogImage) ?? (isObj(raw.seo) ? str(raw.seo.ogImage) : undefined),
    status: str(raw.status) ?? "draft",
    author: normalizeRef(raw.author),
    relatedSlugs: strArr(raw.relatedSlugs),
    content: normalizeBlocks(raw.content ?? raw.blocks ?? raw.paragraphs),
    createdAt: str(raw.createdAt),
    updatedAt: str(raw.updatedAt),
  };
}

export function normalizeMedia(raw: Obj): Media {
  const website = normalizeRef(raw.website ?? raw.websiteId);
  const blogRaw = raw.blog ?? raw.blogId;
  const blog = normalizeRef(blogRaw);
  return {
    id: idOf(raw),
    url: str(raw.url) ?? str(raw.secureUrl) ?? str(raw.secure_url) ?? "",
    publicId: str(raw.publicId) ?? str(raw.public_id),
    filename: str(raw.originalName) ?? str(raw.filename) ?? str(raw.name) ?? str(raw.title) ?? "Untitled file",
    mimeType: str(raw.mimeType) ?? str(raw.mimetype) ?? str(raw.resourceType),
    format: str(raw.format),
    size: num(raw.size) ?? num(raw.bytes),
    width: num(raw.width),
    height: num(raw.height),
    alt: str(raw.alt) ?? str(raw.altText),
    caption: str(raw.caption),
    websiteId: website?.id,
    website,
    blogId: blog?.id,
    blog: blog ? { ...blog, title: isObj(blogRaw) ? str(blogRaw.title) : undefined } : null,
    uploadedBy: normalizeRef(raw.uploadedBy ?? raw.createdBy),
    createdAt: str(raw.createdAt),
    updatedAt: str(raw.updatedAt),
  };
}

export function normalizeEditor(raw: Obj): Editor {
  const websitesRaw = raw.websites ?? raw.assignedWebsites ?? raw.allowedWebsites;
  return {
    id: idOf(raw),
    name: str(raw.name) ?? str(raw.fullName) ?? str(raw.email) ?? "Unnamed",
    email: str(raw.email) ?? "",
    role: normalizeRole(raw.role) ?? "editor",
    isActive: raw.isActive === undefined ? str(raw.status) !== "inactive" : Boolean(raw.isActive),
    websites: Array.isArray(websitesRaw) ? websitesRaw.map(normalizeRef).filter((x): x is Ref => !!x) : [],
    createdAt: str(raw.createdAt),
    lastLoginAt: str(raw.lastLoginAt) ?? str(raw.lastLogin),
  };
}

export function normalizeIntegration(raw: Obj): WebsiteIntegration {
  const website = normalizeRef(raw.website ?? raw.websiteId);
  return {
    id: idOf(raw),
    websiteId: website?.id ?? "",
    website,
    apiKey: str(raw.apiKey) ?? str(raw.key) ?? "",
    apiSecret: str(raw.apiSecret) ?? str(raw.secret),
    isActive: raw.isActive === undefined ? str(raw.status) !== "revoked" : Boolean(raw.isActive),
    createdAt: str(raw.createdAt),
    lastUsedAt: str(raw.lastUsedAt),
  };
}
