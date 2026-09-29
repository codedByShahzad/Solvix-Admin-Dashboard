import type { ReactNode } from "react";
import { RoleGate } from "@/components/auth/RoleGate";

/** Admin-only section. */
export default function AdminSectionLayout({ children }: { children: ReactNode }) {
  return <RoleGate roles={["admin"]}>{children}</RoleGate>;
}
