import Link from "next/link";
import { FileText } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import { formatRelative } from "@/utils/format";
import type { Blog } from "@/types";

/** Compact blog row for dashboard / detail-page lists. */
export function BlogListItem({ blog, showWebsite }: { blog: Blog; showWebsite?: boolean }) {
  return (
    <Link
      href={`/dashboard/blogs/${blog.id}`}
      className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-2/70"
    >
      <BlogThumb blog={blog} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-fg group-hover:text-brand">{blog.title}</div>
        <div className="mt-0.5 truncate text-xs text-muted">
          {showWebsite && blog.website?.name ? `${blog.website.name} · ` : ""}
          {blog.category ? `${blog.category} · ` : ""}Updated {formatRelative(blog.updatedAt ?? blog.createdAt)}
        </div>
      </div>
      <StatusBadge status={blog.status} />
    </Link>
  );
}

export function BlogThumb({ blog, className = "size-10" }: { blog: Pick<Blog, "heroImage" | "title">; className?: string }) {
  if (blog.heroImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={blog.heroImage} alt="" className={`${className} shrink-0 rounded-lg border border-border object-cover`} />;
  }
  return (
    <span className={`${className} flex shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 text-subtle`}>
      <FileText className="size-4" />
    </span>
  );
}
