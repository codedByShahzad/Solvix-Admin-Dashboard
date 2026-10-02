"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingState, PageHeader } from "@/components/ui";
import { BlogEditor } from "@/components/blogs/BlogEditor";
import { useCreateBlogMutation } from "@/store/api/blogApi";
import { toBlogPayload } from "@/features/blogs/schema";
import { useWebsiteOptions } from "@/features/websites/useWebsiteOptions";
import { useMutationToast } from "@/hooks/useMutationToast";

function CreateBlog() {
  const router = useRouter();
  const params = useSearchParams();
  const { websites, isLoading: websitesLoading } = useWebsiteOptions();
  const [create, { isLoading, isSuccess }] = useCreateBlogMutation();
  const run = useMutationToast();

  if (websitesLoading) return <LoadingState label="Preparing editor…" />;

  const defaultWebsite = params.get("website") ?? (websites.length === 1 ? websites[0].id : "");

  return (
    <BlogEditor
      cancelHref="/dashboard/blogs"
      defaults={{ website: defaultWebsite }}
      submitting={isLoading || isSuccess}
      onSubmit={async (values) => {
        const created = await run(
          create(toBlogPayload(values)).unwrap(),
          values.status === "published" ? "Blog published successfully" : "Blog saved as draft",
        );
        if (created) router.push(`/dashboard/blogs/${created.id}`);
      }}
    />
  );
}

export default function CreateBlogPage() {
  return (
    <>
      <PageHeader backHref="/dashboard/blogs" backLabel="Blogs" title="New blog" description="Draft a post, preview its SEO and publish when ready." />
      <Suspense fallback={<LoadingState />}>
        <CreateBlog />
      </Suspense>
    </>
  );
}
