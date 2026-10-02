import { ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Media } from "@/types";

/** Cloudinary image preview (the backend only stores JPG/PNG/WebP images). */
export function MediaPreview({ media, className }: { media: Pick<Media, "url" | "altText" | "filename">; className?: string }) {
  if (!media.url) {
    return (
      <div className={cn("flex size-full items-center justify-center bg-surface-2 text-subtle", className)}>
        <ImageOff className="size-6" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={media.url} alt={media.altText || media.filename} loading="lazy" className={cn("size-full object-cover", className)} />;
}
