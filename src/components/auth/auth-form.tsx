"use client";

import { useActionState } from "react";

import { FieldShell, Input } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  initialAuthActionState,
  type AuthActionState,
} from "@/features/auth/schema";

type AuthFormProps = {
  action: (
    state: AuthActionState,
    payload: FormData,
  ) => Promise<AuthActionState>;
  configured: boolean;
  mode: "login" | "signup";
};

export function AuthForm({ action, configured, mode }: AuthFormProps) {
  const [state, formAction] = useActionState(action, initialAuthActionState);
  const isSignup = mode === "signup";

  return (
    <form action={formAction} className="space-y-5">
      {isSignup ? (
        <FieldShell
          error={state.fieldErrors?.displayName?.[0]}
          htmlFor="displayName"
          label="Display name"
        >
          <Input
            aria-describedby={
              state.fieldErrors?.displayName ? "displayName-error" : undefined
            }
            autoComplete="name"
            disabled={!configured}
            id="displayName"
            name="displayName"
            placeholder="Ada Lovelace"
            required
          />
        </FieldShell>
      ) : null}

      <FieldShell
        error={state.fieldErrors?.email?.[0]}
        htmlFor="email"
        label="Email"
      >
        <Input
          aria-describedby={
            state.fieldErrors?.email ? "email-error" : undefined
          }
          autoComplete="email"
          disabled={!configured}
          id="email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
      </FieldShell>

      <FieldShell
        description={
          isSignup
            ? "At least 8 characters with a letter and number."
            : undefined
        }
        error={state.fieldErrors?.password?.[0]}
        htmlFor="password"
        label="Password"
      >
        <Input
          aria-describedby={
            state.fieldErrors?.password ? "password-error" : undefined
          }
          autoComplete={isSignup ? "new-password" : "current-password"}
          disabled={!configured}
          id="password"
          name="password"
          required
          type="password"
        />
      </FieldShell>

      {state.message ? (
        <p
          aria-live="polite"
          className={
            state.status === "success"
              ? "bg-success-soft text-success rounded-lg px-3 py-2 text-sm"
              : "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
          }
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton
        className="w-full"
        label={isSignup ? "Create account" : "Sign in"}
        pendingLabel={isSignup ? "Creating account…" : "Signing in…"}
      />
    </form>
  );
}
