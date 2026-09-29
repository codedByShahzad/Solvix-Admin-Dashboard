/**
 * Central runtime configuration. Every other file reads from here —
 * never read process.env directly elsewhere.
 */
const DEFAULT_API_URL = "http://localhost:8000/api/v1";

export const config = {
  apiUrl: (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, ""),
  /** Sample-data preview on the login page. Anything except "false" enables it. */
  demoEnabled: process.env.NEXT_PUBLIC_ENABLE_DEMO !== "false",
  appName: "Solvix",
  companyName: "Soldevix Solutions",
} as const;

export const STORAGE_KEYS = {
  session: "solvix.session",
  sidebarCollapsed: "solvix.sidebar.collapsed",
} as const;

export const COOKIE_KEYS = {
  token: "solvix_token",
  role: "solvix_role",
} as const;
