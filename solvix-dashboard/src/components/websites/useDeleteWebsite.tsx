"use client";

import { useState } from "react";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { ConfirmDialog } from "@/components/ui";
import { useDeleteWebsiteMutation } from "@/store/api/websiteApi";
import { useMutationToast } from "@/hooks/useMutationToast";
import type { Website } from "@/types";

/** Shared delete-confirmation flow for the list and detail pages. */
export function useDeleteWebsite(onDeleted?: () => void) {
  const [target, setTarget] = useState<Website | null>(null);
  const [remove, { isLoading }] = useDeleteWebsiteMutation();
  const run = useMutationToast();
  const { locked, lock } = useSubmitLock();

  const confirm = async () => {
    if (!target) return;
    const res = await run(
      remove(target.id).unwrap().then(() => true),
      "Website deleted successfully",
    );
    setTarget(null);
    if (res) onDeleted?.();
  };

  const dialog = (
    <ConfirmDialog
      open={!!target}
      title="Delete website?"
      description={
        <>
          Are you sure you want to delete <span className="font-medium text-fg">{target?.name}</span>? This can&apos;t be undone. Its
          blogs, media and integration keys are not deleted automatically by the backend.
        </>
      }
      confirmLabel="Delete website"
      loading={isLoading || locked}
      onConfirm={lock(confirm)}
      onCancel={() => setTarget(null)}
    />
  );

  return { requestDelete: setTarget, dialog };
}
