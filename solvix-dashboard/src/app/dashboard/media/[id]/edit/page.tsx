"use client";

import { useParams, useRouter } from "next/navigation";
import { FormSkeleton, PageHeader, QueryState } from "@/components/ui";
import { MediaForm } from "@/components/media/MediaForm";
import { useGetMediaQuery, useUpdateMediaMutation } from "@/store/api/mediaApi";
import { toMediaPayload } from "@/features/media/schema";
import { useMutationToast } from "@/hooks/useMutationToast";

export default function EditMediaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const q = useGetMediaQuery(id);
  const [update, { isLoading }] = useUpdateMediaMutation();
  const run = useMutationToast();

  return (
    <>
      <PageHeader backHref={`/dashboard/media/${id}`} backLabel="Back to file" title="Edit media" description={q.data?.filename} />
      <QueryState query={q} loading={<FormSkeleton />} notFoundHref="/dashboard/media">
        {(media) => (
          <MediaForm
            media={media}
            cancelHref={`/dashboard/media/${id}`}
            submitting={isLoading}
            onSubmit={async (values) => {
              const ok = await run(update({ id, body: toMediaPayload(values) }).unwrap(), "Media updated successfully");
              if (ok) router.push(`/dashboard/media/${id}`);
            }}
          />
        )}
      </QueryState>
    </>
  );
}
