"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

interface MenuProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
  width?: string;
}

/** Lightweight dropdown: click-outside + Escape to close, arrow-key navigation. */
export function Menu({ trigger, children, align = "right", className, width = "w-56" }: MenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const items = Array.from(ref.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? []);
        if (!items.length) return;
        e.preventDefault();
        const idx = items.indexOf(document.activeElement as HTMLElement);
        const next = e.key === "ArrowDown" ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
        items[next].focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          role="menu"
          onClick={() => setOpen(false)}
          className={cn(
            "absolute z-50 mt-2 origin-top animate-scale-in overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-pop",
            align === "right" ? "right-0" : "left-0",
            width,
            className,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

const itemClass = (danger?: boolean) =>
  cn(
    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors focus:outline-none [&_svg]:size-4 [&_svg]:shrink-0",
    danger
      ? "text-danger hover:bg-danger-soft focus:bg-danger-soft"
      : "text-fg hover:bg-surface-2 focus:bg-surface-2 [&_svg]:text-muted",
  );

export function MenuItem({
  children,
  onClick,
  href,
  icon,
  danger,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  danger?: boolean;
}) {
  if (href) {
    return (
      <Link role="menuitem" href={href} className={itemClass(danger)}>
        {icon}
        {children}
      </Link>
    );
  }
  return (
    <button role="menuitem" type="button" onClick={onClick} className={itemClass(danger)}>
      {icon}
      {children}
    </button>
  );
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-border" role="separator" />;
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-2.5 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wider text-subtle">{children}</div>;
}
