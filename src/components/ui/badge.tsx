import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "danger" | "neutral" | "primary" | "success" | "warning";

const variants: Record<BadgeVariant, string> = {
  danger: "bg-[var(--danger-soft)] text-[var(--danger)]",
  neutral: "bg-surface-subtle text-muted",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-[var(--warning-soft)] text-warning",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({
  className,
  variant = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
