"use client";

import { useParams, useRouter } from "next/navigation";
import { FormSkeleton, PageHeader, QueryState } from "@/components/ui";
import { EditorForm } from "@/components/editors/EditorForm";
import { useGetEditorQuery, useUpdateEditorMutation } from "@/store/api/editorApi";
import { toEditorPayload } from "@/features/editors/schema";
import { useMutationToast } from "@/hooks/useMutationToast";

export default function EditEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const q = useGetEditorQuery(id);
  const [update, { isLoading }] = useUpdateEditorMutation();
  const run = useMutationToast();
  return (
    <>
      <PageHeader backHref={`/dashboard/editors/${id}`} backLabel={q.data?.name ?? "Editor"} title="Edit editor" description="Update profile, password and website access." />
      <QueryState query={q} loading={<div className="mx-auto max-w-3xl"><FormSkeleton /></div>} notFoundHref="/dashboard/editors">
        {(editor) => (
          <EditorForm
            editor={editor}
            endpoint="editors.update"
            cancelHref={`/dashboard/editors/${id}`}
            submitting={isLoading}
            onSubmit={async (values) => {
              const ok = await run(update({ id, body: toEditorPayload(values, "edit") }).unwrap(), "Editor updated successfully");
              if (ok) router.push(`/dashboard/editors/${id}`);
            }}
          />
        )}
      </QueryState>
    </>
  );
}
