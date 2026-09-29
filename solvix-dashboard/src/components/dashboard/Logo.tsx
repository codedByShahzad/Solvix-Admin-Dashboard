import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8 shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id="solvix-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgb(var(--brand))" />
          <stop offset="1" stopColor="#8B7CF6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#solvix-g)" />
      <path
        d="M20.5 10.5c-1-1.2-2.7-1.9-4.6-1.9-3 0-5.1 1.6-5.1 4 0 2.3 1.7 3.3 4.6 3.9 2.2.5 3 .9 3 1.8 0 1-1 1.6-2.6 1.6-1.8 0-3.2-.7-4.1-1.9l-2 1.8c1.2 1.6 3.3 2.6 6 2.6 3.3 0 5.6-1.6 5.6-4.2 0-2.4-1.6-3.4-4.6-4-2.1-.4-2.9-.8-2.9-1.7 0-.9.9-1.4 2.2-1.4 1.4 0 2.5.5 3.3 1.4l1.8-2z"
        fill="#fff"
      />
    </svg>
  );
}

export function Logo({ collapsed, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <div className="text-[15px] font-semibold tracking-tight text-fg">Solvix</div>
          <div className="truncate text-2xs font-medium text-subtle">Soldevix Solutions</div>
        </div>
      )}
    </div>
  );
}
