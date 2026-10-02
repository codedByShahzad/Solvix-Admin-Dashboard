import type { Section } from "@/types";

/** Read-only rendering of Blog.sections (article preview). */
export function BlogContent({ sections }: { sections: Section[] }) {
  if (!sections.length) return <p className="text-sm italic text-subtle">This post has no content yet.</p>;
  return (
    <div className="space-y-8 text-[15px] leading-[1.75] text-fg/90">
      {sections.map((s) => (
        <section key={s.id} id={s.id} className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-fg">{s.title}</h2>
          {s.blocks.map((b, i) =>
            b.type === "list" ? (
              <ul key={i} className="list-disc space-y-1.5 pl-6 marker:text-subtle">
                {(b.items ?? []).filter(Boolean).map((it, j) => (
                  <li key={j}>{it}</li>
                ))}
              </ul>
            ) : (
              <p key={i} className="whitespace-pre-line">
                {b.text}
              </p>
            ),
          )}
        </section>
      ))}
    </div>
  );
}
