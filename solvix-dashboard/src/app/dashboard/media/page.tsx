"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloudUpload, Eye, Image as ImageIcon, LayoutGrid, List, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  Button,
  ButtonLink,
  DataTable,
  EmptyState,
  GridSkeleton,
  Menu,
  MenuItem,
  MenuSeparator,
  Modal,
  NoResults,
  PageHeader,
  Pagination,
  QueryState,
  RowActions,
  SearchInput,
  Segmented,
  Select,
  TableSkeleton,
  type Column,
} from "@/components/ui";
import { MediaCard } from "@/components/media/MediaCard";
import { MediaPreview } from "@/components/media/MediaPreview";
import { MediaUploader } from "@/components/media/MediaUploader";
import { useDeleteMedia } from "@/components/media/useDeleteMedia";
import { WebsiteSelectField } from "@/components/websites/WebsiteSelectField";
import { useGetMediaListQuery } from "@/store/api/mediaApi";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useDebounce } from "@/hooks/useDebounce";
import { mediaFormat, mediaKind, type MediaKind } from "@/features/media/utils";
import { formatBytes, formatDate, formatRelative } from "@/utils/format";
import type { Media } from "@/types";

const PAGE_SIZE = 24;

export default function MediaLibraryPage() {
  const router = useRouter();
  const q = useGetMediaListQuery();
  const [search, setSearch] = useState("");
  const [website, setWebsite] = useState("");
  const [kind, setKind] = useState<"all" | MediaKind>("all");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(1);
  const [uploadWebsite, setUploadWebsite] = useState("");
  const uploadModal = useDisclosure();
  const debounced = useDebounce(search);
  const { requestDelete, dialog } = useDeleteMedia();

  const items = useMemo(() => q.data?.items ?? [], [q.data]);
  const websiteOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of items) if (m.websiteId) map.set(m.websiteId, m.website?.name ?? m.websiteId);
    return [...map].map(([value, label]) => ({ value, label }));
  }, [items]);

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    return items
      .filter(
        (m) =>
          (!website || m.websiteId === website) &&
          (kind === "all" || mediaKind(m) === kind) &&
          (!term || m.filename.toLowerCase().includes(term) || (m.alt ?? "").toLowerCase().includes(term) || (m.blog?.title ?? "").toLowerCase().includes(term)),
      )
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  }, [items, debounced, website, kind]);

  const totalSize = useMemo(() => items.reduce((sum, m) => sum + (m.size ?? 0), 0), [items]);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clear = () => {
    setSearch("");
    setWebsite("");
    setKind("all");
    setPage(1);
  };

  const actions = (m: Media) => (
    <RowActions>
      <Menu
        width="w-44"
        trigger={({ toggle }) => (
          <Button variant="ghost" size="icon-sm" onClick={toggle} aria-label={`Actions for ${m.filename}`}>
            <MoreHorizontal />
          </Button>
        )}
      >
        <MenuItem href={`/dashboard/media/${m.id}`} icon={<Eye />}>
          View
        </MenuItem>
        <MenuItem href={`/dashboard/media/${m.id}/edit`} icon={<Pencil />}>
          Edit
        </MenuItem>
        <MenuSeparator />
        <MenuItem onClick={() => requestDelete(m)} icon={<Trash2 />} danger>
          Delete
        </MenuItem>
      </Menu>
    </RowActions>
  );

  const columns: Column<Media>[] = [
    {
      key: "file",
      header: "File",
      sortValue: (m) => m.filename,
      cell: (m) => (
        <div className="flex items-center gap-3">
          <span className="size-11 shrink-0 overflow-hidden rounded-lg border border-border">
            <MediaPreview media={m} />
          </span>
          <div className="min-w-0">
            <Link href={`/dashboard/media/${m.id}`} onClick={(e) => e.stopPropagation()} className="block max-w-[280px] truncate font-medium text-fg hover:text-brand">
              {m.filename}
            </Link>
            <div className="text-xs text-muted">{mediaFormat(m)}</div>
          </div>
        </div>
      ),
    },
    { key: "size", header: "Size", align: "right", sortValue: (m) => m.size, cell: (m) => <span className="tabular-nums text-muted">{formatBytes(m.size)}</span> },
    { key: "website", header: "Website", sortValue: (m) => m.website?.name, cell: (m) => <span className="text-fg">{m.website?.name ?? "—"}</span> },
    { key: "blog", header: "Blog", cell: (m) => <span className="block max-w-[200px] truncate text-muted">{m.blog?.title ?? "—"}</span> },
    {
      key: "uploaded",
      header: "Uploaded",
      sortValue: (m) => (m.createdAt ? new Date(m.createdAt) : undefined),
      cell: (m) => (
        <span className="whitespace-nowrap text-muted" title={formatDate(m.createdAt)}>
          {formatRelative(m.createdAt)}
        </span>
      ),
    },
    { key: "actions", header: <span className="sr-only">Actions</span>, align: "right", cell: actions },
  ];

  const toolbar = (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search files, alt text, blog…" />
      <div className="flex flex-wrap items-center gap-2">
        {websiteOptions.length > 1 && (
          <Select
            value={website}
            onChange={(e) => { setWebsite(e.target.value); setPage(1); }}
            options={websiteOptions}
            placeholder="All websites"
            className="h-8 w-40 text-[13px]"
            aria-label="Filter by website"
          />
        )}
        <Segmented<"all" | MediaKind>
          value={kind}
          onChange={(v) => { setKind(v); setPage(1); }}
          items={[
            { value: "all", label: "All" },
            { value: "image", label: "Images" },
            { value: "video", label: "Video" },
            { value: "document", label: "Docs" },
          ]}
        />
        <Segmented
          value={view}
          onChange={setView}
          items={[
            { value: "grid", label: <span className="sr-only">Grid</span>, icon: <LayoutGrid /> },
            { value: "table", label: <span className="sr-only">Table</span>, icon: <List /> },
          ]}
        />
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Media Library"
        description={q.data ? `${items.length} file${items.length === 1 ? "" : "s"} · ${formatBytes(totalSize)} stored in Cloudinary` : "Images and files used across your websites."}
        actions={
          <>
            <ButtonLink href="/dashboard/media/upload" variant="secondary" className="hidden sm:inline-flex">
              Upload page
            </ButtonLink>
            <Button onClick={uploadModal.open} leftIcon={<CloudUpload />}>
              Upload media
            </Button>
          </>
        }
      />

      <QueryState
        query={q}
        loading={view === "grid" ? <GridSkeleton /> : <TableSkeleton />}
        isEmpty={(d) => d.items.length === 0}
        empty={
          <div className="card">
            <EmptyState
              icon={<ImageIcon />}
              title="Your media library is empty"
              description="Upload images to use as hero images, social images and inline blog content."
              action={
                <Button onClick={uploadModal.open} leftIcon={<CloudUpload />}>
                  Upload media
                </Button>
              }
            />
          </div>
        }
      >
        {() =>
          view === "table" ? (
            <DataTable
              data={filtered}
              columns={columns}
              getRowId={(m) => m.id}
              onRowClick={(m) => router.push(`/dashboard/media/${m.id}`)}
              initialSort={{ key: "uploaded", dir: "desc" }}
              toolbar={toolbar}
              empty={<NoResults onClear={clear} />}
              renderMobileRow={(m) => (
                <div className="flex items-center gap-3">
                  <span className="size-12 shrink-0 overflow-hidden rounded-lg border border-border">
                    <MediaPreview media={m} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-fg">{m.filename}</div>
                    <div className="truncate text-xs text-muted">
                      {formatBytes(m.size)} · {m.website?.name ?? "No website"}
                    </div>
                  </div>
                  {actions(m)}
                </div>
              )}
            />
          ) : (
            <div className="space-y-4">
              <div className="card px-4 py-3 sm:px-5">{toolbar}</div>
              {filtered.length === 0 ? (
                <div className="card">
                  <NoResults onClear={clear} />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {pageItems.map((m) => (
                      <MediaCard key={m.id} media={m} onDelete={requestDelete} />
                    ))}
                  </div>
                  {filtered.length > PAGE_SIZE && (
                    <div className="card">
                      <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
                    </div>
                  )}
                </>
              )}
            </div>
          )
        }
      </QueryState>

      <Modal open={uploadModal.isOpen} onClose={uploadModal.close} size="lg" title="Upload media" description="Files are uploaded through the Solvix backend to Cloudinary.">
        <div className="space-y-4 pb-3">
          <WebsiteSelectField value={uploadWebsite} onChange={setUploadWebsite} label="Website" allowEmpty emptyLabel="No specific website" id="upload-website" />
          <MediaUploader websiteId={uploadWebsite} />
        </div>
      </Modal>
      {dialog}
    </>
  );
}
