"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Link2 } from "lucide-react";
import { Button, EndpointNotice, Field, FormActions, FormSection, Input, Select, Textarea } from "@/components/ui";
import { WebsiteSelectField } from "@/components/websites/WebsiteSelectField";
import { useGetBlogsQuery } from "@/store/api/blogApi";
import { mediaSchema, mediaToForm, type MediaFormValues } from "@/features/media/schema";
import { formatBytes } from "@/utils/format";
import type { Media } from "@/types";
import { MediaPreview } from "./MediaPreview";

export function MediaForm({
  media,
  onSubmit,
  submitting,
  cancelHref,
}: {
  media: Media;
  onSubmit: (v: MediaFormValues) => Promise<unknown>;
  submitting?: boolean;
  cancelHref: string;
}) {
  const router = useRouter();
  const blogs = useGetBlogsQuery();
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<MediaFormValues>({ resolver: zodResolver(mediaSchema), defaultValues: mediaToForm(media) });
  const website = watch("website");
  const alt = watch("alt");

  const blogOptions = (blogs.data?.items ?? []).filter((b) => !website || b.websiteId === website).map((b) => ({ value: b.id, label: b.title }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <EndpointNotice endpoints={["media.update"]} />
      <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <FormSection title="Details" description="Describe the file for accessibility and search." icon={<FileText />}>
            <Field label="Alt text" htmlFor="alt" error={errors.alt?.message} aside={`${alt?.length ?? 0}/200`} hint="Describe what's in the image for screen readers.">
              <Input id="alt" placeholder="A student choosing a debate topic from a list" invalid={!!errors.alt} {...register("alt")} />
            </Field>
            <Field label="Caption" htmlFor="caption" error={errors.caption?.message}>
              <Textarea id="caption" rows={2} placeholder="Optional caption shown with the image" {...register("caption")} />
            </Field>
          </FormSection>
          <FormSection title="Associations" description="Where this file is used." icon={<Link2 />}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Controller
                control={control}
                name="website"
                render={({ field }) => (
                  <WebsiteSelectField
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v);
                      setValue("blog", "", { shouldDirty: true });
                    }}
                    allowEmpty
                    emptyLabel="No website"
                  />
                )}
              />
              <Field label="Blog" htmlFor="blog">
                <Select id="blog" options={blogOptions} placeholder="No blog" disabled={!blogOptions.length} {...register("blog")} />
              </Field>
            </div>
          </FormSection>
        </div>
        <div className="card overflow-hidden lg:sticky lg:top-24">
          <div className="aspect-[4/3] bg-surface-2">
            <MediaPreview media={media} className="object-contain" />
          </div>
          <div className="border-t border-border p-4">
            <div className="truncate text-sm font-medium text-fg">{media.filename}</div>
            <div className="text-xs text-muted">
              {formatBytes(media.size)}
              {media.width && media.height ? ` · ${media.width} × ${media.height}` : ""}
            </div>
          </div>
        </div>
      </div>
      <FormActions note={isDirty ? "Unsaved changes" : undefined}>
        <Button variant="secondary" onClick={() => router.push(cancelHref)} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Save changes
        </Button>
      </FormActions>
    </form>
  );
}
