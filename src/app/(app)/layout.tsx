import type { ReactNode } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { AppShell } from "@/components/layout/app-shell";
import { AppNavigation } from "@/components/navigation/app-navigation";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { requireAuthenticatedUser } from "@/features/auth/session";

export default async function ProtectedAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAuthenticatedUser();

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
