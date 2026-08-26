import type { LearningStep } from "@/lib/api";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function section(title: string, html: string): string {
  const trimmed = (html ?? "").replace(/<[^>]*>/g, "").trim();
  if (!trimmed) return "";
  return `<section><h2>${escapeHtml(title)}</h2><div class="prose">${html}</div></section>`;
}

function pre(title: string, code: string, language?: string): string {
  if (!code.trim()) return "";
  const label = language ? `${title} (${language})` : title;
  return `<section><h2>${escapeHtml(label)}</h2><pre>${escapeHtml(code)}</pre></section>`;
}

function stepBody(step: LearningStep): string {
  return [
    `<header class="step-header">
       <p class="eyebrow">Step ${escapeHtml(String(step.step_number))} · ${escapeHtml(step.difficulty)} · ${escapeHtml(step.estimated_time)}</p>
       <h1>${escapeHtml(step.title)}</h1>
       ${step.subtitle ? `<p class="subtitle">${escapeHtml(step.subtitle)}</p>` : ""}
     </header>`,
    step.overview ? `<section><h2>Overview</h2><p>${escapeHtml(step.overview)}</p></section>` : "",
    step.image_base64
      ? `<section><h2>Screenshot</h2><img src="${step.image_base64}" alt="${escapeHtml(step.title)} screenshot" /></section>`
      : "",
    section("Description", step.description),
    section("Objectives", step.objectives),
    pre("Terminal commands", step.commands ?? ""),
    ...step.code_blocks.map((b) => pre(b.title || "Code", b.code ?? "", b.language)),
    section("Notes", step.notes),
    section("Best practices", step.best_practices),
    section("Common mistakes", step.common_mistakes),
    section("Troubleshooting", step.troubleshooting),
    section("References", step.step_references),
  ]
    .filter(Boolean)
    .join("\n");
}

const STYLES = `
  @page { margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif; color: #0f172a; margin: 0; line-height: 1.6; }
  .eyebrow { text-transform: uppercase; letter-spacing: .08em; font-size: 11px; color: #64748b; margin: 0 0 6px; }
  h1 { font-size: 26px; margin: 0 0 6px; }
  .subtitle { color: #475569; margin: 0; }
  .step-header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: .05em; color: #2563eb; margin: 22px 0 8px; }
  section { break-inside: avoid; }
  img { max-width: 100%; border: 1px solid #e2e8f0; border-radius: 6px; }
  pre { background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 6px; font-family: "JetBrains Mono", ui-monospace, monospace; font-size: 11px; white-space: pre-wrap; word-break: break-word; }
  .prose table { border-collapse: collapse; width: 100%; }
  .prose td, .prose th { border: 1px solid #cbd5e1; padding: 6px; }
  .prose code { background: #f1f5f9; padding: 1px 4px; border-radius: 4px; font-family: ui-monospace, monospace; }
  .cover { text-align: center; padding: 80px 0 40px; }
  .cover h1 { font-size: 34px; }
  .cover p { color: #475569; }
  .toc { break-after: page; }
  .toc ol { padding-left: 18px; }
  .toc li { margin: 4px 0; }
  .step { break-before: page; }
  .step:first-of-type { break-before: auto; }
`;

function printDocument(title: string, body: string): void {
  const html = `<!doctype html>
<html><head><meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>${STYLES}</style></head>
<body>${body}</body></html>`;

  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) throw new Error("Enable pop-ups to download the PDF");
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  const print = () => {
    win.print();
  };
  if (win.document.readyState === "complete") setTimeout(print, 400);
  else win.addEventListener("load", () => setTimeout(print, 400));
}

/**
 * Renders a learning step (content + images + code) into a print-ready
 * document and opens the browser print dialog, where it can be saved as PDF.
 */
export function exportStepToPdf(step: LearningStep): void {
  if (typeof window === "undefined") return;
  printDocument(step.title, stepBody(step));
}

/** Renders every learning step of a section into one print-ready document. */
export function exportStepsToPdf(steps: LearningStep[], moduleTitle = "Learning module"): void {
  if (typeof window === "undefined") return;
  if (steps.length === 0) throw new Error("There are no steps to export");

  const ordered = [...steps].sort(
    (a, b) => a.display_order - b.display_order || a.step_number - b.step_number,
  );

  const cover = `<div class="cover">
      <p class="eyebrow">Complete learning module</p>
      <h1>${escapeHtml(moduleTitle)}</h1>
      <p>${ordered.length} step${ordered.length === 1 ? "" : "s"} · Generated ${escapeHtml(new Date().toLocaleDateString())}</p>
    </div>
    <div class="toc">
      <h2>Contents</h2>
      <ol>${ordered
        .map((s) => `<li>${escapeHtml(s.title)}</li>`)
        .join("")}</ol>
    </div>`;

  const body =
    cover + ordered.map((s) => `<article class="step">${stepBody(s)}</article>`).join("\n");

  printDocument(`${moduleTitle} — all steps`, body);
}

