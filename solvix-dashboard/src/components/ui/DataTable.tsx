"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Pagination } from "./Pagination";

type SortValue = string | number | Date | undefined | null;

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Provide to make the column sortable. */
  sortValue?: (row: T) => SortValue;
  className?: string;
  headerClassName?: string;
  align?: "left" | "right" | "center";
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  /** Card layout rendered below the md breakpoint. */
  renderMobileRow?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  initialSort?: { key: string; dir: "asc" | "desc" };
  pageSize?: number;
  /** Rendered instead of rows when `data` is empty. */
  empty?: ReactNode;
  toolbar?: ReactNode;
}

function compare(a: SortValue, b: SortValue): number {
  if (a === b) return 0;
  if (a === undefined || a === null || a === "") return 1;
  if (b === undefined || b === null || b === "") return -1;
  const av = a instanceof Date ? a.getTime() : a;
  const bv = b instanceof Date ? b.getTime() : b;
  if (typeof av === "number" && typeof bv === "number") return av - bv;
  return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
}

/**
 * Client-side sortable, paginated table. Search & filtering happen in the page
 * (so filters can live in the toolbar); this component handles sort + pages.
 */
export function DataTable<T>({
  data,
  columns,
  getRowId,
  renderMobileRow,
  onRowClick,
  initialSort,
  pageSize: initialPageSize = 10,
  empty,
  toolbar,
}: DataTableProps<T>) {
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => setPage(1), [data.length, pageSize]);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key);
    if (!sort || !col?.sortValue) return data;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...data].sort((a, b) => compare(col.sortValue!(a), col.sortValue!(b)) * dir);
  }, [data, columns, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount);
  const rows = sorted.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : undefined));

  const alignClass = (a?: Column<T>["align"]) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");

  return (
    <div className="card overflow-hidden">
      {toolbar && <div className="border-b border-border px-4 py-3 sm:px-5">{toolbar}</div>}

      {data.length === 0 ? (
        empty
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className={cn("scrollbar-thin overflow-x-auto", renderMobileRow && "hidden md:block")}>
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/60">
                  {columns.map((col) => {
                    const active = sort?.key === col.key;
                    return (
                      <th
                        key={col.key}
                        scope="col"
                        aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                        className={cn(
                          "whitespace-nowrap px-5 py-2.5 text-xs font-medium text-muted",
                          alignClass(col.align),
                          col.headerClassName,
                        )}
                      >
                        {col.sortValue ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(col.key)}
                            className={cn(
                              "focus-ring -mx-1 inline-flex items-center gap-1 rounded px-1 transition-colors hover:text-fg",
                              active && "text-fg",
                            )}
                          >
                            {col.header}
                            {active ? (
                              sort!.dir === "asc" ? (
                                <ArrowUp className="size-3" />
                              ) : (
                                <ArrowDown className="size-3" />
                              )
                            ) : (
                              <ChevronsUpDown className="size-3 opacity-50" />
                            )}
                          </button>
                        ) : (
                          col.header
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={getRowId(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "border-b border-border transition-colors last:border-0",
                      onRowClick && "cursor-pointer hover:bg-surface-2/60",
                    )}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={cn("px-5 py-3 align-middle", alignClass(col.align), col.className)}>
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          {renderMobileRow && (
            <ul className="divide-y divide-border md:hidden">
              {rows.map((row) => (
                <li
                  key={getRowId(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn("px-4 py-3.5", onRowClick && "cursor-pointer active:bg-surface-2")}
                >
                  {renderMobileRow(row)}
                </li>
              ))}
            </ul>
          )}

          {sorted.length > 10 ? (
            <Pagination page={current} pageSize={pageSize} total={sorted.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
          ) : null}
        </>
      )}
    </div>
  );
}

/** Stops row-click navigation when clicking action buttons inside a row. */
export function RowActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-end gap-0.5", className)} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}
