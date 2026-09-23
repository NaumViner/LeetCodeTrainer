"use client";

import { useActionState } from "react";
import { FieldShell, Input } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialAuthActionState } from "@/features/auth/schema";
import {
  requestPasswordRecoveryAction,
  resetPasswordAction,
} from "@/features/auth/recovery-actions";

export function PasswordRecoveryForm({ mode }: { mode: "request" | "reset" }) {
  const [state, action] = useActionState(
    mode === "request" ? requestPasswordRecoveryAction : resetPasswordAction,
    initialAuthActionState,
  );
  const fields =
    mode === "request"
      ? [
          {
            name: "email",
            label: "Email",
            type: "email",
            autoComplete: "email",
          },
        ]
      : [
          {
            name: "password",
            label: "New password",
            type: "password",
            autoComplete: "new-password",
          },
          {
            name: "confirmation",
            label: "Confirm new password",
            type: "password",
            autoComplete: "new-password",
          },
        ];
  return (
    <form action={action} className="mt-6 space-y-5">
      {fields.map((field) => (
        <FieldShell
          key={field.name}
          htmlFor={field.name}
          label={field.label}
          error={state.fieldErrors?.[field.name]?.[0]}
          description={
            field.name === "password"
              ? "At least 8 characters, including a letter and a number."
              : undefined
          }
        >
          <Input
            id={field.name}
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            required
            aria-invalid={Boolean(state.fieldErrors?.[field.name])}
            aria-describedby={
              state.fieldErrors?.[field.name]
                ? `${field.name}-error`
                : undefined
            }
          />
        </FieldShell>
      ))}
      {state.message ? (
        <p role="status" className="bg-primary-soft rounded-lg p-3 text-sm">
          {state.message}
        </p>
      ) : null}
      <SubmitButton
        label={mode === "request" ? "Send reset link" : "Save new password"}
        pendingLabel={
          mode === "request" ? "Requesting link…" : "Saving password…"
        }
      />
    </form>
  );
}
