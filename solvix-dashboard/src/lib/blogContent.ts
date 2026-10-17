/**
 * Solvix blog content — the ONE implementation of heading IDs, table of
 * contents, safe HTML rendering and legacy-section conversion.
 *
 * This exact file exists twice and must stay byte-identical:
 *   server/src/utils/blogContent.ts          (validates + derives on save)
 *   solvix-dashboard/src/lib/blogContent.ts  (editor TOC preview + article preview)
 * `npm test` in server/ fails if the two copies differ.
 *
 * Canonical content is a Tiptap / ProseMirror JSON document (Blog.contentJson).
 * Everything else — contentHtml, toc and the legacy `sections` array — is
 * derived from it, so the TOC can never disagree with the article.
 *
 * Pure TypeScript, no dependencies, no DOM: safe on the server and in the browser.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ContentMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface ContentNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ContentNode[];
  text?: string;
  marks?: ContentMark[];
}

export interface ContentDoc {
  type: "doc";
  content: ContentNode[];
}

/** `{ id, title }` is the shape TOC consumers already use; `level` is 2 (H2) or 3 (H3). */
export interface TocEntry {
  id: string;
  title: string;
  level: 2 | 3;
}

export interface LegacyBlock {
  type: "paragraph" | "list";
  text?: string;
  items?: string[];
}

export interface LegacySection {
  id: string;
  title: string;
  blocks: LegacyBlock[];
}

export class BlogContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlogContentError";
  }
}

// ─── Limits & allow-lists ───────────────────────────────────────────────────

const MAX_NODES = 25_000;
const MAX_DEPTH = 12;
const MAX_TEXT_CHARS = 500_000;
const MAX_URL_LENGTH = 2_048;
const MAX_IMAGE_SRC_LENGTH = 8_000_000;
const MAX_ATTR_TEXT = 500;

