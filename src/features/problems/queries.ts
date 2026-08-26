import {
  buildProblemCatalog,
  type Problem,
  type ProblemPrerequisiteRow,
  type ProblemRow,
  type ProblemTopic,
  type ProblemTopicRow,
} from "@/features/problems/model";
import { createClient } from "@/lib/supabase/server";

export async function getProblemCatalog(): Promise<Problem[]> {
  const supabase = await createClient();
  const [problemsResult, topicsResult, secondaryResult, prerequisitesResult] =
    await Promise.all([
      supabase.from("problems").select("*").order("dataset_order"),
      supabase.from("topics").select("*").order("curriculum_order"),
      supabase.from("problem_secondary_topics").select("*"),
      supabase.from("problem_prerequisite_topics").select("*"),
    ]);
  const error =
    problemsResult.error ??
    topicsResult.error ??
    secondaryResult.error ??
    prerequisitesResult.error;

  if (error) {
    throw new Error("Problem library could not be loaded: " + error.message);
  }

  return buildProblemCatalog({
    prerequisites: (prerequisitesResult.data ?? []) as ProblemPrerequisiteRow[],
    problems: (problemsResult.data ?? []) as ProblemRow[],
    secondaryTopics: (secondaryResult.data ?? []) as ProblemTopicRow[],
    topics: (topicsResult.data ?? []) as ProblemTopic[],
  });
}

export async function getProblem(externalId: string): Promise<Problem | null> {
  const problems = await getProblemCatalog();
  return problems.find((problem) => problem.external_id === externalId) ?? null;
}
