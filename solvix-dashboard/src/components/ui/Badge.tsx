import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-muted ring-border",
  brand: "bg-brand-soft text-brand-soft-fg ring-brand/20",
  success: "bg-success-soft text-success ring-success/20",
  warning: "bg-warning-soft text-warning ring-warning/20",
  danger: "bg-danger-soft text-danger ring-danger/20",
  info: "bg-info-soft text-info ring-info/20",
};

const DOTS: Record<BadgeTone, string> = {
  neutral: "bg-subtle",
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

export function Badge({
  tone = "neutral",
  dot,
  className,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", DOTS[tone])} />}
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, BadgeTone> = {
  published: "success",
  active: "success",
  draft: "warning",
  inactive: "neutral",
  revoked: "danger",
  archived: "neutral",
  scheduled: "info",
};

export function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? "unknown").toLowerCase();
  return (
    <Badge tone={STATUS_TONES[s] ?? "neutral"} dot>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: string }) {
  return <Badge tone={role === "admin" ? "brand" : "info"}>{role === "admin" ? "Admin" : "Editor"}</Badge>;
}
