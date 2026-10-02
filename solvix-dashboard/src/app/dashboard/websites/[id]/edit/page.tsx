"use client";

import { useParams, useRouter } from "next/navigation";
import { FormSkeleton, PageHeader, QueryState } from "@/components/ui";
import { WebsiteForm } from "@/components/websites/WebsiteForm";
import { useGetWebsiteQuery, useUpdateWebsiteMutation } from "@/store/api/websiteApi";
import { toUpdateWebsitePayload } from "@/features/websites/schema";
import { useMutationToast } from "@/hooks/useMutationToast";

export default function EditWebsitePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const q = useGetWebsiteQuery(id);
  const [update, { isLoading, isSuccess }] = useUpdateWebsiteMutation();
  const run = useMutationToast();

  return (
    <>
      <PageHeader
        backHref={`/dashboard/websites/${id}`}
        backLabel={q.data?.name ?? "Website"}
        title={q.data ? `Edit ${q.data.name}` : "Edit website"}
        description="Update this website's details and status."
      />
      <QueryState query={q} loading={<div className="mx-auto max-w-3xl"><FormSkeleton /></div>} notFoundHref="/dashboard/websites">
        {(website) => (
          <WebsiteForm
            website={website}
            cancelHref={`/dashboard/websites/${id}`}
            submitting={isLoading || isSuccess}
            onSubmit={async (values) => {
              const ok = await run(update({ id, body: toUpdateWebsitePayload(values) }).unwrap(), "Website updated successfully");
              if (ok) router.push(`/dashboard/websites/${id}`);
            }}
          />
        )}
      </QueryState>
    </>
  );
}
