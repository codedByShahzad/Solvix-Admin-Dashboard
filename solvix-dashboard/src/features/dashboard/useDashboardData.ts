"use client";

import { useMemo } from "react";
import { useGetWebsitesQuery } from "@/store/api/websiteApi";
import { useGetBlogsQuery } from "@/store/api/blogApi";
import { useGetMediaListQuery } from "@/store/api/mediaApi";
import { useGetEditorsQuery } from "@/store/api/editorApi";
import type { StatState } from "@/components/ui";
import type { Role } from "@/types";

export function statState(q: { isLoading: boolean; isError: boolean }): StatState {
  return q.isLoading ? "loading" : q.isError ? "error" : "ready";
}

/**
 * Every dashboard number is counted from real list endpoints (the backend
 * returns full lists, unpaginated) — nothing is estimated or invented.
 */
export function useDashboardData(role: Role | undefined) {
  const isAdmin = role === "admin";
  const websites = useGetWebsitesQuery();
  const blogs = useGetBlogsQuery();
  const media = useGetMediaListQuery();
  const editors = useGetEditorsQuery(undefined, { skip: !isAdmin });

  const derived = useMemo(() => {
    const blogItems = blogs.data ?? [];
    const mediaItems = media.data ?? [];
    const published = blogItems.filter((b) => b.status === "published").length;
    const drafts = blogItems.filter((b) => b.status === "draft").length;
    const archived = blogItems.filter((b) => b.status === "archived").length;

    const recentBlogs = [...blogItems].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")).slice(0, 6);
    const recentMedia = mediaItems.slice(0, 6); // backend already sorts newest first

    const perWebsite = new Map<string, { published: number; total: number }>();
    for (const b of blogItems) {
      const entry = perWebsite.get(b.websiteId) ?? { published: 0, total: 0 };
      entry.total++;
      if (b.status === "published") entry.published++;
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
          meta: b.createdAt === b.updatedAt ? "Blog created" : b.status === "published" ? "Published blog updated" : "Blog updated",
        })),
      ...mediaItems
        .filter((m) => m.createdAt)
        .map((m) => ({ id: `m-${m.id}`, kind: "media" as const, title: m.filename, href: `/dashboard/media/${m.id}`, at: m.createdAt!, meta: "Image uploaded" })),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 8);

    return { published, drafts, archived, recentBlogs, recentMedia, perWebsite, activity };
  }, [blogs.data, media.data]);

  return { websites, blogs, media, editors, ...derived };
}
