import { Link } from "@tanstack/react-router";
import { Search, ShieldCheck } from "lucide-react";
import { getIcon } from "@/components/icon-map";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import type { NavTab } from "@/lib/api";

export function SiteHeader({
  tabs,
  activeSlug,
  query,
  onQueryChange,
}: {
  tabs: NavTab[];
  activeSlug: string;
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground">
            .N
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-foreground">
              .NET Web API Learning Guide
            </span>
            <span className="block text-[11px] text-muted-foreground">
              Step-by-step engineering handbook
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative w-44 sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search steps, commands, code…"
              className="h-9 pl-8 text-sm"
              aria-label="Search documentation"
            />
          </div>
          <ThemeToggle />
          <Link
            to="/admin"
            className="hidden items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:flex"
          >
            <ShieldCheck className="size-3.5" /> Admin
          </Link>
        </div>
      </div>

      <nav className="mx-auto max-w-[1400px] px-4 lg:px-8">
        <ul className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = getIcon(tab.icon);
            const isActive = tab.slug === activeSlug;
            return (
              <li key={tab.id}>
                <Link
                  to="/"
                  search={{ tab: tab.slug }}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "border-primary font-semibold text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {tab.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
