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
  type StatState,
} from "@/components/ui";
import { WebsiteAvatar } from "@/components/websites/WebsiteAvatar";
import { WebsiteStatusBadge } from "@/components/websites/WebsiteStatusBadge";
import { WebsiteEditorsPanel } from "@/components/websites/WebsiteEditorsPanel";
import { TransferOwnershipCard } from "@/components/websites/TransferOwnershipCard";
import { useDeleteWebsite } from "@/components/websites/useDeleteWebsite";
import { WebsiteIntegrationPanel } from "@/components/integrations/WebsiteIntegrationPanel";
import { BlogListItem } from "@/components/blogs/BlogListItem";
import { useGetWebsiteQuery } from "@/store/api/websiteApi";
import { useGetBlogsQuery } from "@/store/api/blogApi";
import { useGetMediaListQuery } from "@/store/api/mediaApi";
import { useCurrentUser } from "@/features/auth/useAuth";
import { formatDateTime, hostOf, siteUrl } from "@/utils/format";

function stateOf(q: { isLoading: boolean; isError: boolean }): StatState {
  return q.isLoading ? "loading" : q.isError ? "error" : "ready";
}

export default function WebsiteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useCurrentUser();
  const q = useGetWebsiteQuery(id);
  const blogsQ = useGetBlogsQuery();
  const mediaQ = useGetMediaListQuery();
  const { requestDelete, dialog } = useDeleteWebsite(() => router.push("/dashboard/websites"));

  const siteBlogs = useMemo(
    () => (blogsQ.data ?? []).filter((b) => b.websiteId === id).sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")),
    [blogsQ.data, id],
  );
  const mediaCount = mediaQ.data?.filter((m) => m.websiteId === id).length;

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
                  <WebsiteStatusBadge active={website.isActive} />
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

            <div className="grid items-start gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                  <StatCard label="Blogs" icon={<FileText />} state={stateOf(blogsQ)} value={siteBlogs.length} />
                  <StatCard label="Published" icon={<FileCheck2 />} accent="success" state={stateOf(blogsQ)} value={siteBlogs.filter((b) => b.status === "published").length} />
                  <StatCard label="Drafts" icon={<FilePen />} accent="warning" state={stateOf(blogsQ)} value={siteBlogs.filter((b) => b.status === "draft").length} />
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

                <WebsiteIntegrationPanel websiteId={id} websiteName={website.name} websiteDomain={website.domain} />
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader icon={<Info />} title="Details" />
                  <div className="p-5">
                    <DetailList
                      items={[
                        { label: "Name", value: website.name },
                        { label: "Slug", value: <code className="font-mono text-xs">{website.slug}</code> },
                        { label: "Domain", value: hostOf(website.domain) || "—" },
                        { label: "Status", value: <WebsiteStatusBadge active={website.isActive} /> },
                        { label: "Owner", value: website.owner === user?.id ? "You" : <code className="font-mono text-xs">{website.owner}</code> },
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
                <WebsiteEditorsPanel website={website} />
                <TransferOwnershipCard website={website} />
              </div>
            </div>
            {dialog}
          </>
        );
      }}
    </QueryState>
  );
}
