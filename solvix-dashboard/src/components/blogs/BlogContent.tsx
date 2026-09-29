import type { ContentBlock } from "@/types";

/** Read-only rendering of content blocks (article preview). */
export function BlogContent({ blocks }: { blocks: ContentBlock[] }) {
  if (!blocks.length) return <p className="text-sm italic text-subtle">This post has no content yet.</p>;
  return (
    <div className="space-y-5 text-[15px] leading-[1.75] text-fg/90">
      {blocks.map((b) => {
        switch (b.type) {
          case "heading":
            return b.level === 3 ? (
              <h3 key={b.id} className="pt-2 text-lg font-semibold tracking-tight text-fg">
                {b.text}
              </h3>
            ) : (
              <h2 key={b.id} className="pt-3 text-xl font-semibold tracking-tight text-fg">
                {b.text}
              </h2>
            );
          case "quote":
            return (
              <blockquote key={b.id} className="border-l-[3px] border-brand bg-brand-soft/40 py-2 pl-4 pr-3 italic text-fg">
                {b.text}
              </blockquote>
            );
          case "list":
            return (
              <ul key={b.id} className="list-disc space-y-1.5 pl-6 marker:text-subtle">
                {(b.items ?? []).filter(Boolean).map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            );
          case "image":
            return b.src ? (
              <figure key={b.id} className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.src} alt={b.alt ?? ""} className="w-full rounded-xl border border-border" />
                {b.caption && <figcaption className="text-center text-xs text-muted">{b.caption}</figcaption>}
              </figure>
            ) : null;
          default:
            return (
              <p key={b.id} className="whitespace-pre-line">
                {b.text}
              </p>
            );
        }
      })}
    </div>
  );
}
