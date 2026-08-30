import { notFound, redirect } from "next/navigation";

import { MockInterviewWorkspace } from "@/components/mock-interviews/mock-interview-workspace";
import type { MockInterviewPhase } from "@/domain/mock-interview";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { getMockInterview } from "@/features/mock-interviews/queries";
import { isRealtimeInterviewEnabled } from "@/features/realtime-interviews/config";

export default async function MockInterviewPage({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const user = await requireAuthenticatedUser();
  const { interviewId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(interviewId)) notFound();
  const interview = await getMockInterview(user.id, interviewId);
  if (!interview) notFound();
  if (interview.status === "completed")
    redirect(`/interviews/${interview.id}/scorecard`);
  if (interview.status === "abandoned") redirect("/interviews/history");
  return (
    <MockInterviewWorkspace
      interview={{
        difficultyMode: interview.difficulty_mode,
        durationMinutes: interview.duration_minutes,
        effectiveElapsedSeconds: interview.effectiveElapsedSeconds,
        id: interview.id,
        phase: interview.phase as MockInterviewPhase,
        realtimeEnabled: isRealtimeInterviewEnabled(),
        realtimeTranscript: interview.realtimeEvents.flatMap((event) => {
          if (
            event.event_type !== "user_transcript" &&
            event.event_type !== "assistant_transcript"
          ) {
            return [];
          }
          return [
            {
              id: String(event.id),
              role:
                event.event_type === "user_transcript"
                  ? ("learner" as const)
                  : ("interviewer" as const),
              text: event.content,
            },
          ];
        }),
        problem: {
          canonicalUrl:
            interview.problem.external_url ??
            `/problems/${interview.problem.external_id ?? "custom"}`,
          difficulty: interview.problem.difficulty,
          externalId: interview.problem.external_id ?? "custom",
          title: interview.problem.title,
        },
        timerRunning: interview.timer_running,
      }}
    />
  );
}
