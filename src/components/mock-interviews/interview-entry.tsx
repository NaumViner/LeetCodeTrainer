import Link from "next/link";
import { Brand } from "@/components/navigation/brand";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { MockInterviewSetupForm } from "@/components/mock-interviews/mock-interview-setup-form";
import { GuestSignupInvitation } from "@/components/mock-interviews/guest-signup-invitation";
import { getAuthenticatedUser } from "@/features/auth/session";
import { getActiveMockInterview } from "@/features/mock-interviews/queries";
import {
  getGuestInterviewTrial,
  getInterviewPreferences,
} from "@/features/mock-interviews/guest";
import { resumeMockInterviewAction } from "@/features/mock-interviews/actions";
import { getActiveAttempt } from "@/features/practice/queries";
import { defaultInterviewPreferences } from "@/domain/interview-setup";
import { getRealtimeInterviewProviderName } from "@/features/realtime-interviews/config";
import { getInterviewRolloutConfig } from "@/features/mock-interviews/rollout";

export async function InterviewEntry({
  standalone = false,
}: {
  standalone?: boolean;
}) {
  const user = await getAuthenticatedUser();
  const [active, defaults, trial, practice] = user
    ? await Promise.all([
        getActiveMockInterview(),
        getInterviewPreferences(),
        user.isAnonymous ? getGuestInterviewTrial() : null,
        user.isAnonymous ? null : getActiveAttempt(user.id),
      ])
    : [null, defaultInterviewPreferences, null, null];
  const guest = !user || user.isAnonymous;
  const rollout = getInterviewRolloutConfig();
  const content = (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
      <div className="mb-8 text-center">
        <p className="text-primary text-sm font-semibold tracking-wide">
          AI MOCK INTERVIEW
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Your next interview starts here.
        </h1>
        <p className="text-muted mx-auto mt-4 max-w-xl leading-7">
          A real conversation. A coding challenge. Feedback on how you think.
        </p>
      </div>
      {active ? (
        <section className="bg-surface rounded-2xl border p-7 text-center">
          <h2 className="text-xl font-semibold">
            Your interview is ready to continue
          </h2>
          <p className="text-muted mt-2 text-sm">
            Return to the same conversation and saved code.
          </p>
          <form action={resumeMockInterviewAction} className="mt-5">
            <button className={buttonVariants()} type="submit">
              Continue interview
            </button>
          </form>
        </section>
      ) : trial?.consumed ? (
        <>
          <GuestSignupInvitation
            required
            hebrew={defaults.interviewLanguage === "hebrew"}
            ended={trial.status === "abandoned"}
          />
          {trial.interviewId ? (
            <Link
              className="text-primary mt-5 block text-center text-sm underline"
              href={`/interviews/${trial.interviewId}/${trial.status === "completed" ? "scorecard" : "ended"}`}
            >
              View your first interview
            </Link>
          ) : null}
        </>
      ) : (
        <section className="bg-surface rounded-2xl border p-6 shadow-sm sm:p-8">
          {practice ? (
            <div className="bg-primary-soft mb-5 rounded-lg p-4 text-sm">
              <p>
                You have unfinished practice. Save and end it before starting an
                interview.
              </p>
              <Link
                className="text-primary mt-2 inline-block underline"
                href={`/practice/${practice.id}`}
              >
                Open unfinished practice
              </Link>
            </div>
          ) : null}
          <MockInterviewSetupForm
            defaults={defaults}
            isGuest={guest}
            voiceAvailable={
              getRealtimeInterviewProviderName() !== null &&
              rollout.promptContentEnabled &&
              !practice
            }
          />
        </section>
      )}
      {!guest ? (
        <div className="text-muted mt-6 flex flex-wrap justify-center gap-5 text-sm">
          <Link className="underline" href="/interviews/history">
            Interview history
          </Link>
          <Link className="underline" href="/diagnostic">
            Optional skills assessment
          </Link>
        </div>
      ) : null}
    </div>
  );
  if (!standalone) return content;
  return (
    <main className="bg-background min-h-screen">
      <header className="bg-surface border-b">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-5">
          <Brand />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              className="text-sm font-medium"
              href={guest ? "/login" : "/interviews/history"}
            >
              {guest ? "Sign in" : "My interviews"}
            </Link>
          </div>
        </div>
      </header>
      {content}
    </main>
  );
}
