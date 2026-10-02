"use client";

import Link from "next/link";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Globe, Mail, UserPlus, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  DetailList,
  DetailSkeleton,
  EmptyState,
  ErrorState,
  PageHeader,
  RoleBadge,
  Skeleton,
} from "@/components/ui";
import { WebsiteAvatar } from "@/components/websites/WebsiteAvatar";
import { WebsiteCheckboxList } from "@/components/editors/WebsiteCheckboxList";
import { BlogListItem } from "@/components/blogs/BlogListItem";
import { useGetEditorsQuery } from "@/store/api/editorApi";
import { useAssignEditorMutation } from "@/store/api/websiteApi";
import { useGetBlogsQuery } from "@/store/api/blogApi";
import { useEditorWebsites } from "@/features/editors/useEditorWebsites";
import { getErrorMessage } from "@/lib/api/errors";
import { formatDateTime } from "@/utils/format";

export default function EditorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const editorsQ = useGetEditorsQuery();
  const { websites, forEditor, isLoading: websitesLoading } = useEditorWebsites();
  const blogs = useGetBlogsQuery();
  const [assign] = useAssignEditorMutation();
  const [toAssign, setToAssign] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const { locked, lock } = useSubmitLock();

  const editor = editorsQ.data?.find((e) => e.id === id);
  const assigned = forEditor(id);
  const authored = useMemo(() => (blogs.data ?? []).filter((b) => b.author?.id === id).slice(0, 6), [blogs.data, id]);

  const onAssign = async () => {
    setAssigning(true);
    let ok = 0;
    for (const websiteId of toAssign) {
      try {
        await assign({ websiteId, editorId: id }).unwrap();
        ok++;
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    }
    setAssigning(false);
    setToAssign([]);
    if (ok) toast.success(ok === 1 ? "Editor assigned successfully" : `Editor assigned to ${ok} websites`);
  };

  if (editorsQ.isLoading) {
    return (
      <>
        <div className="mb-6 space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-56" />
        </div>
        <DetailSkeleton />
      </>
    );
  }
  if (editorsQ.isError) {
    return (
      <div className="card">
        <ErrorState error={editorsQ.error} onRetry={() => editorsQ.refetch()} />
      </div>
    );
  }
  if (!editor) {
    return (
      <div className="card">
        <ErrorState error={{ status: 404, message: "This editor doesn't exist." }} notFoundHref="/dashboard/editors" />
      </div>
    );
  }

  return (
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
      />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader icon={<Globe />} title="Website access" description="Websites you own that this editor can manage." />
            <div className="space-y-5 p-5">
              {websitesLoading ? (
                <Skeleton className="h-16 w-full rounded-xl" />
              ) : assigned.length === 0 ? (
                <EmptyState compact icon={<Globe />} title="No websites assigned" description="Assign a website below so this editor can manage its content." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {assigned.map((w) => (
                    <Link key={w.id} href={`/dashboard/websites/${w.id}`} className="flex items-center gap-3 rounded-xl border border-border p-3.5 transition-colors hover:border-border-strong hover:bg-surface-2/50">
                      <WebsiteAvatar website={w} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-fg">{w.name}</div>
                        <div className="truncate text-xs text-muted">{w.domain.replace(/^https?:\/\//, "")}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {websites.length > assigned.length && (
                <div className="space-y-3 border-t border-border pt-5">
                  <div className="text-sm font-medium text-fg">Assign to more websites</div>
                  <WebsiteCheckboxList
                    websites={websites.filter((w) => !assigned.some((a) => a.id === w.id))}
                    value={toAssign}
                    onChange={setToAssign}
                  />
                  <div className="flex justify-end">
                    <Button onClick={lock(onAssign)} loading={assigning || locked} disabled={!toAssign.length} leftIcon={<UserPlus />}>
                      Assign {toAssign.length ? `(${toAssign.length})` : ""}
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted">Removing an editor from a website isn&apos;t supported by the backend yet.</p>
            </div>
          </Card>
          <Card>
            <CardHeader icon={<FileText />} title="Posts by this editor" />
            <div className="p-3">
              {blogs.isLoading ? (
                <div className="space-y-2 p-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : blogs.isError ? (
                <ErrorState error={blogs.error} onRetry={() => blogs.refetch()} compact />
              ) : authored.length === 0 ? (
                <p className="px-2 py-4 text-sm text-muted">No posts authored yet.</p>
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
                { label: "Added", value: formatDateTime(editor.createdAt) },
                { label: "User ID", value: <code className="font-mono text-xs">{editor.id}</code> },
              ]}
            />
          </div>
        </Card>
      </div>
    </>
  );
}
