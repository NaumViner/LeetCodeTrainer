import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const sourceUrl =
  "https://raw.githubusercontent.com/krmanik/Anki-NeetCode/main/neetcode-150-list.json";
const leetCodeUrl = "https://leetcode.com/graphql/";

const categoryTopics = {
  "Arrays & Hashing": "arrays-and-hashing",
  "Two Pointers": "two-pointers",
  "Sliding Window": "sliding-window",
  Stack: "stack",
  "Binary Search": "binary-search",
  "Linked List": "linked-list",
  Trees: "trees",
  "Heap / Priority Queue": "heap-priority-queue",
  Backtracking: "backtracking",
  Tries: "tries",
  Graphs: "graphs",
  "Advanced Graphs": "advanced-graphs",
  "1-D Dynamic Programming": "one-dimensional-dp",
  "2-D Dynamic Programming": "two-dimensional-dp",
  Greedy: "greedy",
  Intervals: "intervals",
  "Math & Geometry": "math-and-geometry",
  "Bit Manipulation": "bit-manipulation",
};

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.text();
  if (!response.ok) {
    throw new Error(
      "Metadata request failed with HTTP " + response.status + ": " + body,
    );
  }
  return JSON.parse(body);
}

const source = await fetchJson(sourceUrl);
const targetSlugs = new Set(
  Object.values(source).flatMap((categoryProblems) =>
    Object.values(categoryProblems).map((metadata) => {
      const match = metadata.url.match(
        /^https:\/\/leetcode\.com\/problems\/([a-z0-9-]+)\/$/,
      );
      return match?.[1];
    }),
  ),
);
targetSlugs.delete(undefined);

const detailQuery =
  "query catalogQuestions {\n" +
  [...targetSlugs]
    .map(
      (slug, index) =>
        "q" +
        index +
        ': question(titleSlug: "' +
        slug +
        '") { difficulty isPaidOnly questionFrontendId title titleSlug }',
    )
    .join("\n") +
  "\n}";
const leetCode = await fetchJson(leetCodeUrl, {
  body: JSON.stringify({ query: detailQuery }),
  headers: {
    "content-type": "application/json",
    "user-agent": "FAANG-Interview-Academy catalog importer",
  },
  method: "POST",
});
const officialQuestions = new Map(
  Object.values(leetCode.data ?? {}).map((question) => [
    question.titleSlug,
    question,
  ]),
);
const problems = [];

for (const [category, categoryProblems] of Object.entries(source)) {
  const primaryTopic = categoryTopics[category];
  if (!primaryTopic) {
    throw new Error("No curriculum topic mapping exists for " + category);
  }

  for (const metadata of Object.values(categoryProblems)) {
    const match = metadata.url.match(
      /^https:\/\/leetcode\.com\/problems\/([a-z0-9-]+)\/$/,
    );
    const slug = match?.[1];
    const official = slug ? officialQuestions.get(slug) : undefined;

    if (!slug || !official?.questionFrontendId) {
      throw new Error("LeetCode metadata was not found for " + metadata.url);
    }

    problems.push({
      difficulty: official.difficulty.toLowerCase(),
      externalId: String(official.questionFrontendId),
      premium: Boolean(official.isPaidOnly),
      primaryTopic,
      slug,
      title: official.title,
    });
  }
}

if (problems.length !== 150) {
  throw new Error("Expected 150 core problems but received " + problems.length);
}

const catalog = {
  problems,
  source: {
    catalog: "NeetCode 150",
    catalogUrl: "https://neetcode.io/practice/practice/neetcode150",
    metadataUrl: sourceUrl,
    problemMetadataUrl: "https://leetcode.com/problemset/",
  },
  version: 1,
};

await writeFile(
  resolve(process.cwd(), "data", "problems.json"),
  JSON.stringify(catalog, null, 2) + "\n",
  "utf8",
);

console.log("Wrote " + problems.length + " problems to data/problems.json");
