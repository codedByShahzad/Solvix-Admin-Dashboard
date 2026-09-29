"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { WebsiteForm } from "@/components/websites/WebsiteForm";
import { useCreateWebsiteMutation } from "@/store/api/websiteApi";
import { toWebsitePayload } from "@/features/websites/schema";
import { useMutationToast } from "@/hooks/useMutationToast";

export default function CreateWebsitePage() {
  const router = useRouter();
  const [create, { isLoading }] = useCreateWebsiteMutation();
  const run = useMutationToast();

  return (
    <>
      <PageHeader
        backHref="/dashboard/websites"
        backLabel="Websites"
        title="Add website"
        description="Register a new website so its content can be managed in Solvix."
      />
      <WebsiteForm
        endpoint="websites.create"
        cancelHref="/dashboard/websites"
        submitting={isLoading}
        onSubmit={async (values) => {
          const created = await run(create(toWebsitePayload(values)).unwrap(), "Website created successfully");
          if (created) router.push(created.id ? `/dashboard/websites/${created.id}` : "/dashboard/websites");
        }}
      />
    </>
  );
}
