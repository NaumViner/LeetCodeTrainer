"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5 text-center">
      <p className="text-primary text-sm font-semibold">Something went wrong</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        We could not load this page.
      </h1>
      <p className="text-muted mt-3">
        Try again. Your saved learning progress is not affected.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
