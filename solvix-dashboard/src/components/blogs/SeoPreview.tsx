import { hostOf } from "@/utils/format";

/** Approximate Google search-result preview. */
export function SeoPreview({ title, description, domain, path }: { title: string; description: string; domain?: string; path?: string }) {
  const host = hostOf(domain) || "your-website.com";
  const crumbs = (path ?? "").split("/").filter(Boolean);
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 text-2xs font-semibold uppercase tracking-wider text-subtle">Search preview</div>
      <div className="flex items-center gap-2.5">
        <span className="flex size-7 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-muted">{host.charAt(0).toUpperCase()}</span>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[13px] text-fg">{host}</div>
          <div className="truncate text-xs text-muted">
            https://{host}
            {crumbs.map((c) => ` › ${c}`)}
          </div>
        </div>
      </div>
      <div className="mt-2 line-clamp-1 text-lg leading-snug text-[#1a0dab] dark:text-[#99c3ff]">{title || "Your SEO title appears here"}</div>
      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">
        {description || "Add a meta description to control how this post is summarised in search results."}
      </p>
    </div>
  );
}
