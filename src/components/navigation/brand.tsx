import { Braces } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandProps = {
  compact?: boolean;
  className?: string;
};

export function Brand({ compact = false, className }: BrandProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-center gap-2.5 font-semibold",
        className,
      )}
      href="/"
    >
      <span className="bg-primary flex size-8 items-center justify-center rounded-lg text-white">
        <Braces aria-hidden="true" className="size-4" strokeWidth={2.4} />
      </span>
      <span className={cn(compact && "sr-only")}>Interview Academy</span>
    </Link>
  );
}
