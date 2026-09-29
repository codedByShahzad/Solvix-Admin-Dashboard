"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, MoreHorizontal, Pencil, Trash2, UserPlus, Users } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  DataTable,
  EmptyState,
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
  TableSkeleton,
  type Column,
} from "@/components/ui";
import { useDeleteEditor } from "@/components/editors/useDeleteEditor";
import { useGetEditorsQuery } from "@/store/api/editorApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, formatRelative } from "@/utils/format";
import type { Editor } from "@/types";

type StatusFilter = "all" | "active" | "inactive";

export default function EditorsPage() {
  const router = useRouter();
  const q = useGetEditorsQuery();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [website, setWebsite] = useState("");
  const debounced = useDebounce(search);
  const { requestDelete, dialog } = useDeleteEditor();

  const items = useMemo(() => q.data?.items ?? [], [q.data]);
  const websiteOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of items) for (const w of e.websites) map.set(w.id, w.name ?? w.id);
    return [...map].map(([value, label]) => ({ value, label }));
  }, [items]);

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    return items.filter(
      (e) =>
        (status === "all" || (status === "active" ? e.isActive : !e.isActive)) &&
        (!website || e.websites.some((w) => w.id === website)) &&
        (!term || e.name.toLowerCase().includes(term) || e.email.toLowerCase().includes(term)),
    );
  }, [items, debounced, status, website]);

  const clear = () => {
    setSearch("");
    setStatus("all");
    setWebsite("");
  };

  const actions = (e: Editor) => (
    <RowActions>
      <Menu
        width="w-44"
        trigger={({ toggle }) => (
          <Button variant="ghost" size="icon-sm" onClick={toggle} aria-label={`Actions for ${e.name}`}>
            <MoreHorizontal />
          </Button>
        )}
      >
        <MenuItem href={`/dashboard/editors/${e.id}`} icon={<Eye />}>
          View
        </MenuItem>
        <MenuItem href={`/dashboard/editors/${e.id}/edit`} icon={<Pencil />}>
          Edit
        </MenuItem>
        <MenuSeparator />
        <MenuItem onClick={() => requestDelete(e)} icon={<Trash2 />} danger>
          Remove
        </MenuItem>
      </Menu>
    </RowActions>
  );

  const websitesCell = (e: Editor) =>
    e.websites.length ? (
      <div className="flex flex-wrap gap-1">
        {e.websites.slice(0, 2).map((w) => (
          <Badge key={w.id} tone="brand">
            {w.name ?? w.id}
          </Badge>
        ))}
        {e.websites.length > 2 && <Badge>+{e.websites.length - 2}</Badge>}
      </div>
    ) : (
      <span className="text-xs text-subtle">None</span>
    );

  const columns: Column<Editor>[] = [
    {
      key: "name",
      header: "Editor",
      sortValue: (e) => e.name,
      cell: (e) => (
        <div className="flex items-center gap-3">
          <Avatar name={e.name} />
          <div className="min-w-0">
            <Link href={`/dashboard/editors/${e.id}`} onClick={(ev) => ev.stopPropagation()} className="block truncate font-medium text-fg hover:text-brand">
              {e.name}
            </Link>
            <div className="truncate text-xs text-muted">{e.email}</div>
          </div>
        </div>
      ),
    },
    { key: "websites", header: "Websites", cell: websitesCell },
    {
      key: "status",
      header: "Status",
      sortValue: (e) => (e.isActive ? 1 : 0),
      cell: (e) => (
        <Badge tone={e.isActive ? "success" : "neutral"} dot>
          {e.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "lastLogin",
      header: "Last active",
      sortValue: (e) => (e.lastLoginAt ? new Date(e.lastLoginAt) : undefined),
      cell: (e) => <span className="whitespace-nowrap text-muted">{formatRelative(e.lastLoginAt, "Never")}</span>,
    },
    {
      key: "created",
      header: "Added",
      sortValue: (e) => (e.createdAt ? new Date(e.createdAt) : undefined),
      cell: (e) => <span className="whitespace-nowrap text-muted">{formatDate(e.createdAt)}</span>,
    },
    { key: "actions", header: <span className="sr-only">Actions</span>, align: "right", cell: actions },
  ];

  return (
    <>
      <PageHeader
        title="Editors"
        description="People who write and manage content for assigned websites."
        actions={
          <ButtonLink href="/dashboard/editors/create" leftIcon={<UserPlus className="size-4" />}>
            Add editor
          </ButtonLink>
        }
      />
      <QueryState
        query={q}
        loading={<TableSkeleton />}
        isEmpty={(d) => d.items.length === 0}
        empty={
          <div className="card">
            <EmptyState
              icon={<Users />}
              title="No editors yet"
              description="Invite editors and give them access to specific websites."
              action={
                <ButtonLink href="/dashboard/editors/create" leftIcon={<UserPlus className="size-4" />}>
                  Add editor
                </ButtonLink>
              }
            />
          </div>
        }
      >
        {() => (
          <DataTable
            data={filtered}
            columns={columns}
            getRowId={(e) => e.id}
            onRowClick={(e) => router.push(`/dashboard/editors/${e.id}`)}
            initialSort={{ key: "name", dir: "asc" }}
            empty={<NoResults onClear={clear} />}
            toolbar={
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" />
                <div className="flex flex-wrap items-center gap-2">
                  {websiteOptions.length > 1 && (
                    <Select value={website} onChange={(e) => setWebsite(e.target.value)} options={websiteOptions} placeholder="All websites" className="h-8 w-40 text-[13px]" aria-label="Filter by website" />
                  )}
                  <Segmented<StatusFilter>
                    value={status}
                    onChange={setStatus}
                    items={[
                      { value: "all", label: "All" },
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ]}
                  />
                </div>
              </div>
            }
            renderMobileRow={(e) => (
              <div className="flex items-center gap-3">
                <Avatar name={e.name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-fg">{e.name}</div>
                  <div className="truncate text-xs text-muted">{e.email}</div>
                  <div className="mt-1.5">{websitesCell(e)}</div>
                </div>
                {actions(e)}
              </div>
            )}
          />
        )}
      </QueryState>
      {dialog}
    </>
  );
}
