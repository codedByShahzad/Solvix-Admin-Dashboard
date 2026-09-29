"use client";

import { useState } from "react";
import { ImagePlus, Library, Link2, X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import { MediaPicker } from "./MediaPicker";

/** Image URL field with live preview, library picker and paste-URL. */
export function ImageField({
  value,
  onChange,
  websiteId,
  aspect = "aspect-[16/9]",
  id,
}: {
  value: string;
  onChange: (url: string) => void;
  websiteId?: string;
  aspect?: string;
  id?: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [broken, setBroken] = useState(false);

  return (
    <div className="space-y-2.5">
      <div className={cn("group relative overflow-hidden rounded-xl border border-dashed border-border-strong bg-surface-2/60", aspect)}>
        {value && !broken ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="size-full object-cover" onError={() => setBroken(true)} />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/80 group-hover:opacity-100 focus:opacity-100"
              aria-label="Remove image"
            >
              <X className="size-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex size-full flex-col items-center justify-center gap-2 text-subtle transition-colors hover:bg-surface-2 hover:text-muted"
          >
            <ImagePlus className="size-6" />
            <span className="text-xs font-medium">{broken ? "Image couldn't be loaded" : "Choose an image"}</span>
          </button>
        )}
      </div>

      {urlMode && (
        <Input
          id={id}
          autoFocus
          value={value}
          onChange={(e) => {
            setBroken(false);
            onChange(e.target.value.trim());
          }}
          placeholder="https://res.cloudinary.com/…"
          leftIcon={<Link2 />}
          className="text-[13px]"
        />
      )}

      <div className="flex gap-2">
        <Button size="sm" variant="secondary" className="flex-1" leftIcon={<Library />} onClick={() => setPickerOpen(true)}>
          Library
        </Button>
        <Button size="sm" variant={urlMode ? "soft" : "secondary"} className="flex-1" leftIcon={<Link2 />} onClick={() => setUrlMode((v) => !v)}>
          URL
        </Button>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        websiteId={websiteId}
        onSelect={(m) => {
          setBroken(false);
          onChange(m.url);
        }}
      />
    </div>
  );
}