/** Marks rendered (and kept) in this order, outermost first after links. */
const MARK_ORDER = ["bold", "italic", "underline", "strike"] as const;
const MARK_TAGS: Record<(typeof MARK_ORDER)[number], string> = {
  bold: "strong",
  italic: "em",
  underline: "u",
  strike: "s",
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const hasControlChars = (s: string) => /[\u0000-\u001f\u007f]/.test(s);

/** http(s), mailto, site-relative ("/path", not "//host") and in-page ("#id") links. */
export function isSafeHref(href: unknown): href is string {
  if (typeof href !== "string") return false;
  const v = href.trim();
  if (!v || v.length > MAX_URL_LENGTH || hasControlChars(v)) return false;
  return /^(https?:\/\/[^\s]+|mailto:[^\s]+|\/(?!\/)[^\s]*|#[^\s]*)$/i.test(v);
}

/** Remote images, or the base64 raster data URIs the media library may hold. Never SVG. */
export function isSafeImageSrc(src: unknown): src is string {
  if (typeof src !== "string") return false;
  const v = src.trim();
  if (!v || v.length > MAX_IMAGE_SRC_LENGTH) return false;
  if (/^https?:\/\/[^\s"'<>]+$/i.test(v)) return v.length <= MAX_URL_LENGTH;
  return /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i.test(v);
}

const cleanAttrText = (v: unknown) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, MAX_ATTR_TEXT) : "";

// ─── Normalisation (validation) ─────────────────────────────────────────────

type BlockContext = "top" | "nested";

interface NormalizeState {
  nodes: number;
  chars: number;
}

/**
 * Validate and clean a document coming from the editor or an API client.
 * Unknown nodes/marks are unwrapped or dropped, unsafe links/images removed,
 * headings forced to H2/H3 and only allowed at the top level (so every
 * heading is a real article heading that belongs in the TOC).
 * Throws BlogContentError for input that is not a document at all.
 */
export function normalizeDoc(input: unknown): ContentDoc {
  if (!isRecord(input) || input.type !== "doc") {
    throw new BlogContentError('contentJson must be a rich-text document: { "type": "doc", "content": [...] }');
  }
  if (input.content !== undefined && !Array.isArray(input.content)) {
    throw new BlogContentError("contentJson.content must be an array");
  }
  const state: NormalizeState = { nodes: 0, chars: 0 };
  return { type: "doc", content: normalizeBlocks((input.content as unknown[]) ?? [], "top", 1, state) };
}

function count(state: NormalizeState, depth: number) {
  state.nodes += 1;
  if (state.nodes > MAX_NODES) throw new BlogContentError("Content is too large");
  if (depth > MAX_DEPTH) throw new BlogContentError("Content is nested too deeply");
}

function normalizeBlocks(raw: unknown[], ctx: BlockContext, depth: number, state: NormalizeState): ContentNode[] {
  const out: ContentNode[] = [];
  let pendingInline: unknown[] = [];

  const flushInline = () => {
    if (!pendingInline.length) return;
    const content = normalizeInline(pendingInline, state);
    if (content.length) out.push({ type: "paragraph", content });
    pendingInline = [];
  };

  for (const node of raw) {
    if (!isRecord(node) || typeof node.type !== "string") continue;
    count(state, depth);
    const children = Array.isArray(node.content) ? (node.content as unknown[]) : [];

    if (node.type === "text" || node.type === "hardBreak") {
      pendingInline.push(node);
      continue;
    }
    flushInline();

    switch (node.type) {
      case "paragraph": {
        const content = normalizeInline(children, state);
        out.push(content.length ? { type: "paragraph", content } : { type: "paragraph" });
        break;
      }
      case "heading": {
        const content = normalizeInline(children, state);
        if (ctx !== "top") {
          if (content.length) out.push({ type: "paragraph", content });
          break;
        }
        const raw = Number(isRecord(node.attrs) ? node.attrs.level : 2);
        const level = !Number.isFinite(raw) || raw <= 2 ? 2 : 3;
        out.push(content.length ? { type: "heading", attrs: { level }, content } : { type: "heading", attrs: { level } });
        break;
      }
      case "bulletList":
      case "orderedList": {
        const items = normalizeListItems(children, depth + 1, state);
        if (!items.length) break;
        if (node.type === "orderedList") {
          const start = Math.floor(Number(isRecord(node.attrs) ? node.attrs.start : 1));
          out.push({ type: "orderedList", attrs: { start: Number.isFinite(start) && start > 0 ? start : 1 }, content: items });
        } else {
          out.push({ type: "bulletList", content: items });
        }
        break;
      }
      case "blockquote": {
        const content = normalizeBlocks(children, "nested", depth + 1, state);
        if (ctx !== "top") out.push(...content);
        else if (content.length) out.push({ type: "blockquote", content });
        break;
      }
      case "horizontalRule":
        if (ctx === "top") out.push({ type: "horizontalRule" });
        break;
      case "image": {
        const attrs = isRecord(node.attrs) ? node.attrs : {};
        if (ctx !== "top" || !isSafeImageSrc(attrs.src)) break;
        const img: Record<string, unknown> = { src: (attrs.src as string).trim() };
        const alt = cleanAttrText(attrs.alt);
        const title = cleanAttrText(attrs.title);
        if (alt) img.alt = alt;
        if (title) img.title = title;
        out.push({ type: "image", attrs: img });
        break;
      }
      default:
        // listItem outside a list, code blocks, tables… keep their text, drop the wrapper.
        out.push(...normalizeBlocks(children, ctx, depth + 1, state));
    }
  }
  flushInline();
  return out;
}

function normalizeListItems(raw: unknown[], depth: number, state: NormalizeState): ContentNode[] {
  const items: ContentNode[] = [];
  for (const node of raw) {
    if (!isRecord(node) || typeof node.type !== "string") continue;
    const source = node.type === "listItem" ? (Array.isArray(node.content) ? (node.content as unknown[]) : []) : [node];
    if (node.type === "listItem") count(state, depth);
    const content = normalizeBlocks(source, "nested", depth + 1, state).filter(
      (n) => n.type === "paragraph" || n.type === "bulletList" || n.type === "orderedList",
    );
    if (!content.length) continue;
    // A list item must start with a paragraph (Tiptap schema: "paragraph block*").
    if (content[0].type !== "paragraph") content.unshift({ type: "paragraph" });
    items.push({ type: "listItem", content });
  }
  return items;
}

function normalizeInline(raw: unknown[], state: NormalizeState): ContentNode[] {
  const out: ContentNode[] = [];
  for (const node of raw) {
    if (!isRecord(node)) continue;
    if (node.type === "hardBreak") {
      out.push({ type: "hardBreak" });
      continue;
    }
    if (node.type === "text" && typeof node.text === "string" && node.text.length) {
      state.chars += node.text.length;
      if (state.chars > MAX_TEXT_CHARS) throw new BlogContentError("Content is too long");
      const marks = normalizeMarks(node.marks);
      out.push(marks.length ? { type: "text", text: node.text, marks } : { type: "text", text: node.text });
      continue;
    }
    // Inline wrappers we don't support (mentions, emoji…) — keep any text inside.
    if (Array.isArray(node.content)) out.push(...normalizeInline(node.content as unknown[], state));
  }
  return out;
}

function normalizeMarks(raw: unknown): ContentMark[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Map<string, ContentMark>();
  for (const m of raw) {
    if (!isRecord(m) || typeof m.type !== "string" || seen.has(m.type)) continue;
    if (m.type === "link") {
      const href = isRecord(m.attrs) ? m.attrs.href : undefined;
      if (isSafeHref(href)) seen.set("link", { type: "link", attrs: { href: href.trim() } });
    } else if ((MARK_ORDER as readonly string[]).includes(m.type)) {
      seen.set(m.type, { type: m.type });
    }
  }
  const ordered: ContentMark[] = [];
  if (seen.has("link")) ordered.push(seen.get("link") as ContentMark);
  for (const t of MARK_ORDER) if (seen.has(t)) ordered.push(seen.get(t) as ContentMark);
  return ordered;
}

// ─── Text helpers ───────────────────────────────────────────────────────────

/** Visible text of an inline container; hard breaks become `breakAs`. */
export function inlineText(node: ContentNode, breakAs = " "): string {
  let s = "";
  for (const child of node.content ?? []) {
    if (child.type === "text") s += child.text ?? "";
    else if (child.type === "hardBreak") s += breakAs;
    else if (child.content) s += inlineText(child, breakAs);
  }
  return s;
}

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

/** All readable text, blocks separated by newlines (for word count / reading time / search). */
export function docToPlainText(doc: ContentDoc): string {
  const lines: string[] = [];
  const walk = (nodes: ContentNode[]) => {
    for (const n of nodes) {
      if (n.type === "paragraph" || n.type === "heading") {
        const t = collapse(inlineText(n));
        if (t) lines.push(t);
      } else if (n.content) walk(n.content);
    }
  };
  walk(doc.content);
  return lines.join("\n");
}

export function countWords(doc: ContentDoc): number {
  const text = docToPlainText(doc);
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

export function isDocEmpty(doc: ContentDoc): boolean {
  return countWords(doc) === 0 && !doc.content.some((n) => n.type === "image");
}

// ─── Heading IDs & table of contents ────────────────────────────────────────

/** URL-friendly anchor from heading text (same rules as the dashboard's slugify). */
export function headingSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Next free ID: `base`, `base-2`, `base-3`… */
export function uniqueId(base: string, used: Set<string>): string {
  let id = base;
  for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
  used.add(id);
  return id;
}

/**
 * The single heading-ID strategy. Walks top-level H2/H3 headings in order,
 * skips empty ones, and gives each a stable slug of its text, de-duplicated
 * with -2, -3… Keyed by the heading's index in doc.content.
 *
 * IDs depend only on the heading texts and their order, so the editor
 * preview, the saved TOC and the published HTML always agree. Renaming a
 * heading renames its anchor everywhere at once.
 */
export function computeHeadings(doc: ContentDoc): Map<number, TocEntry> {
  const used = new Set<string>();
  const result = new Map<number, TocEntry>();
  doc.content.forEach((node, index) => {
    if (node.type !== "heading") return;
    const title = collapse(inlineText(node));
    if (!title) return;
    const level = node.attrs?.level === 3 ? 3 : 2;
    result.set(index, { id: uniqueId(headingSlug(title) || "section", used), title, level });
  });
  return result;
}

export function buildToc(doc: ContentDoc): TocEntry[] {
  return [...computeHeadings(doc).values()];
}

// ─── Safe HTML rendering ────────────────────────────────────────────────────

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const linkHref = (n: ContentNode): string | undefined => {
  const link = n.marks?.find((m) => m.type === "link");
  const href = link?.attrs?.href;
  return isSafeHref(href) ? href.trim() : undefined;
};

function renderMarkedText(n: ContentNode): string {
  if (n.type === "hardBreak") return "<br>";
  let html = escapeHtml(n.text ?? "");
  const types = new Set((n.marks ?? []).map((m) => m.type));
  for (let i = MARK_ORDER.length - 1; i >= 0; i -= 1) {
    const t = MARK_ORDER[i];
    if (types.has(t)) html = `<${MARK_TAGS[t]}>${html}</${MARK_TAGS[t]}>`;
  }
  return html;
}

function renderInline(nodes: ContentNode[]): string {
  let html = "";
  for (let i = 0; i < nodes.length; ) {
    const href = nodes[i].type === "text" ? linkHref(nodes[i]) : undefined;
    if (!href) {
      html += renderMarkedText(nodes[i]);
      i += 1;
      continue;
    }
    // One <a> for consecutive text sharing the same link (e.g. "read **this** guide").
    let inner = "";
    while (i < nodes.length && nodes[i].type === "text" && linkHref(nodes[i]) === href) {
      inner += renderMarkedText(nodes[i]);
      i += 1;
    }
    const external = /^https?:\/\//i.test(href);
    html += `<a href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${inner}</a>`;
  }
  return html;
}

function renderBlocks(nodes: ContentNode[], headings?: Map<number, TocEntry>): string {
  const parts: string[] = [];
  nodes.forEach((n, index) => {
    switch (n.type) {
      case "paragraph": {
        const inner = renderInline(n.content ?? []);
        if (collapse(inlineText(n))) parts.push(`<p>${inner}</p>`);
        break;
      }
      case "heading": {
        const entry = headings?.get(index);
        if (entry) parts.push(`<h${entry.level} id="${escapeHtml(entry.id)}">${renderInline(n.content ?? [])}</h${entry.level}>`);
        break;
      }
      case "bulletList":
      case "orderedList": {
        const start = Number(n.attrs?.start ?? 1);
        const open = n.type === "orderedList" ? (start > 1 ? `<ol start="${start}">` : "<ol>") : "<ul>";
        const items = (n.content ?? []).map((li) => {
          const kids = li.content ?? [];
          const body =
            kids.length === 1 && kids[0].type === "paragraph" ? renderInline(kids[0].content ?? []) : renderBlocks(kids);
          return `<li>${body}</li>`;
        });
        parts.push(`${open}${items.join("")}${n.type === "orderedList" ? "</ol>" : "</ul>"}`);
        break;
      }
      case "blockquote": {
        const inner = renderBlocks(n.content ?? []);
        if (inner) parts.push(`<blockquote>${inner}</blockquote>`);
        break;
      }
      case "horizontalRule":
        parts.push("<hr>");
        break;
      case "image": {
        const src = n.attrs?.src;
        if (!isSafeImageSrc(src)) break;
        const alt = cleanAttrText(n.attrs?.alt);
        const title = cleanAttrText(n.attrs?.title);
        parts.push(
          `<figure><img src="${escapeHtml(src.trim())}" alt="${escapeHtml(alt)}"${title ? ` title="${escapeHtml(title)}"` : ""} loading="lazy" decoding="async"></figure>`,
        );
        break;
      }
    }
  });
  return parts.join("\n");
}

/** Article HTML with `id`s on H2/H3 that match buildToc(). Every value is escaped; only allow-listed tags are produced. */
export function renderHtml(doc: ContentDoc): string {
  return renderBlocks(doc.content, computeHeadings(doc));
}

// ─── Legacy `sections` ⇄ document ───────────────────────────────────────────

/**
 * Old section-based content → document. Each section becomes an H2 followed
 * by its blocks; every block is converted exactly once, in order (multi-line
 * paragraph text keeps its line breaks).
 */
export function sectionsToDoc(sections: unknown): ContentDoc {
  const content: ContentNode[] = [];
  for (const s of Array.isArray(sections) ? sections : []) {
    if (!isRecord(s)) continue;
    const title = typeof s.title === "string" ? s.title.trim() : "";
    if (title) content.push({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: title }] });
    for (const b of Array.isArray(s.blocks) ? s.blocks : []) {
      if (!isRecord(b)) continue;
      if (b.type === "list") {
        const items = (Array.isArray(b.items) ? b.items : [])
          .filter((i): i is string => typeof i === "string" && i.trim().length > 0)
          .map((i) => ({ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: i.trim() }] }] }));
        if (items.length) content.push({ type: "bulletList", content: items });
      } else if (typeof b.text === "string" && b.text.trim()) {
        const lines = b.text.trim().split(/\r?\n/);
        const inline: ContentNode[] = [];
        lines.forEach((line, i) => {
          if (i > 0) inline.push({ type: "hardBreak" });
          if (line) inline.push({ type: "text", text: line });
        });
        content.push({ type: "paragraph", content: inline });
      }
    }
  }
  return normalizeDoc({ type: "doc", content });
}

