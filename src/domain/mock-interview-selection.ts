import type { ScoredRecommendation } from "@/domain/recommendation";

export type InterviewDifficultyMode = "adaptive" | "easy" | "medium" | "hard";

type CatalogProblem = {
  active: boolean;
  dataset_order: number;
  difficulty: string;
  id: string;
};

type SelectionScore = Pick<
  ScoredRecommendation,
  "breakdown" | "candidate" | "eligible"
>;

type InterviewProblemSelection<TProblem extends CatalogProblem> = {
  problem: TProblem;
  score: SelectionScore | null;
};

export function selectInterviewProblem<TProblem extends CatalogProblem>(input: {
  catalog: TProblem[];
  rankedRecommendations: SelectionScore[];
  recentProblemIds: ReadonlySet<string>;
  requestedDifficulty: InterviewDifficultyMode;
}): InterviewProblemSelection<TProblem> | null {
  const activeProblemsById = new Map(
    input.catalog
      .filter((problem) => problem.active)
      .map((problem) => [problem.id, problem]),
  );

  if (input.requestedDifficulty === "adaptive") {
    const ranked = input.rankedRecommendations.flatMap((score) => {
      const problem = activeProblemsById.get(score.candidate.id);
      return problem ? [{ problem, score }] : [];
    });
    const eligible = ranked.filter(({ score }) => score.eligible);
    return preferFreshProblem(
      eligible.length > 0 ? eligible : ranked,
      input.recentProblemIds,
    );
  }

  const scoresByProblemId = new Map(
    input.rankedRecommendations.map((score) => [score.candidate.id, score]),
  );
  const fixedDifficultyCandidates = [...activeProblemsById.values()]
    .filter((problem) => problem.difficulty === input.requestedDifficulty)
    .map((problem) => ({
      problem,
      score: scoresByProblemId.get(problem.id) ?? null,
    }))
    .sort(compareFixedCandidates);

  return preferFreshProblem(fixedDifficultyCandidates, input.recentProblemIds);
}

function preferFreshProblem<TProblem extends CatalogProblem>(
  candidates: InterviewProblemSelection<TProblem>[],
  recentProblemIds: ReadonlySet<string>,
) {
  return (
    candidates.find(({ problem }) => !recentProblemIds.has(problem.id)) ??
    candidates[0] ??
    null
  );
}

function compareFixedCandidates<TProblem extends CatalogProblem>(
  left: InterviewProblemSelection<TProblem>,
  right: InterviewProblemSelection<TProblem>,
) {
  const scoreDifference =
    (right.score?.breakdown.total ?? Number.NEGATIVE_INFINITY) -
    (left.score?.breakdown.total ?? Number.NEGATIVE_INFINITY);
  return (
    scoreDifference ||
    left.problem.dataset_order - right.problem.dataset_order ||
    left.problem.id.localeCompare(right.problem.id)
  );
}
