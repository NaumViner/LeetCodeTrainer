"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { deleteMockInterviewAction } from "@/features/mock-interviews/actions";
import { initialMockInterviewDeleteActionState } from "@/features/mock-interviews/schema";

export function DeleteInterviewForm({ interviewId }: { interviewId: string }) {
  const [state, formAction, pending] = useActionState(
    deleteMockInterviewAction,
    initialMockInterviewDeleteActionState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") router.replace("/interviews/history");
  }, [router, state.status]);

  return (
    <details className="relative">
      <summary className="text-muted hover:text-foreground cursor-pointer text-sm font-semibold">
        Delete
      </summary>
      <form
        action={formAction}
        className="bg-surface mt-3 w-full rounded-xl border border-red-200 p-4 sm:absolute sm:right-0 sm:z-10 sm:w-80 dark:border-red-900"
      >
        <input name="interviewId" type="hidden" value={interviewId} />
        <p className="text-sm font-semibold">Delete this mock interview?</p>
        <p className="text-muted mt-2 text-xs leading-5">
          This permanently removes the interview, transcript, scorecard, and
          evaluation. Its effect on topic coverage, profile scores, and future
          recommendations is recalculated from the remaining evidence.
        </p>
        <label className="mt-3 flex items-start gap-2 text-xs leading-5">
          <input
            className="mt-1"
            name="confirmation"
            required
            type="checkbox"
            value="delete"
          />
          I understand that this cannot be undone.
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
          <Trash2 aria-hidden="true" className="size-4" />
          {pending ? "Deleting…" : "Delete permanently"}
        </Button>
      </form>
    </details>
  );
}
