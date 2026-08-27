import { BrainCircuit, CheckCircle2, Code2 } from "lucide-react";
import { redirect } from "next/navigation";

import { DiagnosticForm } from "@/components/diagnostic/diagnostic-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  initialDiagnosticQuestions,
  questionsByIds,
} from "@/domain/diagnostic";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { getDiagnosticAttempt } from "@/features/diagnostic/queries";
import { getProfile } from "@/features/profile/queries";

export default async function DiagnosticPage() {
  const user = await requireAuthenticatedUser();
  const [profile, attempt] = await Promise.all([
    getProfile(user.id),
    getDiagnosticAttempt(user.id),
  ]);
  if (!profile?.onboarding_completed) redirect("/onboarding");
  if (profile.diagnostic_completed || attempt?.status === "completed") {
    redirect("/diagnostic/results");
  }

  const codingQuestions = attempt
    ? questionsByIds(attempt.assigned_coding_question_ids)
    : [];
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">
            {attempt ? "Step 2 of 2" : "Step 1 of 2"}
          </Badge>
          <Badge>{attempt ? "Adaptive coding" : "Concepts and patterns"}</Badge>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          {attempt
            ? "Solve the assessment matched to your baseline."
            : "Find the right place to begin."}
        </h1>
        <p className="text-muted mt-3 max-w-2xl leading-7">
          {attempt
            ? "These implementation decisions were selected from your earlier responses. No dynamic programming traps or unnecessary difficulty jumps."
            : "This short diagnostic checks core concepts and pattern recognition before adapting the coding section. It sets a starting estimate; practice evidence will refine it."}
        </p>
        <ProgressBar
          className="mt-6"
          label="Diagnostic progress"
          value={attempt ? 65 : 15}
        />
      </div>

      {attempt ? (
        <Card className="bg-primary-soft">
          <CardContent className="flex items-start gap-4 p-5 sm:p-6">
            <Code2 aria-hidden="true" className="text-primary mt-0.5 size-5" />
            <div>
              <p className="font-semibold capitalize">
                {attempt.coding_tier} coding tier
              </p>
              <p className="text-muted mt-1 text-sm leading-6">
                Concept score {Math.round(attempt.concept_score)} · Pattern
                score {Math.round(attempt.pattern_score)} ·{" "}
                {codingQuestions.length}{" "}
                {codingQuestions.length === 1 ? "problem" : "problems"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-primary-soft">
          <CardContent className="flex items-start gap-4 p-5 sm:p-6">
            <BrainCircuit
              aria-hidden="true"
              className="text-primary mt-0.5 size-5"
            />
            <div>
              <p className="font-semibold">About 8 minutes</p>
              <p className="text-muted mt-1 text-sm leading-6">
                Answer from memory. A wrong answer is useful placement evidence,
                not a penalty.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <DiagnosticForm
        attemptId={attempt?.id}
        questions={attempt ? codingQuestions : initialDiagnosticQuestions}
        stage={attempt ? "coding" : "knowledge"}
      />

      <p className="text-muted flex items-center gap-2 text-xs">
        <CheckCircle2 aria-hidden="true" className="size-4" />
        Answers and scores remain private to your authenticated account.
      </p>
    </div>
  );
}
