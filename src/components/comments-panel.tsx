import { useState } from "react";
import { Heart, MessageSquare, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { StepComment } from "@/lib/api";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function CommentCard({ comment }: { comment: StepComment }) {
  const [liked, setLiked] = useState(false);

  return (
    <li className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        {comment.avatar_base64 ? (
          <img
            src={comment.avatar_base64}
            alt={comment.developer_name}
            className="size-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials(comment.developer_name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {comment.developer_name}
            </p>
            {comment.is_pinned ? (
              <span className="flex items-center gap-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                <Pin className="size-2.5" /> Pinned
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {comment.role}
            {comment.role ? " · " : ""}
            {new Date(comment.created_at).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{comment.comment}</p>
      <div className="mt-3 flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setLiked((v) => !v)}
          className={`h-7 gap-1 px-2 text-xs ${liked ? "text-primary" : "text-muted-foreground"}`}
        >
          <Heart className={`size-3.5 ${liked ? "fill-current" : ""}`} />
          {liked ? "Helpful" : "Helpful?"}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs text-muted-foreground">
          <MessageSquare className="size-3.5" /> Reply
        </Button>
      </div>
    </li>
  );
}

export function CommentsPanel({
  comments,
  stepTitle,
  loading,
}: {
  comments: StepComment[];
  stepTitle?: string | undefined;
  loading?: boolean | undefined;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          Senior Developer Comments
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {stepTitle ? `Notes for “${stepTitle}”` : "Hover a step to see its notes"}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          No developer comments on this step yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <CommentCard key={c.id} comment={c} />
          ))}
        </ul>
      )}
    </div>
  );
}
