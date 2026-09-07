import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GuestSignupInvitation } from "@/components/mock-interviews/guest-signup-invitation";
import { DeleteInterviewForm } from "@/components/mock-interviews/delete-interview-form";
import { buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireInterviewUser } from "@/features/auth/session";
import { getMockInterview } from "@/features/mock-interviews/queries";
import { retryInterviewEvaluationAction } from "@/features/mock-interviews/actions";
import {
  interviewEvaluationSchema,
  INTERVIEW_EVALUATION_DIMENSIONS,
  interviewEvaluationDimensionLabels,
} from "@/features/interview-evaluation/model";

export default async function MockInterviewScorecardPage({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const user = await requireInterviewUser();
  const { interviewId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(interviewId)) notFound();
  const interview = await getMockInterview(user.id, interviewId);
  if (!interview) notFound();
  if (interview.status === "active") redirect("/interviews/" + interview.id);
  if (interview.status === "abandoned")
    redirect("/interviews/" + interview.id + "/ended");
  const parsed = interview.evaluation
    ? interviewEvaluationSchema.safeParse({
        confidence: interview.evaluation.confidence,
        dimensions: interview.evaluation.dimensions,
        improvements: interview.evaluation.improvements,
        rawScore: interview.evaluation.raw_score,
        recommendedActions: interview.evaluation.recommended_actions,
        recurringSignals: interview.evaluation.recurring_signals,
        strengths: interview.evaluation.strengths,
        summary: interview.evaluation.summary,
      })
    : null;
  const evaluation = parsed?.success ? parsed.data : null;
  const hebrew = interview.interview_language === "hebrew";
  const score = evaluation?.rawScore ?? interview.scorecard?.overall_score;
  return (
    <div className="mx-auto max-w-5xl space-y-6" dir={hebrew ? "rtl" : "ltr"}>
      <header className="bg-success-soft rounded-2xl border p-6 sm:p-8">
        <p className="text-sm font-semibold">
          {hebrew ? "הראיון הושלם" : "Interview complete"}
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          {hebrew ? "המשוב על הראיון שלך" : "Your interview feedback"}
        </h1>
        {score !== undefined ? (
          <p className="mt-5 text-5xl font-semibold">
            {Math.round(score)}
            <span className="text-muted text-base"> / 100</span>
          </p>
        ) : null}
        <p className="text-muted mt-3 text-sm">
          {interview.problem.primaryTopic.name} · {interview.duration_minutes}{" "}
          min ·{" "}
          {interview.interviewer_level === "faang_tough"
            ? "Tough"
            : "Comfortable"}
        </p>
        <p className="text-muted mt-2 text-xs">
          {hebrew
            ? "הערכה לצורך תרגול, שאינה מבטיחה תוצאה בראיון עבודה."
            : "A training estimate, not a prediction of interview outcome."}
        </p>
      </header>
      {user.isAnonymous ? <GuestSignupInvitation hebrew={hebrew} /> : null}
      <nav className="flex flex-wrap gap-3" aria-label="Interview result views">
        <Link
          className={buttonVariants({ variant: "secondary" })}
          href={"/interviews/" + interview.id + "/review"}
        >
          {hebrew ? "צפייה בשיחה ובקוד" : "Review interview"}
        </Link>
        <Link className={buttonVariants()} href="/interviews">
          {hebrew ? "ראיון נוסף" : "Next interview"}
        </Link>
      </nav>
      {evaluation ? (
        <>
          <section className="bg-surface rounded-xl border p-6">
            <h2 className="text-xl font-semibold">
              {hebrew ? "סיכום" : "Summary"}
            </h2>
            <p className="text-muted mt-2 text-xs">
              {interview.evaluation?.status === "completed"
                ? "AI evaluation"
                : "Provisional fallback"}{" "}
              · {Math.round(evaluation.confidence * 100)}% confidence
            </p>
            <p className="mt-4 leading-7">{evaluation.summary}</p>
          </section>
          <section
            className="grid gap-4 sm:grid-cols-2"
            aria-label="Interview rubric"
          >
            {INTERVIEW_EVALUATION_DIMENSIONS.map((dimension) => {
              const result = evaluation.dimensions[dimension];
              return (
                <article
                  className="bg-surface rounded-xl border p-5"
                  key={dimension}
                >
                  <h2 className="font-semibold">
                    {interviewEvaluationDimensionLabels[dimension]}
                  </h2>
                  <p className="text-primary mt-2 font-semibold">
                    {result.confidence > 0
                      ? result.score + "/5"
                      : "Not assessed"}
                  </p>
                  <p className="text-muted mt-3 text-sm leading-6">
                    {result.rationale}
                  </p>
                </article>
              );
            })}
          </section>
          <div className="grid gap-4 sm:grid-cols-2">
            <section className="bg-surface rounded-xl border p-5">
              <h2 className="font-semibold">
                {hebrew ? "חוזקות" : "Strengths"}
              </h2>
              <ul className="mt-3 list-inside list-disc space-y-2 text-sm">
                {evaluation.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section className="bg-surface rounded-xl border p-5">
              <h2 className="font-semibold">
                {hebrew ? "מה לשפר" : "What to improve"}
              </h2>
              <ul className="mt-3 list-inside list-disc space-y-2 text-sm">
                {evaluation.improvements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
          <p className="text-muted text-xs leading-5">
            {hebrew
              ? "נכונות הקוד מבוססת על ראיות מהראיון. הקוד לא הורץ בבדיקות אוטומטיות."
              : "Code correctness is based on interview evidence. Code was not executed against automated tests."}
          </p>
        </>
      ) : (
        <section className="bg-surface rounded-xl border p-6">
          <h2 className="text-xl font-semibold">
            {hebrew ? "הראיון נשמר" : "Your interview is saved"}
          </h2>
          <p className="text-muted mt-3 text-sm">
            {hebrew
              ? "המשוב המפורט עדיין אינו זמין. אפשר לשמור את הראיון בחשבון ולנסות שוב."
              : "Detailed feedback is not available yet. You can still save the interview to your account and try again."}
          </p>
          <form action={retryInterviewEvaluationAction} className="mt-4">
            <input name="interviewId" type="hidden" value={interview.id} />
            <SubmitButton
              label="Check feedback again"
              pendingLabel="Preparing feedback…"
            />
          </form>
        </section>
      )}
      {!user.isAnonymous ? (
        <Link
          className="text-primary block text-sm underline"
          href="/diagnostic"
        >
          Optional skills assessment
        </Link>
      ) : null}
      <DeleteInterviewForm interviewId={interview.id} />
    </div>
  );
}
