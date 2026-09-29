"use client";

import { useMemo } from "react";
import { useGetWebsitesQuery } from "@/store/api/websiteApi";
import { useGetBlogsQuery } from "@/store/api/blogApi";
import { useGetMediaListQuery } from "@/store/api/mediaApi";
import { useGetEditorsQuery } from "@/store/api/editorApi";
import { isUnconfirmed } from "@/lib/api/errors";
import type { StatState } from "@/components/ui";
import type { Role } from "@/types";

type Q = { isLoading: boolean; isError: boolean; error?: unknown };

export function statState(q: Q): StatState {
  if (q.isLoading) return "loading";
  if (q.isError) return isUnconfirmed(q.error) ? "pending" : "error";
  return "ready";
}

/**
 * Every dashboard number is derived from existing list endpoints — nothing is invented.
 * If a list route isn't connected, its cards show "Needs endpoint".
 * Note: Published/Draft counts are computed from the blogs the list returns; if the
 * backend paginates that list, a dedicated stats endpoint would be needed for exact totals.
 */
export function useDashboardData(role: Role | undefined) {
  const isAdmin = role === "admin";
  const websites = useGetWebsitesQuery(undefined, { skip: !isAdmin });
  const blogs = useGetBlogsQuery();
  const media = useGetMediaListQuery();
  const editors = useGetEditorsQuery(undefined, { skip: !isAdmin });

  const derived = useMemo(() => {
    const blogItems = blogs.data?.items ?? [];
    const mediaItems = media.data?.items ?? [];
    const published = blogItems.filter((b) => b.status === "published").length;
    const drafts = blogItems.filter((b) => b.status === "draft").length;
    const partial = !!blogs.data && blogs.data.total > blogItems.length;

    const recentBlogs = [...blogItems].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")).slice(0, 6);
    const recentMedia = [...mediaItems].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).slice(0, 6);

    const perWebsite = new Map<string, { published: number; drafts: number }>();
    for (const b of blogItems) {
      const entry = perWebsite.get(b.websiteId) ?? { published: 0, drafts: 0 };
      if (b.status === "published") entry.published++;
      else entry.drafts++;
      perWebsite.set(b.websiteId, entry);
    }

    type Activity = { id: string; kind: "blog" | "media"; title: string; href: string; at: string; meta: string };
    const activity: Activity[] = [
      ...blogItems
        .filter((b) => b.updatedAt)
        .map((b) => ({
          id: `b-${b.id}`,
          kind: "blog" as const,
          title: b.title,
          href: `/dashboard/blogs/${b.id}`,
          at: b.updatedAt!,
          meta: b.status === "published" ? "Blog published / updated" : "Draft updated",
        })),
      ...mediaItems
        .filter((m) => m.createdAt)
        .map((m) => ({ id: `m-${m.id}`, kind: "media" as const, title: m.filename, href: `/dashboard/media/${m.id}`, at: m.createdAt!, meta: "Media uploaded" })),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 8);

    return { published, drafts, partial, recentBlogs, recentMedia, perWebsite, activity };
  }, [blogs.data, media.data]);

  return { websites, blogs, media, editors, ...derived };
}
