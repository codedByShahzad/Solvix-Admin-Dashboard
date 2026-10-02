"use client";

import { useState } from "react";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { ConfirmDialog } from "@/components/ui";
import { useDeleteBlogMutation } from "@/store/api/blogApi";
import { useMutationToast } from "@/hooks/useMutationToast";
import type { Blog } from "@/types";

export function useDeleteBlog(onDeleted?: () => void) {
  const [target, setTarget] = useState<Blog | null>(null);
  const [remove, { isLoading }] = useDeleteBlogMutation();
  const run = useMutationToast();
  const { locked, lock } = useSubmitLock();

  const confirm = async () => {
    if (!target) return;
    const ok = await run(remove(target.id).unwrap().then(() => true), "Blog deleted successfully");
    setTarget(null);
    if (ok) onDeleted?.();
  };

  return {
    requestDelete: setTarget,
    dialog: (
      <ConfirmDialog
        open={!!target}
        title="Delete blog?"
        description={
          <>
            Are you sure you want to delete <span className="font-medium text-fg">“{target?.title}”</span>? It will be removed from its website. This
            can&apos;t be undone.
          </>
        }
        confirmLabel="Delete blog"
        loading={isLoading || locked}
        onConfirm={lock(confirm)}
        onCancel={() => setTarget(null)}
      />
    ),
  };
}
