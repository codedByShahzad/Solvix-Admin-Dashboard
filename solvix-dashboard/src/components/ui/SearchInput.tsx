"use client";

import { Search, X } from "lucide-react";
import { Input } from "./Field";
import { cn } from "@/lib/cn";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("w-full sm:w-72", className)}>
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        leftIcon={<Search />}
        className="[&::-webkit-search-cancel-button]:hidden"
        rightSlot={
          value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-md p-1 text-subtle hover:bg-surface-2 hover:text-fg"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : undefined
        }
      />
    </div>
  );
}
