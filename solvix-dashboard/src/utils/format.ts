const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function toDate(value?: string | number | Date | null): Date | null {
  if (value === undefined || value === null || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value?: string | number | Date | null, fallback = "—"): string {
  const d = toDate(value);
  return d ? dateFmt.format(d) : fallback;
}

const utcDateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** Calendar dates stored as UTC midnight (Blog.publishDate) — shown without timezone shift. */
export function formatCalendarDate(value?: string | number | Date | null, fallback = "—"): string {
  const d = toDate(value);
  return d ? utcDateFmt.format(d) : fallback;
}

export function formatDateTime(value?: string | number | Date | null, fallback = "—"): string {
  const d = toDate(value);
  return d ? dateTimeFmt.format(d) : fallback;
}

export function formatRelative(value?: string | number | Date | null, fallback = "—"): string {
  const d = toDate(value);
  if (!d) return fallback;
  const diff = d.getTime() - Date.now();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["week", 604_800_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return "just now";
}

export function formatBytes(bytes?: number, fallback = "—"): string {
  if (bytes === undefined || !Number.isFinite(bytes)) return fallback;
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${units[i]}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function initials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

export function capitalize(s?: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

/** Stored date → value for <input type="date"> (UTC calendar date, matching how it is saved). */
export function toDateInput(value?: string): string {
  const d = toDate(value);
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

/** Today's date in the user's timezone, as YYYY-MM-DD. */
export function todayInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function hostOf(domain?: string): string {
  if (!domain) return "";
  return domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

export function siteUrl(domain?: string, path = ""): string | undefined {
  const host = hostOf(domain);
  if (!host) return undefined;
  return `https://${host}${path.startsWith("/") || !path ? path : `/${path}`}`;
}
