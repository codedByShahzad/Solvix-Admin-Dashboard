"use client";

import { useMemo, useState } from "react";
import { Check, ImageOff } from "lucide-react";
import { Button, EmptyState, ErrorState, Modal, SearchInput, Skeleton } from "@/components/ui";
import { useGetMediaListQuery } from "@/store/api/mediaApi";
import { mediaKind } from "@/features/media/utils";
import { cn } from "@/lib/cn";
import type { Media } from "@/types";

/** Pick an existing image from the media library. */
export function MediaPicker({
  open,
  onClose,
  onSelect,
  websiteId,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (media: Media) => void;
  websiteId?: string;
}) {
  const q = useGetMediaListQuery(undefined, { skip: !open });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Media | null>(null);

  const images = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (q.data?.items ?? [])
      .filter((m) => mediaKind(m) === "image")
      .filter((m) => !term || m.filename.toLowerCase().includes(term) || (m.alt ?? "").toLowerCase().includes(term))
      .sort((a, b) => Number(b.websiteId === websiteId) - Number(a.websiteId === websiteId));
  }, [q.data, search, websiteId]);

  const close = () => {
    setSelected(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="xl"
      title="Choose from media library"
      description="Images from this website are shown first."
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={!selected}
            onClick={() => {
              if (selected) onSelect(selected);
              close();
            }}
          >
            Use image
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search images…" className="sm:w-full" />
        {q.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : q.isError ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} compact />
        ) : images.length === 0 ? (
          <EmptyState compact icon={<ImageOff />} title="No images found" description="Upload images in the Media library first, or paste an image URL." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((m) => {
              const active = selected?.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelected(m)}
                  onDoubleClick={() => {
                    onSelect(m);
                    close();
                  }}
                  className={cn(
                    "focus-ring group relative overflow-hidden rounded-lg border-2 bg-surface-2 text-left transition-all",
                    active ? "border-brand shadow-focus" : "border-transparent hover:border-border-strong",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt={m.alt ?? ""} className="aspect-square w-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5 text-2xs font-medium text-white">
                    {m.filename}
                  </span>
                  {active && (
                    <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-brand text-white shadow">
                      <Check className="size-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
