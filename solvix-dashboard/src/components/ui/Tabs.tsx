"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem<V extends string> {
  value: V;
  label: ReactNode;
  count?: number;
  icon?: ReactNode;
}

/** Underline tabs for page sections. */
export function Tabs<V extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<V>[];
  value: V;
  onChange: (v: V) => void;
  className?: string;
}) {
  return (
    <div className={cn("scrollbar-thin -mb-px flex gap-1 overflow-x-auto border-b border-border", className)} role="tablist">
      {items.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              "focus-ring relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-t-md px-3 pb-2.5 pt-2 text-sm font-medium transition-colors [&_svg]:size-4",
              active ? "text-fg" : "text-muted hover:text-fg",
            )}
          >
            {t.icon}
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-2xs font-semibold tabular-nums",
                  active ? "bg-brand-soft text-brand-soft-fg" : "bg-surface-2 text-muted",
                )}
              >
                {t.count}
              </span>
            )}
            {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />}
          </button>
        );
      })}
    </div>
  );
}

/** Pill segmented control for compact filters / view toggles. */
export function Segmented<V extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: { value: V; label: ReactNode; icon?: ReactNode }[];
  value: V;
  onChange: (v: V) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface-2 p-0.5", className)}>
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onChange(it.value)}
          aria-pressed={it.value === value}
          className={cn(
            "focus-ring inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition-all [&_svg]:size-3.5",
            it.value === value ? "bg-surface text-fg shadow-xs" : "text-muted hover:text-fg",
          )}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </div>
  );
}
