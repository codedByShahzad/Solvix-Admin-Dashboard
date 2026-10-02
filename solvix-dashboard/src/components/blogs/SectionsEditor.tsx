"use client";

import { ArrowDown, ArrowUp, List, Pilcrow, Plus, Trash2 } from "lucide-react";
import { Button, EmptyState, Input, Textarea } from "@/components/ui";
import { newSection, type SectionFormValue } from "@/features/blogs/schema";
import { slugify } from "@/utils/slug";
import type { Block } from "@/types";

type SectionErrors = ({ id?: { message?: string }; title?: { message?: string } } | undefined)[] | undefined;

function move<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir;
  if (target < 0 || target >= arr.length) return arr;
  const next = [...arr];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/**
 * Editor for Blog.sections — each section has an anchor `id`, a `title` and
 * blocks that are either a paragraph (`text`) or a list (`items`), exactly as
 * in models/Blog.ts.
 */
export function SectionsEditor({
  value,
  onChange,
  errors,
}: {
  value: SectionFormValue[];
  onChange: (sections: SectionFormValue[]) => void;
  errors?: SectionErrors;
}) {
  const updateSection = (i: number, patch: Partial<SectionFormValue>) => onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const updateBlock = (si: number, bi: number, patch: Partial<Block>) =>
    updateSection(si, { blocks: value[si].blocks.map((b, idx) => (idx === bi ? { ...b, ...patch } : b)) });

  const setTitle = (i: number, title: string) => {
    const s = value[i];
    const autoId = !s.id || s.id === slugify(s.title);
    updateSection(i, { title, ...(autoId ? { id: slugify(title) } : {}) });
  };

  return (
    <div className="space-y-4">
      {value.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong">
          <EmptyState compact icon={<Pilcrow />} title="No sections yet" description="Articles are built from sections — each with a heading, paragraphs and lists." />
        </div>
      ) : (
        <ol className="space-y-4">
          {value.map((section, si) => (
            <li key={section.key} className="rounded-xl border border-border bg-surface transition-colors focus-within:border-brand/50">
              <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-2/50 px-3 py-1.5">
                <span className="text-xs font-medium text-muted">Section {si + 1}</span>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon-sm" className="size-7" onClick={() => onChange(move(value, si, -1))} disabled={si === 0} aria-label="Move section up">
                    <ArrowUp />
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="size-7" onClick={() => onChange(move(value, si, 1))} disabled={si === value.length - 1} aria-label="Move section down">
                    <ArrowDown />
                  </Button>
                  <Button variant="danger-soft" size="icon-sm" className="size-7" onClick={() => onChange(value.filter((_, idx) => idx !== si))} aria-label="Delete section">
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <div className="space-y-3 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_200px]">
                  <div>
                    <Input
                      value={section.title}
                      onChange={(e) => setTitle(si, e.target.value)}
                      placeholder="Section heading"
                      className="text-base font-semibold"
                      invalid={!!errors?.[si]?.title}
                      aria-label={`Section ${si + 1} title`}
                    />
                    {errors?.[si]?.title?.message && <p className="mt-1 text-xs font-medium text-danger">{errors[si]?.title?.message}</p>}
                  </div>
                  <div>
                    <Input
                      value={section.id}
                      onChange={(e) => updateSection(si, { id: e.target.value })}
                      prefixText="#"
                      placeholder="section-id"
                      className="font-mono text-[13px]"
                      invalid={!!errors?.[si]?.id}
                      aria-label={`Section ${si + 1} anchor ID`}
                    />
                    {errors?.[si]?.id?.message && <p className="mt-1 text-xs font-medium text-danger">{errors[si]?.id?.message}</p>}
                  </div>
                </div>

                {section.blocks.map((block, bi) => (
                  <div key={bi} className="group flex gap-2">
                    <span className="mt-2.5 flex size-5 shrink-0 items-center justify-center text-subtle" title={block.type === "list" ? "List" : "Paragraph"}>
                      {block.type === "list" ? <List className="size-4" /> : <Pilcrow className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      {block.type === "paragraph" ? (
                        <Textarea value={block.text ?? ""} onChange={(e) => updateBlock(si, bi, { text: e.target.value })} rows={3} placeholder="Write a paragraph…" />
                      ) : (
                        <div className="space-y-2 rounded-lg border border-border p-2">
                          {(block.items ?? []).map((item, ii) => (
                            <div key={ii} className="flex items-center gap-2">
                              <span className="size-1.5 shrink-0 rounded-full bg-subtle" />
                              <Input
                                value={item}
                                onChange={(e) => {
                                  const items = [...(block.items ?? [])];
                                  items[ii] = e.target.value;
                                  updateBlock(si, bi, { items });
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    const items = [...(block.items ?? [])];
                                    items.splice(ii + 1, 0, "");
                                    updateBlock(si, bi, { items });
                                  }
                                }}
                                placeholder={`List item ${ii + 1}`}
                              />
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => updateBlock(si, bi, { items: (block.items ?? []).filter((_, k) => k !== ii) })}
                                disabled={(block.items ?? []).length <= 1}
                                aria-label="Remove item"
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          ))}
                          <Button variant="ghost" size="xs" leftIcon={<Plus />} onClick={() => updateBlock(si, bi, { items: [...(block.items ?? []), ""] })}>
                            Add item
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 opacity-60 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                      <Button variant="ghost" size="icon-sm" className="size-7" onClick={() => updateSection(si, { blocks: move(section.blocks, bi, -1) })} disabled={bi === 0} aria-label="Move block up">
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="danger-soft"
                        size="icon-sm"
                        className="size-7"
                        onClick={() => updateSection(si, { blocks: section.blocks.filter((_, k) => k !== bi) })}
                        aria-label="Delete block"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex flex-wrap gap-2 pl-7">
                  <Button variant="secondary" size="xs" leftIcon={<Pilcrow />} onClick={() => updateSection(si, { blocks: [...section.blocks, { type: "paragraph", text: "" }] })}>
                    Paragraph
                  </Button>
                  <Button variant="secondary" size="xs" leftIcon={<List />} onClick={() => updateSection(si, { blocks: [...section.blocks, { type: "list", items: [""] }] })}>
                    List
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Button variant="secondary" className="w-full border-dashed" leftIcon={<Plus />} onClick={() => onChange([...value, newSection()])}>
        Add section
      </Button>
    </div>
  );
}
