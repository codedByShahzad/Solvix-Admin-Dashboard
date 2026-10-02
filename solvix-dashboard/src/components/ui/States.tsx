"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, Inbox, Loader2, RefreshCw, SearchX, ShieldAlert, WifiOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { isApiError, isForbidden, isNotFound, type ApiError } from "@/lib/api/errors";
import { Button, ButtonLink } from "./Button";

function StateShell({
  icon,
  tone = "neutral",
  title,
  description,
  action,
  className,
  compact,
}: {
  icon: ReactNode;
  tone?: "neutral" | "danger" | "warning" | "brand";
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const toneClass = {
    neutral: "bg-surface-2 text-muted ring-border",
    danger: "bg-danger-soft text-danger ring-danger/15",
    warning: "bg-warning-soft text-warning ring-warning/15",
    brand: "bg-brand-soft text-brand ring-brand/15",
  }[tone];
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "px-4 py-8" : "px-6 py-14", className)}>
      <span className={cn("flex size-12 items-center justify-center rounded-2xl ring-1 ring-inset [&_svg]:size-5", toneClass)}>
        {icon}
      </span>
      <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-fg">{title}</h3>
      {description && <div className="mt-1.5 max-w-md text-sm leading-relaxed text-muted">{description}</div>}
      {action && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon = <Inbox />,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return <StateShell icon={icon} title={title} description={description} action={action} className={className} compact={compact} />;
}

export function NoResults({ onClear }: { onClear?: () => void }) {
  return (
    <StateShell
      icon={<SearchX />}
      title="No matching results"
      description="Try a different search term or clear the filters."
      action={
        onClear && (
          <Button variant="secondary" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        )
      }
    />
  );
}

export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2.5 py-16 text-sm text-muted", className)} role="status">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

export function ForbiddenState({ compact, message }: { compact?: boolean; message?: string }) {
  return (
    <StateShell
      compact={compact}
      tone="danger"
      icon={<ShieldAlert />}
      title="You don't have access"
      description={message ?? "Your account doesn't have permission to view this. Ask an admin if you think this is a mistake."}
      action={
        <ButtonLink href="/dashboard" variant="secondary" size="sm">
          Back to dashboard
        </ButtonLink>
      }
    />
  );
}

export function ErrorState({
  error,
  onRetry,
  compact,
  className,
  notFoundHref,
}: {
  error?: unknown;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
  notFoundHref?: string;
}) {
  if (isForbidden(error)) return <ForbiddenState compact={compact} message={(error as ApiError).message} />;
  if (isNotFound(error)) {
    return (
      <StateShell
        compact={compact}
        className={className}
        icon={<SearchX />}
        title="Not found"
        description={(isApiError(error) && error.message) || "This item doesn't exist or may have been deleted."}
        action={
          notFoundHref && (
            <Link href={notFoundHref} className="text-sm font-medium text-brand hover:underline">
              Go back
            </Link>
          )
        }
      />
    );
  }
  const apiError = isApiError(error) ? (error as ApiError) : undefined;
  const offline = apiError?.status === "FETCH_ERROR" || apiError?.status === "TIMEOUT_ERROR";
  return (
    <StateShell
      compact={compact}
      className={className}
      tone="danger"
      icon={offline ? <WifiOff /> : <AlertCircle />}
      title={offline ? "Can't reach the server" : "Something went wrong"}
      description={apiError?.message ?? "We couldn't load this data. Please try again."}
      action={
        onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry} leftIcon={<RefreshCw />}>
            Try again
          </Button>
        )
      }
    />
  );
}

interface QueryLike<T> {
  data?: T;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  refetch: () => unknown;
}

/**
 * Renders the four states of an API-driven view — Loading · Error · Empty · Success —
 * so every page handles them the same way.
 */
export function QueryState<T>({
  query,
  loading,
  isEmpty,
  empty,
  children,
  notFoundHref,
  compact,
}: {
  query: QueryLike<T>;
  loading: ReactNode;
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  children: (data: T) => ReactNode;
  notFoundHref?: string;
  compact?: boolean;
}) {
  if (query.isLoading) return <>{loading}</>;
  if (query.isError || query.data === undefined) {
    return (
      <div className={compact ? "" : "card"}>
        <ErrorState error={query.error} onRetry={() => query.refetch()} notFoundHref={notFoundHref} compact={compact} />
      </div>
    );
  }
  if (isEmpty?.(query.data) && empty) return <>{empty}</>;
  return <>{children(query.data)}</>;
}
