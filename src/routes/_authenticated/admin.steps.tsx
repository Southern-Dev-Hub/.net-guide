import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileDown, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  CODE_LANGUAGES,
  DIFFICULTIES,
  createRow,
  deleteRow,
  fetchAllSteps,
  fetchTabs,
  updateRow,
  type CodeBlock,
  type LearningStep,
} from "@/lib/api";
import { exportStepToPdf, exportStepsToPdf } from "@/lib/step-pdf";
import { RichTextEditor } from "@/components/rich-text-editor";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/steps")({
  component: StepsAdmin,
});

const RICH_FIELDS = [
  { key: "description", label: "Description" },
  { key: "objectives", label: "Objectives" },
  { key: "notes", label: "Notes" },
  { key: "best_practices", label: "Best practices" },
  { key: "common_mistakes", label: "Common mistakes" },
  { key: "troubleshooting", label: "Troubleshooting" },
  { key: "step_references", label: "References" },
] as const;

function StepsAdmin() {
  const queryClient = useQueryClient();
  const tabsQuery = useQuery({ queryKey: ["tabs"], queryFn: fetchTabs });
  const stepsQuery = useQuery({ queryKey: ["all-steps"], queryFn: fetchAllSteps });

  const tabs = tabsQuery.data ?? [];
  const [tabId, setTabId] = useState<string>("");
  const activeTabId = tabId || tabs[0]?.id || "";
  const steps = useMemo(
    () => (stepsQuery.data ?? []).filter((s) => s.tab_id === activeTabId),
    [stepsQuery.data, activeTabId],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<LearningStep | null>(null);
  const selected = steps.find((s) => s.id === selectedId) ?? null;
  const editing = draft && draft.id === selected?.id ? draft : selected;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["all-steps"] });
    await queryClient.invalidateQueries({ queryKey: ["steps"] });
  };

  const create = useMutation({
    mutationFn: () =>
      createRow<LearningStep>("learning_steps", {
        tab_id: activeTabId,
        step_number: steps.length + 1,
        display_order: steps.length + 1,
        title: "New step",
        subtitle: "",
        difficulty: "Beginner",
        estimated_time: "10 min",
        status: "draft",
        overview: "",
        description: "",
        objectives: "",
        commands: "",
        code_blocks: [],
        notes: "",
        best_practices: "",
        common_mistakes: "",
        troubleshooting: "",
        step_references: "",
      }),
    onSuccess: async (row) => {
      await refresh();
      setSelectedId(row.id);
      setDraft(null);
      toast.success("Step created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: (step: LearningStep) =>
      updateRow<LearningStep>("learning_steps", step.id, {
        step_number: step.step_number,
        display_order: step.display_order,
        title: step.title,
        subtitle: step.subtitle,
        difficulty: step.difficulty,
        estimated_time: step.estimated_time,
        status: step.status,
        image_base64: step.image_base64,
        overview: step.overview,
        description: step.description,
        objectives: step.objectives,
        commands: step.commands,
        code_blocks: step.code_blocks,
        notes: step.notes,
        best_practices: step.best_practices,
        common_mistakes: step.common_mistakes,
        troubleshooting: step.troubleshooting,
        step_references: step.step_references,
      }),
    onSuccess: async () => {
      await refresh();
      setDraft(null);
      toast.success("Step saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRow("learning_steps", id),
    onSuccess: async () => {
      setSelectedId(null);
      setDraft(null);
      await refresh();
      toast.success("Step deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function patch(values: Partial<LearningStep>) {
    if (!editing) return;
    setDraft({ ...editing, ...values });
  }

  function patchBlock(index: number, values: Partial<CodeBlock>) {
    if (!editing) return;
    const blocks = editing.code_blocks.map((b, i) => (i === index ? { ...b, ...values } : b));
    patch({ code_blocks: blocks });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Learning steps</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Author tutorial steps, commands, code samples and screenshots.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div className="w-52 space-y-1.5">
            <Label>Section</Label>
            <Select
              value={activeTabId}
              onValueChange={(v) => {
                setTabId(v);
                setSelectedId(null);
                setDraft(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a tab" />
              </SelectTrigger>
              <SelectContent>
                {tabs.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              try {
                exportStepsToPdf(steps, tabs.find((t) => t.id === activeTabId)?.title);
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
            disabled={steps.length === 0}
          >
            <FileDown className="size-4" /> Download all steps as PDF
          </Button>
          <Button onClick={() => create.mutate()} disabled={!activeTabId || create.isPending}>
            <Plus className="size-4" /> New step
          </Button>

        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <ul className="space-y-2">
          {steps.map((step) => (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(step.id);
                  setDraft(null);
                }}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  step.id === selectedId
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-medium text-foreground">
                  {step.step_number}. {step.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {step.status} · {step.difficulty}
                </p>
              </button>
            </li>
          ))}
          {steps.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
              No steps in this section yet.
            </li>
          ) : null}
        </ul>

        {editing ? (
          <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Title</Label>
                <Input value={editing.title} onChange={(e) => patch({ title: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Subtitle</Label>
                <Input
                  value={editing.subtitle}
                  onChange={(e) => patch({ subtitle: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Step number</Label>
                <Input
                  type="number"
                  value={editing.step_number}
                  onChange={(e) =>
                    patch({
                      step_number: Number(e.target.value) || 1,
                      display_order: Number(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Estimated time</Label>
                <Input
                  value={editing.estimated_time}
                  onChange={(e) => patch({ estimated_time: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Select
                  value={editing.difficulty}
                  onValueChange={(v) => patch({ difficulty: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editing.status} onValueChange={(v) => patch({ status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Overview</Label>
                <Textarea
                  rows={3}
                  value={editing.overview}
                  onChange={(e) => patch({ overview: e.target.value })}
                />
              </div>
            </div>

            <ImageUpload
              value={editing.image_base64}
              onChange={(base64) => patch({ image_base64: base64 })}
            />

            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="code">Commands &amp; code</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 pt-4">
                {RICH_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label>{field.label}</Label>
                    <RichTextEditor
                      value={editing[field.key]}
                      onChange={(html) => patch({ [field.key]: html } as Partial<LearningStep>)}
                    />
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="code" className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label>Terminal commands</Label>
                  <Textarea
                    rows={4}
                    className="font-mono text-xs"
                    value={editing.commands}
                    onChange={(e) => patch({ commands: e.target.value })}
                    placeholder="dotnet new webapi -n MyApi"
                  />
                </div>

                <div className="space-y-3">
                  {editing.code_blocks.map((block, index) => (
                    <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="min-w-40 flex-1 space-y-1.5">
                          <Label>Title</Label>
                          <Input
                            value={block.title}
                            onChange={(e) => patchBlock(index, { title: e.target.value })}
                          />
                        </div>
                        <div className="w-36 space-y-1.5">
                          <Label>Language</Label>
                          <Select
                            value={block.language}
                            onValueChange={(v) => patchBlock(index, { language: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CODE_LANGUAGES.map((l) => (
                                <SelectItem key={l} value={l}>
                                  {l}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            patch({
                              code_blocks: editing.code_blocks.filter((_, i) => i !== index),
                            })
                          }
                          aria-label="Remove code block"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                      <Textarea
                        rows={8}
                        className="font-mono text-xs"
                        value={block.code}
                        onChange={(e) => patchBlock(index, { code: e.target.value })}
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() =>
                      patch({
                        code_blocks: [
                          ...editing.code_blocks,
                          { title: "Program.cs", language: "csharp", code: "" },
                        ],
                      })
                    }
                  >
                    <Plus className="size-4" /> Add code block
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button
                variant="ghost"
                onClick={() => remove.mutate(editing.id)}
                className="text-destructive"
              >
                <Trash2 className="size-4" /> Delete step
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    try {
                      exportStepToPdf(editing);
                    } catch (e) {
                      toast.error((e as Error).message);
                    }
                  }}
                >
                  <FileDown className="size-4" /> Download PDF
                </Button>
                <Button onClick={() => save.mutate(editing)} disabled={save.isPending}>
                  <Save className="size-4" /> Save changes
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Select a step to edit, or create a new one.
          </div>
        )}
      </div>
    </div>
  );
}
