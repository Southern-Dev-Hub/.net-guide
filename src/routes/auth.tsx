import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ensureDefaultAdmin } from "@/lib/bootstrap.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin sign in — .NET Web API Learning Guide" },
      { name: "description", content: "Sign in to manage tutorials, steps and developer notes." },
      { property: "og:title", content: "Admin sign in — .NET Web API Learning Guide" },
      { property: "og:description", content: "Content management for the learning portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const bootstrap = useServerFn(ensureDefaultAdmin);
  const [email, setEmail] = useState("admin@dotnetguide.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void bootstrap().catch(() => undefined);
  }, [bootstrap]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await bootstrap().catch(() => undefined);
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error(signInError.message);
      await navigate({ to: "/admin" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-7 shadow-raised">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <h1 className="text-base font-semibold text-foreground">Admin sign in</h1>
            <p className="text-xs text-muted-foreground">Content management console</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Sign in
          </Button>
        </form>

        <p className="mt-4 rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
          Default credentials are pre-filled: <strong>admin@dotnetguide.local</strong> /{" "}
          <strong>admin123</strong>. Change the password after your first sign in.
        </p>
      </div>
    </div>
  );
}
