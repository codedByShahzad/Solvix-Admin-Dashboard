import { z } from "zod";
import type { Media } from "@/types";

export const mediaSchema = z.object({
  alt: z.string().trim().max(200, "Keep alt text under 200 characters"),
  caption: z.string().trim().max(300, "Keep the caption under 300 characters"),
  website: z.string(),
  blog: z.string(),
});

export type MediaFormValues = z.infer<typeof mediaSchema>;

export function mediaToForm(m?: Media): MediaFormValues {
  return { alt: m?.alt ?? "", caption: m?.caption ?? "", website: m?.websiteId ?? "", blog: m?.blogId ?? "" };
}

/** Request body for media.update — field names NEED BACKEND CONFIRMATION. */
export function toMediaPayload(v: MediaFormValues): Record<string, unknown> {
  return { alt: v.alt, caption: v.caption || undefined, website: v.website || undefined, blog: v.blog || null };
}
