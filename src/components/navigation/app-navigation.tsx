"use client";

import { BriefcaseBusiness, History, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/interviews", icon: BriefcaseBusiness, label: "Start interview" },
  { href: "/interviews/history", icon: History, label: "My interviews" },
  { href: "/settings/profile", icon: Settings, label: "Settings" },
] as const;

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <ul className="flex gap-1 lg:block lg:space-y-1">
      {items.map(({ href, icon: Icon, label }) => {
        const active =
          pathname === href ||
          (href !== "/interviews" && pathname.startsWith(`${href}/`));
        return (
          <li key={label}>
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap lg:gap-3 ${active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-subtle hover:text-foreground"}`}
              href={href}
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
