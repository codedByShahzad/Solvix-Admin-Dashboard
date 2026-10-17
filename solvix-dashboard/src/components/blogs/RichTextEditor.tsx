"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { ListItem } from "@tiptap/extension-list";
import { Blockquote } from "@tiptap/extension-blockquote";
import {
  AlertTriangle,
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Redo2,
  Strikethrough,
  TextQuote,
  Underline,
  Undo2,
} from "lucide-react";
import { Button, Field, Input, Modal, Skeleton } from "@/components/ui";
import { isSafeHref, type ContentDoc } from "@/lib/blogContent";
import { cn } from "@/lib/cn";

/**
 * Paragraphs, H2/H3, bold/italic/underline/strike, links, bullet/numbered
 * lists and blockquotes. Headings are only allowed at the top level (not
 * inside quotes or list items), so every heading is a real article heading
 * for the table of contents.
 */
const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    code: false,
    codeBlock: false,
    horizontalRule: false,
    blockquote: false,
    listItem: false,
    link: { openOnClick: false, autolink: true, linkOnPaste: true, defaultProtocol: "https" },
  }),
  Blockquote.extend({ content: "(paragraph | bulletList | orderedList)+" }),
  ListItem.extend({ content: "paragraph (paragraph | bulletList | orderedList)*" }),
  Placeholder.configure({
    placeholder: ({ node }) =>
      node.type.name === "heading" ? `Heading ${node.attrs.level}` : "Start writing… Use H2 and H3 for headings.",
  }),
];

const EMPTY_DOC: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

// ─── Toolbar ────────────────────────────────────────────────────────────────

function useModKey() {
  const [mod, setMod] = useState("Ctrl");
  useEffect(() => {
    if (/Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent)) setMod("⌘");
  }, []);
  return mod;
}

function ToolButton({
  label,
  shortcut,
  icon,
  onClick,
  active,
  disabled,
}: {
  label: string;
  shortcut?: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      data-tool
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault() /* keep the editor selection */}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors",
        "hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
        "disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4",
        active && "bg-brand-soft text-brand-soft-fg hover:bg-brand-soft hover:text-brand-soft-fg",
      )}
    >
      {icon}
    </button>
  );
}

const Divider = () => <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-border" />;

function Toolbar({ editor, onLink }: { editor: Editor; onLink: () => void }) {
  const mod = useModKey();
  const ref = useRef<HTMLDivElement>(null);
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      paragraph: e.isActive("paragraph") && !e.isActive("bulletList") && !e.isActive("orderedList") && !e.isActive("blockquote"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canHeading: e.can().setHeading({ level: 2 }) || e.isActive("heading"),
      canQuote: e.can().toggleBlockquote(),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  // One Tab stop for the whole toolbar; ← → Home End move between buttons.
  const [focusIndex, setFocusIndex] = useState(0);
  const buttons = () => Array.from(ref.current?.querySelectorAll<HTMLButtonElement>("[data-tool]:not(:disabled)") ?? []);
  useEffect(() => {
    const list = buttons();
    list.forEach((b, i) => (b.tabIndex = i === Math.min(focusIndex, list.length - 1) ? 0 : -1));
  });
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = buttons();
    const current = list.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) return;
    let next = current;
    if (e.key === "ArrowRight") next = (current + 1) % list.length;
    else if (e.key === "ArrowLeft") next = (current - 1 + list.length) % list.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = list.length - 1;
    else return;
    e.preventDefault();
    setFocusIndex(next);
    list[next]?.focus();
  };

  const chain = () => editor.chain().focus();
  const alt = mod === "⌘" ? "⌥" : "Alt";

  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label="Formatting"
      aria-controls="blog-content-editor"
      onKeyDown={onKeyDown}
      onFocus={(e) => {
        const i = buttons().indexOf(e.target as unknown as HTMLButtonElement);
        if (i >= 0) setFocusIndex(i);
      }}
      className="scrollbar-thin flex items-center gap-0.5 overflow-x-auto border-b border-border bg-surface/95 px-2 py-1.5 backdrop-blur"
    >
      <ToolButton label="Paragraph" shortcut={`${mod}+${alt}+0`} icon={<Pilcrow />} active={s.paragraph} onClick={() => chain().setParagraph().run()} />
      <ToolButton label="Heading 2" shortcut={`${mod}+${alt}+2`} icon={<Heading2 />} active={s.h2} disabled={!s.canHeading} onClick={() => chain().toggleHeading({ level: 2 }).run()} />
      <ToolButton label="Heading 3" shortcut={`${mod}+${alt}+3`} icon={<Heading3 />} active={s.h3} disabled={!s.canHeading} onClick={() => chain().toggleHeading({ level: 3 }).run()} />
      <Divider />
      <ToolButton label="Bold" shortcut={`${mod}+B`} icon={<Bold />} active={s.bold} onClick={() => chain().toggleBold().run()} />
      <ToolButton label="Italic" shortcut={`${mod}+I`} icon={<Italic />} active={s.italic} onClick={() => chain().toggleItalic().run()} />
      <ToolButton label="Underline" shortcut={`${mod}+U`} icon={<Underline />} active={s.underline} onClick={() => chain().toggleUnderline().run()} />
      <ToolButton label="Strikethrough" shortcut={`${mod}+Shift+S`} icon={<Strikethrough />} active={s.strike} onClick={() => chain().toggleStrike().run()} />
      <ToolButton label={s.link ? "Edit link" : "Add link"} shortcut={`${mod}+K`} icon={<LinkIcon />} active={s.link} onClick={onLink} />
      <Divider />
      <ToolButton label="Bulleted list" shortcut={`${mod}+Shift+8`} icon={<List />} active={s.bullet} onClick={() => chain().toggleBulletList().run()} />
      <ToolButton label="Numbered list" shortcut={`${mod}+Shift+7`} icon={<ListOrdered />} active={s.ordered} onClick={() => chain().toggleOrderedList().run()} />
      <ToolButton label="Quote" shortcut={`${mod}+Shift+B`} icon={<TextQuote />} active={s.quote} disabled={!s.canQuote && !s.quote} onClick={() => chain().toggleBlockquote().run()} />
      <Divider />
      <ToolButton label="Undo" shortcut={`${mod}+Z`} icon={<Undo2 />} disabled={!s.canUndo} onClick={() => chain().undo().run()} />
      <ToolButton label="Redo" shortcut={`${mod}+Shift+Z`} icon={<Redo2 />} disabled={!s.canRedo} onClick={() => chain().redo().run()} />
    </div>
  );
}

