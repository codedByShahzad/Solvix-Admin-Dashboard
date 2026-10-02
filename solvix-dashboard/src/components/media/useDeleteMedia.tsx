"use client";

import { useState } from "react";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { ConfirmDialog } from "@/components/ui";
import { useDeleteMediaMutation } from "@/store/api/mediaApi";
import { useMutationToast } from "@/hooks/useMutationToast";
import type { Media } from "@/types";

/** DELETE /media/:id (admin only) — removes the Cloudinary asset and the record. */
export function useDeleteMedia(onDeleted?: () => void) {
  const [target, setTarget] = useState<Media | null>(null);
  const [remove, { isLoading }] = useDeleteMediaMutation();
  const run = useMutationToast();
  const { locked, lock } = useSubmitLock();

  const confirm = async () => {
    if (!target) return;
    const ok = await run(remove(target.id).unwrap().then(() => true), "Media deleted successfully");
    setTarget(null);
    if (ok) onDeleted?.();
  };

  return {
    requestDelete: setTarget,
    dialog: (
      <ConfirmDialog
        open={!!target}
        title="Delete media?"
        description={
          <>
            <span className="font-medium text-fg">{target?.filename}</span> will be removed from Cloudinary and the library. Blogs that use its URL will show a broken image.
          </>
        }
        confirmLabel="Delete media"
        loading={isLoading || locked}
        onConfirm={lock(confirm)}
        onCancel={() => setTarget(null)}
      />
    ),
  };
}
