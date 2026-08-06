import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createRow, deleteRow, fetchTabs, slugify, updateRow, type NavTab } from "@/lib/api";
import { getIcon, ICON_NAMES } from "@/components/icon-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/tabs")({
  component: TabsAdmin,
});

function TabsAdmin() {
  const queryClient = useQueryClient();
  const tabsQuery = useQuery({ queryKey: ["tabs"], queryFn: fetchTabs });
  const tabs = tabsQuery.data ?? [];
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("BookOpen");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["tabs"] });

  const create = useMutation({
    mutationFn: () =>
      createRow<NavTab>("nav_tabs", {
        title: title.trim(),
        slug: slugify(title),
        icon,
        display_order: tabs.length + 1,
        is_active: true,
      }),
    onSuccess: async () => {
      setTitle("");
      await refresh();
      toast.success("Tab created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Record<string, unknown> }) =>
      updateRow<NavTab>("nav_tabs", id, values),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRow("nav_tabs", id),
    onSuccess: async () => {
      await refresh();
      toast.success("Tab deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Navigation tabs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tabs render across the top of the public portal, ordered by their position.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) create.mutate();
        }}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
      >
        <div className="min-w-48 flex-1 space-y-1.5">
          <Label htmlFor="tab-title">Tab title</Label>
          <Input
            id="tab-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder=".NET 10 Web API"
          />
        </div>
        <div className="w-44 space-y-1.5">
          <Label>Icon</Label>
          <Select value={icon} onValueChange={setIcon}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ICON_NAMES.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={create.isPending}>
          <Plus className="size-4" /> Add tab
        </Button>
      </form>

      <ul className="space-y-2">
        {tabs.map((tab) => {
          const Icon = getIcon(tab.icon);
          return (
            <li
              key={tab.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
            >
              <Icon className="size-4 text-primary" />
              <Input
                defaultValue={tab.title}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (value && value !== tab.title) {
                    update.mutate({ id: tab.id, values: { title: value, slug: slugify(value) } });
                  }
                }}
                className="w-56"
              />
              <span className="font-mono text-xs text-muted-foreground">/{tab.slug}</span>
              <Input
                type="number"
                defaultValue={tab.display_order}
                onBlur={(e) =>
                  update.mutate({
                    id: tab.id,
                    values: { display_order: Number(e.target.value) || 0 },
                  })
                }
                className="w-20"
                aria-label="Display order"
              />
              <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                Active
                <Switch
                  checked={tab.is_active}
                  onCheckedChange={(checked) =>
                    update.mutate({ id: tab.id, values: { is_active: checked } })
                  }
                />
              </label>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove.mutate(tab.id)}
                aria-label={`Delete ${tab.title}`}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
