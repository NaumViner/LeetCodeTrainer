import { z } from "zod";

import {
  buildInterviewPerformanceProfile,
  type InterviewProfileEvidence,
} from "@/domain/interview-profile";
import { interviewEvaluationSchema } from "@/features/interview-evaluation/model";
import { getProblemCatalog } from "@/features/problems/queries";
import { createClient } from "@/lib/supabase/server";

const evidenceCoverageSchema = z
  .object({
    hasCode: z.boolean(),
    hasFirstPartyQuestionContent: z.boolean(),
    hasTrustedTests: z.boolean(),
    phaseTimingCount: z.number().int().min(0),
    transcriptTurns: z.number().int().min(0),
  })
  .passthrough();
const sourceDifficultySchema = z.enum(["easy", "medium", "hard"]);
const sourceInterviewerLevelSchema = z.enum(["beginner", "faang_tough"]);

export async function getInterviewPerformanceProfile(
  userId: string,
  now = new Date(),
) {
  const supabase = await createClient();
  const [evaluationResult, interviewResult, catalog] = await Promise.all([
    supabase
      .from("mock_interview_evaluations")
      .select("*")
      .eq("user_id", userId)
      .eq("is_current", true)
      .in("status", ["completed", "provisional"])
      .order("completed_at", { ascending: false }),
    supabase
      .from("mock_interviews")
      .select("id, problem_id")
      .eq("user_id", userId)
      .eq("status", "completed"),
    getProblemCatalog(),
  ]);
  const error = evaluationResult.error ?? interviewResult.error;
  if (error)
    throw new Error("Interview performance profile could not be loaded.");

  const interviewById = new Map(
    (interviewResult.data ?? []).map((interview) => [interview.id, interview]),
  );
  const problemById = new Map(catalog.map((problem) => [problem.id, problem]));
  const evidence: InterviewProfileEvidence[] = [];
  for (const row of evaluationResult.data ?? []) {
    if (
      row.evaluation_version < 1 ||
      !row.completed_at ||
      row.raw_score === null ||
      row.confidence === null
    ) {
      continue;
    }
    const evaluation = interviewEvaluationSchema.safeParse({
      confidence: row.confidence,
      dimensions: row.dimensions,
      improvements: row.improvements,
      rawScore: row.raw_score,
      recommendedActions: row.recommended_actions,
      recurringSignals: row.recurring_signals,
      strengths: row.strengths,
      summary: row.summary,
    });
    const coverage = evidenceCoverageSchema.safeParse(row.evidence_coverage);
    const difficulty = sourceDifficultySchema.safeParse(row.source_difficulty);
    const interviewerLevel = sourceInterviewerLevelSchema.safeParse(
      row.source_interviewer_level,
    );
    const interview = interviewById.get(row.mock_interview_id);
    const problem = interview ? problemById.get(interview.problem_id) : null;
    if (
      !evaluation.success ||
      !coverage.success ||
      !difficulty.success ||
      !interviewerLevel.success ||
      !problem
    )
      continue;

    evidence.push({
      completedAt: row.completed_at,
      confidence: evaluation.data.confidence,
      difficulty: difficulty.data,
      dimensions: evaluation.data.dimensions,
      evidenceCoverage: coverage.data,
      id: row.id,
      interviewerLevel: interviewerLevel.data,
      primaryTopicId: problem.primaryTopic.id,
      rawScore: evaluation.data.rawScore,
      recurringSignals: evaluation.data.recurringSignals,
      secondaryTopicIds: problem.secondaryTopics.map((topic) => topic.id),
    });
  }

  const topics = [
    ...new Map(
      catalog.flatMap((problem) =>
        [problem.primaryTopic, ...problem.secondaryTopics].map((topic) => [
          topic.id,
          topic,
        ]),
      ),
    ).values(),
  ];
  return {
    evidence,
    profile: buildInterviewPerformanceProfile(evidence, {
      now,
      topicIds: topics.map((topic) => topic.id),
      totalTopicCount: topics.length,
    }),
    topics,
  };
}
