"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { AlertCircle, CheckCircle2, CloudUpload, File as FileIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useUploadMediaMutation } from "@/store/api/mediaApi";
import { ACCEPTED_MEDIA, MAX_UPLOAD_BYTES } from "@/features/media/utils";
import { getErrorMessage, isUnconfirmed } from "@/lib/api/errors";
import { formatBytes } from "@/utils/format";
import { uid } from "@/utils/slug";

type ItemStatus = "queued" | "uploading" | "done" | "error";

interface QueueItem {
  id: string;
  file: File;
  preview?: string;
  status: ItemStatus;
  error?: string;
}

/** Drag-and-drop multi-file uploader. Files go to the backend media route, which stores them in Cloudinary. */
export function MediaUploader({
  websiteId,
  blogId,
  onComplete,
  disabled,
}: {
  websiteId?: string;
  blogId?: string;
  onComplete?: (uploaded: number) => void;
  disabled?: boolean;
}) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [upload] = useUploadMediaMutation();

  // Revoke object URLs on unmount
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => () => itemsRef.current.forEach((i) => i.preview && URL.revokeObjectURL(i.preview)), []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const next: QueueItem[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error(`${file.name} is larger than ${formatBytes(MAX_UPLOAD_BYTES)}`);
        continue;
      }
      next.push({
        id: uid("up"),
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        status: "queued",
      });
    }
    setItems((prev) => [...prev, ...next]);
  }, []);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!disabled && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const remove = (id: string) =>
    setItems((prev) => {
      const it = prev.find((i) => i.id === id);
      if (it?.preview) URL.revokeObjectURL(it.preview);
      return prev.filter((i) => i.id !== id);
    });

  const setStatus = (id: string, status: ItemStatus, error?: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status, error } : i)));

  const start = async () => {
    const pending = items.filter((i) => i.status === "queued" || i.status === "error");
    if (!pending.length) return;
    setRunning(true);
    let ok = 0;
    for (const item of pending) {
      setStatus(item.id, "uploading");
      try {
        await upload({ file: item.file, websiteId: websiteId || undefined, blogId: blogId || undefined }).unwrap();
        setStatus(item.id, "done");
        ok++;
      } catch (e) {
        setStatus(item.id, "error", getErrorMessage(e, "Upload failed"));
        if (isUnconfirmed(e)) {
          toast.warning("Backend route not connected yet", { description: `"media.upload" needs route confirmation in src/lib/api/endpoints.ts.` });
          // No point trying the rest
          setItems((prev) => prev.map((i) => (i.status === "queued" ? { ...i, status: "error", error: "Upload route pending" } : i)));
          break;
        }
      }
    }
    setRunning(false);
    if (ok > 0) {
      toast.success(ok === 1 ? "Media uploaded successfully" : `${ok} files uploaded successfully`);
      onComplete?.(ok);
    }
  };

  const queued = items.filter((i) => i.status === "queued" || i.status === "error").length;
  const done = items.filter((i) => i.status === "done").length;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        className={cn(
          "focus-ring flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          dragging ? "border-brand bg-brand-soft/60" : "border-border-strong bg-surface-2/40 hover:border-brand/50 hover:bg-brand-soft/30",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <span className={cn("flex size-14 items-center justify-center rounded-2xl transition-colors", dragging ? "bg-brand text-white" : "bg-surface text-brand shadow-card")}>
          <CloudUpload className="size-6" />
        </span>
        <p className="mt-4 text-sm font-medium text-fg">
          <span className="text-brand">Click to upload</span> or drag and drop
        </p>
        <p className="mt-1 text-xs text-muted">Images, video or PDF · up to {formatBytes(MAX_UPLOAD_BYTES)} each</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_MEDIA}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5 text-xs text-muted">
            <span>
              {items.length} file{items.length === 1 ? "" : "s"} · {done} uploaded
            </span>
            {!running && (
              <button type="button" onClick={() => items.forEach((i) => remove(i.id))} className="font-medium hover:text-fg">
                Clear all
              </button>
            )}
          </div>
          <ul className="divide-y divide-border">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-2">
                  {it.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.preview} alt="" className="size-full object-cover" />
                  ) : (
                    <FileIcon className="size-5 text-subtle" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-fg">{it.file.name}</div>
                  <div className={cn("truncate text-xs", it.status === "error" ? "text-danger" : "text-muted")}>
                    {it.status === "error" ? it.error : formatBytes(it.file.size)}
                  </div>
                  {it.status === "uploading" && (
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full w-2/3 animate-pulse rounded-full bg-brand" />
                    </div>
                  )}
                </div>
                {it.status === "uploading" && <Loader2 className="size-4 shrink-0 animate-spin text-brand" />}
                {it.status === "done" && <CheckCircle2 className="size-4 shrink-0 text-success" />}
                {it.status === "error" && <AlertCircle className="size-4 shrink-0 text-danger" />}
                {(it.status === "queued" || it.status === "error") && !running && (
                  <Button variant="ghost" size="icon-sm" onClick={() => remove(it.id)} aria-label={`Remove ${it.file.name}`}>
                    <X />
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <div className="flex justify-end gap-2 border-t border-border bg-surface-2/50 px-4 py-3">
            <Button onClick={start} loading={running} disabled={!queued || disabled} leftIcon={<CloudUpload />}>
              {running ? "Uploading…" : queued ? `Upload ${queued} file${queued === 1 ? "" : "s"}` : "All uploaded"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
