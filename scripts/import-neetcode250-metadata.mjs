import { readFile, writeFile } from "node:fs/promises";
import ts from "typescript";

// Parse only literal metadata from the official public bundle. Never execute
// downloaded JavaScript. This imports identifiers, not statements or solutions.
const bundlePath = process.argv[2];
if (!bundlePath)
  throw new Error("Pass the downloaded official NeetCode bundle path.");
const previous = JSON.parse(await readFile("data/problems.json", "utf8"));
const category = {
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
const source = ts.createSourceFile(
  "catalog.js",
  await readFile(bundlePath, "utf8"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.JS,
);
const found = new Map();
function literal(node) {
  if (ts.isStringLiteral(node)) return node.text;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.ExclamationToken &&
    ts.isNumericLiteral(node.operand)
  )
    return !Number(node.operand.text);
  return undefined;
}
function visit(node) {
  if (ts.isObjectLiteralExpression(node)) {
    const record = {};
    for (const field of node.properties)
      if (ts.isPropertyAssignment(field))
        record[field.name.getText(source).replaceAll('"', "")] = literal(
          field.initializer,
        );
    if (record.neetcode250 === true && record.problem && record.link) {
      const slug = record.link.replace(/\/$/, "");
      const externalId = record.code?.match(/^(\d+)-/)?.[1];
      if (!externalId || !category[record.pattern])
        throw new Error(`Unsupported metadata: ${slug} / ${record.pattern}`);
      found.set(slug, {
        difficulty: record.difficulty.toLowerCase(),
        externalId: String(Number(externalId)),
        premium: record.premium === true,
        primaryTopic: category[record.pattern],
        slug,
        title: record.problem,
      });
    }
  }
  ts.forEachChild(node, visit);
}
visit(source);
if (found.size !== 250)
  throw new Error(`Expected exactly 250 official entries; found ${found.size}`);
for (const p of previous.problems)
  if (!found.has(p.slug))
    throw new Error(`Previous question missing: ${p.slug}`);
// Preserve existing metadata/identities/categories for published interviews.
const old = new Set(previous.problems.map((p) => p.slug));
const problems = [
  ...previous.problems,
  ...[...found.values()].filter((p) => !old.has(p.slug)),
];
await writeFile(
  "data/neetcode-250.json",
  JSON.stringify(
    {
      version: 1,
      source: {
        catalog: "NeetCode 250",
        catalogUrl: "https://neetcode.io/practice/practice/neetcode250",
        retrievedAt: "2026-09-23",
        metadataSource:
          "Official NeetCode public application bundle; identifiers only",
        preservesPublished150Metadata: true,
      },
      problems,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Verified ${found.size} official entries; preserved ${old.size}, added ${problems.length - old.size}.`,
);
