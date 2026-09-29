"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { EditorForm } from "@/components/editors/EditorForm";
import { useCreateEditorMutation } from "@/store/api/editorApi";
import { toEditorPayload } from "@/features/editors/schema";
import { useMutationToast } from "@/hooks/useMutationToast";

export default function CreateEditorPage() {
  const router = useRouter();
  const [create, { isLoading }] = useCreateEditorMutation();
  const run = useMutationToast();
  return (
    <>
      <PageHeader backHref="/dashboard/editors" backLabel="Editors" title="Add editor" description="Create an editor account and choose which websites they can manage." />
      <EditorForm
        endpoint="editors.create"
        cancelHref="/dashboard/editors"
        submitting={isLoading}
        onSubmit={async (values) => {
          const created = await run(create(toEditorPayload(values, "create")).unwrap(), "Editor created successfully");
          if (created) router.push(created.id ? `/dashboard/editors/${created.id}` : "/dashboard/editors");
        }}
      />
    </>
  );
}
