import { notFound, redirect } from "next/navigation";

import { MockInterviewWorkspace } from "@/components/mock-interviews/mock-interview-workspace";
import {
  normalizeInterviewLanguage,
  type MockInterviewPhase,
} from "@/domain/mock-interview";
import { requireAuthenticatedUser } from "@/features/auth/session";
import { getActiveInterviewQuestionPrompt } from "@/features/interview-evaluation/question-content";
import {
  getMockInterview,
  getOwnedActiveMockInterview,
  getRecentActiveInterviewTranscript,
} from "@/features/mock-interviews/queries";
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
  const [interview, recentTranscript] = await Promise.all([
    getOwnedActiveMockInterview(interviewId),
    getRecentActiveInterviewTranscript(interviewId),
  ]);
  if (!interview) {
    const finishedInterview = await getMockInterview(user.id, interviewId);
    if (!finishedInterview) notFound();
    if (finishedInterview.status === "completed") {
      redirect(`/interviews/${finishedInterview.id}/scorecard`);
    }
    redirect("/interviews/history");
  }
  const realtimeProvider = getRealtimeInterviewProviderName();
  const questionPrompt = rollout.promptContentEnabled
    ? getActiveInterviewQuestionPrompt(
        interview.questionContentKey,
        interview.questionContentVersion,
      )
    : null;
  if (!questionPrompt) notFound();
  return (
    <MockInterviewWorkspace
      interview={{
        codeSnapshot: interview.codeSnapshot ?? "",
        codingLanguage: interview.codingLanguage,
        codingWorkspaceEnabled: rollout.codingWorkspaceEnabled,
        durationMinutes: interview.durationMinutes,
        effectiveElapsedSeconds: interview.effectiveElapsedSeconds,
        id: interview.id,
        initialRecentTranscript: recentTranscript,
        interviewLanguage: normalizeInterviewLanguage(
          interview.interviewLanguage,
        ),
        phase: interview.phase as MockInterviewPhase,
        questionPrompt,
        realtimeEnabled: realtimeProvider !== null,
        realtimeProvider,
        scratchpad: interview.scratchpad ?? "",
        startedAt: interview.startedAt,
        timerRunning: interview.timerRunning,
        workspaceVersion: interview.workspaceVersion,
      }}
    />
  );
}
