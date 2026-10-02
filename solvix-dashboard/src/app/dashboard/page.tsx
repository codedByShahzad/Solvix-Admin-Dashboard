"use client";

import Link from "next/link";
import {
  ArrowRight,
  CloudUpload,
  FileCheck2,
  FilePen,
  FileText,
  Globe,
  Image as ImageIcon,
  PenSquare,
  Plus,
  Users,
  Activity,
} from "lucide-react";
import {
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Skeleton,
  StatCard,
} from "@/components/ui";
import { BlogListItem } from "@/components/blogs/BlogListItem";
import { MediaPreview } from "@/components/media/MediaPreview";
import { WebsiteAvatar } from "@/components/websites/WebsiteAvatar";
import { useAuth } from "@/features/auth/useAuth";
import { statState, useDashboardData } from "@/features/dashboard/useDashboardData";
import { formatNumber, formatRelative, hostOf } from "@/utils/format";
import { cn } from "@/lib/cn";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-1.5">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardHomePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const d = useDashboardData(user?.role);
  const blogState = statState(d.blogs);
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  const n = (v?: number) => (v === undefined ? undefined : formatNumber(v));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium text-muted">{today}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">
            {greeting()}, {user?.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {isAdmin ? "Here's what's happening across your websites." : "Here's the content you're working on."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <ButtonLink href="/dashboard/websites/create" variant="secondary" leftIcon={<Globe className="size-4" />}>
              Add website
            </ButtonLink>
          )}
          <ButtonLink href="/dashboard/media/upload" variant="secondary" leftIcon={<CloudUpload className="size-4" />}>
            Upload
          </ButtonLink>
          <ButtonLink href="/dashboard/blogs/create" leftIcon={<Plus className="size-4" />}>
            New blog
          </ButtonLink>
        </div>
      </div>

      {/* Stats */}
      {isAdmin ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-6">
          <StatCard label="Total Websites" icon={<Globe />} state={statState(d.websites)} value={n(d.websites.data?.length)} href="/dashboard/websites" />
          <StatCard label="Total Blogs" icon={<FileText />} accent="info" state={blogState} value={n(d.blogs.data?.length)} href="/dashboard/blogs" />
          <StatCard label="Published Blogs" icon={<FileCheck2 />} accent="success" state={blogState} value={n(d.published)} href="/dashboard/blogs" />
          <StatCard label="Draft Blogs" icon={<FilePen />} accent="warning" state={blogState} value={n(d.drafts)} href="/dashboard/blogs" />
          <StatCard label="Total Media" icon={<ImageIcon />} accent="info" state={statState(d.media)} value={n(d.media.data?.length)} href="/dashboard/media" />
          <StatCard label="Total Editors" icon={<Users />} accent="neutral" state={statState(d.editors)} value={n(d.editors.data?.length)} href="/dashboard/editors" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Your Websites" icon={<Globe />} state={statState(d.websites)} value={n(d.websites.data?.length)} />
          <StatCard label="Accessible Blogs" icon={<FileText />} state={blogState} value={n(d.blogs.data?.length)} href="/dashboard/blogs" />
          <StatCard label="Published Blogs" icon={<FileCheck2 />} accent="success" state={blogState} value={n(d.published)} href="/dashboard/blogs" />
          <StatCard label="Draft Blogs" icon={<FilePen />} accent="warning" state={blogState} value={n(d.drafts)} href="/dashboard/blogs" />
          <StatCard label="Media" icon={<ImageIcon />} accent="info" state={statState(d.media)} value={n(d.media.data?.length)} href="/dashboard/media" />
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-3">
        {/* Recent blogs */}
        <Card className="xl:col-span-2">
          <CardHeader
            icon={<FileText />}
            title="Recent blogs"
            description="Latest updated posts"
            action={
              <ButtonLink href="/dashboard/blogs" variant="ghost" size="sm">
                View all <ArrowRight className="size-3.5" />
              </ButtonLink>
            }
          />
          <div className="p-3">
            {d.blogs.isLoading ? (
              <ListSkeleton />
            ) : d.blogs.isError ? (
              <ErrorState error={d.blogs.error} onRetry={() => d.blogs.refetch()} compact />
            ) : d.recentBlogs.length === 0 ? (
              <EmptyState
                compact
                icon={<PenSquare />}
                title="No blogs yet"
                description="Your latest posts will show up here."
                action={
                  <ButtonLink href="/dashboard/blogs/create" size="sm" leftIcon={<Plus className="size-4" />}>
                    Write a blog
                  </ButtonLink>
                }
              />
            ) : (
              d.recentBlogs.map((b) => <BlogListItem key={b.id} blog={b} showWebsite />)
            )}
          </div>
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader icon={<FileCheck2 />} title="Content status" />
            <div className="p-5">
              {d.blogs.isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : d.blogs.isError ? (
                <ErrorState error={d.blogs.error} compact />
              ) : (d.published + d.drafts + d.archived === 0 ? (
                <p className="text-sm text-muted">No blogs to summarise yet.</p>
              ) : (
                <>
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="bg-success transition-all" style={{ width: `${(d.published / (d.published + d.drafts + d.archived)) * 100}%` }} />
                    <div className="bg-warning transition-all" style={{ width: `${(d.drafts / (d.published + d.drafts + d.archived)) * 100}%` }} />
                    <div className="bg-subtle transition-all" style={{ width: `${(d.archived / (d.published + d.drafts + d.archived)) * 100}%` }} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      { label: "Published", value: d.published, dot: "bg-success" },
                      { label: "Drafts", value: d.drafts, dot: "bg-warning" },
                      { label: "Archived", value: d.archived, dot: "bg-subtle" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg bg-surface-2/60 p-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted">
                          <span className={cn("size-2 rounded-full", s.dot)} />
                          {s.label}
                        </div>
                        <div className="mt-1 text-lg font-semibold tabular-nums text-fg">
                          {s.value}
                          <span className="ml-1 text-xs font-normal text-muted">
                            {Math.round((s.value / (d.published + d.drafts + d.archived)) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ))}
            </div>
          </Card>

          {isAdmin ? (
            <Card>
              <CardHeader
                icon={<Globe />}
                title="Website overview"
                action={
                  <ButtonLink href="/dashboard/websites" variant="ghost" size="sm">
                    Manage
                  </ButtonLink>
                }
              />
              <div className="p-3">
                {d.websites.isLoading ? (
                  <ListSkeleton rows={2} />
                ) : d.websites.isError ? (
                  <ErrorState error={d.websites.error} onRetry={() => d.websites.refetch()} compact />
                ) : !d.websites.data?.length ? (
                  <EmptyState compact icon={<Globe />} title="No websites yet" />
                ) : (
                  <ul>
                    {d.websites.data.map((w) => {
                      const c = d.perWebsite.get(w.id);
                      return (
                        <li key={w.id}>
                          <Link href={`/dashboard/websites/${w.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-2/70">
                            <WebsiteAvatar website={w} />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-fg">{w.name}</div>
                              <div className="truncate text-xs text-muted">{hostOf(w.domain)}</div>
                            </div>
                            {d.blogs.data && (
                              <div className="text-right text-xs">
                                <div className="font-semibold tabular-nums text-fg">{c?.total ?? 0} blogs</div>
                                <div className="text-muted">{c?.published ?? 0} live</div>
                              </div>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader icon={<Globe />} title="Your websites" description="Websites you're assigned to" />
              <div className="p-3">
                {d.websites.isLoading ? (
                  <ListSkeleton rows={2} />
                ) : d.websites.isError ? (
                  <ErrorState error={d.websites.error} onRetry={() => d.websites.refetch()} compact />
                ) : !d.websites.data?.length ? (
                  <p className="px-2 py-3 text-sm text-muted">You aren&apos;t assigned to any website yet. Ask an admin to give you access.</p>
                ) : (
                  <ul>
                    {d.websites.data.map((w) => (
                      <li key={w.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5">
                        <WebsiteAvatar website={w} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-fg">{w.name}</div>
                          <div className="truncate text-xs text-muted">{hostOf(w.domain)}</div>
                        </div>
                        <span className="text-xs tabular-nums text-muted">{d.perWebsite.get(w.id)?.total ?? 0} blogs</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        {/* Recent media */}
        <Card className="xl:col-span-2">
          <CardHeader
            icon={<ImageIcon />}
            title="Recent media"
            action={
              <ButtonLink href="/dashboard/media" variant="ghost" size="sm">
                Library <ArrowRight className="size-3.5" />
              </ButtonLink>
            }
          />
          <div className="p-5">
            {d.media.isLoading ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : d.media.isError ? (
              <ErrorState error={d.media.error} onRetry={() => d.media.refetch()} compact />
            ) : d.recentMedia.length === 0 ? (
              <EmptyState
                compact
                icon={<ImageIcon />}
                title="No media yet"
                action={
                  <ButtonLink href="/dashboard/media/upload" size="sm" variant="secondary" leftIcon={<CloudUpload className="size-4" />}>
                    Upload media
                  </ButtonLink>
                }
              />
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {d.recentMedia.map((m) => (
                  <Link
                    key={m.id}
                    href={`/dashboard/media/${m.id}`}
                    title={m.filename}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-2"
                  >
                    <MediaPreview media={m} className="transition-transform duration-300 group-hover:scale-105" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader icon={<Activity />} title="Recent activity" />
          <div className="p-5">
            {d.blogs.isLoading || d.media.isLoading ? (
              <ListSkeleton rows={4} />
            ) : d.activity.length === 0 ? (
              <p className="text-sm text-muted">
                {d.blogs.isError && d.media.isError ? "Activity appears once blog and media data are available." : "No recent activity."}
              </p>
            ) : (
              <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-border">
                {d.activity.map((a) => (
                  <li key={a.id} className="relative flex gap-3">
                    <span
                      className={cn(
                        "z-10 flex size-6 shrink-0 items-center justify-center rounded-full ring-4 ring-surface",
                        a.kind === "blog" ? "bg-brand-soft text-brand" : "bg-info-soft text-info",
                      )}
                    >
                      {a.kind === "blog" ? <FileText className="size-3" /> : <ImageIcon className="size-3" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link href={a.href} className="block truncate text-sm font-medium text-fg hover:text-brand">
                        {a.title}
                      </Link>
                      <div className="text-xs text-muted">
                        {a.meta} · {formatRelative(a.at)}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
