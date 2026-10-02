"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, ImageUp, Link2, X } from "lucide-react";
import { toast } from "sonner";
import { Button, Field, FormActions, FormSection, Input, Select } from "@/components/ui";
import { useGetBlogsQuery } from "@/store/api/blogApi";
import { mediaSchema, mediaToForm, type MediaFormValues } from "@/features/media/schema";
import { ACCEPTED_MEDIA, validateUploadFile } from "@/features/media/utils";
import { formatBytes } from "@/utils/format";
import type { Media } from "@/types";
import { MediaPreview } from "./MediaPreview";
import { useSubmitLock } from "@/hooks/useSubmitLock";

export interface MediaFormSubmit extends MediaFormValues {
  replaceWith?: File;
}

/** PATCH /media/:id — alt text, file name, blog link, optional replacement image. Website can't be changed. */
export function MediaForm({
  media,
  onSubmit,
  submitting,
  cancelHref,
}: {
  media: Media;
  onSubmit: (v: MediaFormSubmit) => Promise<unknown>;
  submitting?: boolean;
  cancelHref: string;
}) {
  const router = useRouter();
  const blogs = useGetBlogsQuery();
  const fileRef = useRef<HTMLInputElement>(null);
  const { locked, lock } = useSubmitLock();
  const busy = submitting || locked;
  const [replacement, setReplacement] = useState<{ file: File; url: string } | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<MediaFormValues>({ resolver: zodResolver(mediaSchema), defaultValues: mediaToForm(media) });
  const altText = watch("altText");

  useEffect(() => () => {
    if (replacement) URL.revokeObjectURL(replacement.url);
  }, [replacement]);

  const blogOptions = (blogs.data ?? []).filter((b) => b.websiteId === media.websiteId).map((b) => ({ value: b.id, label: b.title }));

  const pickFile = (file?: File) => {
    if (!file) return;
    const problem = validateUploadFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setReplacement({ file, url: URL.createObjectURL(file) });
  };

  return (
    <form onSubmit={lock(handleSubmit((v) => onSubmit({ ...v, replaceWith: replacement?.file })))} noValidate>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <FormSection title="Details" description="Describe the image for accessibility and search." icon={<FileText />}>
            <Field label="File name" htmlFor="filename" required error={errors.filename?.message}>
              <Input id="filename" invalid={!!errors.filename} {...register("filename")} />
            </Field>
            <Field label="Alt text" htmlFor="altText" error={errors.altText?.message} aside={`${altText?.length ?? 0}/200`} hint="Describe what's in the image for screen readers.">
              <Input id="altText" placeholder="A student choosing a debate topic from a list" invalid={!!errors.altText} {...register("altText")} />
            </Field>
          </FormSection>
          <FormSection title="Associations" description="Media always belongs to the website it was uploaded for." icon={<Link2 />}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Website">
                <Input value={media.website?.name ?? media.websiteId} disabled readOnly />
              </Field>
              <Field label="Blog" htmlFor="blog" hint="Only blogs from the same website can be linked.">
                <Select id="blog" options={blogOptions} placeholder={blogs.isLoading ? "Loading…" : "No blog"} {...register("blog")} />
              </Field>
            </div>
          </FormSection>
        </div>
        <div className="card overflow-hidden lg:sticky lg:top-24">
          <div className="aspect-[4/3] bg-surface-2">
            <MediaPreview media={replacement ? { ...media, url: replacement.url } : media} className="object-contain" />
          </div>
          <div className="space-y-3 border-t border-border p-4">
            <div>
              <div className="truncate text-sm font-medium text-fg">{replacement?.file.name ?? media.filename}</div>
              <div className="text-xs text-muted">
                {replacement
                  ? `${formatBytes(replacement.file.size)} · will replace the current image`
                  : `${formatBytes(media.size)}${media.width && media.height ? ` · ${media.width} × ${media.height}` : ""}`}
              </div>
            </div>
            <input ref={fileRef} type="file" accept={ACCEPTED_MEDIA} className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
            {replacement ? (
              <Button variant="secondary" size="sm" className="w-full" leftIcon={<X />} onClick={() => setReplacement(null)}>
                Keep current image
              </Button>
            ) : (
              <Button variant="secondary" size="sm" className="w-full" leftIcon={<ImageUp />} onClick={() => fileRef.current?.click()}>
                Replace image
              </Button>
            )}
          </div>
        </div>
      </div>
      <FormActions note={isDirty || replacement ? "Unsaved changes" : undefined}>
        <Button variant="secondary" onClick={() => router.push(cancelHref)} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          {busy && replacement ? "Uploading…" : "Save changes"}
        </Button>
      </FormActions>
    </form>
  );
}
