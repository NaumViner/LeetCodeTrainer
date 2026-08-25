import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5 text-center">
      <p className="text-primary font-mono text-sm font-semibold">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        This page is not in the curriculum.
      </h1>
      <p className="text-muted mt-3">
        The link may be outdated or the page may have moved.
      </p>
      <Link className={buttonVariants({ size: "lg" })} href="/">
        Return home
      </Link>
    </main>
  );
}
