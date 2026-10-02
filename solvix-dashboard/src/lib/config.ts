/**
 * Central runtime configuration. Only public, non-secret values belong here —
 * anything prefixed NEXT_PUBLIC_ is shipped to the browser.
 */
const DEFAULT_API_URL = "http://localhost:8000/api/v1";

export const config = {
  apiUrl: (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, ""),
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
