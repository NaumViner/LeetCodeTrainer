import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireInterviewUser } from "@/features/auth/session";
import { getMockInterview } from "@/features/mock-interviews/queries";
import { GuestSignupInvitation } from "@/components/mock-interviews/guest-signup-invitation";
import { buttonVariants } from "@/components/ui/button";
export default async function EndedInterviewPage({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const user = await requireInterviewUser();
  const { interviewId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(interviewId)) notFound();
  const interview = await getMockInterview(user.id, interviewId);
  if (!interview) notFound();
  if (interview.status !== "abandoned") redirect("/interviews/" + interview.id);
  const hebrew = interview.interview_language === "hebrew";
  return (
    <div className="mx-auto max-w-3xl space-y-6" dir={hebrew ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-3xl font-semibold">
          {hebrew ? "הראיון לא הושלם" : "Interview ended early"}
        </h1>
        <p className="text-muted mt-3">
          {hebrew
            ? "העבודה שביצעת נשמרה. ראיון שלא הושלם לא מקבל ציון סופי."
            : "The work you did is saved. An unfinished interview does not receive a final score."}
        </p>
      </div>
      {user.isAnonymous ? (
        <GuestSignupInvitation hebrew={hebrew} ended />
      ) : (
        <Link className={buttonVariants()} href="/interviews">
          Start another interview
        </Link>
      )}
      {interview.code_snapshot ? (
        <section className="bg-surface rounded-xl border p-5">
          <h2 className="mb-3 font-semibold">
            {hebrew ? "הקוד שנשמר" : "Saved code"}
          </h2>
          <pre
            dir="ltr"
            className="overflow-x-auto text-sm whitespace-pre-wrap"
          >
            {interview.code_snapshot}
          </pre>
        </section>
      ) : null}
      {interview.scratchpad ? (
        <section className="bg-surface rounded-xl border p-5">
          <h2 className="mb-3 font-semibold">
            {hebrew ? "הערות שנשמרו" : "Saved notes"}
          </h2>
          <p className="whitespace-pre-wrap">{interview.scratchpad}</p>
        </section>
      ) : null}
    </div>
  );
}
