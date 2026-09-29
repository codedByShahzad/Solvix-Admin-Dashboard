"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { ForbiddenState } from "@/components/ui";
import type { Role } from "@/types";

/** Page-level guard. UI only — the backend enforces authorization. */
export function RoleGate({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;
  if (!roles.includes(user.role)) {
    return (
      <div className="card">
        <ForbiddenState />
      </div>
    );
  }
  return <>{children}</>;
}

/** Inline guard: renders children only for admins. */
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { user } = useAuth();
  return <>{user?.role === "admin" ? children : fallback}</>;
}
