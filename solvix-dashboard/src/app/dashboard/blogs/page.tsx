"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, FileText, LayoutGrid, List, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Button,
  ButtonLink,
  DataTable,
  EmptyState,
  GridSkeleton,
  LoadingState,
  Menu,
  MenuItem,
  MenuSeparator,
  NoResults,
  PageHeader,
  QueryState,
  RowActions,
  SearchInput,
  Segmented,
  Select,
  StatusBadge,
  TableSkeleton,
  type Column,
} from "@/components/ui";
import { BlogThumb } from "@/components/blogs/BlogListItem";
import { BlogCard } from "@/components/blogs/BlogCard";
import { useDeleteBlog } from "@/components/blogs/useDeleteBlog";
import { useGetBlogsQuery } from "@/store/api/blogApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, formatRelative } from "@/utils/format";
import type { Blog } from "@/types";

type StatusFilter = "all" | "published" | "draft" | "archived";

function BlogsView() {
  const router = useRouter();
  const params = useSearchParams();
  const q = useGetBlogsQuery();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [website, setWebsite] = useState(params.get("website") ?? "");
  const [category, setCategory] = useState("");
  const [view, setView] = useState<"table" | "grid">("table");
  const debounced = useDebounce(search);
  const { requestDelete, dialog } = useDeleteBlog();

  const items = useMemo(() => q.data ?? [], [q.data]);

  const websiteOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of items) if (b.websiteId) map.set(b.websiteId, b.website?.name ?? b.websiteId);
    return [...map].map(([value, label]) => ({ value, label }));
  }, [items]);

  const categoryOptions = useMemo(
    () => [...new Set(items.map((b) => b.category).filter((c): c is string => !!c))].sort().map((c) => ({ value: c, label: c })),
    [items],
  );

  const counts = useMemo(
    () => ({
      all: items.length,
      published: items.filter((b) => b.status === "published").length,
      draft: items.filter((b) => b.status === "draft").length,
      archived: items.filter((b) => b.status === "archived").length,
    }),
    [items],
  );

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    return items.filter(
      (b) =>
        (status === "all" || b.status === status) &&
        (!website || b.websiteId === website) &&
        (!category || b.category === category) &&
        (!term ||
          b.title.toLowerCase().includes(term) ||
          b.slug.toLowerCase().includes(term) ||
          b.keywords.some((k) => k.toLowerCase().includes(term))),
    );
  }, [items, debounced, status, website, category]);

  const clear = () => {
    setSearch("");
    setStatus("all");
    setWebsite("");
    setCategory("");
  };

  const actions = (b: Blog) => (
    <RowActions>
      <Menu
        width="w-44"
        trigger={({ toggle }) => (
          <Button variant="ghost" size="icon-sm" onClick={toggle} aria-label={`Actions for ${b.title}`}>
            <MoreHorizontal />
          </Button>
        )}
      >
        <MenuItem href={`/dashboard/blogs/${b.id}`} icon={<Eye />}>
          View
        </MenuItem>
        <MenuItem href={`/dashboard/blogs/${b.id}/edit`} icon={<Pencil />}>
          Edit
        </MenuItem>
        <MenuSeparator />
        <MenuItem onClick={() => requestDelete(b)} icon={<Trash2 />} danger>
          Delete
        </MenuItem>
      </Menu>
    </RowActions>
  );

  const columns: Column<Blog>[] = [
    {
      key: "title",
      header: "Post",
      sortValue: (b) => b.title,
      className: "max-w-[420px]",
      cell: (b) => (
        <div className="flex items-center gap-3">
          <BlogThumb blog={b} />
          <div className="min-w-0">
            <Link href={`/dashboard/blogs/${b.id}`} onClick={(e) => e.stopPropagation()} className="block truncate font-medium text-fg hover:text-brand">
              {b.title}
            </Link>
            <div className="truncate font-mono text-xs text-muted">/{b.slug}</div>
          </div>
        </div>
      ),
    },
    { key: "website", header: "Website", sortValue: (b) => b.website?.name, cell: (b) => <span className="text-fg">{b.website?.name ?? "—"}</span> },
    { key: "status", header: "Status", sortValue: (b) => b.status, cell: (b) => <StatusBadge status={b.status} /> },
    { key: "category", header: "Category", sortValue: (b) => b.category, cell: (b) => <span className="text-muted">{b.category ?? "—"}</span> },
    { key: "author", header: "Author", cell: (b) => <span className="whitespace-nowrap text-muted">{b.author?.name ?? "—"}</span> },
    {
      key: "updated",
      header: "Updated",
      sortValue: (b) => (b.updatedAt ? new Date(b.updatedAt) : undefined),
      cell: (b) => (
        <span className="whitespace-nowrap text-muted" title={formatDate(b.updatedAt)}>
          {formatRelative(b.updatedAt)}
        </span>
      ),
    },
    { key: "actions", header: <span className="sr-only">Actions</span>, align: "right", cell: actions },
  ];

  const toolbar = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search title, slug, keyword…" />
        <div className="flex flex-wrap items-center gap-2">
          {websiteOptions.length > 1 && (
            <Select value={website} onChange={(e) => setWebsite(e.target.value)} options={websiteOptions} placeholder="All websites" className="h-8 w-40 text-[13px]" aria-label="Filter by website" />
          )}
          {categoryOptions.length > 0 && (
            <Select value={category} onChange={(e) => setCategory(e.target.value)} options={categoryOptions} placeholder="All categories" className="h-8 w-40 text-[13px]" aria-label="Filter by category" />
          )}
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
      <Segmented<StatusFilter>
        value={status}
        onChange={setStatus}
        className="max-w-full self-start overflow-x-auto"
        items={[
          { value: "all", label: `All · ${counts.all}` },
          { value: "published", label: `Published · ${counts.published}` },
          { value: "draft", label: `Drafts · ${counts.draft}` },
          ...(counts.archived ? [{ value: "archived" as const, label: `Archived · ${counts.archived}` }] : []),
        ]}
      />
    </div>
  );

  return (
    <>
      <PageHeader
        title="Blogs"
        description="Write, edit and publish posts across your websites."
        actions={
          <ButtonLink href="/dashboard/blogs/create" leftIcon={<Plus className="size-4" />}>
            New blog
          </ButtonLink>
        }
      />

      <QueryState
        query={q}
        loading={view === "grid" ? <GridSkeleton count={6} /> : <TableSkeleton rows={8} />}
        isEmpty={(d) => d.length === 0}
        empty={
          <div className="card">
            <EmptyState
              icon={<FileText />}
              title="No blogs yet"
              description="Create your first post — it will appear here and on its website once published."
              action={
                <ButtonLink href="/dashboard/blogs/create" leftIcon={<Plus className="size-4" />}>
                  New blog
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
                  {filtered.map((b) => (
                    <BlogCard key={b.id} blog={b} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <DataTable
              data={filtered}
              columns={columns}
              getRowId={(b) => b.id}
              onRowClick={(b) => router.push(`/dashboard/blogs/${b.id}`)}
              initialSort={{ key: "updated", dir: "desc" }}
              toolbar={toolbar}
              empty={<NoResults onClear={clear} />}
              renderMobileRow={(b) => (
                <div className="flex items-start gap-3">
                  <BlogThumb blog={b} className="size-12" />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-medium text-fg">{b.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <StatusBadge status={b.status} />
                      <span>{b.website?.name}</span>
                      <span>· {formatRelative(b.updatedAt)}</span>
                    </div>
                  </div>
                  {actions(b)}
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

export default function BlogsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <BlogsView />
    </Suspense>
  );
}
