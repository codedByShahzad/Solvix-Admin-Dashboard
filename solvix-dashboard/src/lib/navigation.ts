import {
  FileText,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  Settings,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
  /** Match nested routes (e.g. /dashboard/blogs/123) as active. */
  exact?: boolean;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

/**
 * Single source of truth for navigation AND route access.
 *   Shared (admin + editor): Dashboard, Blogs, Media, Profile
 *   Admin-only:              Websites, Editors, Settings
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "editor"], exact: true }],
  },
  {
    label: "Content",
    items: [
      { label: "Websites", href: "/dashboard/websites", icon: Globe, roles: ["admin"] },
      { label: "Blogs", href: "/dashboard/blogs", icon: FileText, roles: ["admin", "editor"] },
      { label: "Media", href: "/dashboard/media", icon: ImageIcon, roles: ["admin", "editor"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Editors", href: "/dashboard/editors", icon: Users, roles: ["admin"] },
      { label: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["admin"] },
    ],
  },
  {
    label: "Account",
    items: [{ label: "Profile", href: "/dashboard/profile", icon: UserCircle, roles: ["admin", "editor"] }],
  },
];

/** Admin-only route prefixes (used by middleware + RoleGate). */
export const ADMIN_ONLY_PREFIXES = ["/dashboard/websites", "/dashboard/editors", "/dashboard/settings"];

export function navForRole(role: Role | undefined): NavSection[] {
  if (!role) return [];
  return NAV_SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => i.roles.includes(role)) })).filter(
    (s) => s.items.length > 0,
  );
}

export function isNavActive(item: NavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  websites: "Websites",
  blogs: "Blogs",
  media: "Media",
  editors: "Editors",
  settings: "Settings",
  profile: "Profile",
  create: "Create",
  upload: "Upload",
  edit: "Edit",
};

export interface Crumb {
  label: string;
  href: string;
}

export function breadcrumbsFor(pathname: string): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((part, i) => ({
    label: SEGMENT_LABELS[part] ?? "Details",
    href: "/" + parts.slice(0, i + 1).join("/"),
  }));
}
