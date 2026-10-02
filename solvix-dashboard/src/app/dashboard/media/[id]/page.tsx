"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Download, Info, Pencil, Trash2 } from "lucide-react";
import {
  Button,
  ButtonLink,
  Card,
  CardHeader,
  CopyButton,
  DetailList,
  DetailSkeleton,
  PageHeader,
  QueryState,
  Skeleton,
} from "@/components/ui";
import { MediaPreview } from "@/components/media/MediaPreview";
import { useDeleteMedia } from "@/components/media/useDeleteMedia";
import { useGetMediaQuery } from "@/store/api/mediaApi";
import { useIsAdmin } from "@/features/auth/useAuth";
import { mediaFormat } from "@/features/media/utils";
import { formatBytes, formatDateTime } from "@/utils/format";

export default function MediaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const q = useGetMediaQuery(id);
  const isAdmin = useIsAdmin();
  const { requestDelete, dialog } = useDeleteMedia(() => router.push("/dashboard/media"));

  return (
    <QueryState
      query={q}
      notFoundHref="/dashboard/media"
      loading={
        <>
          <div className="mb-6 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-72" />
          </div>
          <DetailSkeleton />
        </>
      }
    >
      {(media) => (
        <>
          <PageHeader
            backHref="/dashboard/media"
            backLabel="Media Library"
            title={media.filename}
            description={`${mediaFormat(media)} · ${formatBytes(media.size)}`}
            actions={
              <>
                {isAdmin && (
                  <Button variant="danger-soft" leftIcon={<Trash2 />} onClick={() => requestDelete(media)}>
                    Delete
                  </Button>
                )}
                {media.url && (
                  <a
                    href={media.url}
                    target="_blank"
                    rel="noreferrer"
                    download={media.filename}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3.5 text-sm font-medium text-fg shadow-xs hover:bg-surface-2"
                  >
                    <Download className="size-4" />
                    Original
                  </a>
                )}
                <ButtonLink href={`/dashboard/media/${id}/edit`} leftIcon={<Pencil className="size-4" />}>
                  Edit
                </ButtonLink>
              </>
            }
          />
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <Card className="overflow-hidden">
              <div
                className="flex aspect-[4/3] items-center justify-center"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, rgb(var(--surface-2)) 25%, transparent 25%), linear-gradient(-45deg, rgb(var(--surface-2)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgb(var(--surface-2)) 75%), linear-gradient(-45deg, transparent 75%, rgb(var(--surface-2)) 75%)",
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0",
                }}
              >
                <MediaPreview media={media} className="object-contain" />
              </div>
              {media.altText && (
                <div className="border-t border-border p-4 text-sm">
                  <span className="text-muted">Alt text: </span>
                  <span className="text-fg">{media.altText}</span>
                </div>
              )}
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader title="File URL" description="Use this link in blogs or on your websites." />
                <div className="p-5">
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 py-1.5 pl-3 pr-1.5">
                    <code className="min-w-0 flex-1 truncate font-mono text-xs text-fg" title={media.url}>
                      {media.url}
                    </code>
                    <CopyButton value={media.url} toastMessage="URL copied to clipboard" />
                  </div>
                </div>
              </Card>
              <Card>
                <CardHeader icon={<Info />} title="File information" />
                <div className="p-5">
                  <DetailList
                    items={[
                      { label: "File name", value: media.filename },
                      { label: "Type", value: media.mimeType ?? mediaFormat(media) },
                      { label: "Size", value: formatBytes(media.size) },
                      { label: "Dimensions", value: media.width && media.height ? `${media.width} × ${media.height}` : "—" },
                      {
                        label: "Website",
                        value: media.website?.name ?? "—",
                      },
                      {
                        label: "Blog",
                        value: media.blog ? (
                          <Link href={`/dashboard/blogs/${media.blog.id}`} className="text-brand hover:underline">
                            {media.blog.title ?? "View blog"}
                          </Link>
                        ) : (
                          "—"
                        ),
                      },
                      { label: "Uploaded", value: formatDateTime(media.createdAt) },
                      { label: "Updated", value: formatDateTime(media.updatedAt) },
                      { label: "Cloudinary ID", value: media.publicId ? <code className="font-mono text-xs">{media.publicId}</code> : "—" },
                    ]}
                  />
                </div>
              </Card>
            </div>
          </div>
          {dialog}
        </>
      )}
    </QueryState>
  );
}
