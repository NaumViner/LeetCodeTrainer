import { describe, expect, it } from "vitest";

import {
  buildCurriculum,
  curriculumProgress,
  type LessonProgressRow,
  type LessonRow,
  type TopicRow,
} from "@/features/curriculum/model";

function topic(id: string, order: number): TopicRow {
  return {
    active: true,
    created_at: "2026-08-26T00:00:00.000Z",
    curriculum_order: order,
    id,
    long_description: "A sufficiently detailed curriculum topic description.",
    name: "Topic " + order,
    short_description: "A concise topic description.",
    slug: "topic-" + order,
    stage: order - 1,
    updated_at: "2026-08-26T00:00:00.000Z",
  };
}

function lesson(id: string, topicId: string): LessonRow {
  return {
    active: true,
    common_mistakes: ["Skipping the invariant"],
    content_path: "content/curriculum/example.md",
    created_at: "2026-08-26T00:00:00.000Z",
    estimated_minutes: 20,
    id,
    learning_objectives: ["Explain the invariant"],
    lesson_order: 1,
    recognition_signals: ["ordered input"],
    slug: "lesson",
    title: "Lesson",
    topic_id: topicId,
    updated_at: "2026-08-26T00:00:00.000Z",
  };
}

function completion(lessonId: string): LessonProgressRow {
  return {
    completed_at: "2026-08-26T01:00:00.000Z",
    created_at: "2026-08-26T00:30:00.000Z",
    lesson_id: lessonId,
    started_at: "2026-08-26T00:30:00.000Z",
    updated_at: "2026-08-26T01:00:00.000Z",
    user_id: "30000000-0000-4000-8000-000000000001",
  };
}

describe("curriculum progress", () => {
  it("orders topics and unlocks prerequisites only after completion", () => {
    const topics = [topic("topic-b", 2), topic("topic-a", 1)];
    const lessons = [
      lesson("lesson-a", "topic-a"),
      lesson("lesson-b", "topic-b"),
    ];
    const curriculum = buildCurriculum({
      lessons,
      progress: [completion("lesson-a")],
      topicPrerequisites: [
        { prerequisite_topic_id: "topic-a", topic_id: "topic-b" },
      ],
      topics,
    });

    expect(curriculum.map((item) => item.id)).toEqual(["topic-a", "topic-b"]);
    expect(curriculum[0]?.progressPercent).toBe(100);
    expect(curriculum[1]?.prerequisitesComplete).toBe(true);
  });

  it("summarizes completion across the full curriculum", () => {
    const curriculum = buildCurriculum({
      lessons: [lesson("lesson-a", "topic-a"), lesson("lesson-b", "topic-b")],
      progress: [completion("lesson-a")],
      topicPrerequisites: [],
      topics: [topic("topic-a", 1), topic("topic-b", 2)],
    });

    expect(curriculumProgress(curriculum)).toEqual({
      completedLessons: 1,
      percent: 50,
      totalLessons: 2,
    });
  });
});
