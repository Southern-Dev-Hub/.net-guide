import { useEffect, useRef } from "react";
import {
  Bold,
  Code2,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Table,
  Underline,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

/** Lightweight rich text editor used across the admin CMS. */
export function RichTextEditor({ value, onChange, placeholder, minHeight = 140 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) el.innerHTML = value || "";
  }, [value]);

  function exec(command: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    onChange(ref.current?.innerHTML ?? "");
  }

  function insertHtml(html: string) {
    exec("insertHTML", html);
  }

  const tools = [
    { icon: Bold, label: "Bold", run: () => exec("bold") },
    { icon: Italic, label: "Italic", run: () => exec("italic") },
    { icon: Underline, label: "Underline", run: () => exec("underline") },
    { icon: Heading2, label: "Heading", run: () => exec("formatBlock", "<h2>") },
    { icon: Heading3, label: "Subheading", run: () => exec("formatBlock", "<h3>") },
    { icon: List, label: "Bullet list", run: () => exec("insertUnorderedList") },
    { icon: ListOrdered, label: "Numbered list", run: () => exec("insertOrderedList") },
    { icon: Quote, label: "Quote", run: () => exec("formatBlock", "<blockquote>") },
    {
      icon: Code2,
      label: "Inline code",
      run: () => insertHtml(`<code>${window.getSelection()?.toString() || "code"}</code>`),
    },
    {
      icon: Link2,
      label: "Link",
      run: () => {
        const url = window.prompt("Link URL", "https://learn.microsoft.com/");
        if (url) exec("createLink", url);
      },
    },
    {
      icon: Table,
      label: "Table",
      run: () =>
        insertHtml(
          "<table><thead><tr><th>Column</th><th>Column</th></tr></thead><tbody><tr><td>Value</td><td>Value</td></tr></tbody></table><p></p>",
        ),
    },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-card">
      <div className="flex flex-wrap gap-0.5 border-b border-border bg-muted/60 p-1">
        {tools.map((tool) => (
          <Button
            key={tool.label}
            type="button"
            size="sm"
            variant="ghost"
            title={tool.label}
            className="size-7 p-0"
            onMouseDown={(e) => e.preventDefault()}
            onClick={tool.run}
          >
            <tool.icon className="size-3.5" />
          </Button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        style={{ minHeight }}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        onBlur={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className="doc-prose max-h-[420px] overflow-y-auto px-3 py-2 outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  );
}
