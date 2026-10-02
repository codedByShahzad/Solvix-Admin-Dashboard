"use client";

import Link from "next/link";
import { Copy, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Menu, MenuItem, MenuSeparator } from "@/components/ui";
import { useIsAdmin } from "@/features/auth/useAuth";
import { formatBytes } from "@/utils/format";
import { mediaFormat } from "@/features/media/utils";
import type { Media } from "@/types";
import { MediaPreview } from "./MediaPreview";

export function MediaCard({ media, onDelete }: { media: Media; onDelete: (m: Media) => void }) {
  const isAdmin = useIsAdmin();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(media.url);
      toast.success("URL copied to clipboard");
    } catch {
      toast.error("Couldn't copy the URL.");
    }
  };

  return (
    <div className="card group relative flex flex-col overflow-hidden transition-all hover:border-border-strong hover:shadow-pop">
      <Link href={`/dashboard/media/${media.id}`} className="relative block aspect-[4/3] overflow-hidden bg-surface-2">
        <MediaPreview media={media} className="transition-transform duration-300 group-hover:scale-[1.03]" />
        <span className="absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-2xs font-semibold text-white backdrop-blur">{mediaFormat(media)}</span>
      </Link>
      <div className="flex items-start gap-2 p-3">
        <div className="min-w-0 flex-1">
          <Link href={`/dashboard/media/${media.id}`} className="block truncate text-[13px] font-medium text-fg hover:text-brand" title={media.filename}>
            {media.filename}
          </Link>
          <div className="mt-0.5 truncate text-xs text-muted">
            {formatBytes(media.size)}
            {media.website?.name ? ` · ${media.website.name}` : ""}
          </div>
        </div>
        <Menu
          width="w-44"
          trigger={({ toggle }) => (
            <Button variant="ghost" size="icon-sm" className="-mr-1 size-7" onClick={toggle} aria-label={`Actions for ${media.filename}`}>
              <MoreHorizontal />
            </Button>
          )}
        >
          <MenuItem href={`/dashboard/media/${media.id}`} icon={<Eye />}>
            View
          </MenuItem>
          <MenuItem href={`/dashboard/media/${media.id}/edit`} icon={<Pencil />}>
            Edit
          </MenuItem>
          <MenuItem onClick={copy} icon={<Copy />}>
            Copy URL
          </MenuItem>
          {isAdmin && (
            <>
              <MenuSeparator />
              <MenuItem onClick={() => onDelete(media)} icon={<Trash2 />} danger>
                Delete
              </MenuItem>
            </>
          )}
        </Menu>
      </div>
    </div>
  );
}
