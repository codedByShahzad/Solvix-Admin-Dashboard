"use client";

import { ArrowDown, ArrowUp, Heading2, Image as ImageIcon, List, Pilcrow, Plus, Quote, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button, EmptyState, Input, Select, Textarea } from "@/components/ui";
import { ImageField } from "@/components/media/ImageField";
import { uid } from "@/utils/slug";
import type { ContentBlock, ContentBlockType } from "@/types";

const BLOCKS: { type: ContentBlockType; label: string; icon: ReactNode }[] = [
  { type: "paragraph", label: "Paragraph", icon: <Pilcrow /> },
  { type: "heading", label: "Heading", icon: <Heading2 /> },
  { type: "list", label: "List", icon: <List /> },
  { type: "quote", label: "Quote", icon: <Quote /> },
  { type: "image", label: "Image", icon: <ImageIcon /> },
];

function newBlock(type: ContentBlockType): ContentBlock {
  const base = { id: uid("blk"), type };
  if (type === "heading") return { ...base, text: "", level: 2 };
  if (type === "list") return { ...base, items: [""] };
  if (type === "image") return { ...base, src: "", alt: "", caption: "" };
  return { ...base, text: "" };
}

/**
 * Block-based body editor (paragraph / heading / list / quote / image).
 * Block shape NEEDS BACKEND CONFIRMATION against the Blog model's content field.
 */
export function ContentBlocksEditor({
  value,
  onChange,
  websiteId,
  invalid,
}: {
  value: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  websiteId?: string;
  invalid?: boolean;
}) {
  const update = (id: string, patch: Partial<ContentBlock>) => onChange(value.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const remove = (id: string) => onChange(value.filter((b) => b.id !== id));
  const move = (index: number, dir: -1 | 1) => {
    const next = [...value];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const add = (type: ContentBlockType) => onChange([...value, newBlock(type)]);

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <div className={invalid ? "rounded-xl border border-dashed border-danger" : "rounded-xl border border-dashed border-border-strong"}>
          <EmptyState compact icon={<Pilcrow />} title="Start writing" description="Add blocks to build the article body." />
        </div>
      ) : (
        <ol className="space-y-3">
          {value.map((block, i) => {
            const meta = BLOCKS.find((b) => b.type === block.type)!;
            return (
              <li key={block.id} className="group rounded-xl border border-border bg-surface transition-colors focus-within:border-brand/50 hover:border-border-strong">
                <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
                  <span className="flex items-center gap-2 text-xs font-medium text-muted [&_svg]:size-3.5">
                    {meta.icon}
                    {meta.label}
                    <span className="text-subtle">#{i + 1}</span>
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon-sm" className="size-7" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                      <ArrowUp />
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="size-7" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Move down">
                      <ArrowDown />
                    </Button>
                    <Button variant="danger-soft" size="icon-sm" className="size-7" onClick={() => remove(block.id)} aria-label="Delete block">
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  {block.type === "paragraph" && (
                    <Textarea
                      value={block.text ?? ""}
                      onChange={(e) => update(block.id, { text: e.target.value })}
                      rows={4}
                      placeholder="Write a paragraph…"
                      className="border-0 px-1 shadow-none focus:shadow-none"
                    />
                  )}
                  {block.type === "heading" && (
                    <div className="flex gap-2">
                      <Select
                        value={String(block.level ?? 2)}
                        onChange={(e) => update(block.id, { level: Number(e.target.value) as 2 | 3 })}
                        options={[
                          { value: "2", label: "H2" },
                          { value: "3", label: "H3" },
                        ]}
                        className="w-20"
                      />
                      <Input
                        value={block.text ?? ""}
                        onChange={(e) => update(block.id, { text: e.target.value })}
                        placeholder="Section heading"
                        className="text-base font-semibold"
                      />
                    </div>
                  )}
                  {block.type === "quote" && (
                    <div className="border-l-[3px] border-brand pl-3">
                      <Textarea
                        value={block.text ?? ""}
                        onChange={(e) => update(block.id, { text: e.target.value })}
                        rows={2}
                        placeholder="Quote text…"
                        className="border-0 px-1 italic shadow-none focus:shadow-none"
                      />
                    </div>
                  )}
                  {block.type === "list" && (
                    <div className="space-y-2">
                      {(block.items ?? []).map((item, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <span className="size-1.5 shrink-0 rounded-full bg-subtle" />
                          <Input
                            value={item}
                            onChange={(e) => {
                              const items = [...(block.items ?? [])];
                              items[j] = e.target.value;
                              update(block.id, { items });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const items = [...(block.items ?? [])];
                                items.splice(j + 1, 0, "");
                                update(block.id, { items });
                              }
                            }}
                            placeholder={`List item ${j + 1}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => update(block.id, { items: (block.items ?? []).filter((_, k) => k !== j) })}
                            disabled={(block.items ?? []).length <= 1}
                            aria-label="Remove item"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      ))}
                      <Button variant="ghost" size="xs" leftIcon={<Plus />} onClick={() => update(block.id, { items: [...(block.items ?? []), ""] })}>
                        Add item
                      </Button>
                    </div>
                  )}
                  {block.type === "image" && (
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,240px)_1fr]">
                      <ImageField value={block.src ?? ""} onChange={(src) => update(block.id, { src })} websiteId={websiteId} aspect="aspect-[4/3]" />
                      <div className="space-y-2">
                        <Input value={block.alt ?? ""} onChange={(e) => update(block.id, { alt: e.target.value })} placeholder="Alt text (describe the image)" />
                        <Input value={block.caption ?? ""} onChange={(e) => update(block.id, { caption: e.target.value })} placeholder="Caption (optional)" />
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-2/60 p-2">
        <span className="px-1.5 text-xs font-medium text-muted">Add block</span>
        {BLOCKS.map((b) => (
          <Button key={b.type} variant="secondary" size="xs" leftIcon={b.icon} onClick={() => add(b.type)}>
            {b.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
