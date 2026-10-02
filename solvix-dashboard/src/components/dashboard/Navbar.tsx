"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, LogOut, Menu as MenuIcon, Search, Settings, UserCircle } from "lucide-react";
import { breadcrumbsFor } from "@/lib/navigation";
import { useAuth } from "@/features/auth/useAuth";
import { Avatar, Menu, MenuItem, MenuLabel, MenuSeparator, RoleBadge } from "@/components/ui";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [query, setQuery] = useState("");
  const crumbs = breadcrumbsFor(pathname);
  const title = crumbs[crumbs.length - 1]?.label ?? "Dashboard";

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/dashboard/blogs?q=${encodeURIComponent(q)}` : "/dashboard/blogs");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="focus-ring -ml-1 rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg lg:hidden"
        aria-label="Open navigation"
      >
        <MenuIcon className="size-5" />
      </button>

      {/* Breadcrumbs / title */}
      <div className="min-w-0 flex-1">
        <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-[13px] sm:flex">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <span key={c.href} className="flex min-w-0 items-center gap-1">
                {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-subtle" />}
                {last ? (
                  <span className="truncate font-medium text-fg" aria-current="page">
                    {c.label}
                  </span>
                ) : (
                  <Link href={c.href} className="truncate text-muted transition-colors hover:text-fg">
                    {c.label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
        <div className="truncate text-[15px] font-semibold text-fg sm:hidden">{title}</div>
      </div>

      {/* Search blogs */}
      <form onSubmit={onSearch} className="hidden md:block" role="search">
        <label className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 size-4 text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search blogs…"
            aria-label="Search blogs"
            className="h-9 w-56 rounded-lg border border-border bg-surface-2/70 pl-9 pr-3 text-sm text-fg transition-all placeholder:text-subtle hover:border-border-strong focus:w-72 focus:border-brand focus:bg-surface focus:shadow-focus focus:outline-none"
          />
        </label>
      </form>

      <ThemeToggle />

      {/* Profile menu */}
      {user && (
        <Menu
          width="w-64"
          trigger={({ toggle, open }) => (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-haspopup="menu"
              className="focus-ring flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-1 transition-colors hover:bg-surface-2 sm:pr-2"
            >
              <Avatar name={user.name} size="sm" />
              <span className="hidden text-left leading-tight sm:block">
                <span className="block max-w-[140px] truncate text-[13px] font-medium text-fg">{user.name}</span>
                <span className="block text-2xs capitalize text-muted">{user.role}</span>
              </span>
              <ChevronDown className="hidden size-3.5 text-subtle sm:block" />
            </button>
          )}
        >
          <div className="flex items-center gap-3 px-2.5 py-2.5">
            <Avatar name={user.name} size="md" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-fg">{user.name}</div>
              <div className="truncate text-xs text-muted">{user.email || "—"}</div>
            </div>
          </div>
          <div className="px-2.5 pb-2">
            <RoleBadge role={user.role} />
          </div>
          <MenuSeparator />
          <MenuLabel>Account</MenuLabel>
          <MenuItem href="/dashboard/profile" icon={<UserCircle />}>
            Profile
          </MenuItem>
          {user.role === "admin" && (
            <MenuItem href="/dashboard/settings" icon={<Settings />}>
              Settings
            </MenuItem>
          )}
          <MenuSeparator />
          <MenuItem onClick={() => signOut()} icon={<LogOut />} danger>
            Log out
          </MenuItem>
        </Menu>
      )}
    </header>
  );
}
