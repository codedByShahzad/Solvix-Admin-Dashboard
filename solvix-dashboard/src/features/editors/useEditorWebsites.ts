"use client";

import { useMemo } from "react";
import { useGetWebsitesQuery } from "@/store/api/websiteApi";
import type { Website } from "@/types";

/** editorId → websites (owned by the current admin) the editor is assigned to. */
export function useEditorWebsites() {
  const q = useGetWebsitesQuery();
  const map = useMemo(() => {
    const m = new Map<string, Website[]>();
    for (const w of q.data ?? []) for (const id of w.editors) m.set(id, [...(m.get(id) ?? []), w]);
    return m;
  }, [q.data]);
  return { websites: q.data ?? [], forEditor: (id: string) => map.get(id) ?? [], isLoading: q.isLoading };
}
