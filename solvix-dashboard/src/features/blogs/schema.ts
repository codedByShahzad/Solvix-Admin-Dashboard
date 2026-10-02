import { z } from "zod";
import type { Blog, BlogStatus } from "@/types";
import type { BlogPayload } from "@/store/api/blogApi";
import { toDateInput } from "@/utils/format";
import { uid } from "@/utils/slug";

export const BLOG_STATUSES: { value: BlogStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export const SEO_TITLE_MAX = 60;
export const SEO_DESC_MAX = 160;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const blockSchema = z.object({
  type: z.enum(["paragraph", "list"]),
  text: z.string().optional(),
  items: z.array(z.string()).optional(),
});

/** `key` is a client-only React key; the backend fields are id, title, blocks. */
const sectionSchema = z.object({
  key: z.string(),
  id: z
    .string()
    .trim()
    .min(1, "Section ID is required")
    .regex(SLUG_RE, "Use lowercase letters, numbers and hyphens"),
  title: z.string().trim().min(1, "Section title is required"),
  blocks: z.array(blockSchema),
});

/** Mirrors models/Blog.ts (website, slug, title required; slug unique per website). */
export const blogSchema = z
  .object({
    website: z.string().trim().min(1, "Choose a website"),

    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Keep the title under 200 characters"),

    subtitle: z
      .string()
      .trim()
      .max(300, "Keep the subtitle under 300 characters"),

    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .regex(SLUG_RE, "Use lowercase letters, numbers and hyphens only"),

    category: z.string().trim().max(60),

    status: z.enum(["draft", "published", "archived"]),

    publishDate: z.string(),

    readingTime: z.string().trim().max(40),

    canonicalPath: z
      .string()
      .trim()
      .refine(
        (v) => !v || v.startsWith("/"),
        "Canonical path must start with /"
      ),

    seoTitle: z
      .string()
      .trim()
      .max(120, "Keep the SEO title under 120 characters"),

    seoDescription: z
      .string()
      .trim()
      .max(320, "Keep the SEO description under 320 characters"),

    keywords: z.array(z.string()),

    heroImage: z.string().trim(),

    ogImage: z.string().trim(),

    relatedSlugs: z.array(z.string()),

    sections: z.array(sectionSchema),
  })
  .superRefine((v, ctx) => {
    const seen = new Set<string>();

    v.sections.forEach((s, i) => {
      if (s.id && seen.has(s.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["sections", i, "id"],
          message: "Section IDs must be unique",
        });
      }

      seen.add(s.id);
    });
  });

export type BlogFormValues = z.infer<typeof blogSchema>;
export type SectionFormValue = BlogFormValues["sections"][number];

export function newSection(
  title = "",
  id = ""
): SectionFormValue {
  return {
    key: uid("sec"),
    id,
    title,
    blocks: [
      {
        type: "paragraph",
        text: "",
      },
    ],
  };
}

export function blogToForm(
  b?: Blog,
  defaults?: Partial<BlogFormValues>
): BlogFormValues {
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

    sections: (b?.sections ?? []).map((s) => ({
      key: uid("sec"),
      id: s.id,
      title: s.title,
      blocks: s.blocks,
    })),
  };
}

/**
 * Body for POST /blogs and PATCH /blogs/:id.
 * Empty optional strings are sent as "" on update so fields can be cleared.
 *
 * Author is intentionally NOT included here.
 * The backend automatically sets the author to the logged-in user.
 */
export function toBlogPayload(v: BlogFormValues): BlogPayload {
  return {
    website: v.website,

    title: v.title,

    subtitle: v.subtitle,

    slug: v.slug,

    category: v.category,

    status: v.status,

    // A calendar date → UTC midnight, so every timezone
    // (and external sites) see the same day.
    publishDate: v.publishDate
      ? `${v.publishDate}T00:00:00.000Z`
      : undefined,

    readingTime: v.readingTime,

    canonicalPath: v.canonicalPath,

    seoTitle: v.seoTitle,

    seoDescription: v.seoDescription,

    keywords: v.keywords,

    heroImage: v.heroImage,

    ogImage: v.ogImage,

    relatedSlugs: v.relatedSlugs,

    sections: v.sections.map((s) => ({
      id: s.id,
      title: s.title,

      blocks: s.blocks
        .map((b) =>
          b.type === "list"
            ? {
                type: "list" as const,
                items: (b.items ?? [])
                  .map((i) => i.trim())
                  .filter(Boolean),
              }
            : {
                type: "paragraph" as const,
                text: (b.text ?? "").trim(),
              }
        )
        .filter((b) =>
          b.type === "list"
            ? b.items.length > 0
            : b.text.length > 0
        ),
    })),
  };
}

export function sectionsToPlainText(
  sections: {
    title: string;
    blocks: {
      text?: string;
      items?: string[];
    }[];
  }[]
): string {
  return sections
    .map((s) =>
      [
        s.title,
        ...s.blocks
          .map((b) => [b.text, ...(b.items ?? [])])
          .filter(Boolean)
          .join(" "),
      ].join(" ")
    )
    .join(" ");
}