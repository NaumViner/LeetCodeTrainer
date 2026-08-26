import type { Tables } from "@/types/database";

export const CURRICULUM_STAGES = [
  {
    description: "Build a calm, repeatable interview process.",
    name: "Interview Fundamentals",
    stage: 0,
  },
  {
    description: "Strengthen complexity reasoning and implementation fluency.",
    name: "Foundations",
    stage: 1,
  },
  {
    description: "Learn the patterns that appear most often in interviews.",
    name: "Core Patterns",
    stage: 2,
  },
  {
    description: "Explore choice, connectivity, ordering, and structure.",
    name: "Search & Structural Patterns",
    stage: 3,
  },
  {
    description: "Build state-based and specialized problem-solving tools.",
    name: "Advanced Patterns",
    stage: 4,
  },
  {
    description: "Apply patterns in mixed, timed, and hidden-topic settings.",
    name: "Interview Execution",
    stage: 5,
  },
] as const;

export type TopicRow = Tables<"topics">;
export type LessonRow = Tables<"lessons">;
export type LessonProgressRow = Tables<"lesson_progress">;
export type TopicPrerequisiteRow = Tables<"topic_prerequisites">;

export type CurriculumLesson = LessonRow & {
  completed: boolean;
  completedAt: string | null;
};

export type CurriculumTopic = TopicRow & {
  completedLessons: number;
  lessons: CurriculumLesson[];
  prerequisiteTopicIds: string[];
  prerequisitesComplete: boolean;
  progressPercent: number;
  totalLessons: number;
};

type CurriculumInput = {
  lessons: LessonRow[];
  progress: LessonProgressRow[];
  topicPrerequisites: TopicPrerequisiteRow[];
  topics: TopicRow[];
};

export function buildCurriculum({
  lessons,
  progress,
  topicPrerequisites,
  topics,
}: CurriculumInput): CurriculumTopic[] {
  const completedByLesson = new Map(
    progress.map((record) => [record.lesson_id, record.completed_at]),
  );
  const lessonsByTopic = new Map<string, CurriculumLesson[]>();

  for (const lesson of lessons) {
    const completedAt = completedByLesson.get(lesson.id) ?? null;
    const topicLessons = lessonsByTopic.get(lesson.topic_id) ?? [];
    topicLessons.push({
      ...lesson,
      completed: Boolean(completedAt),
      completedAt,
    });
    lessonsByTopic.set(lesson.topic_id, topicLessons);
  }

  const prerequisiteIdsByTopic = new Map<string, string[]>();
  for (const prerequisite of topicPrerequisites) {
    const current = prerequisiteIdsByTopic.get(prerequisite.topic_id) ?? [];
    current.push(prerequisite.prerequisite_topic_id);
    prerequisiteIdsByTopic.set(prerequisite.topic_id, current);
  }

  const completedTopicIds = new Set(
    topics
      .filter((topic) => {
        const topicLessons = lessonsByTopic.get(topic.id) ?? [];
        return (
          topicLessons.length > 0 &&
          topicLessons.every((lesson) => lesson.completed)
        );
      })
      .map((topic) => topic.id),
  );

  return [...topics]
    .sort((left, right) => left.curriculum_order - right.curriculum_order)
    .map((topic) => {
      const topicLessons = (lessonsByTopic.get(topic.id) ?? []).sort(
        (left, right) => left.lesson_order - right.lesson_order,
      );
      const prerequisiteTopicIds = prerequisiteIdsByTopic.get(topic.id) ?? [];
      const completedLessons = topicLessons.filter(
        (lesson) => lesson.completed,
      ).length;

      return {
        ...topic,
        completedLessons,
        lessons: topicLessons,
        prerequisiteTopicIds,
        prerequisitesComplete: prerequisiteTopicIds.every((id) =>
          completedTopicIds.has(id),
        ),
        progressPercent:
          topicLessons.length === 0
            ? 0
            : (completedLessons / topicLessons.length) * 100,
        totalLessons: topicLessons.length,
      };
    });
}

export function curriculumProgress(topics: CurriculumTopic[]) {
  const totalLessons = topics.reduce(
    (total, topic) => total + topic.totalLessons,
    0,
  );
  const completedLessons = topics.reduce(
    (total, topic) => total + topic.completedLessons,
    0,
  );

  return {
    completedLessons,
    percent: totalLessons === 0 ? 0 : (completedLessons / totalLessons) * 100,
    totalLessons,
  };
}
