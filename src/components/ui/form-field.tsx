import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

type FieldShellProps = {
  children: ReactNode;
  description?: string;
  error?: string;
  htmlFor: string;
  label: string;
};

export function FieldShell({
  children,
  description,
  error,
  htmlFor,
  label,
}: FieldShellProps) {
  return (
    <div>
      <label className="text-sm font-semibold" htmlFor={htmlFor}>
        {label}
      </label>
      {description ? (
        <p
          className="text-muted mt-1 text-xs leading-5"
          id={`${htmlFor}-description`}
        >
          {description}
        </p>
      ) : null}
      <div className="mt-2">{children}</div>
      {error ? (
        <p
          aria-live="polite"
          className="mt-1.5 text-sm text-red-600 dark:text-red-400"
          id={`${htmlFor}-error`}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "bg-surface placeholder:text-muted/70 focus:border-primary h-11 w-full rounded-lg border px-3 text-sm shadow-sm outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "bg-surface focus:border-primary h-11 w-full rounded-lg border px-3 text-sm shadow-sm outline-none",
        className,
      )}
      {...props}
    />
  );
}
