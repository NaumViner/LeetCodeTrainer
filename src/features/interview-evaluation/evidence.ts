import "server-only";

import {
  buildInterviewEvidencePackage,
  type InterviewEvidencePackage,
  type TrustedTestResults,
} from "@/features/interview-evaluation/evidence-model";
import { getFirstPartyQuestionContent } from "@/features/interview-evaluation/question-content";
import { getMockInterview } from "@/features/mock-interviews/queries";

export async function assembleInterviewEvidencePackage(
  userId: string,
  interviewId: string,
  options: { trustedTests?: TrustedTestResults | null } = {},
): Promise<InterviewEvidencePackage> {
  const interview = await getMockInterview(userId, interviewId);
  if (!interview) {
    throw new Error("completed_interview_evidence_unavailable");
  }

  const evidence = buildInterviewEvidencePackage({
    assembledAt: new Date(),
    interview,
    problem: interview.problem,
    questionContent: getFirstPartyQuestionContent(interview.problem.slug),
    realtimeEvents: interview.realtimeEvents,
    realtimeSession: interview.realtimeSession,
    trustedTests: options.trustedTests,
  });
  if (!evidence) {
    throw new Error("completed_interview_evidence_invalid_state");
  }
  return evidence;
}
