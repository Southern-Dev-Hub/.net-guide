import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Expand,
  LifeBuoy,
  Link2,
  ListChecks,
  ShieldCheck,
  StickyNote,
  Terminal,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CodeBlock } from "@/components/code-block";
import type { LearningStep } from "@/lib/api";

function Section({
  icon: Icon,
  title,
  html,
}: {
  icon: typeof ListChecks;
  title: string;
  html: string;
}) {
  if (!html || !html.replace(/<[^>]*>/g, "").trim()) return null;
  return (
    <section className="space-y-1.5">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="size-4 text-primary" />
        {title}
      </h4>
      <div className="doc-prose" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}

const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner: "bg-success/10 text-success",
  Intermediate: "bg-warning/15 text-warning",
  Advanced: "bg-destructive/10 text-destructive",
};

export function StepCard({
  step,
  active,
  onSelect,
  commentCount,
}: {
  step: LearningStep;
  active: boolean;
  onSelect: () => void;
  commentCount: number;
}) {
  const [zoom, setZoom] = useState(false);

  return (
    <article
      id={`step-${step.id}`}
      onMouseEnter={onSelect}
      onFocusCapture={onSelect}
      className={`scroll-mt-28 rounded-2xl border bg-card shadow-card transition-shadow ${
        active ? "border-primary/50 shadow-raised" : "border-border"
      }`}
    >
      <header className="flex flex-wrap items-start gap-4 p-5 pb-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-mono text-sm font-semibold text-primary">
          {String(step.step_number).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold leading-tight text-foreground">{step.title}</h3>
            <CheckCircle2 className="size-4 shrink-0 text-success" aria-label="Step ready" />
          </div>
          {step.subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{step.subtitle}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-full px-2.5 py-1 font-medium ${
                DIFFICULTY_STYLES[step.difficulty] ?? "bg-muted text-muted-foreground"
              }`}
            >
              {step.difficulty}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
              <Clock className="size-3" />
              {step.estimated_time}
            </span>
            {commentCount > 0 ? (
              <span className="rounded-full bg-accent px-2.5 py-1 font-medium text-accent-foreground">
                {commentCount} developer note{commentCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      {step.overview ? (
        <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">{step.overview}</p>
      ) : null}

      {step.image_base64 ? (
        <div className="px-5 pb-4">
          <button
            type="button"
            onClick={() => setZoom(true)}
            className="group relative block w-full overflow-hidden rounded-xl border border-border"
          >
            <img
              src={step.image_base64}
              alt={`${step.title} screenshot`}
              loading="lazy"
              className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-secondary/85 px-2 py-1 text-xs text-secondary-foreground opacity-0 transition-opacity group-hover:opacity-100">
              <Expand className="size-3" /> Zoom
            </span>
          </button>
          <Dialog open={zoom} onOpenChange={setZoom}>
            <DialogContent className="max-w-5xl border-border p-2">
              <img
                src={step.image_base64}
                alt={`${step.title} screenshot enlarged`}
                className="max-h-[80vh] w-full rounded-lg object-contain"
              />
            </DialogContent>
          </Dialog>
        </div>
      ) : null}

      <Accordion type="single" collapsible className="border-t border-border px-5">
        <AccordionItem value="details" className="border-none">
          <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
            Full walkthrough
          </AccordionTrigger>
          <AccordionContent className="space-y-5 pb-5">
            <Section icon={ListChecks} title="Description" html={step.description} />
            <Section icon={ListChecks} title="Objectives" html={step.objectives} />

            {step.commands.trim() ? (
              <section className="space-y-1.5">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Terminal className="size-4 text-primary" />
                  Commands
                </h4>
                <CodeBlock language="bash" code={step.commands.trim()} title="terminal" />
              </section>
            ) : null}

            {step.code_blocks.length > 0 ? (
              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Code examples</h4>
                {step.code_blocks.map((block, i) => (
                  <CodeBlock
                    key={`${step.id}-code-${i}`}
                    title={block.title}
                    language={block.language || "csharp"}
                    code={block.code}
                  />
                ))}
              </section>
            ) : null}

            <Section icon={StickyNote} title="Notes" html={step.notes} />
            <Section icon={ShieldCheck} title="Best practices" html={step.best_practices} />
            <Section icon={AlertTriangle} title="Common mistakes" html={step.common_mistakes} />
            <Section icon={LifeBuoy} title="Troubleshooting" html={step.troubleshooting} />
            <Section icon={Link2} title="References" html={step.step_references} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </article>
  );
}
