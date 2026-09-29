import Link from "next/link";
import { Avatar, Badge } from "@/components/ui";
import type { Editor } from "@/types";

/** Profile summary card for an editor. */
export function EditorCard({ editor }: { editor: Editor }) {
  return (
    <Link href={`/dashboard/editors/${editor.id}`} className="card group flex items-center gap-4 p-4 transition-all hover:border-border-strong hover:shadow-pop">
      <Avatar name={editor.name} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-fg group-hover:text-brand">{editor.name}</span>
          <Badge tone={editor.isActive ? "success" : "neutral"} dot>
            {editor.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <div className="truncate text-sm text-muted">{editor.email}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {editor.websites.length ? (
            editor.websites.map((w) => (
              <Badge key={w.id} tone="brand">
                {w.name ?? w.id}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-subtle">No websites assigned</span>
          )}
        </div>
      </div>
    </Link>
  );
}
