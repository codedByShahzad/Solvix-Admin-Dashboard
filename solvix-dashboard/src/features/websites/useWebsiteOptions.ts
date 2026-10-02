"use client";

import { useMemo } from "react";
import { useGetWebsitesQuery } from "@/store/api/websiteApi";
import type { Website } from "@/types";

/**
 * Websites the current user can put content on, from GET /websites
 * (admins: websites they own · editors: websites assigned to them).
 */
export function useWebsiteOptions() {
  const q = useGetWebsitesQuery();
  return useMemo(() => {
    const websites: Website[] = q.data ?? [];
    return {
      websites,
      options: websites.map((w) => ({ value: w.id, label: `${w.name} · ${w.domain.replace(/^https?:\/\//, "")}` })),
      isLoading: q.isLoading,
      isError: q.isError,
      error: q.error,
      nameOf: (id?: string) => websites.find((w) => w.id === id)?.name,
    };
  }, [q.data, q.isLoading, q.isError, q.error]);
}
