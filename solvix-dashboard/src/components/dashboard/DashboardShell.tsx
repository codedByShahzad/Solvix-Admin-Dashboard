"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { STORAGE_KEYS } from "@/lib/config";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setMobileNavOpen, setSidebarCollapsed } from "@/features/ui/uiSlice";
import { useAuth } from "@/features/auth/useAuth";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { LogoMark } from "./Logo";

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg">
      <LogoMark className="size-10 animate-pulse" />
      <div className="flex items-center gap-2 text-sm text-muted">
        <Loader2 className="size-4 animate-spin" />
        Loading your workspace…
      </div>
    </div>
  );
}

/** One shell for both roles — navigation adapts to the signed-in user's role. */
export function DashboardShell({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const { status } = useAuth();
  const { sidebarCollapsed, mobileNavOpen } = useAppSelector((s) => s.ui);

  // Restore collapsed preference
  useEffect(() => {
    try {
      dispatch(setSidebarCollapsed(localStorage.getItem(STORAGE_KEYS.sidebarCollapsed) === "1"));
    } catch {
      /* ignore */
    }
  }, [dispatch]);

  // Close drawer on navigation
  useEffect(() => {
    dispatch(setMobileNavOpen(false));
  }, [pathname, dispatch]);

  // Lock scroll while drawer is open
  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dispatch(setMobileNavOpen(false));
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileNavOpen, dispatch]);

  const toggleCollapsed = () => {
    const next = !sidebarCollapsed;
    dispatch(setSidebarCollapsed(next));
    try {
      localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  if (status !== "authenticated") return <FullScreenLoader />;

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-border transition-[width] duration-200 ease-out lg:block",
          sidebarCollapsed ? "w-[76px]" : "w-64",
        )}
      >
        <Sidebar collapsed={sidebarCollapsed} onToggleCollapsed={toggleCollapsed} />
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={() => dispatch(setMobileNavOpen(false))} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-slide-in-left border-r border-border shadow-pop">
            <Sidebar collapsed={false} mobile onNavigate={() => dispatch(setMobileNavOpen(false))} />
          </aside>
        </div>
      )}

      <div className={cn("flex min-h-screen flex-col transition-[padding] duration-200 ease-out", sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
        <Navbar onOpenMobileNav={() => dispatch(setMobileNavOpen(true))} />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
