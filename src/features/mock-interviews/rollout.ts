import { parseServerEnv } from "@/lib/env";
import type { InterviewSelectionMode } from "@/domain/interview-selection";

export type InterviewRolloutConfig = {
  codingWorkspaceEnabled: boolean;
  promptContentEnabled: boolean;
  selectionModesEnabled: boolean;
};

export function getInterviewRolloutConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): InterviewRolloutConfig {
  const env = parseServerEnv(environment);
  return {
    codingWorkspaceEnabled: env.INTERVIEW_CODING_WORKSPACE_ENABLED ?? true,
    promptContentEnabled: env.INTERVIEW_PROMPT_CONTENT_ENABLED ?? true,
    selectionModesEnabled: env.INTERVIEW_SELECTION_MODES_ENABLED ?? true,
  };
}

export function canUseInterviewSelectionMode(
  config: InterviewRolloutConfig,
  mode: InterviewSelectionMode,
) {
  return config.selectionModesEnabled || mode === "learning";
}
