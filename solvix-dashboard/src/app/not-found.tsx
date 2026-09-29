import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-bg px-6 py-16">
      <div className="max-w-md text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand ring-1 ring-inset ring-brand/15">
          <Compass className="size-6" />
        </span>
        <p className="mt-6 text-sm font-semibold text-brand">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">Page not found</h1>
        <p className="mt-3 text-sm text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-8">
          <ButtonLink href="/dashboard">Back to dashboard</ButtonLink>
        </div>
      </div>
    </div>
  );
}
