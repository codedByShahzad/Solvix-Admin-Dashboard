import { z } from "zod";
import type { Blog, ContentBlock } from "@/types";
import { toDateInput } from "@/utils/format";

export const BLOG_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];

export const SEO_TITLE_MAX = 60;
export const SEO_DESC_MAX = 160;

const blockSchema = z.object({
  id: z.string(),
  type: z.enum(["heading", "paragraph", "quote", "image", "list"]),
  text: z.string().optional(),
  level: z.union([z.literal(2), z.literal(3)]).optional(),
  src: z.string().optional(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  items: z.array(z.string()).optional(),
});

export const blogSchema = z.object({
  website: z.string().trim().min(1, "Choose a website"),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200, "Keep the title under 200 characters"),
  subtitle: z.string().trim().max(300, "Keep the subtitle under 300 characters"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only"),
  category: z.string().trim().max(60),
  status: z.string().min(1),
  publishDate: z.string(),
  readingTime: z.string().regex(/^\d{0,3}$/, "Enter minutes as a number"),
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
  content: z.array(blockSchema),
});

export type BlogFormValues = z.infer<typeof blogSchema>;

export function blogToForm(b?: Blog, defaults?: Partial<BlogFormValues>): BlogFormValues {
  return {
    website: b?.websiteId ?? defaults?.website ?? "",
    title: b?.title ?? "",
    subtitle: b?.subtitle ?? "",
    slug: b?.slug ?? "",
    category: b?.category ?? "",
    status: b?.status ?? "draft",
    publishDate: toDateInput(b?.publishDate),
    readingTime: b?.readingTime ? String(b.readingTime) : "",
    canonicalPath: b?.canonicalPath ?? "",
    seoTitle: b?.seoTitle ?? "",
    seoDescription: b?.seoDescription ?? "",
    keywords: b?.keywords ?? [],
    heroImage: b?.heroImage ?? "",
    ogImage: b?.ogImage ?? "",
    relatedSlugs: b?.relatedSlugs ?? [],
    content: b?.content ?? [],
  };
}

function cleanBlock(b: ContentBlock) {
  const { id: _id, ...rest } = b;
  void _id;
  return Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined && v !== ""));
}

/** Request body for blogs.create / blogs.update — field names NEED BACKEND CONFIRMATION against the Blog model. */
export function toBlogPayload(v: BlogFormValues): Record<string, unknown> {
  return {
    website: v.website,
    title: v.title,
    subtitle: v.subtitle || undefined,
    slug: v.slug,
    category: v.category || undefined,
    status: v.status,
    publishDate: v.publishDate ? new Date(v.publishDate).toISOString() : undefined,
    readingTime: v.readingTime ? Number(v.readingTime) : undefined,
    canonicalPath: v.canonicalPath || undefined,
    seoTitle: v.seoTitle || undefined,
    seoDescription: v.seoDescription || undefined,
    keywords: v.keywords,
    heroImage: v.heroImage || undefined,
    ogImage: v.ogImage || undefined,
    relatedSlugs: v.relatedSlugs,
    content: v.content.map(cleanBlock),
  };
}

export function blocksToPlainText(blocks: ContentBlock[]): string {
  return blocks
    .map((b) => [b.text, ...(b.items ?? []), b.caption].filter(Boolean).join(" "))
    .join(" ");
}
