import type { Media } from "@/types";

/** Must match server/src/middleware/upload.middleware.ts */
export const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPTED_MEDIA = ACCEPTED_MIME_TYPES.join(",");
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function validateUploadFile(file: File): string | null {
  if (!(ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type)) return "Only JPG, PNG and WebP images are allowed.";
  if (file.size > MAX_UPLOAD_BYTES) return "File is too large. Maximum size is 5 MB.";
  return null;
}

export function mediaFormat(m: Pick<Media, "mimeType" | "filename">): string {
  return (m.mimeType?.split("/")[1] ?? m.filename.split(".").pop() ?? "image").replace("jpeg", "jpg").toUpperCase();
}
