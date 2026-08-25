import { BookOpen, Gauge, History, Settings } from "lucide-react";
import Link from "next/link";

const items = [
  { href: "/dashboard", icon: Gauge, label: "Dashboard" },
  { href: "/dashboard#curriculum", icon: BookOpen, label: "Learn" },
  { href: "/dashboard#history", icon: History, label: "History" },
  { href: "/settings/profile", icon: Settings, label: "Settings" },
] as const;

export function AppNavigation() {
  return (
    <ul className="space-y-1">
      {items.map(({ href, icon: Icon, label }) => (
        <li key={label}>
          <Link
            className="text-muted hover:bg-surface-subtle hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"
            href={href}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
