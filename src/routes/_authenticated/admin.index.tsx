import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Link2, ListTree, MessageSquare } from "lucide-react";
import { fetchAllComments, fetchAllSteps, fetchResources, fetchTabs } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const tabs = useQuery({ queryKey: ["tabs"], queryFn: fetchTabs });
  const steps = useQuery({ queryKey: ["all-steps"], queryFn: fetchAllSteps });
  const comments = useQuery({ queryKey: ["all-comments"], queryFn: fetchAllComments });
  const resources = useQuery({ queryKey: ["all-resources"], queryFn: () => fetchResources() });

  const cards = [
    {
      label: "Navigation tabs",
      value: tabs.data?.length ?? 0,
      icon: ListTree,
      to: "/admin/tabs" as const,
    },
    {
      label: "Learning steps",
      value: steps.data?.length ?? 0,
      icon: FileText,
      to: "/admin/steps" as const,
    },
    {
      label: "Developer comments",
      value: comments.data?.length ?? 0,
      icon: MessageSquare,
      to: "/admin/comments" as const,
    },
    {
      label: "Resources",
      value: resources.data?.length ?? 0,
      icon: Link2,
      to: "/admin/resources" as const,
    },
  ];

  const drafts = (steps.data ?? []).filter((s) => s.status !== "published");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage every piece of content shown on the public learning portal.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/50"
          >
            <card.icon className="size-4 text-primary" />
            <p className="mt-3 text-2xl font-semibold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="text-sm font-semibold text-foreground">Drafts awaiting publication</h2>
        {drafts.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Everything is published.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {drafts.map((step) => (
              <li key={step.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-foreground">
                  {step.step_number}. {step.title}
                </span>
                <Link to="/admin/steps" className="shrink-0 text-xs text-primary hover:underline">
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
