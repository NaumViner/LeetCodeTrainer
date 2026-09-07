import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { AppShell } from "@/components/layout/app-shell";
import { AppNavigation } from "@/components/navigation/app-navigation";
import { Brand } from "@/components/navigation/brand";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getAuthenticatedUser } from "@/features/auth/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getAuthenticatedUser();
  if (!user || user.isAnonymous)
    return (
      <div className="bg-background min-h-screen">
        <header className="bg-surface flex min-h-16 items-center justify-between border-b px-5 sm:px-8">
          <Brand />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link className="text-sm font-medium" href="/login">
              Sign in
            </Link>
          </div>
        </header>
        <main id="main-content" className="mx-auto max-w-7xl p-5 sm:p-8">
          {children}
        </main>
      </div>
    );
  return (
    <AppShell
      header={
        <div className="flex items-center gap-3">
          <span className="text-muted hidden max-w-52 truncate text-sm sm:block">
            {user.email}
          </span>
          <ThemeToggle />
          <LogoutButton />
        </div>
      }
      navigation={<AppNavigation />}
    >
      {children}
    </AppShell>
  );
}
