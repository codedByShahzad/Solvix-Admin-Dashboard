import { z } from "zod";
import type { Website } from "@/types";
import type { CreateWebsiteInput, UpdateWebsiteInput } from "@/store/api/websiteApi";

const DOMAIN_RE = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Mirrors models/Website.ts — name, slug, domain required; slug & domain unique. */
export const websiteSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Keep the name under 80 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Keep the slug under 100 characters")
    .regex(SLUG_RE, "Use lowercase letters, numbers and hyphens only"),
  domain: z
    .string()
    .trim()
    .min(1, "Domain is required")
    .transform((v) => v.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase())
    .refine((v) => DOMAIN_RE.test(v), "Enter a valid domain, e.g. topicler.com"),
  description: z.string().trim().max(500, "Keep the description under 500 characters"),
  isActive: z.boolean(),
});

export type WebsiteFormInput = z.input<typeof websiteSchema>;
export type WebsiteFormValues = z.output<typeof websiteSchema>;

export function websiteToForm(w?: Website): WebsiteFormInput {
  return {
    name: w?.name ?? "",
    slug: w?.slug ?? "",
    // Older records may have been saved with a protocol — show the bare host.
    domain: (w?.domain ?? "").replace(/^https?:\/\//i, "").replace(/\/.*$/, ""),
    description: w?.description ?? "",
    isActive: w?.isActive ?? true,
  };
}

/** POST /websites — the backend ignores isActive on create (defaults to true). */
export function toCreateWebsitePayload(v: WebsiteFormValues): CreateWebsiteInput {
  return { name: v.name, slug: v.slug, domain: v.domain, description: v.description || undefined };
}

/** PATCH /websites/:id */
export function toUpdateWebsitePayload(v: WebsiteFormValues): UpdateWebsiteInput {
  return { name: v.name, slug: v.slug, domain: v.domain, description: v.description, isActive: v.isActive };
}
