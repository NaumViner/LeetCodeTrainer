import "server-only";

import { buildInterviewCoverage } from "@/domain/interview-coverage";
import {
  NEETCODE_150_COLLECTION_SLUG,
  NEETCODE_150_EXPECTED_PROBLEM_COUNT,
  NEETCODE_150_EXPECTED_TOPIC_COUNT,
} from "@/domain/neetcode-150";
import { createClient } from "@/lib/supabase/server";

export async function getInterviewTopicCoverage(userId: string) {
  const supabase = await createClient();
  const { data: collection, error: collectionError } = await supabase
    .from("problem_collections")
    .select("*")
    .eq("slug", NEETCODE_150_COLLECTION_SLUG)
    .eq("active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (collectionError || !collection) {
    throw new Error("The interview problem collection could not be loaded.");
  }

  const [membershipResult, topicResult, interviewResult] = await Promise.all([
    supabase
      .from("problem_collection_memberships")
      .select("ordinal, primary_topic_id, problem_id")
      .eq("collection_id", collection.id)
      .order("ordinal"),
    supabase.from("topics").select("id, name, slug").order("curriculum_order"),
    supabase
      .from("mock_interviews")
      .select("completed_at, problem_id")
      .eq("user_id", userId)
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false }),
  ]);
  const error =
    membershipResult.error ?? topicResult.error ?? interviewResult.error;
  if (error) {
    throw new Error("Interview topic coverage could not be loaded.");
  }

  const coverage = buildInterviewCoverage({
    completedInterviews: (interviewResult.data ?? []).flatMap((interview) =>
      interview.completed_at
        ? [
            {
              completedAt: interview.completed_at,
              problemId: interview.problem_id,
            },
          ]
        : [],
    ),
    memberships: (membershipResult.data ?? []).map((membership) => ({
      ordinal: membership.ordinal,
      primaryTopicId: membership.primary_topic_id,
      problemId: membership.problem_id,
    })),
    topics: topicResult.data ?? [],
  });

  if (
    collection.expected_problem_count !== NEETCODE_150_EXPECTED_PROBLEM_COUNT ||
    collection.expected_primary_topic_count !==
      NEETCODE_150_EXPECTED_TOPIC_COUNT ||
    (membershipResult.data ?? []).length !==
      collection.expected_problem_count ||
    coverage.totalTopicCount !== collection.expected_primary_topic_count
  ) {
    throw new Error("The interview problem collection is inconsistent.");
  }

  return {
    ...coverage,
    collection: {
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      version: collection.version,
    },
    memberships: (membershipResult.data ?? []).map((membership) => ({
      ordinal: membership.ordinal,
      primaryTopicId: membership.primary_topic_id,
      problemId: membership.problem_id,
    })),
  };
}
