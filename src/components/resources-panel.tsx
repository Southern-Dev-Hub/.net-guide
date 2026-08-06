import { ExternalLink } from "lucide-react";
import type { Resource } from "@/lib/api";

const TYPE_STYLES: Record<string, string> = {
  "Microsoft Learn": "bg-primary/10 text-primary",
  "GitHub Repository": "bg-secondary/10 text-secondary",
  "NuGet Package": "bg-chart-5/15 text-chart-5",
  "Postman Collection": "bg-warning/15 text-warning",
  "PDF Download": "bg-destructive/10 text-destructive",
  "YouTube Tutorial": "bg-destructive/10 text-destructive",
};

export function ResourcesPanel({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
        Additional Resources
      </h2>
      <ul className="space-y-2">
        {resources.map((r) => (
          <li key={r.id}>
            <a
              href={r.url || "#"}
              target="_blank"
              rel="noreferrer noopener"
              className="block rounded-xl border border-border bg-card p-3 shadow-card transition-colors hover:border-primary/50"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{r.title}</p>
                <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              </div>
              {r.description ? (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {r.description}
                </p>
              ) : null}
              <span
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  TYPE_STYLES[r.type] ?? "bg-muted text-muted-foreground"
                }`}
              >
                {r.type}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
