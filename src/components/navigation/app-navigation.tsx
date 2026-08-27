import {
  BookOpen,
  BriefcaseBusiness,
  CalendarCheck2,
  ChartNoAxesCombined,
  Dumbbell,
  Gauge,
  History,
  LibraryBig,
  RefreshCw,
  Settings,
} from "lucide-react";
import Link from "next/link";

const items = [
  { href: "/dashboard", icon: Gauge, label: "Dashboard" },
  { href: "/plan", icon: CalendarCheck2, label: "Today" },
  { href: "/learn", icon: BookOpen, label: "Learn" },
  { href: "/practice", icon: Dumbbell, label: "Practice" },
  { href: "/review", icon: RefreshCw, label: "Review" },
  { href: "/interviews", icon: BriefcaseBusiness, label: "Interview" },
  { href: "/problems", icon: LibraryBig, label: "Problems" },
  { href: "/progress", icon: ChartNoAxesCombined, label: "Progress" },
  { href: "/history", icon: History, label: "History" },
  { href: "/settings/profile", icon: Settings, label: "Settings" },
] as const;

export function AppNavigation() {
  return (
    <ul className="flex gap-1 lg:block lg:space-y-1">
      {items.map(({ href, icon: Icon, label }) => (
        <li key={label}>
          <Link
            className="text-muted hover:bg-surface-subtle hover:text-foreground flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap lg:gap-3"
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
