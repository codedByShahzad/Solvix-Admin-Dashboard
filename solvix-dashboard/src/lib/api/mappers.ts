/**
 * Raw backend response types + mappers to frontend types.
 *
 * Response envelopes (traced from server/src/controllers):
 *   auth/login     → { message, token, user }
 *   auth/register  → { message, user }
 *   auth/me        → { user }
 *   websites/*     → { success, message, data }
 *   blogs, media   → { success, count?, data }
 *   admin/editors  → { success, count, data }
 *   integrations   → { success, message?, data }
 *
 * Mongo documents use `_id`; auth user objects use `id`.
 * Populated references arrive as objects, unpopulated ones as ID strings.
 */
import type {
  Blog,
  BlogStatus,
  Block,
  Editor,
  IntegrationCredentials,
  IntegrationStatus,
  Media,
  Ref,
  Role,
  Section,
  User,
  Website,
  WebsiteIntegration,
} from "@/types";

// ── Envelopes ────────────────────────────────────────────────────────────────

export interface DataEnvelope<T> {
  success: boolean;
  message?: string;
  count?: number;
  data: T;
}

// ── Raw documents ────────────────────────────────────────────────────────────

type ObjectIdString = string;

interface RawPopulated {
  _id: ObjectIdString;
  name?: string;
  domain?: string;
  slug?: string;
  title?: string;
  email?: string;
}

type RawRef = ObjectIdString | RawPopulated | null | undefined;

export interface RawAuthUser {
  id: ObjectIdString;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface RawUserDoc {
  _id: ObjectIdString;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RawWebsite {
  _id: ObjectIdString;
  name: string;
  slug: string;
  domain: string;
  description?: string;
  isActive: boolean;
  owner: RawRef;
  editors?: RawRef[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RawBlog {
  _id: ObjectIdString;
  website: RawRef;
  slug: string;
  title: string;
  subtitle?: string;
  heroImage?: string;
  category?: string;
  publishDate?: string;
  readingTime?: string;
  canonicalPath?: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  ogImage?: string;
  sections?: Section[];
  status: BlogStatus;
  author: RawRef;
  relatedSlugs?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RawMedia {
  _id: ObjectIdString;
  website: RawRef;
  blog?: RawRef;
  filename: string;
  url: string;
  publicId?: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  altText?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RawIntegration {
  id: ObjectIdString;
  websiteId: ObjectIdString;
  type: "REST_API";
  apiUrl: string;
  status: IntegrationStatus;
  lastConnectedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RawIntegrationCredentials extends RawIntegration {
  apiKey: string;
  apiSecret: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function refId(ref: RawRef): string {
  if (!ref) return "";
  return typeof ref === "string" ? ref : ref._id;
}

function toRef(ref: RawRef): Ref | null {
  if (!ref) return null;
  if (typeof ref === "string") return { id: ref };
  return { id: ref._id, name: ref.name, domain: ref.domain };
}

// ── Mappers ──────────────────────────────────────────────────────────────────

export function mapAuthUser(u: RawAuthUser): User {
  return { id: String(u.id), name: u.name, email: u.email, role: u.role, isActive: u.isActive };
}

export function mapUserDoc(u: RawUserDoc): Editor {
  return { id: u._id, name: u.name, email: u.email, role: u.role, isActive: u.isActive, createdAt: u.createdAt };
}

export function mapWebsite(w: RawWebsite): Website {
  return {
    id: w._id,
    name: w.name,
    slug: w.slug,
    domain: w.domain,
    description: w.description,
    isActive: w.isActive !== false,
    owner: refId(w.owner),
    editors: (w.editors ?? []).map(refId).filter(Boolean),
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  };
}

function mapBlock(b: Block): Block {
  return b.type === "list" ? { type: "list", items: b.items ?? [] } : { type: "paragraph", text: b.text ?? "" };
}

export function mapBlog(b: RawBlog): Blog {
  const author = toRef(b.author);
  return {
    id: b._id,
    websiteId: refId(b.website),
    website: toRef(b.website),
    slug: b.slug,
    title: b.title,
    subtitle: b.subtitle,
    heroImage: b.heroImage,
    category: b.category,
    publishDate: b.publishDate,
    readingTime: b.readingTime,
    canonicalPath: b.canonicalPath,
    seoTitle: b.seoTitle,
    seoDescription: b.seoDescription,
    keywords: b.keywords ?? [],
    ogImage: b.ogImage,
    sections: (b.sections ?? []).map((s) => ({ id: s.id, title: s.title, blocks: (s.blocks ?? []).map(mapBlock) })),
    status: b.status,
    author: author ? { ...author, email: typeof b.author === "object" && b.author ? b.author.email : undefined } : null,
    relatedSlugs: b.relatedSlugs ?? [],
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

export function mapMedia(m: RawMedia): Media {
  const website = m.website && typeof m.website === "object" ? m.website : null;
  const blog = m.blog && typeof m.blog === "object" ? m.blog : null;
  return {
    id: m._id,
    websiteId: refId(m.website),
    website: website ? { id: website._id, name: website.name, domain: website.domain, slug: website.slug } : null,
    blogId: refId(m.blog) || undefined,
    blog: blog ? { id: blog._id, title: blog.title, slug: blog.slug } : m.blog ? { id: refId(m.blog) } : null,
    filename: m.filename,
    url: m.url,
    publicId: m.publicId,
    mimeType: m.mimeType,
    size: m.size,
    width: m.width,
    height: m.height,
    altText: m.altText,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

export function mapIntegration(i: RawIntegration): WebsiteIntegration {
  return {
    id: String(i.id),
    websiteId: String(i.websiteId),
    type: i.type,
    apiUrl: i.apiUrl,
    status: i.status,
    lastConnectedAt: i.lastConnectedAt,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  };
}

export function mapIntegrationCredentials(i: RawIntegrationCredentials): IntegrationCredentials {
  return { ...mapIntegration(i), apiKey: i.apiKey, apiSecret: i.apiSecret };
}
