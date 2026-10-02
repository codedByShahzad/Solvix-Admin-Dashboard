"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { isNavActive, navForRole } from "@/lib/navigation";
import { useAuth } from "@/features/auth/useAuth";
import { Avatar } from "@/components/ui";
import { Logo } from "./Logo";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  /** Mobile drawer mode. */
  mobile?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ collapsed, onToggleCollapsed, mobile, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const sections = navForRole(user?.role);
  const compact = collapsed && !mobile;

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Brand */}
      <div className={cn("flex h-16 shrink-0 items-center border-b border-border", compact ? "justify-center px-2" : "justify-between px-4")}>
        <Link href="/dashboard" onClick={onNavigate} className="focus-ring rounded-lg" aria-label="Solvix dashboard">
          <Logo collapsed={compact} />
        </Link>
        {mobile && (
          <button
            type="button"
            onClick={onNavigate}
            className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4" aria-label="Main">
        {sections.map((section, si) => (
          <div key={si} className={cn(si > 0 && "mt-5")}>
            {section.label &&
              (compact ? (
                <div className="mx-auto mb-2 h-px w-6 bg-border" />
              ) : (
                <div className="mb-1.5 px-3 text-2xs font-semibold uppercase tracking-[0.08em] text-subtle">{section.label}</div>
              ))}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isNavActive(item, pathname);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={compact ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "focus-ring group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                        compact ? "mx-auto size-10 justify-center" : "h-9 px-3",
                        active ? "bg-brand-soft text-brand-soft-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
                      )}
                    >
                      {active && !compact && <span className="absolute -left-3 h-5 w-[3px] rounded-r-full bg-brand" />}
                      <Icon className={cn("size-[18px] shrink-0", active ? "text-brand" : "text-subtle group-hover:text-fg")} />
                      {!compact && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border p-3">
        {!compact && user && (
          <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar name={user.name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-fg">{user.name}</div>
              <div className="truncate text-xs capitalize text-muted">{user.role}</div>
            </div>
          </div>
        )}
        <div className={cn("flex gap-1", compact ? "flex-col items-center" : "items-center")}>
          <button
            type="button"
            onClick={() => signOut()}
            title="Log out"
            className={cn(
              "focus-ring flex items-center gap-3 rounded-lg text-sm font-medium text-muted transition-colors hover:bg-danger-soft hover:text-danger",
              compact ? "size-10 justify-center" : "h-9 flex-1 px-3",
            )}
          >
            <LogOut className="size-[18px]" />
            {!compact && "Log out"}
          </button>
          {!mobile && onToggleCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="focus-ring flex size-9 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-surface-2 hover:text-fg"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
