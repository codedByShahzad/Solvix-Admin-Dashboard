"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, UserPlus, Users } from "lucide-react";
import {
  Avatar,
  Badge,
  ButtonLink,
  DataTable,
  EmptyState,
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
import { useGetEditorsQuery } from "@/store/api/editorApi";
import { useEditorWebsites } from "@/features/editors/useEditorWebsites";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/utils/format";
import type { Editor } from "@/types";

type StatusFilter = "all" | "active" | "inactive";

export default function EditorsPage() {
  const router = useRouter();
  const q = useGetEditorsQuery();
  const { websites, forEditor } = useEditorWebsites();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [website, setWebsite] = useState("");
  const debounced = useDebounce(search);

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    return (q.data ?? []).filter(
      (e) =>
        (status === "all" || (status === "active" ? e.isActive : !e.isActive)) &&
        (!website || forEditor(e.id).some((w) => w.id === website)) &&
        (!term || e.name.toLowerCase().includes(term) || e.email.toLowerCase().includes(term)),
    );
  }, [q.data, debounced, status, website, forEditor]);

  const clear = () => {
    setSearch("");
    setStatus("all");
    setWebsite("");
  };

  const websitesCell = (e: Editor) => {
    const list = forEditor(e.id);
    return list.length ? (
      <div className="flex flex-wrap gap-1">
        {list.slice(0, 2).map((w) => (
          <Badge key={w.id} tone="brand">
            {w.name}
          </Badge>
        ))}
        {list.length > 2 && <Badge>+{list.length - 2}</Badge>}
      </div>
    ) : (
      <span className="text-xs text-subtle">None</span>
    );
  };

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
    { key: "websites", header: "Your websites", cell: websitesCell },
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
      key: "created",
      header: "Added",
      sortValue: (e) => (e.createdAt ? new Date(e.createdAt) : undefined),
      cell: (e) => <span className="whitespace-nowrap text-muted">{formatDate(e.createdAt)}</span>,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      cell: (e) => (
        <RowActions>
          <ButtonLink href={`/dashboard/editors/${e.id}`} variant="ghost" size="sm" leftIcon={<Eye className="size-4" />}>
            View
          </ButtonLink>
        </RowActions>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Editors"
        description="Editor accounts and the websites they can manage."
        actions={
          <ButtonLink href="/dashboard/editors/create" leftIcon={<UserPlus className="size-4" />}>
            Add editor
          </ButtonLink>
        }
      />
      <QueryState
        query={q}
        loading={<TableSkeleton />}
        isEmpty={(d) => d.length === 0}
        empty={
          <div className="card">
            <EmptyState
              icon={<Users />}
              title="No editors yet"
              description="Create editor accounts and give them access to specific websites."
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
                  {websites.length > 1 && (
                    <Select
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      options={websites.map((w) => ({ value: w.id, label: w.name }))}
                      placeholder="All websites"
                      className="h-8 w-40 text-[13px]"
                      aria-label="Filter by website"
                    />
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
              </div>
            )}
          />
        )}
      </QueryState>
    </>
  );
}
