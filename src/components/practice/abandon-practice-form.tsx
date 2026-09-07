"use client";

import { LogOut } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { abandonPracticeAttemptAction } from "@/features/practice/actions";
import { initialAbandonPracticeAttemptActionState } from "@/features/practice/schema";

export function AbandonPracticeForm({ attemptId }: { attemptId: string }) {
  const [state, formAction, pending] = useActionState(
    abandonPracticeAttemptAction,
    initialAbandonPracticeAttemptActionState,
  );

  return (
    <details>
      <summary className="text-muted hover:text-foreground cursor-pointer text-sm font-semibold">
        Abandon practice
      </summary>
      <form
        action={formAction}
        className="mt-3 rounded-xl border border-red-200 p-4 dark:border-red-900"
      >
        <input name="attemptId" type="hidden" value={attemptId} />
        <p className="text-sm font-semibold">End this practice attempt?</p>
        <p className="text-muted mt-2 text-xs leading-5">
          The timer will stop and this attempt cannot be resumed. It will not
          count as a completed solution or change your mastery.
        </p>
        <label className="mt-3 flex items-start gap-2 text-xs leading-5">
          <input
            className="mt-1"
            name="confirmation"
            required
            type="checkbox"
            value="abandon"
          />
          I understand and want to continue to mock interviews.
        </label>
        {state.status === "error" ? (
          <p
            aria-live="polite"
            className="mt-3 text-xs text-red-700 dark:text-red-300"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}
        <Button
          className="mt-4 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
          disabled={pending}
          size="sm"
          type="submit"
          variant="secondary"
        >
          <LogOut aria-hidden="true" className="size-4" />
          {pending ? "Ending practice…" : "Abandon and open interviews"}
        </Button>
      </form>
    </details>
  );
}
