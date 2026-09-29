"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileText, Globe, Mail, Pencil, Trash2, UserRound } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  DetailList,
  DetailSkeleton,
  EmptyState,
  PageHeader,
  QueryState,
  RoleBadge,
  Skeleton,
} from "@/components/ui";
import { WebsiteAvatar } from "@/components/websites/WebsiteAvatar";
import { BlogListItem } from "@/components/blogs/BlogListItem";
import { useDeleteEditor } from "@/components/editors/useDeleteEditor";
import { useGetEditorQuery } from "@/store/api/editorApi";
import { useGetBlogsQuery } from "@/store/api/blogApi";
import { formatDateTime, formatRelative } from "@/utils/format";

export default function EditorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const q = useGetEditorQuery(id);
  const blogs = useGetBlogsQuery();
  const { requestDelete, dialog } = useDeleteEditor(() => router.push("/dashboard/editors"));

  const authored = useMemo(() => (blogs.data?.items ?? []).filter((b) => b.author?.id === id).slice(0, 6), [blogs.data, id]);

  return (
    <QueryState
      query={q}
      notFoundHref="/dashboard/editors"
      loading={
        <>
          <div className="mb-6 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-56" />
          </div>
          <DetailSkeleton />
        </>
      }
    >
      {(editor) => (
        <>
          <PageHeader
            backHref="/dashboard/editors"
            backLabel="Editors"
            title={
              <span className="flex items-center gap-3">
                <Avatar name={editor.name} size="lg" />
                <span className="truncate">{editor.name}</span>
              </span>
            }
            meta={
              <>
                <RoleBadge role={editor.role} />
                <Badge tone={editor.isActive ? "success" : "neutral"} dot>
                  {editor.isActive ? "Active" : "Inactive"}
                </Badge>
                <a href={`mailto:${editor.email}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
                  <Mail className="size-3.5" />
                  {editor.email}
                </a>
              </>
            }
            actions={
              <>
                <Button variant="danger-soft" leftIcon={<Trash2 />} onClick={() => requestDelete(editor)}>
                  Remove
                </Button>
                <ButtonLink href={`/dashboard/editors/${id}/edit`} leftIcon={<Pencil className="size-4" />}>
                  Edit
                </ButtonLink>
              </>
            }
          />
          <div className="grid items-start gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader icon={<Globe />} title="Website access" description="Content this editor can manage." />
                <div className="p-5">
                  {editor.websites.length === 0 ? (
                    <EmptyState
                      compact
                      icon={<Globe />}
                      title="No websites assigned"
                      description="This editor can sign in but can't manage any content yet."
                      action={
                        <ButtonLink href={`/dashboard/editors/${id}/edit`} size="sm" variant="secondary">
                          Assign websites
                        </ButtonLink>
                      }
                    />
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {editor.websites.map((w) => (
                        <Link key={w.id} href={`/dashboard/websites/${w.id}`} className="flex items-center gap-3 rounded-xl border border-border p-3.5 transition-colors hover:border-border-strong hover:bg-surface-2/50">
                          <WebsiteAvatar website={{ id: w.id, name: w.name ?? w.id }} />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-fg">{w.name ?? w.id}</div>
                            {w.domain && <div className="truncate text-xs text-muted">{w.domain}</div>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
              <Card>
                <CardHeader icon={<FileText />} title="Recent posts" description="Blogs authored by this editor." />
                <div className="p-3">
                  {blogs.isLoading ? (
                    <div className="space-y-2 p-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : authored.length === 0 ? (
                    <p className="px-2 py-4 text-sm text-muted">{blogs.isError ? "Blog data isn't available." : "No posts authored yet."}</p>
                  ) : (
                    authored.map((b) => <BlogListItem key={b.id} blog={b} showWebsite />)
                  )}
                </div>
              </Card>
            </div>
            <Card>
              <CardHeader icon={<UserRound />} title="Account" />
              <div className="p-5">
                <DetailList
                  items={[
                    { label: "Name", value: editor.name },
                    { label: "Email", value: editor.email },
                    { label: "Role", value: <RoleBadge role={editor.role} /> },
                    { label: "Status", value: editor.isActive ? "Active" : "Inactive" },
                    { label: "Last active", value: formatRelative(editor.lastLoginAt, "Never") },
                    { label: "Added", value: formatDateTime(editor.createdAt) },
                  ]}
                />
              </div>
            </Card>
          </div>
          {dialog}
        </>
      )}
    </QueryState>
  );
}
