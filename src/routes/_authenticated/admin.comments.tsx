import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createRow,
  deleteRow,
  fetchAllComments,
  fetchAllSteps,
  updateRow,
  type StepComment,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/comments")({
  component: CommentsAdmin,
});

function CommentsAdmin() {
  const queryClient = useQueryClient();
  const stepsQuery = useQuery({ queryKey: ["all-steps"], queryFn: fetchAllSteps });
  const commentsQuery = useQuery({ queryKey: ["all-comments"], queryFn: fetchAllComments });
  const steps = stepsQuery.data ?? [];
  const comments = commentsQuery.data ?? [];

  const [stepId, setStepId] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Senior .NET Engineer");
  const [text, setText] = useState("");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["all-comments"] });

  const create = useMutation({
    mutationFn: () =>
      createRow<StepComment>("step_comments", {
        step_id: stepId,
        developer_name: name.trim(),
        role: role.trim(),
        comment: text.trim(),
        is_pinned: false,
      }),
    onSuccess: async () => {
      setName("");
      setText("");
      await refresh();
      toast.success("Comment added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Record<string, unknown> }) =>
      updateRow<StepComment>("step_comments", id, values),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRow("step_comments", id),
    onSuccess: async () => {
      await refresh();
      toast.success("Comment deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Developer comments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Notes shown in the sticky sidebar next to each step.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (stepId && name.trim() && text.trim()) create.mutate();
        }}
        className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-card"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Step</Label>
            <Select value={stepId} onValueChange={setStepId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a step" />
              </SelectTrigger>
              <SelectContent>
                {steps.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.step_number}. {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Developer name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Comment</Label>
          <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <Button type="submit" disabled={create.isPending}>
          <Plus className="size-4" /> Add comment
        </Button>
      </form>

      <ul className="space-y-2">
        {comments.map((comment) => {
          const step = steps.find((s) => s.id === comment.step_id);
          return (
            <li
              key={comment.id}
              className="rounded-xl border border-border bg-card p-4 shadow-card"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{comment.developer_name}</p>
                <span className="text-xs text-muted-foreground">{comment.role}</span>
                <span className="text-xs text-muted-foreground">
                  · {step ? `${step.step_number}. ${step.title}` : "Unassigned step"}
                </span>
                <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                  Pinned
                  <Switch
                    checked={comment.is_pinned}
                    onCheckedChange={(checked) =>
                      update.mutate({ id: comment.id, values: { is_pinned: checked } })
                    }
                  />
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove.mutate(comment.id)}
                  aria-label="Delete comment"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
              <Textarea
                rows={2}
                defaultValue={comment.comment}
                className="mt-3"
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (value && value !== comment.comment) {
                    update.mutate({ id: comment.id, values: { comment: value } });
                  }
                }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
