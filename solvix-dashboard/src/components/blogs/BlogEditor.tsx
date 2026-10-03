"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CalendarClock, FileText, Image as ImageIcon, Link2, Plus, Search, Send, Sparkles, Type } from "lucide-react";
import {
  Button,
  Field,
  FormActions,
  FormSection,
  Input,
  Select,
  StatusBadge,
  TagInput,
  Textarea,
} from "@/components/ui";
import { WebsiteSelectField } from "@/components/websites/WebsiteSelectField";
import { ImageField } from "@/components/media/ImageField";
import { useWebsiteOptions } from "@/features/websites/useWebsiteOptions";
import { useGetBlogsQuery } from "@/store/api/blogApi";
import {
  BLOG_STATUSES,
  SEO_DESC_MAX,
  SEO_TITLE_MAX,
  blogSchema,
  blogToForm,
  sectionsToPlainText,
  type BlogFormValues,
} from "@/features/blogs/schema";
import { estimateReadingTime, slugify } from "@/utils/slug";
import { formatDateTime, todayInput } from "@/utils/format";
import { cn } from "@/lib/cn";
import type { Blog } from "@/types";
import { SectionsEditor } from "./SectionsEditor";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { SeoPreview } from "./SeoPreview";

const SECTIONS = [
  { id: "basic", label: "Basic information" },
  { id: "content", label: "Content" },
  { id: "seo", label: "SEO" },
  { id: "related", label: "Related content" },
  { id: "publishing", label: "Publishing" },
  { id: "media", label: "Media" },
];

function Counter({ value, max }: { value: number; max: number }) {
  return <span className={cn(value > max && "font-medium text-warning")}>{`${value}/${max}`}</span>;
}

