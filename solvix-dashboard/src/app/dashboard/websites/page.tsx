"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Globe, LayoutGrid, List, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Button,
  ButtonLink,
  DataTable,
  EmptyState,
  GridSkeleton,
  Menu,
  MenuItem,
  MenuSeparator,
  NoResults,
  PageHeader,
  QueryState,
  RowActions,
  SearchInput,
  Segmented,
  StatusBadge,
  TableSkeleton,
  type Column,
} from "@/components/ui";
import { WebsiteAvatar } from "@/components/websites/WebsiteAvatar";
import { WebsiteCard } from "@/components/websites/WebsiteCard";
import { useDeleteWebsite } from "@/components/websites/useDeleteWebsite";
import { useGetWebsitesQuery } from "@/store/api/websiteApi";
import { useGetBlogsQuery } from "@/store/api/blogApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, hostOf } from "@/utils/format";
import type { Website } from "@/types";

type StatusFilter = "all" | "active" | "inactive";

export default function WebsitesPage() {
  const router = useRouter();
  const q = useGetWebsitesQuery();
  const blogs = useGetBlogsQuery();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [view, setView] = useState<"table" | "grid">("table");
  const debounced = useDebounce(search);
  const { requestDelete, dialog } = useDeleteWebsite();

  const blogCounts = useMemo(() => {
    if (!blogs.data) return undefined;
    const map = new Map<string, number>();
    for (const b of blogs.data.items) map.set(b.websiteId, (map.get(b.websiteId) ?? 0) + 1);
    return map;
  }, [blogs.data]);

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    return (q.data?.items ?? []).filter(
      (w) =>
        (status === "all" || w.status === status) &&
        (!term || w.name.toLowerCase().includes(term) || w.domain.toLowerCase().includes(term)),
    );
  }, [q.data, debounced, status]);

  const clear = () => {
    setSearch("");
    setStatus("all");
  };

  const actions = (w: Website) => (
    <RowActions>
      <Menu
        width="w-44"
        trigger={({ toggle }) => (
          <Button variant="ghost" size="icon-sm" onClick={toggle} aria-label={`Actions for ${w.name}`}>
            <MoreHorizontal />
          </Button>
        )}
      >
        <MenuItem href={`/dashboard/websites/${w.id}`} icon={<Eye />}>
          View
        </MenuItem>
        <MenuItem href={`/dashboard/websites/${w.id}/edit`} icon={<Pencil />}>
          Edit
        </MenuItem>
        <MenuSeparator />
        <MenuItem onClick={() => requestDelete(w)} icon={<Trash2 />} danger>
          Delete
        </MenuItem>
      </Menu>
    </RowActions>
  );

  const columns: Column<Website>[] = [
    {
      key: "name",
      header: "Website",
      sortValue: (w) => w.name,
      cell: (w) => (
        <div className="flex items-center gap-3">
          <WebsiteAvatar website={w} />
          <div className="min-w-0">
            <Link href={`/dashboard/websites/${w.id}`} className="block truncate font-medium text-fg hover:text-brand" onClick={(e) => e.stopPropagation()}>
              {w.name}
            </Link>
            <div className="truncate text-xs text-muted">{hostOf(w.domain) || "—"}</div>
          </div>
        </div>
      ),
    },
    { key: "status", header: "Status", sortValue: (w) => w.status, cell: (w) => <StatusBadge status={w.status} /> },
    {
      key: "blogs",
      header: "Blogs",
      align: "right",
      sortValue: (w) => blogCounts?.get(w.id),
      cell: (w) => <span className="tabular-nums text-fg">{blogCounts ? (blogCounts.get(w.id) ?? 0) : "—"}</span>,
    },
    { key: "owner", header: "Owner", cell: (w) => <span className="text-muted">{w.owner?.name ?? "—"}</span> },
    {
      key: "created",
      header: "Created",
      sortValue: (w) => (w.createdAt ? new Date(w.createdAt) : undefined),
      cell: (w) => <span className="whitespace-nowrap text-muted">{formatDate(w.createdAt)}</span>,
    },
    { key: "actions", header: <span className="sr-only">Actions</span>, align: "right", cell: actions },
  ];

  const toolbar = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <SearchInput value={search} onChange={setSearch} placeholder="Search name or domain…" />
      <div className="flex items-center gap-2">
        <Segmented<StatusFilter>
          value={status}
          onChange={setStatus}
          items={[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
        <Segmented
          value={view}
          onChange={setView}
          className="hidden sm:inline-flex"
          items={[
            { value: "table", label: <span className="sr-only">Table</span>, icon: <List /> },
            { value: "grid", label: <span className="sr-only">Grid</span>, icon: <LayoutGrid /> },
          ]}
        />
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Websites"
        description="Every website managed through Solvix."
        actions={
          <ButtonLink href="/dashboard/websites/create" leftIcon={<Plus className="size-4" />}>
            Add website
          </ButtonLink>
        }
      />

      <QueryState
        query={q}
        loading={view === "grid" ? <GridSkeleton count={6} /> : <TableSkeleton />}
        isEmpty={(d) => d.items.length === 0}
        empty={
          <div className="card">
            <EmptyState
              icon={<Globe />}
              title="No websites yet"
              description="Add your first website to start managing its blogs and media."
              action={
                <ButtonLink href="/dashboard/websites/create" leftIcon={<Plus className="size-4" />}>
                  Add website
                </ButtonLink>
              }
            />
          </div>
        }
      >
        {() =>
          view === "grid" ? (
            <div className="space-y-4">
              <div className="card px-4 py-3 sm:px-5">{toolbar}</div>
              {filtered.length === 0 ? (
                <div className="card">
                  <NoResults onClear={clear} />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((w) => (
                    <WebsiteCard key={w.id} website={w} blogCount={blogCounts?.get(w.id) ?? (blogCounts ? 0 : undefined)} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <DataTable
              data={filtered}
              columns={columns}
              getRowId={(w) => w.id}
              onRowClick={(w) => router.push(`/dashboard/websites/${w.id}`)}
              initialSort={{ key: "name", dir: "asc" }}
              toolbar={toolbar}
              empty={<NoResults onClear={clear} />}
              renderMobileRow={(w) => (
                <div className="flex items-center gap-3">
                  <WebsiteAvatar website={w} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-fg">{w.name}</div>
                    <div className="truncate text-xs text-muted">{hostOf(w.domain)}</div>
                  </div>
                  <StatusBadge status={w.status} />
                  {actions(w)}
                </div>
              )}
            />
          )
        }
      </QueryState>
      {dialog}
    </>
  );
}
