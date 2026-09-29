"use client";

import { useMemo } from "react";
import { useGetWebsitesQuery } from "@/store/api/websiteApi";
import { useCurrentUser } from "@/features/auth/useAuth";
import type { Ref } from "@/types";

/**
 * Websites the current user can assign content to.
 *  - Admin: the websites list endpoint.
 *  - Editor: the websites attached to their user (from the login response),
 *    because editors usually can't list all websites.
 * `unavailable` = no source of website options, so forms fall back to a Website ID input.
 */
export function useWebsiteOptions() {
  const user = useCurrentUser();
  const isAdmin = user?.role === "admin";
  const q = useGetWebsitesQuery(undefined, { skip: !isAdmin });

  return useMemo(() => {
    const websites: Ref[] = isAdmin
      ? (q.data?.items.map((w) => ({ id: w.id, name: w.name, domain: w.domain })) ?? [])
      : (user?.websites ?? []);
    const options = websites.map((w) => ({ value: w.id, label: w.name ? `${w.name}${w.domain ? ` · ${w.domain}` : ""}` : w.id }));
    return {
      websites,
      options,
      isLoading: isAdmin && q.isLoading,
      unavailable: !(isAdmin && q.isLoading) && options.length === 0,
      nameOf: (id?: string) => websites.find((w) => w.id === id)?.name,
    };
  }, [isAdmin, q.data, q.isLoading, user?.websites]);
}
