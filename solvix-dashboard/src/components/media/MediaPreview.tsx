import { FileText, FileVideo, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { mediaFormat, mediaKind } from "@/features/media/utils";
import type { Media } from "@/types";

/** Renders an image/video preview, or a typed file tile for other formats. */
export function MediaPreview({ media, className, controls }: { media: Media; className?: string; controls?: boolean }) {
  const kind = mediaKind(media);
  if (kind === "image" && media.url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={media.url} alt={media.alt ?? media.filename} loading="lazy" className={cn("size-full object-cover", className)} />;
  }
  if (kind === "video" && media.url) {
    return <video src={media.url} controls={controls} muted playsInline className={cn("size-full bg-black object-contain", className)} />;
  }
  const Icon = kind === "document" ? FileText : kind === "video" ? FileVideo : FileIcon;
  return (
    <div className={cn("flex size-full flex-col items-center justify-center gap-2 bg-surface-2 text-subtle", className)}>
      <Icon className="size-8" />
      <span className="rounded bg-surface px-1.5 py-0.5 text-2xs font-semibold text-muted ring-1 ring-border">{mediaFormat(media)}</span>
    </div>
  );
}