function legacyBlocksOf(n: ContentNode): LegacyBlock[] {
  switch (n.type) {
    case "paragraph":
    case "heading": {
      const text = inlineText(n, "\n").trim();
      return text ? [{ type: "paragraph", text }] : [];
    }
    case "bulletList":
    case "orderedList": {
      const items: string[] = [];
      const collect = (list: ContentNode) => {
        for (const li of list.content ?? []) {
          for (const child of li.content ?? []) {
            if (child.type === "paragraph") {
              const t = collapse(inlineText(child));
              if (t) items.push(t);
            } else if (child.type === "bulletList" || child.type === "orderedList") collect(child);
          }
        }
      };
      collect(n);
      return items.length ? [{ type: "list", items }] : [];
    }
    case "blockquote":
      return (n.content ?? []).flatMap(legacyBlocksOf);
    default:
      return [];
  }
}

/**
 * Document → legacy `sections`, for websites that still render the old format.
 * Each H2 starts a section whose `id` equals its TOC/HTML anchor. H3 headings
 * and quotes become paragraphs, inline formatting becomes plain text, images
 * and dividers are omitted. Content before the first H2 goes into an
 * "Introduction" section. Derived on every save — never edited directly.
 */
export function docToSections(doc: ContentDoc): LegacySection[] {
  const headings = computeHeadings(doc);
  const sections: LegacySection[] = [];
  const intro: LegacyBlock[] = [];
  let current: LegacySection | null = null;

  doc.content.forEach((node, index) => {
    const entry = headings.get(index);
    if (node.type === "heading" && entry?.level === 2) {
      current = { id: entry.id, title: entry.title, blocks: [] };
      sections.push(current);
      return;
    }
    const blocks = legacyBlocksOf(node);
    if (current) (current as LegacySection).blocks.push(...blocks);
    else intro.push(...blocks);
  });

  if (intro.length) {
    const used = new Set([...headings.values()].map((h) => h.id));
    sections.unshift({ id: uniqueId("introduction", used), title: "Introduction", blocks: intro });
  }
  return sections;
}

// ─── Everything derived on save ─────────────────────────────────────────────

export interface DerivedContent {
  contentJson: ContentDoc;
  contentHtml: string;
  toc: TocEntry[];
  sections: LegacySection[];
}

export function deriveContent(input: unknown): DerivedContent {
  const contentJson = normalizeDoc(input);
  return {
    contentJson,
    contentHtml: renderHtml(contentJson),
    toc: buildToc(contentJson),
    sections: docToSections(contentJson),
  };
}
