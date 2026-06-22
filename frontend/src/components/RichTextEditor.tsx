"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { useEffect } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

const TEXT_COLORS = [
  { label: "Fekete", value: "#0f172a" },
  { label: "Piros", value: "#dc2626" },
  { label: "Bordó", value: "#9f1239" },
  { label: "Zöld", value: "#15803d" },
  { label: "Kék", value: "#1d4ed8" },
] as const;

function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
        active
          ? "bg-brand-900 text-white"
          : "border border-brand-200 text-brand-900 hover:bg-brand-50"
      }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 180 }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color],
    content: value || "",
    immediatelyRender: false,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      attributes: {
        class: "outline-none prose prose-sm max-w-none",
        style: `min-height:${minHeight}px; padding: 12px 14px;`,
        "data-placeholder": placeholder ?? "",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const normalized = value || "";
    if (current !== normalized) {
      editor.commands.setContent(normalized || "");
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null;

  const activeColor = editor.getAttributes("textStyle").color as string | undefined;

  return (
    <div className="overflow-hidden rounded-xl border border-brand-200 transition focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100">
      <div className="flex flex-wrap items-center gap-1 border-b border-brand-100 bg-brand-50/50 px-2 py-1.5">
        <ToolbarBtn
          title="Félkövér (Ctrl+B)"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn
          title="Dőlt (Ctrl+I)"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn
          title="Felsorolás"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          ≡
        </ToolbarBtn>
        <ToolbarBtn
          title="Számozott lista"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.
        </ToolbarBtn>
        <div className="mx-1 h-4 w-px bg-brand-200" />
        <ToolbarBtn
          title="Nagy cím"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarBtn>
        <ToolbarBtn
          title="Kis cím"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarBtn>
        <div className="mx-1 h-4 w-px bg-brand-200" />
        <div className="flex items-center gap-1">
          <span className="px-1 text-[10px] font-semibold uppercase tracking-wide text-red-950/50">Szín</span>
          {TEXT_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              title={color.label}
              onClick={() =>
                editor.chain().focus().extendMarkRange("textStyle").setColor(color.value).run()
              }
              className={`h-6 w-6 rounded-md border transition hover:scale-105 ${
                activeColor === color.value ? "ring-2 ring-brand-600 ring-offset-1" : "border-brand-200"
              }`}
              style={{ backgroundColor: color.value }}
              aria-label={color.label}
            />
          ))}
          <ToolbarBtn
            title="Szín törlése"
            onClick={() => editor.chain().focus().extendMarkRange("textStyle").unsetColor().run()}
          >
            A
          </ToolbarBtn>
        </div>
        <div className="mx-1 h-4 w-px bg-brand-200" />
        <ToolbarBtn
          title="Visszavonás"
          onClick={() => editor.chain().focus().undo().run()}
        >
          ↩
        </ToolbarBtn>
        <ToolbarBtn
          title="Újra"
          onClick={() => editor.chain().focus().redo().run()}
        >
          ↪
        </ToolbarBtn>
        <ToolbarBtn
          title="Formázás törlése"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        >
          T̶
        </ToolbarBtn>
      </div>

      <div className="relative bg-white">
        {editor.isEmpty ? (
          <span
            className="pointer-events-none absolute left-[14px] top-[13px] text-sm text-slate-400 select-none"
            aria-hidden
          >
            {placeholder}
          </span>
        ) : null}
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .ProseMirror h2 { font-size: 1.1rem; font-weight: 700; margin: 0.75rem 0 0.25rem; }
        .ProseMirror h3 { font-size: 1rem; font-weight: 700; margin: 0.5rem 0 0.25rem; }
        .ProseMirror p { margin: 0.4rem 0; min-height: 1.4em; }
        .ProseMirror p:first-child { margin-top: 0; }
        .ProseMirror p:last-child { margin-bottom: 0; }
        .ProseMirror > * + * { margin-top: 0.4rem; }
        .ProseMirror strong { font-weight: 700; color: inherit; }
        .ProseMirror em { color: inherit; }
        .ProseMirror h2, .ProseMirror h3 { color: inherit; }
      `}</style>
    </div>
  );
}
