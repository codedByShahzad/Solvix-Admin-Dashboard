"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui";
import { EditorForm } from "@/components/editors/EditorForm";
import { useRegisterMutation } from "@/store/api/authApi";
import { useAssignEditorMutation } from "@/store/api/websiteApi";
import { getErrorMessage } from "@/lib/api/errors";

export default function CreateEditorPage() {
  const router = useRouter();
  const [registerUser] = useRegisterMutation();
  const [assign] = useAssignEditorMutation();
  const [busy, setBusy] = useState(false);

  return (
    <>
      <PageHeader backHref="/dashboard/editors" backLabel="Editors" title="Add editor" description="Create an editor account and choose which websites they can manage." />
      <EditorForm
        cancelHref="/dashboard/editors"
        submitting={busy}
        onSubmit={async (v) => {
          setBusy(true);
          try {
            // 1) POST /auth/register { role: "editor" }
            let editorId: string;
            try {
              const user = await registerUser({ name: v.name.trim(), email: v.email.trim().toLowerCase(), password: v.password, role: "editor" }).unwrap();
              editorId = user.id;
            } catch (e) {
              toast.error(getErrorMessage(e));
              setBusy(false);
              return;
            }
            // 2) PATCH /websites/:id/assign-editor for each selected website
            const failures: string[] = [];
            for (const websiteId of v.websites) {
              try {
                await assign({ websiteId, editorId }).unwrap();
              } catch (e) {
                failures.push(getErrorMessage(e));
              }
            }
            if (failures.length) toast.warning("Editor created, but some website assignments failed", { description: failures[0] });
            else toast.success("Editor created successfully");
            router.push(`/dashboard/editors/${editorId}`); // stays busy until the page changes
          } catch {
            setBusy(false);
          }
        }}
      />
    </>
  );
}
