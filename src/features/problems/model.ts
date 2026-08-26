import type { Tables } from "@/types/database";

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const CURRICULUM_LEVELS = [
  "foundation",
  "guided",
  "independent",
  "timed",
  "interview",
] as const;

export type ProblemRow = Tables<"problems">;
export type ProblemTopicRow = Tables<"problem_secondary_topics">;
export type ProblemPrerequisiteRow = Tables<"problem_prerequisite_topics">;
export type ProblemTopic = Tables<"topics">;

export type Problem = ProblemRow & {
  prerequisiteTopics: ProblemTopic[];
  primaryTopic: ProblemTopic;
  secondaryTopics: ProblemTopic[];
};

export type ProblemFilters = {
  company?: string;
  difficulty?: string;
  level?: string;
  query?: string;
  tag?: string;
  topic?: string;
};

type ProblemCatalogInput = {
  prerequisites: ProblemPrerequisiteRow[];
  problems: ProblemRow[];
  secondaryTopics: ProblemTopicRow[];
  topics: ProblemTopic[];
};

export function buildProblemCatalog({
  prerequisites,
  problems,
  secondaryTopics,
  topics,
}: ProblemCatalogInput): Problem[] {
  const topicsById = new Map(topics.map((topic) => [topic.id, topic]));
  const secondaryByProblem = groupTopics(secondaryTopics, topicsById);
  const prerequisitesByProblem = groupTopics(prerequisites, topicsById);

  return [...problems]
    .sort((left, right) => left.dataset_order - right.dataset_order)
    .flatMap((problem) => {
      const primaryTopic = topicsById.get(problem.primary_topic_id);
      if (!primaryTopic) return [];

      return [
        {
          ...problem,
          prerequisiteTopics: prerequisitesByProblem.get(problem.id) ?? [],
          primaryTopic,
          secondaryTopics: secondaryByProblem.get(problem.id) ?? [],
        },
      ];
    });
}

export function filterProblems(
  problems: Problem[],
  filters: ProblemFilters,
): Problem[] {
  const query = filters.query?.trim().toLowerCase();

  return problems.filter((problem) => {
    if (
      query &&
      ![
        problem.external_id ?? "",
        problem.title,
        problem.primaryTopic.name,
        ...problem.pattern_tags,
        ...problem.recognition_signals,
      ].some((value) => value.toLowerCase().includes(query))
    ) {
      return false;
    }

    if (
      filters.topic &&
      problem.primaryTopic.slug !== filters.topic &&
      !problem.secondaryTopics.some((topic) => topic.slug === filters.topic)
    ) {
      return false;
    }
    if (filters.difficulty && problem.difficulty !== filters.difficulty) {
      return false;
    }
    if (filters.level && problem.curriculum_level !== filters.level) {
      return false;
    }
    if (filters.tag && !problem.pattern_tags.includes(filters.tag)) {
      return false;
    }
    if (filters.company && !problem.company_tags.includes(filters.company)) {
      return false;
    }

    return true;
  });
}

export function problemFilterOptions(problems: Problem[]) {
  return {
    companies: sortedUnique(
      problems.flatMap((problem) => problem.company_tags),
    ),
    tags: sortedUnique(problems.flatMap((problem) => problem.pattern_tags)),
    topics: [
      ...new Map(
        problems
          .flatMap((problem) => [
            problem.primaryTopic,
            ...problem.secondaryTopics,
          ])
          .map((topic) => [topic.id, topic]),
      ).values(),
    ].sort((left, right) => left.curriculum_order - right.curriculum_order),
  };
}

function sortedUnique(values: string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function groupTopics(
  rows: Array<{ problem_id: string; topic_id: string }>,
  topicsById: Map<string, ProblemTopic>,
) {
  const grouped = new Map<string, ProblemTopic[]>();
  for (const row of rows) {
    const topic = topicsById.get(row.topic_id);
    if (!topic) continue;
    const current = grouped.get(row.problem_id) ?? [];
    current.push(topic);
    grouped.set(row.problem_id, current);
  }
  return grouped;
}
