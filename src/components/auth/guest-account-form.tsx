"use client";
import { useActionState, useState } from "react";
import { FieldShell, Input } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialAuthActionState } from "@/features/auth/schema";
import {
  completeAccountAction,
  requestGuestEmailAction,
  retryGuestClaimAction,
  verifyGuestEmailAction,
} from "@/features/auth/guest-actions";

export function GuestAccountForm({
  mode = "email",
}: {
  mode?: "email" | "password" | "transfer";
}) {
  const [state, action] = useActionState(
    mode === "password"
      ? completeAccountAction
      : mode === "transfer"
        ? retryGuestClaimAction
        : requestGuestEmailAction,
    initialAuthActionState,
  );
  const [verifyState, verify] = useActionState(
    verifyGuestEmailAction,
    initialAuthActionState,
  );
  const [email, setEmail] = useState("");
  return (
    <div className="space-y-6">
      <form action={action} className="space-y-5">
        {mode === "email" ? (
          <FieldShell htmlFor="guest-email" label="Email">
            <Input
              id="guest-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </FieldShell>
        ) : null}
        {mode === "password" ? (
          <FieldShell
            htmlFor="new-password"
            label="Choose a password"
            description="At least 8 characters with a letter and a number."
          >
            <Input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </FieldShell>
        ) : null}
        {state.message ? (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className="text-muted text-sm leading-6"
          >
            {state.message}
          </p>
        ) : null}
        <SubmitButton
          className="w-full"
          label={
            mode === "email"
              ? "Verify email & save interview"
              : mode === "password"
                ? "Save account"
                : "Attach my interview"
          }
          pendingLabel="Saving…"
        />
      </form>
      {mode === "email" && state.status === "success" ? (
        <form action={verify} className="space-y-4 border-t pt-5">
          <input type="hidden" name="email" value={email} />
          <FieldShell htmlFor="email-code" label="Verification code">
            <Input
              id="email-code"
              name="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,8}"
              required
            />
          </FieldShell>
          {verifyState.message ? (
            <p role="alert" className="text-danger text-sm">
              {verifyState.message}
            </p>
          ) : null}
          <SubmitButton label="Verify code" pendingLabel="Verifying…" />
        </form>
      ) : null}
    </div>
  );
}
