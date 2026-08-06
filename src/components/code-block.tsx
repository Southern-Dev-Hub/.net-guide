import { useEffect, useMemo, useRef, useState } from "react";
import hljs from "highlight.js/lib/core";
import csharp from "highlight.js/lib/languages/csharp";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import sql from "highlight.js/lib/languages/sql";
import yaml from "highlight.js/lib/languages/yaml";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import http from "highlight.js/lib/languages/http";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

let registered = false;
function register() {
  if (registered) return;
  hljs.registerLanguage("csharp", csharp);
  hljs.registerLanguage("bash", bash);
  hljs.registerLanguage("json", json);
  hljs.registerLanguage("xml", xml);
  hljs.registerLanguage("sql", sql);
  hljs.registerLanguage("yaml", yaml);
  hljs.registerLanguage("javascript", javascript);
  hljs.registerLanguage("typescript", typescript);
  hljs.registerLanguage("http", http);
  registered = true;
}

export function CodeBlock({
  title,
  language,
  code,
}: {
  title?: string;
  language: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const html = useMemo(() => {
    register();
    try {
      return hljs.highlight(code, { language: hljs.getLanguage(language) ? language : "bash" })
        .value;
    } catch {
      return code.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] ?? c);
    }
  }, [code, language]);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-code-bg">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-md bg-primary/15 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-primary">
            {language}
          </span>
          {title ? (
            <span className="truncate font-mono text-xs text-code-fg/70">{title}</span>
          ) : null}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={copy}
          className="h-7 gap-1.5 px-2 text-xs text-code-fg/70 hover:bg-white/10 hover:text-code-fg"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-relaxed text-code-fg">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
