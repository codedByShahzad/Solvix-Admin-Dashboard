"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <AlertTriangle className="size-5" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-fg">This page ran into a problem</h2>
      <p className="mt-1.5 max-w-md text-sm text-muted">An unexpected error occurred while rendering. You can try again or go back to the dashboard.</p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset} leftIcon={<RefreshCw />}>
          Try again
        </Button>
        <ButtonLink href="/dashboard" variant="secondary">
          Dashboard
        </ButtonLink>
      </div>
    </div>
  );
}
