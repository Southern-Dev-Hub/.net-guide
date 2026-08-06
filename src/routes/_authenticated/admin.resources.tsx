import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  RESOURCE_TYPES,
  createRow,
  deleteRow,
  fetchResources,
  fetchTabs,
  updateRow,
  type Resource,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/resources")({
  component: ResourcesAdmin,
});

function ResourcesAdmin() {
  const queryClient = useQueryClient();
  const tabsQuery = useQuery({ queryKey: ["tabs"], queryFn: fetchTabs });
  const resourcesQuery = useQuery({ queryKey: ["all-resources"], queryFn: () => fetchResources() });
  const tabs = tabsQuery.data ?? [];
  const resources = resourcesQuery.data ?? [];

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<string>(RESOURCE_TYPES[0]);
  const [tabId, setTabId] = useState("");
  const [description, setDescription] = useState("");

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["all-resources"] });
    await queryClient.invalidateQueries({ queryKey: ["resources"] });
  };

  const create = useMutation({
    mutationFn: () =>
      createRow<Resource>("resources", {
        title: title.trim(),
        url: url.trim(),
        type,
        tab_id: tabId || null,
        description: description.trim(),
        display_order: resources.length + 1,
      }),
    onSuccess: async () => {
      setTitle("");
      setUrl("");
      setDescription("");
      await refresh();
      toast.success("Resource added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Record<string, unknown> }) =>
      updateRow<Resource>("resources", id, values),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRow("resources", id),
    onSuccess: async () => {
      await refresh();
      toast.success("Resource deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Resources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Links and downloads shown under the developer comments sidebar.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) create.mutate();
        }}
        className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:grid-cols-2"
      >
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>URL</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOURCE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Section</Label>
          <Select value={tabId} onValueChange={setTabId}>
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
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <Button type="submit" disabled={create.isPending}>
            <Plus className="size-4" /> Add resource
          </Button>
        </div>
      </form>

      <ul className="space-y-2">
        {resources.map((resource) => (
          <li
            key={resource.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
          >
            <Input
              defaultValue={resource.title}
              className="w-56"
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value && value !== resource.title) {
                  update.mutate({ id: resource.id, values: { title: value } });
                }
              }}
            />
            <Input
              defaultValue={resource.url}
              className="min-w-48 flex-1"
              onBlur={(e) =>
                update.mutate({ id: resource.id, values: { url: e.target.value.trim() } })
              }
            />
            <span className="text-xs text-muted-foreground">{resource.type}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => remove.mutate(resource.id)}
              aria-label="Delete resource"
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
