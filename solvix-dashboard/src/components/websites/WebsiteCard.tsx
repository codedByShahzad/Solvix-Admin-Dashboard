import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { WebsiteStatusBadge } from "./WebsiteStatusBadge";
import { formatDate, hostOf, siteUrl } from "@/utils/format";
import type { Website } from "@/types";
import { WebsiteAvatar } from "./WebsiteAvatar";

export function WebsiteCard({ website, blogCount }: { website: Website; blogCount?: number }) {
  return (
    <Link
      href={`/dashboard/websites/${website.id}`}
      className="card group flex flex-col gap-4 p-5 transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-pop"
    >
      <div className="flex items-start justify-between gap-3">
        <WebsiteAvatar website={website} size="lg" />
        <WebsiteStatusBadge active={website.isActive} />
      </div>
      <div className="min-w-0">
        <h3 className="truncate font-semibold text-fg">{website.name}</h3>
        <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted">
          {hostOf(website.domain) || "No domain"}
          {siteUrl(website.domain) && <ExternalLink className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />}
        </p>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
        <span>{blogCount !== undefined ? `${blogCount} blog${blogCount === 1 ? "" : "s"}` : "—"}</span>
        <span>Added {formatDate(website.createdAt)}</span>
      </div>
    </Link>
  );
}
