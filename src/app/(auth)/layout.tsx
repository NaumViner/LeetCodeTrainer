import type { ReactNode } from "react";

import { Brand } from "@/components/navigation/brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[0.85fr_1.15fr]">
      <section className="bg-surface flex flex-col border-r px-5 py-6 sm:px-10 lg:px-14">
        <Brand />
        <div className="my-auto py-16">
          <p className="text-primary text-sm font-semibold">
            A plan that learns with you
          </p>
          <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Prepare with intention, not endless problem lists.
          </h1>
          <p className="text-muted mt-5 max-w-lg text-lg leading-8">
            Your account keeps practice history, independence, mistakes, and
            future reviews connected.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        {children}
      </section>
    </main>
  );
}
