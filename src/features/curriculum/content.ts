import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

const curriculumPathPattern =
  /^content\/curriculum\/([a-z0-9]+(?:-[a-z0-9]+)*\.md)$/;

export async function readLessonContent(contentPath: string) {
  const match = curriculumPathPattern.exec(contentPath);

  if (!match?.[1]) {
    throw new Error("Lesson content path is outside the curriculum directory.");
  }

  return readFile(
    join(process.cwd(), "content", "curriculum", match[1]),
    "utf8",
  );
}
