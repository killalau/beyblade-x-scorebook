import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router";

import { cn } from "@/lib/utils";

export type NavigationItem = {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
};

type AppNavigationProps = { items: NavigationItem[] };

export function AppNavigation({ items }: AppNavigationProps) {
  return (
    <nav aria-label="Primary" className="overflow-x-auto pb-1">
      <ul className="flex min-w-max gap-1 rounded-xl border border-border bg-card p-1.5 shadow-sm">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                <Icon aria-hidden="true" className="size-4" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
