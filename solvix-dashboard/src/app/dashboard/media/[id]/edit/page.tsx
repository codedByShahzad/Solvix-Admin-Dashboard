"use client";

import { useParams, useRouter } from "next/navigation";
import { FormSkeleton, PageHeader, QueryState } from "@/components/ui";
import { MediaForm } from "@/components/media/MediaForm";
import { useGetMediaQuery, useUpdateMediaMutation } from "@/store/api/mediaApi";
import { useMutationToast } from "@/hooks/useMutationToast";

export default function EditMediaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const q = useGetMediaQuery(id);
  const [update, { isLoading, isSuccess }] = useUpdateMediaMutation();
  const run = useMutationToast();

  return (
    <>
      <PageHeader backHref={`/dashboard/media/${id}`} backLabel="Back to file" title="Edit media" description={q.data?.filename} />
      <QueryState query={q} loading={<FormSkeleton />} notFoundHref="/dashboard/media">
        {(media) => (
          <MediaForm
            media={media}
            cancelHref={`/dashboard/media/${id}`}
            submitting={isLoading || isSuccess}
            onSubmit={async (v) => {
              const ok = await run(
                update({
                  id,
                  altText: v.altText,
                  // When replacing the image without renaming, let the backend use the new file's name.
                  filename: v.replaceWith && v.filename === media.filename ? undefined : v.filename,
                  blog: v.blog,
                  replaceWith: v.replaceWith,
                }).unwrap(),
                "Media updated successfully",
              );
              if (ok) router.push(`/dashboard/media/${id}`);
            }}
          />
        )}
      </QueryState>
    </>
  );
}
