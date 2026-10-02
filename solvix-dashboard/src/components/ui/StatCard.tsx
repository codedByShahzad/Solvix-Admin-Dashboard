import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Skeleton } from "./Skeleton";

export type StatState = "loading" | "ready" | "error";

export function StatCard({
  label,
  value,
  icon,
  state,
  hint,
  href,
  accent = "brand",
}: {
  label: string;
  value?: number | string;
  icon: ReactNode;
  state: StatState;
  hint?: ReactNode;
  href?: string;
  accent?: "brand" | "success" | "warning" | "info" | "neutral";
}) {
  const accents = {
    brand: "bg-brand-soft text-brand",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    info: "bg-info-soft text-info",
    neutral: "bg-surface-2 text-muted",
  };

  const body = (
    <div className="flex h-full flex-col justify-between gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium text-muted">{label}</span>
        <span className={cn("flex size-9 items-center justify-center rounded-xl [&_svg]:size-[18px]", accents[accent])}>{icon}</span>
      </div>
      <div>
        {state === "loading" && <Skeleton className="h-8 w-16" />}
        {state === "ready" && <div className="text-[28px] font-semibold leading-none tracking-tight tabular-nums text-fg">{value}</div>}
        {state === "error" && <div className="text-sm font-medium text-subtle">Unavailable</div>}
        <div className="mt-1.5 min-h-[18px] text-xs text-muted">{state === "ready" ? hint : null}</div>
      </div>
    </div>
  );

  if (href && state === "ready") {
    return (
      <Link href={href} className="card group relative block transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-pop">
        {body}
        <ArrowUpRight className="absolute bottom-5 right-5 size-4 text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>
    );
  }
  return <div className="card">{body}</div>;
}
