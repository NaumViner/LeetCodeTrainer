import { parseServerEnv } from "@/lib/env";
import type { InterviewSelectionMode } from "@/domain/interview-selection";

export type InterviewRolloutConfig = {
  codingWorkspaceEnabled: boolean;
  followUpEnabled: boolean;
  liveStageEnabled: boolean;
  promptContentEnabled: boolean;
  reviewTimelineEnabled: boolean;
  selectionModesEnabled: boolean;
};

export function getInterviewRolloutConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): InterviewRolloutConfig {
  const env = parseServerEnv(environment);
  return {
    codingWorkspaceEnabled: env.INTERVIEW_CODING_WORKSPACE_ENABLED ?? true,
    followUpEnabled: env.INTERVIEW_FOLLOW_UP_ENABLED ?? true,
    liveStageEnabled: env.INTERVIEW_LIVE_STAGE_ENABLED ?? true,
    promptContentEnabled: env.INTERVIEW_PROMPT_CONTENT_ENABLED ?? true,
    reviewTimelineEnabled: env.INTERVIEW_REVIEW_TIMELINE_ENABLED ?? true,
    selectionModesEnabled: env.INTERVIEW_SELECTION_MODES_ENABLED ?? true,
  };
}

export function canUseInterviewSelectionMode(
  config: InterviewRolloutConfig,
  mode: InterviewSelectionMode,
) {
  return config.selectionModesEnabled || mode === "learning";
}
