"use client";

import { Skeleton } from "@/components/ui";
import { WebsiteAvatar } from "@/components/websites/WebsiteAvatar";
import { cn } from "@/lib/cn";
import type { Website } from "@/types";

export function WebsiteCheckboxList({
  websites,
  value,
  onChange,
  loading,
  disabledIds = [],
}: {
  websites: Website[];
  value: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
  /** Already-assigned websites (shown checked and locked). */
  disabledIds?: string[];
}) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    );
  }
  if (!websites.length) return <p className="text-sm text-muted">You don&apos;t own any websites yet.</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {websites.map((w) => {
        const locked = disabledIds.includes(w.id);
        const checked = locked || value.includes(w.id);
        return (
          <label
            key={w.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3.5 transition-colors",
              locked ? "cursor-default opacity-70" : "cursor-pointer",
              checked ? "border-brand bg-brand-soft/50" : "border-border hover:border-border-strong",
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={locked}
              onChange={() => onChange(checked ? value.filter((x) => x !== w.id) : [...value, w.id])}
              className="size-4 accent-[rgb(var(--brand))]"
            />
            <WebsiteAvatar website={w} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-fg">{w.name}</span>
              <span className="block truncate text-xs text-muted">{locked ? "Already assigned" : w.domain.replace(/^https?:\/\//, "")}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
