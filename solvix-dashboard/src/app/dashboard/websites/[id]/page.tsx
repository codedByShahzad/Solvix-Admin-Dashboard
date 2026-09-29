"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ExternalLink, FileCheck2, FilePen, FileText, Image as ImageIcon, Info, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Button,
  ButtonLink,
  Card,
  CardHeader,
  DetailList,
  DetailSkeleton,
  EmptyState,
  ErrorState,
  PageHeader,
  QueryState,
  Skeleton,
  StatCard,
  StatusBadge,
  type StatState,
} from "@/components/ui";
import { WebsiteAvatar } from "@/components/websites/WebsiteAvatar";
import { useDeleteWebsite } from "@/components/websites/useDeleteWebsite";
import { WebsiteIntegrationPanel } from "@/components/integrations/WebsiteIntegrationPanel";
import { BlogListItem } from "@/components/blogs/BlogListItem";
import { useGetWebsiteQuery } from "@/store/api/websiteApi";
import { useGetBlogsQuery } from "@/store/api/blogApi";
import { useGetMediaListQuery } from "@/store/api/mediaApi";
import { isUnconfirmed } from "@/lib/api/errors";
import { formatDateTime, hostOf, siteUrl } from "@/utils/format";

function stateOf(q: { isLoading: boolean; isError: boolean; error?: unknown }): StatState {
  if (q.isLoading) return "loading";
  if (q.isError) return isUnconfirmed(q.error) ? "pending" : "error";
  return "ready";
}

export default function WebsiteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const q = useGetWebsiteQuery(id);
  const blogsQ = useGetBlogsQuery();
  const mediaQ = useGetMediaListQuery();
  const { requestDelete, dialog } = useDeleteWebsite(() => router.push("/dashboard/websites"));

  const siteBlogs = useMemo(
    () =>
      (blogsQ.data?.items ?? [])
        .filter((b) => b.websiteId === id)
        .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")),
    [blogsQ.data, id],
  );
  const mediaCount = mediaQ.data?.items.filter((m) => m.websiteId === id).length;

  return (
    <QueryState
      query={q}
      notFoundHref="/dashboard/websites"
      loading={
        <>
          <div className="mb-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-64" />
          </div>
          <DetailSkeleton />
        </>
      }
    >
      {(website) => {
        const url = siteUrl(website.domain);
        return (
          <>
            <PageHeader
              backHref="/dashboard/websites"
              backLabel="Websites"
              title={
                <span className="flex items-center gap-3">
                  <WebsiteAvatar website={website} size="lg" />
                  <span className="truncate">{website.name}</span>
                </span>
              }
              meta={
                <>
                  <StatusBadge status={website.status} />
                  {url && (
                    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
                      {hostOf(website.domain)}
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </>
              }
              actions={
                <>
                  <Button variant="danger-soft" leftIcon={<Trash2 />} onClick={() => requestDelete(website)}>
                    Delete
                  </Button>
                  <ButtonLink href={`/dashboard/websites/${id}/edit`} variant="secondary" leftIcon={<Pencil className="size-4" />}>
                    Edit
                  </ButtonLink>
                </>
              }
            />

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                  <StatCard label="Blogs" icon={<FileText />} state={stateOf(blogsQ)} value={siteBlogs.length} />
                  <StatCard
                    label="Published"
                    icon={<FileCheck2 />}
                    accent="success"
                    state={stateOf(blogsQ)}
                    value={siteBlogs.filter((b) => b.status === "published").length}
                  />
                  <StatCard
                    label="Drafts"
                    icon={<FilePen />}
                    accent="warning"
                    state={stateOf(blogsQ)}
                    value={siteBlogs.filter((b) => b.status === "draft").length}
                  />
                  <StatCard label="Media" icon={<ImageIcon />} accent="info" state={stateOf(mediaQ)} value={mediaCount} />
                </div>

                <Card>
                  <CardHeader
                    icon={<FileText />}
                    title="Blogs"
                    description={`Latest content on ${website.name}`}
                    action={
                      <ButtonLink href={`/dashboard/blogs/create?website=${id}`} size="sm" variant="secondary" leftIcon={<Plus className="size-4" />}>
                        New blog
                      </ButtonLink>
                    }
                  />
                  <div className="p-3">
                    {blogsQ.isLoading ? (
                      <div className="space-y-2 p-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full rounded-lg" />
                        ))}
                      </div>
                    ) : blogsQ.isError ? (
                      <ErrorState error={blogsQ.error} onRetry={() => blogsQ.refetch()} compact />
                    ) : siteBlogs.length === 0 ? (
                      <EmptyState compact icon={<FileText />} title="No blogs yet" description="Blogs created for this website will appear here." />
                    ) : (
                      <>
                        {siteBlogs.slice(0, 6).map((b) => (
                          <BlogListItem key={b.id} blog={b} />
                        ))}
                        {siteBlogs.length > 6 && (
                          <div className="px-2 pb-1 pt-2">
                            <ButtonLink href={`/dashboard/blogs?website=${id}`} variant="ghost" size="sm">
                              View all {siteBlogs.length} blogs
                            </ButtonLink>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Card>

                <WebsiteIntegrationPanel websiteId={id} websiteName={website.name} />
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader icon={<Info />} title="Details" />
                  <div className="p-5">
                    <DetailList
                      items={[
                        { label: "Name", value: website.name },
                        { label: "Domain", value: hostOf(website.domain) || "—" },
                        { label: "Status", value: <StatusBadge status={website.status} /> },
                        { label: "Owner", value: website.owner?.name ?? "—" },
                        { label: "Created", value: formatDateTime(website.createdAt) },
                        { label: "Updated", value: formatDateTime(website.updatedAt) },
                        { label: "ID", value: <code className="font-mono text-xs">{website.id}</code> },
                      ]}
                    />
                    {website.description && (
                      <div className="mt-4 border-t border-border pt-4">
                        <div className="mb-1 text-xs font-medium text-muted">Description</div>
                        <p className="text-sm leading-relaxed text-fg">{website.description}</p>
                      </div>
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