// ─── Link dialog ────────────────────────────────────────────────────────────

/** "topicler.com/x" → "https://topicler.com/x"; paths, #anchors and mailto: are kept. */
function normalizeLinkInput(raw: string): string {
  const v = raw.trim();
  if (!v || /^(https?:\/\/|mailto:|\/|#)/i.test(v)) return v;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `mailto:${v}`;
  return `https://${v}`;
}

function LinkDialog({ editor, open, onClose }: { editor: Editor; open: boolean; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const hasLink = editor.isActive("link");

  useEffect(() => {
    if (open) {
      setUrl((editor.getAttributes("link").href as string | undefined) ?? "");
      setError(null);
    }
  }, [open, editor]);

  const apply = () => {
    const href = normalizeLinkInput(url);
    if (!isSafeHref(href)) {
      setError("Enter a web address (https://…), a site path starting with /, an #anchor or an email address.");
      return;
    }
    const { empty } = editor.state.selection;
    if (empty && !hasLink) {
      editor.chain().focus().insertContent({ type: "text", text: url.trim(), marks: [{ type: "link", attrs: { href } }] }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    // Put the cursor after the link (so the next key can't replace the linked text)
    // and stop the link from extending over what is typed next.
    editor.chain().setTextSelection(editor.state.selection.to).unsetMark("link").run();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={hasLink ? "Edit link" : "Add link"}
      footer={
        <>
          {hasLink && (
            <Button
              variant="danger-soft"
              className="mr-auto"
              onClick={() => {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
                onClose();
              }}
            >
              Remove link
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={apply}>Apply</Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation(); // the dialog is portalled but React events still bubble to the blog form
          apply();
        }}
      >
        <Field label="URL" htmlFor="rte-link-url" error={error ?? undefined}>
          <Input
            id="rte-link-url"
            data-autofocus
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="https://topicler.com/blog/another-post"
            invalid={!!error}
            className="font-mono text-[13px]"
          />
        </Field>
      </form>
    </Modal>
  );
}

// ─── Editor ─────────────────────────────────────────────────────────────────

export function RichTextEditor({
  initialContent,
  onChange,
  onReady,
  onContentError,
}: {
  /** Loaded once when the editor mounts. */
  initialContent: ContentDoc;
  onChange: (doc: JSONContent) => void;
  onReady?: (editor: Editor) => void;
  /** The stored content could not be loaded into the editor. */
  onContentError?: () => void;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const openLinkRef = useRef(() => setLinkOpen(true));

  const editor = useEditor({
    extensions,
    content: initialContent.content.length ? (initialContent as JSONContent) : EMPTY_DOC,
    immediatelyRender: false,
    enableContentCheck: true,
    onContentError: () => {
      setLoadError(true);
      onContentError?.();
    },
    editorProps: {
      attributes: {
        id: "blog-content-editor",
        class: "solvix-prose solvix-editor",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Article content",
      },
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === "k") {
          event.preventDefault();
          openLinkRef.current();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => onChangeRef.current(e.getJSON()),
  });

  useEffect(() => {
    if (editor && onReady) onReady(editor);
  }, [editor, onReady]);

  if (!editor) {
    return (
      <div className="overflow-hidden rounded-xl border border-border" aria-busy="true" aria-label="Loading editor">
        <div className="flex gap-1 border-b border-border px-2 py-1.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="size-8 rounded-md" />
          ))}
        </div>
        <div className="space-y-3 p-5">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface transition-colors focus-within:border-brand/50">
      {loadError && (
        <div role="alert" className="flex items-start gap-2.5 border-b border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>Part of this post&apos;s content could not be loaded into the editor. Saving is disabled so nothing is overwritten.</span>
        </div>
      )}
      <div className="sticky top-16 z-20 overflow-hidden rounded-t-xl">
        <Toolbar editor={editor} onLink={() => setLinkOpen(true)} />
      </div>
      <EditorContent editor={editor} />
      <LinkDialog editor={editor} open={linkOpen} onClose={() => setLinkOpen(false)} />
    </div>
  );
}
