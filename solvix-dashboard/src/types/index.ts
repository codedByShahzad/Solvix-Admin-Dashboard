/**
 * Frontend domain types — these mirror the Solvix backend models
 * (server/src/models). Raw API documents are converted into these
 * by src/lib/api/mappers.ts.
 */

export type Role = "admin" | "editor";

/** A populated reference (e.g. blog.website → { _id, name, domain }). */
export interface Ref {
  id: string;
  name?: string;
  domain?: string;
}

// ── User (models/User.ts) ────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
}

/** Editors returned by GET /admin/editors. */
export type Editor = User;

// ── Website (models/Website.ts) ──────────────────────────────────────────────
export interface Website {
  id: string;
  name: string;
  slug: string;
  domain: string;
  description?: string;
  isActive: boolean;
  /** Owner user ID (not populated by the backend). */
  owner: string;
  /** Assigned editor user IDs (not populated by the backend). */
  editors: string[];
  createdAt?: string;
  updatedAt?: string;
}

// ── Blog (models/Blog.ts) ────────────────────────────────────────────────────
export type BlogStatus = "draft" | "published" | "archived";

export type BlockType = "paragraph" | "list";

export interface Block {
  type: BlockType;
  text?: string;
  items?: string[];
}

export interface Section {
  id: string;
  title: string;
  blocks: Block[];
}

export interface Blog {
  id: string;
  websiteId: string;
  /** Populated on list / get (name, domain). */
  website: Ref | null;
  slug: string;
  title: string;
  subtitle?: string;
  heroImage?: string;
  category?: string;
  publishDate?: string;
  /** Free text, e.g. "5 min read". */
  readingTime?: string;
  canonicalPath?: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords: string[];
  ogImage?: string;
  sections: Section[];
  status: BlogStatus;
  /** Populated on list / get (name, email). */
  author: (Ref & { email?: string }) | null;
  relatedSlugs: string[];
  createdAt?: string;
  updatedAt?: string;
}

// ── Media (models/Media.model.ts) ────────────────────────────────────────────
export interface Media {
  id: string;
  websiteId: string;
  /** Populated (name, slug, domain). */
  website: (Ref & { slug?: string }) | null;
  blogId?: string;
  /** Populated (title, slug). */
  blog: { id: string; title?: string; slug?: string } | null;
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

// ── Website integration (models/websiteIntegration.model.ts) ────────────────
export type IntegrationStatus = "connected" | "disconnected" | "error";

export interface WebsiteIntegration {
  id: string;
  websiteId: string;
  type: "REST_API";
  apiUrl: string;
  status: IntegrationStatus;
  lastConnectedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Returned ONLY by POST /website-integrations (the one time the secret is shown). */
export interface IntegrationCredentials extends WebsiteIntegration {
  apiKey: string;
  apiSecret: string;
}