export function BlogEditor({
  blog,
  defaults,
  onSubmit,
  submitting,
  cancelHref,
}: {
  blog?: Blog;
  defaults?: Partial<BlogFormValues>;
  onSubmit: (values: BlogFormValues) => Promise<unknown>;
  submitting?: boolean;
  cancelHref: string;
}) {
  const router = useRouter();
  const { websites } = useWebsiteOptions();
  const blogsQ = useGetBlogsQuery();
  const [slugTouched, setSlugTouched] = useState(!!blog);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<BlogFormValues>({ resolver: zodResolver(blogSchema), defaultValues: blogToForm(blog, defaults) });

  const title = watch("title");
  const slug = watch("slug");
  const websiteId = watch("website");
  const status = watch("status");
  const sections = watch("sections");
  const seoTitle = watch("seoTitle");
  const seoDescription = watch("seoDescription");
  const canonicalPath = watch("canonicalPath");
  const heroImage = watch("heroImage");
  const relatedSlugs = watch("relatedSlugs");

  useEffect(() => {
    if (!slugTouched) setValue("slug", slugify(title ?? ""), { shouldDirty: true });
  }, [title, slugTouched, setValue]);

  const website = websites.find((w) => w.id === websiteId);
  const plainText = useMemo(() => sectionsToPlainText(sections ?? []), [sections]);
  const words = plainText.split(/\s+/).filter(Boolean).length;
  const minutes = estimateReadingTime(plainText);

  const relatedSuggestions = useMemo(
    () =>
      (blogsQ.data ?? [])
        .filter((b) => b.id !== blog?.id && (!websiteId || b.websiteId === websiteId) && !relatedSlugs.includes(b.slug))
        .slice(0, 8),
    [blogsQ.data, blog?.id, websiteId, relatedSlugs],
  );

  const { locked, lock } = useSubmitLock();
  const busy = submitting || locked;
  const submitWith = (nextStatus?: BlogFormValues["status"]) =>
    lock(handleSubmit(
      async (values) => {
        const final = { ...values };
        if (nextStatus) final.status = nextStatus;
        if (final.status === "published" && !final.publishDate) final.publishDate = todayInput();
        await onSubmit(final);
      },
      () => toast.error("Please fix the highlighted fields before saving."),
    ));

  const isPublished = blog?.status === "published";

  return (
    <form onSubmit={submitWith()} noValidate>
      <div className="mb-6 space-y-4">
        <nav className="scrollbar-thin -mx-1 flex gap-1 overflow-x-auto px-1" aria-label="Editor sections">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="shrink-0 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-border-strong hover:text-fg"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          <FormSection id="basic" title="Basic information" description="Headline, URL slug and category." icon={<Type />}>
            <Field label="Title" htmlFor="title" required error={errors.title?.message} aside={`${title?.length ?? 0}/200`}>
              <Input id="title" placeholder="How to pick a debate topic in under a minute" invalid={!!errors.title} className="h-10 text-base font-medium" {...register("title")} />
            </Field>
            <Field label="Subtitle" htmlFor="subtitle" error={errors.subtitle?.message} hint="A one-line summary shown under the title.">
              <Textarea id="subtitle" rows={2} placeholder="A practical guide for students, writers and teams." invalid={!!errors.subtitle} {...register("subtitle")} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Slug"
                htmlFor="slug"
                required
                error={errors.slug?.message}
                hint={slugTouched ? "Custom slug" : "Generated from the title"}
              >
                <Input
                  id="slug"
                  placeholder="how-to-pick-a-debate-topic"
                  invalid={!!errors.slug}
                  className="font-mono text-[13px]"
                  {...register("slug", { onChange: () => setSlugTouched(true) })}
                  rightSlot={
                    slugTouched ? (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          setSlugTouched(false);
                          setValue("slug", slugify(getValues("title")), { shouldDirty: true, shouldValidate: true });
                        }}
                        title="Regenerate from title"
                      >
                        <Sparkles className="size-3.5" />
                      </Button>
                    ) : undefined
                  }
                />
              </Field>
              <Field label="Category" htmlFor="category" error={errors.category?.message}>
                <Input id="category" placeholder="e.g. Guides" list="blog-categories" {...register("category")} />
                <datalist id="blog-categories">
                  {[...new Set((blogsQ.data ?? []).map((b) => b.category).filter(Boolean))].map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
            </div>
          </FormSection>

          <FormSection
            id="content"
            title="Content"
            description="The article body: sections with paragraphs and lists."
            icon={<FileText />}
            action={
              <span className="whitespace-nowrap rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium tabular-nums text-muted">
                {words} words · ~{minutes} min
              </span>
            }
          >
            <Controller
              control={control}
              name="sections"
              render={({ field }) => <SectionsEditor value={field.value} onChange={field.onChange} errors={errors.sections as never} />}
            />
          </FormSection>

          <FormSection id="seo" title="SEO" description="Control how this post appears in search and social." icon={<Search />}>
            <Field
              label="SEO title"
              htmlFor="seoTitle"
              error={errors.seoTitle?.message}
              aside={<Counter value={seoTitle?.length ?? 0} max={SEO_TITLE_MAX} />}
              hint={`Aim for under ${SEO_TITLE_MAX} characters. Leave blank to use the title.`}
            >
              <Input id="seoTitle" placeholder={title ? `${title}${website?.name ? ` | ${website.name}` : ""}` : "SEO title"} {...register("seoTitle")} />
            </Field>
            <Field
              label="SEO description"
              htmlFor="seoDescription"
              error={errors.seoDescription?.message}
              aside={<Counter value={seoDescription?.length ?? 0} max={SEO_DESC_MAX} />}
            >
              <Textarea id="seoDescription" rows={3} placeholder="A compelling summary for search results…" {...register("seoDescription")} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Keywords" htmlFor="keywords" hint="Press Enter or comma to add.">
                <Controller
                  control={control}
                  name="keywords"
                  render={({ field }) => <TagInput id="keywords" value={field.value} onChange={field.onChange} placeholder="debate, topics" />}
                />
              </Field>
              <Field label="Canonical path" htmlFor="canonicalPath" error={errors.canonicalPath?.message} hint="Path on the website, starting with /">
                <Input
                  id="canonicalPath"
                  placeholder={slug ? `/blog/${slug}` : "/blog/my-post"}
                  className="font-mono text-[13px]"
                  invalid={!!errors.canonicalPath}
                  {...register("canonicalPath")}
                />
              </Field>
            </div>
            <SeoPreview
              title={seoTitle || title}
              description={seoDescription}
              domain={website?.domain}
              path={canonicalPath || (slug ? `/blog/${slug}` : "")}
            />
          </FormSection>

          <FormSection id="related" title="Related content" description="Link other posts by slug." icon={<Link2 />}>
            <Controller
              control={control}
              name="relatedSlugs"
              render={({ field }) => (
                <>
                  <Field label="Related slugs" htmlFor="relatedSlugs">
                    <TagInput id="relatedSlugs" value={field.value} onChange={field.onChange} transform={slugify} placeholder="another-post-slug" />
                  </Field>
                  {relatedSuggestions.length > 0 && (
                    <div>
                      <div className="mb-2 text-xs font-medium text-muted">Suggestions{website?.name ? ` from ${website.name}` : ""}</div>
                      <div className="flex flex-wrap gap-2">
                        {relatedSuggestions.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => field.onChange([...field.value, b.slug])}
                            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand-soft-fg"
                          >
                            <Plus className="size-3 shrink-0" />
                            <span className="truncate">{b.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            />
          </FormSection>
        </div>

        {/* Side column */}
        <div className="space-y-6 xl:sticky xl:top-24">
          <FormSection id="publishing" title="Publishing" icon={<CalendarClock />} action={<StatusBadge status={status} />}>
            <Controller
              control={control}
              name="website"
              render={({ field }) => (
                <WebsiteSelectField value={field.value} onChange={field.onChange} error={errors.website?.message} required />
              )}
            />
            <Field label="Status" htmlFor="status">
              <Select id="status" options={BLOG_STATUSES} {...register("status")} />
            </Field>
            <Field label="Publish date" htmlFor="publishDate" hint="Defaults to today when you publish.">
              <Input id="publishDate" type="date" {...register("publishDate")} />
            </Field>
            <Field label="Reading time" htmlFor="readingTime" error={errors.readingTime?.message}>
              <Input
                id="readingTime"
                placeholder={`${minutes} min read`}
                invalid={!!errors.readingTime}
                {...register("readingTime")}
                rightSlot={
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() =>
                      setValue("readingTime", `${estimateReadingTime(sectionsToPlainText(getValues("sections")))} min read`, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    Auto
                  </Button>
                }
              />
            </Field>
            {blog && (
              <div className="space-y-1 border-t border-border pt-4 text-xs text-muted">
                <div className="flex justify-between">
                  <span>Created</span>
                  <span className="text-fg">{formatDateTime(blog.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last updated</span>
                  <span className="text-fg">{formatDateTime(blog.updatedAt)}</span>
                </div>
                {blog.author?.name && (
                  <div className="flex justify-between">
                    <span>Author</span>
                    <span className="text-fg">{blog.author.name}</span>
                  </div>
                )}
              </div>
            )}
          </FormSection>

          <FormSection id="media" title="Media" icon={<ImageIcon />}>
            <Field label="Hero image">
              <Controller
                control={control}
                name="heroImage"
                render={({ field }) => <ImageField value={field.value} onChange={field.onChange} websiteId={websiteId} />}
              />
            </Field>
            <Field
              label="Social (OG) image"
              aside={
                heroImage ? (
                  <button type="button" className="font-medium text-brand hover:underline" onClick={() => setValue("ogImage", heroImage, { shouldDirty: true })}>
                    Use hero image
                  </button>
                ) : undefined
              }
              hint="Recommended 1200 × 630."
            >
              <Controller
                control={control}
                name="ogImage"
                render={({ field }) => <ImageField value={field.value} onChange={field.onChange} websiteId={websiteId} aspect="aspect-[1200/630]" />}
              />
            </Field>
          </FormSection>
        </div>
      </div>

      <FormActions note={isDirty ? "Unsaved changes" : blog ? `Last saved ${formatDateTime(blog.updatedAt)}` : undefined}>
        <Button variant="secondary" onClick={() => router.push(cancelHref)} disabled={busy}>
          Cancel
        </Button>
        {!isPublished && (
          <Button variant="secondary" onClick={submitWith("draft")} disabled={busy}>
            Save draft
          </Button>
        )}
        <Button onClick={submitWith("published")} loading={busy} leftIcon={<Send />}>
          {isPublished ? "Update" : "Publish"}
        </Button>
      </FormActions>
    </form>
  );
}
