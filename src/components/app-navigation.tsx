import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

type AppNavigationProps = {
  items: NavigationItem[];
  activeId: string;
};

export function AppNavigation({ items, activeId }: AppNavigationProps) {
  return (
    <nav aria-label="Primary" className="overflow-x-auto pb-1">
      <ul className="flex min-w-max gap-1 rounded-xl border border-border bg-card p-1.5 shadow-sm">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeId;

          return (
            <li key={item.id}>
              <a
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
                <span>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
