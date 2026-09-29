"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui";
import { useDeleteMediaMutation } from "@/store/api/mediaApi";
import { useMutationToast } from "@/hooks/useMutationToast";
import type { Media } from "@/types";

export function useDeleteMedia(onDeleted?: () => void) {
  const [target, setTarget] = useState<Media | null>(null);
  const [remove, { isLoading }] = useDeleteMediaMutation();
  const run = useMutationToast();

  const confirm = async () => {
    if (!target) return;
    const ok = await run(remove(target.id).unwrap(), "Media deleted successfully");
    setTarget(null);
    if (ok !== undefined) onDeleted?.();
  };

  return {
    requestDelete: setTarget,
    dialog: (
      <ConfirmDialog
        open={!!target}
        title="Delete media?"
        description={
          <>
            <span className="font-medium text-fg">{target?.filename}</span> will be removed from the library and Cloudinary. Blogs that use it will show a
            broken image.
          </>
        }
        confirmLabel="Delete media"
        loading={isLoading}
        onConfirm={confirm}
        onCancel={() => setTarget(null)}
      />
    ),
  };
}
