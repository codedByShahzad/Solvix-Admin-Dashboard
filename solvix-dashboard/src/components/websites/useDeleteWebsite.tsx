"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui";
import { useDeleteWebsiteMutation } from "@/store/api/websiteApi";
import { useMutationToast } from "@/hooks/useMutationToast";
import type { Website } from "@/types";

/** Shared delete-confirmation flow for the list and detail pages. */
export function useDeleteWebsite(onDeleted?: () => void) {
  const [target, setTarget] = useState<Website | null>(null);
  const [remove, { isLoading }] = useDeleteWebsiteMutation();
  const run = useMutationToast();

  const confirm = async () => {
    if (!target) return;
    const ok = await run(remove(target.id).unwrap(), "Website deleted successfully");
    setTarget(null);
    if (ok !== undefined) onDeleted?.();
  };

  const dialog = (
    <ConfirmDialog
      open={!!target}
      title="Delete website?"
      description={
        <>
          Are you sure you want to delete <span className="font-medium text-fg">{target?.name}</span>? Its blogs, media links and
          integration keys may stop working. This can&apos;t be undone.
        </>
      }
      confirmLabel="Delete website"
      loading={isLoading}
      onConfirm={confirm}
      onCancel={() => setTarget(null)}
    />
  );

  return { requestDelete: setTarget, dialog };
}
