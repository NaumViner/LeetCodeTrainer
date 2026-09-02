import { notFound, redirect } from "next/navigation";

import { MockInterviewWorkspace } from "@/components/mock-interviews/mock-interview-workspace";
import {
  normalizeInterviewLanguage,
  normalizeInterviewerLevel,
  type MockInterviewPhase,
} from "@/domain/mock-interview";
import type { InterviewPhaseGuideEvent } from "@/domain/interview-phase-guide";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { getLearnerVisibleQuestionContent } from "@/features/interview-evaluation/question-content";
import { getMockInterview } from "@/features/mock-interviews/queries";
import { getInterviewRolloutConfig } from "@/features/mock-interviews/rollout";
import { getRealtimeInterviewProviderName } from "@/features/realtime-interviews/config";

export default async function MockInterviewPage({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const user = await requireAuthenticatedUser();
  const rollout = getInterviewRolloutConfig();
  const { interviewId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(interviewId)) notFound();
  const interview = await getMockInterview(user.id, interviewId);
  if (!interview) notFound();
  if (interview.status === "completed")
    redirect(`/interviews/${interview.id}/scorecard`);
  if (interview.status === "abandoned") redirect("/interviews/history");
  const realtimeProvider = getRealtimeInterviewProviderName();
  const questionContent = rollout.promptContentEnabled
    ? getLearnerVisibleQuestionContent(
        interview.problem.slug,
        interview.question_content_version,
      )
    : null;
  return (
    <MockInterviewWorkspace
      interview={{
        codeSnapshot: interview.code_snapshot ?? "",
        codingLanguage: interview.coding_language as "java" | "python",
        codingWorkspaceEnabled: rollout.codingWorkspaceEnabled,
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
        phaseEvents: interview.phaseEvents.map((event) => ({
          displaySummary: event.display_summary,
          id: event.id,
          phase: event.phase,
          suggestedPhase: event.suggested_phase,
          transitionType: event.transition_type,
        })) as InterviewPhaseGuideEvent[],
        realtimeEnabled: realtimeProvider !== null,
        realtimeEvidenceEventIds: interview.realtimeEvents
          .filter(
            (event) =>
              event.phase === interview.phase &&
              [
                "assistant_transcript",
                "code_snapshot",
                "phase_context",
                "user_transcript",
              ].includes(event.event_type),
          )
          .slice(-12)
          .map((event) => String(event.id)),
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
        scratchpad: interview.scratchpad ?? "",
        problem: {
          canonicalUrl:
            interview.problem.external_url ??
            `/problems/${interview.problem.external_id ?? "custom"}`,
          difficulty: interview.problem.difficulty,
          externalId: interview.problem.external_id ?? "custom",
          questionContent,
          title: interview.problem.title,
        },
        startedAt: interview.started_at,
        timerRunning: interview.timer_running,
        workspaceVersion: interview.workspace_version,
      }}
    />
  );
}
