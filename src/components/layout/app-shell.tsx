import type { ReactNode } from "react";

import { Brand } from "@/components/navigation/brand";

type AppShellProps = {
  children: ReactNode;
  navigation: ReactNode;
};

export function AppShell({ children, navigation }: AppShellProps) {
  return (
    <div className="bg-background min-h-screen">
      <a
        className="bg-primary fixed top-3 left-3 z-50 -translate-y-20 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:translate-y-0"
        href="#main-content"
      >
        Skip to content
      </a>
      <aside className="bg-surface fixed inset-y-0 left-0 hidden w-64 border-r p-5 lg:block">
        <Brand />
        <nav aria-label="Application navigation" className="mt-8">
          {navigation}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <div className="bg-surface border-b px-5 py-4 lg:hidden">
          <Brand />
        </div>
        <main className="mx-auto max-w-7xl p-5 sm:p-8" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
