/**
 * Frontend domain models. Backend documents are converted into these shapes
 * by src/lib/api/normalize.ts, so pages never depend on raw Mongo field names
 * (_id vs id, populated vs unpopulated refs, etc.).
 */

export type Role = "admin" | "editor";

export interface Ref {
  id: string;
  name?: string;
  domain?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  /** Websites the user may access (editors). Present only if the backend returns it. */
  websites?: Ref[];
}

export type WebsiteStatus = "active" | "inactive" | (string & {});

export interface Website {
  id: string;
  name: string;
  domain: string;
  slug?: string;
  description?: string;
  status: WebsiteStatus;
  logo?: string;
  owner?: Ref | null;
  createdAt?: string;
  updatedAt?: string;
}

export type BlogStatus = "draft" | "published" | (string & {});

export type ContentBlockType = "heading" | "paragraph" | "quote" | "image" | "list";

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  text?: string;
  level?: 2 | 3;
  src?: string;
  alt?: string;
  caption?: string;
  items?: string[];
}

export interface Blog {
  id: string;
  websiteId: string;
  website?: Ref | null;
  slug: string;
  title: string;
  subtitle?: string;
  heroImage?: string;
  category?: string;
  publishDate?: string;
  readingTime?: number;
  canonicalPath?: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords: string[];
  ogImage?: string;
  status: BlogStatus;
  author?: Ref | null;
  relatedSlugs: string[];
  content: ContentBlock[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Media {
  id: string;
  url: string;
  publicId?: string;
  filename: string;
  mimeType?: string;
  format?: string;
  size?: number;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  websiteId?: string;
  website?: Ref | null;
  blogId?: string;
  blog?: (Ref & { title?: string }) | null;
  uploadedBy?: Ref | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Editor {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  websites: Ref[];
  createdAt?: string;
  lastLoginAt?: string;
}

export interface WebsiteIntegration {
  id: string;
  websiteId: string;
  website?: Ref | null;
  apiKey: string;
  /** Usually returned only once, at creation time. */
  apiSecret?: string;
  isActive: boolean;
  createdAt?: string;
  lastUsedAt?: string;
}

export interface ListResult<T> {
  items: T[];
  /** meta.total from the backend when present, otherwise items.length */
  total: number;
}
