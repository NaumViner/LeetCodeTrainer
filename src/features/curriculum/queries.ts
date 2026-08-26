import {
  buildCurriculum,
  type CurriculumTopic,
  type LessonProgressRow,
  type LessonRow,
  type TopicPrerequisiteRow,
  type TopicRow,
} from "@/features/curriculum/model";
import { createClient } from "@/lib/supabase/server";

export async function getCurriculum(
  userId: string,
): Promise<CurriculumTopic[]> {
  const supabase = await createClient();
  const [topicsResult, lessonsResult, prerequisitesResult, progressResult] =
    await Promise.all([
      supabase.from("topics").select("*").order("curriculum_order"),
      supabase.from("lessons").select("*").order("lesson_order"),
      supabase.from("topic_prerequisites").select("*"),
      supabase.from("lesson_progress").select("*").eq("user_id", userId),
    ]);

  const error =
    topicsResult.error ??
    lessonsResult.error ??
    prerequisitesResult.error ??
    progressResult.error;

  if (error) {
    throw new Error("Curriculum could not be loaded: " + error.message);
  }

  return buildCurriculum({
    lessons: (lessonsResult.data ?? []) as LessonRow[],
    progress: (progressResult.data ?? []) as LessonProgressRow[],
    topicPrerequisites: (prerequisitesResult.data ??
      []) as TopicPrerequisiteRow[],
    topics: (topicsResult.data ?? []) as TopicRow[],
  });
}

export async function getTopic(
  userId: string,
  topicSlug: string,
): Promise<CurriculumTopic | null> {
  const curriculum = await getCurriculum(userId);
  return curriculum.find((topic) => topic.slug === topicSlug) ?? null;
}
