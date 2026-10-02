import { z } from "zod";
import type { Media } from "@/types";

/** Editable fields of PATCH /media/:id */
export const mediaSchema = z.object({
  filename: z.string().trim().min(1, "File name is required").max(200),
  altText: z.string().trim().max(200, "Keep alt text under 200 characters"),
  blog: z.string(),
});

export type MediaFormValues = z.infer<typeof mediaSchema>;

export function mediaToForm(m: Media): MediaFormValues {
  return { filename: m.filename, altText: m.altText ?? "", blog: m.blogId ?? "" };
}
