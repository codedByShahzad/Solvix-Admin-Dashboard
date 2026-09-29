import type { Media } from "@/types";

export const ACCEPTED_MEDIA = "image/*,video/*,application/pdf";
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // matches common Cloudinary/multer limits — confirm with backend

export type MediaKind = "image" | "video" | "document" | "other";

export function mediaKind(m: Pick<Media, "mimeType" | "format" | "url">): MediaKind {
  const t = (m.mimeType ?? "").toLowerCase();
  const f = (m.format ?? m.url.split("?")[0].split(".").pop() ?? "").toLowerCase();
  if (t.startsWith("image") || ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"].includes(f) || m.url.startsWith("data:image")) return "image";
  if (t.startsWith("video") || ["mp4", "webm", "mov"].includes(f)) return "video";
  if (t.includes("pdf") || f === "pdf") return "document";
  return "other";
}

export function mediaFormat(m: Pick<Media, "mimeType" | "format" | "filename">): string {
  return (m.format ?? m.mimeType?.split("/")[1] ?? m.filename.split(".").pop() ?? "file").toUpperCase();
}
