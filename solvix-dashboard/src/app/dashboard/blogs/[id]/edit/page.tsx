"use client";

import { useParams, useRouter } from "next/navigation";
import { FormSkeleton, PageHeader, QueryState } from "@/components/ui";
import { BlogEditor } from "@/components/blogs/BlogEditor";
import { useGetBlogQuery, useUpdateBlogMutation } from "@/store/api/blogApi";
import { toBlogPayload } from "@/features/blogs/schema";
import { useMutationToast } from "@/hooks/useMutationToast";

export default function EditBlogPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const q = useGetBlogQuery(id);
  const [update, { isLoading, isSuccess }] = useUpdateBlogMutation();
  const run = useMutationToast();

  return (
    <>
      <PageHeader
        backHref={`/dashboard/blogs/${id}`}
        backLabel="Back to post"
        title="Edit blog"
        description={q.data?.title ?? "Update content, SEO and publishing settings."}
      />
      <QueryState
        query={q}
        notFoundHref="/dashboard/blogs"
        loading={
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <FormSkeleton />
            <FormSkeleton />
          </div>
        }
      >
        {(blog) => (
          <BlogEditor
            blog={blog}
            cancelHref={`/dashboard/blogs/${id}`}
            submitting={isLoading || isSuccess}
            onSubmit={async (values) => {
              const ok = await run(update({ id, body: toBlogPayload(values) }).unwrap(), "Blog updated successfully");
              if (ok) router.push(`/dashboard/blogs/${id}`);
            }}
          />
        )}
      </QueryState>
    </>
  );
}
