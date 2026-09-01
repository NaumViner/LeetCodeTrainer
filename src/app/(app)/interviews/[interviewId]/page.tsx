import { notFound, redirect } from "next/navigation";

import { MockInterviewWorkspace } from "@/components/mock-interviews/mock-interview-workspace";
import {
  normalizeInterviewLanguage,
  normalizeInterviewerLevel,
  type MockInterviewPhase,
} from "@/domain/mock-interview";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { getMockInterview } from "@/features/mock-interviews/queries";
import { getRealtimeInterviewProviderName } from "@/features/realtime-interviews/config";

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
  const realtimeProvider = getRealtimeInterviewProviderName();
  return (
    <MockInterviewWorkspace
      interview={{
        difficultyMode: interview.difficulty_mode,
        durationMinutes: interview.duration_minutes,
        effectiveElapsedSeconds: interview.effectiveElapsedSeconds,
        id: interview.id,
        interviewerLevel: normalizeInterviewerLevel(
          interview.interviewer_level,
        ),
        interviewLanguage: normalizeInterviewLanguage(
          interview.interview_language,
        ),
        phase: interview.phase as MockInterviewPhase,
        realtimeEnabled: realtimeProvider !== null,
        realtimeProvider,
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
        startedAt: interview.started_at,
        timerRunning: interview.timer_running,
      }}
    />
  );
}
