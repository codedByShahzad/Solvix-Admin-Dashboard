import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A titled card that groups related form fields. */
export function FormSection({
  id,
  title,
  description,
  icon,
  children,
  className,
  action,
}: {
  id?: string;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section id={id} className={cn("card scroll-mt-24", className)}>
      <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-start gap-3">
          {icon && (
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand [&_svg]:size-4">
              {icon}
            </span>
          )}
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}

/** Sticky bottom bar with form actions (Cancel / Save). */
export function FormActions({ children, className, note }: { children: ReactNode; className?: string; note?: ReactNode }) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 -mx-4 mt-6 flex flex-col-reverse items-stretch gap-3 border-t border-border bg-surface/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:-mx-8 lg:px-8",
        className,
      )}
    >
      <div className="text-xs text-muted">{note}</div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row">{children}</div>
    </div>
  );
}
