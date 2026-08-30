"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      aria-labelledby="error-title"
      className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5 text-center"
      role="alert"
    >
      <p className="text-primary text-sm font-semibold">Something went wrong</p>
      <h1
        className="mt-2 text-3xl font-semibold tracking-tight"
        id="error-title"
      >
        We could not load this page.
      </h1>
      <p className="text-muted mt-3">
        Try again. Your saved learning progress is not affected.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link
          className={buttonVariants({ variant: "secondary" })}
          href="/dashboard"
        >
          Go to dashboard
        </Link>
      </div>
      {error.digest ? (
        <p className="text-muted mt-5 font-mono text-xs">
          Reference: {error.digest}
        </p>
      ) : null}
    </main>
  );
}
