import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, LayoutDashboard, Link2, ListTree, LogOut, MessageSquare } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/tabs", label: "Navigation tabs", icon: ListTree, exact: false },
  { to: "/admin/steps", label: "Learning steps", icon: FileText, exact: false },
  { to: "/admin/comments", label: "Developer comments", icon: MessageSquare, exact: false },
  { to: "/admin/resources", label: "Resources", icon: Link2, exact: false },
] as const;

function AdminLayout() {
  const { isAdmin, loading, user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }

  if (loading) {
    return <div className="p-10 text-sm text-muted-foreground">Checking permissions…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-lg font-semibold text-foreground">Administrator access required</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The account {user?.email} does not have the admin role for this workspace.
        </p>
        <Button variant="outline" onClick={signOut}>
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card px-3 py-4 md:flex">
        <Link to="/" className="mb-6 flex items-center gap-2 px-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground">
            .N
          </span>
          <span className="text-sm font-semibold text-foreground">Content CMS</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-border pt-3">
          <p className="truncate px-3 text-xs text-muted-foreground">{user?.email}</p>
          <div className="flex items-center gap-2 px-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" className="flex-1 justify-start gap-2" onClick={signOut}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
        <div className="mb-4 flex gap-1 overflow-x-auto md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="whitespace-nowrap rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <Outlet />
      </main>
    </div>
  );
}
