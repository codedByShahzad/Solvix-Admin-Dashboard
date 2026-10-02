"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { WebsiteForm } from "@/components/websites/WebsiteForm";
import { useCreateWebsiteMutation } from "@/store/api/websiteApi";
import { toCreateWebsitePayload } from "@/features/websites/schema";
import { useMutationToast } from "@/hooks/useMutationToast";

export default function CreateWebsitePage() {
  const router = useRouter();
  const [create, { isLoading, isSuccess }] = useCreateWebsiteMutation();
  const run = useMutationToast();

  return (
    <>
      <PageHeader backHref="/dashboard/websites" backLabel="Websites" title="Add website" description="Register a website so its content can be managed in Solvix." />
      <WebsiteForm
        cancelHref="/dashboard/websites"
        submitting={isLoading || isSuccess}
        onSubmit={async (values) => {
          const created = await run(create(toCreateWebsitePayload(values)).unwrap(), "Website created successfully");
          if (created) router.push(`/dashboard/websites/${created.id}`);
        }}
      />
    </>
  );
}
