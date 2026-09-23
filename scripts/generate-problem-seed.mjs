import { topicMetadata } from "./catalog-topic-metadata.mjs";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { z } from "zod";

const topicSlugs = [
  "advanced-graphs",
  "arrays-and-hashing",
  "backtracking",
  "binary-search",
  "bit-manipulation",
  "graphs",
  "greedy",
  "heap-priority-queue",
  "intervals",
  "linked-list",
  "math-and-geometry",
  "one-dimensional-dp",
  "sliding-window",
  "stack",
  "trees",
  "tries",
  "two-dimensional-dp",
  "two-pointers",
];

const catalogSchema = z.object({
  problems: z
    .array(
      z.object({
        companies: z.array(z.string().min(1).max(80)).max(20).optional(),
        difficulty: z.enum(["easy", "medium", "hard"]),
        externalId: z.string().regex(/^\d+$/),
        premium: z.boolean(),
        primaryTopic: z.enum(topicSlugs),
        slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        title: z.string().min(2).max(160),
      }),
    )
    .length(150),
  version: z.literal(1),
});

const secondaryTopics = {
  "top-k-frequent-elements": ["heap-priority-queue"],
  "valid-sudoku": ["graphs"],
  "longest-consecutive-sequence": ["graphs"],
  "trapping-rain-water": ["stack"],
  "sliding-window-maximum": ["heap-priority-queue", "stack"],
  "generate-parentheses": ["stack"],
  "find-the-duplicate-number": ["two-pointers"],
  "merge-k-sorted-lists": ["heap-priority-queue"],
  "task-scheduler": ["greedy"],
  "word-search": ["graphs"],
  "word-search-ii": ["backtracking", "graphs"],
  "redundant-connection": ["advanced-graphs"],
  "course-schedule": ["advanced-graphs"],
  "course-schedule-ii": ["advanced-graphs"],
  "cheapest-flights-within-k-stops": ["one-dimensional-dp"],
  "longest-palindromic-substring": ["two-pointers"],
  "palindromic-substrings": ["two-pointers"],
  "partition-equal-subset-sum": ["two-dimensional-dp"],
  "jump-game-ii": ["one-dimensional-dp"],
  "maximum-subarray": ["one-dimensional-dp"],
  "rotate-image": ["arrays-and-hashing"],
};

const interviewHard = new Set([
  "median-of-two-sorted-arrays",
  "reverse-nodes-in-k-group",
  "binary-tree-maximum-path-sum",
  "serialize-and-deserialize-binary-tree",
  "word-search-ii",
  "word-ladder",
  "reconstruct-itinerary",
  "burst-balloons",
  "regular-expression-matching",
]);

function unique(values) {
  return [...new Set(values)];
}

function derivedTags(problem) {
  const tags = [...topicMetadata[problem.primaryTopic].tags];
  const title = problem.title.toLowerCase();
  if (/kth|top k/.test(title)) tags.push("top-k");
  if (/substring|subarray/.test(title)) tags.push("contiguous-range");
  if (/palindrom/.test(title)) tags.push("palindrome");
  if (/cycle/.test(title)) tags.push("cycle-detection");
  if (/matrix|grid|island/.test(title)) tags.push("grid");
  if (/design|serialize|encode/.test(title)) tags.push("data-structure-design");
  if (/minimum|maximum|cheapest|cost/.test(title)) tags.push("optimization");
  return unique(tags).slice(0, 15);
}

function derivedSignals(problem) {
  const signals = [...topicMetadata[problem.primaryTopic].signals];
  const title = problem.title.toLowerCase();
  if (/kth|top k/.test(title))
    signals.push("retain only the best k candidates");
  if (/substring|subarray/.test(title))
    signals.push("a contiguous segment is required");
  if (/palindrom/.test(title))
    signals.push("symmetry around a center or endpoints");
  if (/schedule|interval/.test(title))
    signals.push("ordering controls compatibility");
  return unique(signals).slice(0, 15);
}

