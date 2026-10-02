"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CalendarClock, Clock, ExternalLink, Hash, Link2, Pencil, Search, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  DetailList,
  DetailSkeleton,
  PageHeader,
  QueryState,
  Skeleton,
  StatusBadge,
} from "@/components/ui";
import { BlogContent } from "@/components/blogs/BlogContent";
import { SeoPreview } from "@/components/blogs/SeoPreview";
import { useDeleteBlog } from "@/components/blogs/useDeleteBlog";
import { useGetBlogQuery, useGetBlogsQuery } from "@/store/api/blogApi";
import { formatCalendarDate, formatDateTime, siteUrl } from "@/utils/format";

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const q = useGetBlogQuery(id);
  const all = useGetBlogsQuery();
  const { requestDelete, dialog } = useDeleteBlog(() => router.push("/dashboard/blogs"));

  return (
    <QueryState
      query={q}
      notFoundHref="/dashboard/blogs"
      loading={
        <>
          <div className="mb-6 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-96 max-w-full" />
          </div>
          <DetailSkeleton />
        </>
      }
    >
      {(blog) => {
        const path = blog.canonicalPath || `/blog/${blog.slug}`;
        const liveUrl = blog.status === "published" ? siteUrl(blog.website?.domain, path) : undefined;
        const related = blog.relatedSlugs.map((slug) => ({ slug, blog: all.data?.find((b) => b.slug === slug && b.websiteId === blog.websiteId) }));

        return (
          <>
            <PageHeader
              backHref="/dashboard/blogs"
              backLabel="Blogs"
              title={blog.title}
              meta={
                <>
                  <StatusBadge status={blog.status} />
                  {blog.website?.name && <Badge tone="brand">{blog.website.name}</Badge>}
                  {blog.category && <Badge>{blog.category}</Badge>}
                </>
              }
              actions={
                <>
                  <Button variant="danger-soft" leftIcon={<Trash2 />} onClick={() => requestDelete(blog)}>
                    Delete
                  </Button>
                  {liveUrl && (
                    <a href={liveUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3.5 text-sm font-medium text-fg shadow-xs hover:bg-surface-2">
                      <ExternalLink className="size-4" />
                      View live
                    </a>
                  )}
                  <ButtonLink href={`/dashboard/blogs/${id}/edit`} leftIcon={<Pencil className="size-4" />}>
                    Edit
                  </ButtonLink>
                </>
              }
            />

            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <Card className="overflow-hidden">
                {blog.heroImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={blog.heroImage} alt="" className="aspect-[21/9] w-full border-b border-border object-cover" />
                )}
                <article className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
                  <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    {blog.author?.name && <span className="font-medium text-fg">{blog.author.name}</span>}
                    <span className="flex items-center gap-1">
                      <CalendarClock className="size-3.5" />
                      {formatCalendarDate(blog.publishDate, "Not published")}
                    </span>
                    {blog.readingTime ? (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {blog.readingTime}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-fg">{blog.title}</h2>
                  {blog.subtitle && <p className="mt-3 text-lg leading-relaxed text-muted">{blog.subtitle}</p>}
                  <div className="my-7 h-px bg-border" />
                  <BlogContent sections={blog.sections} />
                </article>
              </Card>

              <div className="space-y-6 xl:sticky xl:top-24">
                <Card>
                  <CardHeader icon={<CalendarClock />} title="Publishing" />
                  <div className="p-5">
                    <DetailList
                      items={[
                        { label: "Status", value: <StatusBadge status={blog.status} /> },
                        { label: "Website", value: blog.website?.name ?? blog.websiteId ?? "—" },
                        { label: "Publish date", value: formatCalendarDate(blog.publishDate) },
                        { label: "Author", value: blog.author?.name ?? "—" },
                        { label: "Created", value: formatDateTime(blog.createdAt) },
                        { label: "Updated", value: formatDateTime(blog.updatedAt) },
                      ]}
                    />
                  </div>
                </Card>

                <Card>
                  <CardHeader icon={<Search />} title="SEO" />
                  <div className="space-y-4 p-5">
                    <SeoPreview title={blog.seoTitle || blog.title} description={blog.seoDescription ?? ""} domain={blog.website?.domain} path={path} />
                    <DetailList
                      items={[
                        { label: "Slug", value: <code className="font-mono text-xs">{blog.slug}</code> },
                        { label: "Canonical", value: <code className="font-mono text-xs">{blog.canonicalPath || "—"}</code> },
                      ]}
                    />
                    {blog.keywords.length > 0 && (
                      <div>
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
                          <Hash className="size-3.5" /> Keywords
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {blog.keywords.map((k) => (
                            <Badge key={k}>{k}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {blog.ogImage && (
                      <div>
                        <div className="mb-2 text-xs font-medium text-muted">Social image</div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={blog.ogImage} alt="" className="aspect-[1200/630] w-full rounded-lg border border-border object-cover" />
                      </div>
                    )}
                  </div>
                </Card>

                <Card>
                  <CardHeader icon={<Link2 />} title="Related content" />
                  <div className="p-3">
                    {related.length === 0 ? (
                      <p className="px-2 py-3 text-sm text-muted">No related posts linked.</p>
                    ) : (
                      <ul>
                        {related.map((r) => (
                          <li key={r.slug}>
                            {r.blog ? (
                              <Link href={`/dashboard/blogs/${r.blog.id}`} className="block rounded-lg px-2 py-2 text-sm text-fg hover:bg-surface-2 hover:text-brand">
                                {r.blog.title}
                              </Link>
                            ) : (
                              <span className="block px-2 py-2 font-mono text-xs text-muted">/{r.slug}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Card>
              </div>
            </div>
            {dialog}
          </>
        );
      }}
    </QueryState>
  );
}
