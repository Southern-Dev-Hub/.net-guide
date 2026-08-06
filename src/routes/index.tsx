import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { StepCard } from "@/components/step-card";
import { CommentsPanel } from "@/components/comments-panel";
import { ResourcesPanel } from "@/components/resources-panel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchComments,
  fetchResources,
  fetchSteps,
  fetchTabs,
  type LearningStep,
} from "@/lib/api";

type Search = { tab?: string | undefined };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    tab: typeof search["tab"] === "string" ? (search["tab"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: ".NET Web API Learning Guide — Step-by-step Documentation" },
      {
        name: "description",
        content:
          "A documentation portal for building production .NET Web APIs: guided steps, commands, code examples and senior developer commentary.",
      },
      { property: "og:title", content: ".NET Web API Learning Guide" },
      {
        property: "og:description",
        content:
          "Guided .NET 8 and .NET 10 Web API tutorials with commands, code examples and senior developer notes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortalPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-10 text-center text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Nothing here yet.</div>,
});

function matches(step: LearningStep, q: string) {
  if (!q) return true;
  const needle = q.toLowerCase();
  const haystack = [
    step.title,
    step.subtitle,
    step.overview,
    step.description,
    step.objectives,
    step.commands,
    step.notes,
    step.best_practices,
    step.common_mistakes,
    step.troubleshooting,
    step.step_references,
    ...step.code_blocks.map((b) => `${b.title} ${b.language} ${b.code}`),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

function PortalPage() {
  const { tab: tabParam } = Route.useSearch();
  const [query, setQuery] = useState("");
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  const tabsQuery = useQuery({ queryKey: ["tabs"], queryFn: fetchTabs });
  const tabs = useMemo(
    () => (tabsQuery.data ?? []).filter((t) => t.is_active),
    [tabsQuery.data],
  );
  const activeTab = tabs.find((t) => t.slug === tabParam) ?? tabs[0];

  const stepsQuery = useQuery({
    queryKey: ["steps", activeTab?.id],
    queryFn: () => fetchSteps(activeTab?.id ?? ""),
    enabled: Boolean(activeTab?.id),
  });

  const steps = useMemo(
    () => (stepsQuery.data ?? []).filter((s) => s.status === "published"),
    [stepsQuery.data],
  );
  const visibleSteps = useMemo(() => steps.filter((s) => matches(s, query)), [steps, query]);

  const commentsQuery = useQuery({
    queryKey: ["comments", steps.map((s) => s.id).join(",")],
    queryFn: () => fetchComments(steps.map((s) => s.id)),
    enabled: steps.length > 0,
  });

  const resourcesQuery = useQuery({
    queryKey: ["resources", activeTab?.id],
    queryFn: () => fetchResources(activeTab?.id),
    enabled: Boolean(activeTab?.id),
  });

  const currentStep = visibleSteps.find((s) => s.id === activeStepId) ?? visibleSteps[0];
  const allComments = commentsQuery.data ?? [];
  const stepComments = allComments.filter((c) => c.step_id === currentStep?.id);

  const loading = tabsQuery.isLoading || stepsQuery.isLoading;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader
        tabs={tabs}
        activeSlug={activeTab?.slug ?? ""}
        query={query}
        onQueryChange={setQuery}
      />

      <main className="mx-auto max-w-[1400px] px-4 py-8 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {activeTab?.title ?? "Learning path"}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Build production-ready {activeTab?.title ?? ".NET"} services
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Follow each step in order. Every step includes the exact commands, annotated code
            examples, screenshots and hard-won advice from senior engineers.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            {loading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)
            ) : visibleSteps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                <BookOpen className="mx-auto size-6 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  {query
                    ? `No steps match “${query}”.`
                    : "No published steps in this section yet. Add some from the admin panel."}
                </p>
              </div>
            ) : (
              visibleSteps.map((step) => (
                <StepCard
                  key={step.id}
                  step={step}
                  active={step.id === currentStep?.id}
                  onSelect={() => setActiveStepId(step.id)}
                  commentCount={allComments.filter((c) => c.step_id === step.id).length}
                />
              ))
            )}
          </div>

          <aside className="lg:sticky lg:top-32 lg:h-[calc(100vh-9rem)] lg:overflow-y-auto lg:pr-1">
            <div className="space-y-8">
              <CommentsPanel
                comments={stepComments}
                stepTitle={currentStep?.title}
                loading={commentsQuery.isLoading}
              />
              <ResourcesPanel resources={resourcesQuery.data ?? []} />
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Content managed through the admin CMS · .NET Web API Learning Guide
      </footer>
    </div>
  );
}
