import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = { title: "Access denied" };

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="max-w-md text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-danger ring-1 ring-inset ring-danger/15">
          <ShieldAlert className="size-6" />
        </span>
        <p className="mt-6 text-sm font-semibold text-danger">403 — Forbidden</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">You don&apos;t have access to this page</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          This section is only available to administrators. If you need access, ask a Solvix admin to update your permissions.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/dashboard">Go to dashboard</ButtonLink>
          <ButtonLink href="/dashboard/profile" variant="secondary">
            View profile
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
