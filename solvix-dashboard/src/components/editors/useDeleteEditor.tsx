"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui";
import { useDeleteEditorMutation } from "@/store/api/editorApi";
import { useMutationToast } from "@/hooks/useMutationToast";
import type { Editor } from "@/types";

export function useDeleteEditor(onDeleted?: () => void) {
  const [target, setTarget] = useState<Editor | null>(null);
  const [remove, { isLoading }] = useDeleteEditorMutation();
  const run = useMutationToast();

  const confirm = async () => {
    if (!target) return;
    const ok = await run(remove(target.id).unwrap(), "Editor removed successfully");
    setTarget(null);
    if (ok !== undefined) onDeleted?.();
  };

  return {
    requestDelete: setTarget,
    dialog: (
      <ConfirmDialog
        open={!!target}
        title="Remove editor?"
        description={
          <>
            <span className="font-medium text-fg">{target?.name}</span> will lose access to Solvix immediately. Content they created stays in place.
          </>
        }
        confirmLabel="Remove editor"
        loading={isLoading}
        onConfirm={confirm}
        onCancel={() => setTarget(null)}
      />
    ),
  };
}