function curriculumLevel(problem, topicPosition) {
  if (problem.difficulty === "easy") return "foundation";
  if (problem.difficulty === "hard") {
    return interviewHard.has(problem.slug) ? "interview" : "timed";
  }
  return topicPosition < 3 ? "guided" : "independent";
}

function sqlString(value) {
  return "'" + value.replaceAll("'", "''") + "'";
}

function sqlArray(values) {
  if (values.length === 0) return "array[]::text[]";
  return "array[" + values.map(sqlString).join(", ") + "]::text[]";
}

const catalogPath = resolve(process.cwd(), "data", "problems.json");
const catalog = catalogSchema.parse(
  JSON.parse(await readFile(catalogPath, "utf8")),
);
const externalIds = new Set();
const slugs = new Set();
const mediumTopicPositions = new Map();

for (const problem of catalog.problems) {
  if (externalIds.has(problem.externalId) || slugs.has(problem.slug)) {
    throw new Error("Duplicate problem identity: " + problem.slug);
  }
  externalIds.add(problem.externalId);
  slugs.add(problem.slug);
}

const problemRows = catalog.problems.map((problem, index) => {
  const mediumPosition = mediumTopicPositions.get(problem.primaryTopic) ?? 0;
  if (problem.difficulty === "medium") {
    mediumTopicPositions.set(problem.primaryTopic, mediumPosition + 1);
  }
  return [
    sqlString("leetcode"),
    sqlString(problem.externalId),
    sqlString(problem.slug),
    sqlString(problem.title),
    sqlString(problem.difficulty),
    sqlString("https://leetcode.com/problems/" + problem.slug + "/"),
    "(select id from public.topics where slug = " +
      sqlString(problem.primaryTopic) +
      ")",
    sqlArray(derivedTags(problem)),
    sqlArray(derivedSignals(problem)),
    problem.difficulty === "easy"
      ? "20"
      : problem.difficulty === "medium"
        ? "35"
        : "50",
    sqlString(curriculumLevel(problem, mediumPosition)),
    problem.premium ? "true" : "false",
    sqlArray(problem.companies ?? []),
    String(index + 1),
  ].join(", ");
});

const secondaryRows = catalog.problems.flatMap((problem) =>
  (secondaryTopics[problem.slug] ?? [])
    .filter((topic) => topic !== problem.primaryTopic)
    .map(
      (topic) =>
        "(" + sqlString(problem.externalId) + ", " + sqlString(topic) + ")",
    ),
);
const prerequisiteRows = catalog.problems.flatMap((problem) =>
  topicMetadata[problem.primaryTopic].prerequisites.map(
    (topic) =>
      "(" + sqlString(problem.externalId) + ", " + sqlString(topic) + ")",
  ),
);

const sql = `-- Generated by scripts/generate-problem-seed.mjs from data/problems.json.
-- Contains metadata and links only; no third-party problem statements.

insert into public.problems (
  source,
  external_id,
  slug,
  title,
  difficulty,
  external_url,
  primary_topic_id,
  pattern_tags,
  recognition_signals,
  estimated_minutes,
  curriculum_level,
  premium,
  company_tags,
  dataset_order
)
values
  (${problemRows.join("),\n  (")});

insert into public.problem_secondary_topics (problem_id, topic_id)
select problems.id, topics.id
from (values
  ${secondaryRows.join(",\n  ")}
) as metadata(external_id, topic_slug)
join public.problems problems
  on problems.source = 'leetcode' and problems.external_id = metadata.external_id
join public.topics topics on topics.slug = metadata.topic_slug;

insert into public.problem_prerequisite_topics (problem_id, topic_id)
select problems.id, topics.id
from (values
  ${prerequisiteRows.join(",\n  ")}
) as metadata(external_id, topic_slug)
join public.problems problems
  on problems.source = 'leetcode' and problems.external_id = metadata.external_id
join public.topics topics on topics.slug = metadata.topic_slug;
`;

await writeFile(
  resolve(
    process.cwd(),
    "supabase",
    "migrations",
    "20260826121000_seed_problems.sql",
  ),
  sql,
  "utf8",
);

console.log(
  "Generated seed migration for " + catalog.problems.length + " problems",
);
