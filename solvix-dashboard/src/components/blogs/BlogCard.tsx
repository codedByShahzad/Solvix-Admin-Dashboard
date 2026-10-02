import Link from "next/link";
import { Clock, FileText } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import { formatCalendarDate, formatDate } from "@/utils/format";
import type { Blog } from "@/types";

export function BlogCard({ blog }: { blog: Blog }) {
  return (
    <Link
      href={`/dashboard/blogs/${blog.id}`}
      className="card group flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-pop"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
        {blog.heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={blog.heroImage} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex size-full items-center justify-center text-subtle">
            <FileText className="size-8" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StatusBadge status={blog.status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1.5 flex items-center gap-2 text-xs text-muted">
          {blog.website?.name && <span className="font-medium text-brand">{blog.website.name}</span>}
          {blog.category && <span>· {blog.category}</span>}
        </div>
        <h3 className="line-clamp-2 font-semibold leading-snug text-fg group-hover:text-brand">{blog.title}</h3>
        {blog.subtitle && <p className="mt-1 line-clamp-2 text-sm text-muted">{blog.subtitle}</p>}
        <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted">
          <span>{blog.publishDate ? formatCalendarDate(blog.publishDate) : formatDate(blog.updatedAt)}</span>
          {blog.readingTime ? (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {blog.readingTime}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
