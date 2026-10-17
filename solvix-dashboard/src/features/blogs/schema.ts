import { z } from "zod";
import type { Blog, BlogStatus } from "@/types";
import type { BlogPayload } from "@/store/api/blogApi";
import { toDateInput } from "@/utils/format";
import { normalizeDoc, sectionsToDoc, type ContentDoc } from "@/lib/blogContent";

export const BLOG_STATUSES: { value: BlogStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export const SEO_TITLE_MAX = 60;
export const SEO_DESC_MAX = 160;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Mirrors models/Blog.ts (website, slug, title required; slug unique per website). */
export const blogSchema = z
  .object({
    website: z.string().trim().min(1, "Choose a website"),
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(200, "Keep the title under 200 characters"),
    subtitle: z.string().trim().max(300, "Keep the subtitle under 300 characters"),
    slug: z.string().trim().min(1, "Slug is required").regex(SLUG_RE, "Use lowercase letters, numbers and hyphens only"),
    category: z.string().trim().max(60),
    status: z.enum(["draft", "published", "archived"]),
    publishDate: z.string(),
    readingTime: z.string().trim().max(40),
    canonicalPath: z
      .string()
      .trim()
      .refine((v) => !v || v.startsWith("/"), "Canonical path must start with /"),
    seoTitle: z.string().trim().max(120, "Keep the SEO title under 120 characters"),
    seoDescription: z.string().trim().max(320, "Keep the SEO description under 320 characters"),
    keywords: z.array(z.string()),
    heroImage: z.string().trim(),
    ogImage: z.string().trim(),
    relatedSlugs: z.array(z.string()),
  });

/** The fields managed by react-hook-form. */
export type BlogFieldValues = z.infer<typeof blogSchema>;

/** Everything the blog form submits: the fields plus the rich-text document (owned by the editor). */
export type BlogFormValues = BlogFieldValues & { contentJson: ContentDoc };

/**
 * The document to edit: the stored rich-text content, or — for posts written
 * with the old section editor — those sections converted (each section → H2
 * followed by its paragraphs and lists, in order). Nothing is saved until the user saves.
 */
export function blogContentDoc(b?: Blog): ContentDoc {
  return b?.contentJson ?? sectionsToDoc(b?.sections ?? []);
}

export function blogToForm(b?: Blog, defaults?: Partial<BlogFormValues>): BlogFormValues {
  return {
    website: b?.websiteId ?? defaults?.website ?? "",
    title: b?.title ?? "",
    subtitle: b?.subtitle ?? "",
    slug: b?.slug ?? "",
    category: b?.category ?? "",
    status: b?.status ?? "draft",
    publishDate: toDateInput(b?.publishDate),
    readingTime: b?.readingTime ?? "",
    canonicalPath: b?.canonicalPath ?? "",
    seoTitle: b?.seoTitle ?? "",
    seoDescription: b?.seoDescription ?? "",
    keywords: b?.keywords ?? [],
    heroImage: b?.heroImage ?? "",
    ogImage: b?.ogImage ?? "",
    relatedSlugs: b?.relatedSlugs ?? [],
    contentJson: b ? blogContentDoc(b) : (defaults?.contentJson ?? { type: "doc", content: [] }),
  };
}

/** Body for POST /blogs and PATCH /blogs/:id. Empty optional strings are sent as "" on update so fields can be cleared. */
export function toBlogPayload(v: BlogFormValues): BlogPayload {
  return {
    website: v.website,
    title: v.title,
    subtitle: v.subtitle,
    slug: v.slug,
    category: v.category,
    status: v.status,
    // A calendar date → UTC midnight, so every timezone (and external sites) see the same day.
    publishDate: v.publishDate ? `${v.publishDate}T00:00:00.000Z` : undefined,
    readingTime: v.readingTime,
    canonicalPath: v.canonicalPath,
    seoTitle: v.seoTitle,
    seoDescription: v.seoDescription,
    keywords: v.keywords,
    heroImage: v.heroImage,
    ogImage: v.ogImage,
    relatedSlugs: v.relatedSlugs,
    // The backend derives contentHtml, toc and the legacy sections from this document.
    contentJson: normalizeDoc(v.contentJson),
  };
}
