import "server-only";

import { z } from "zod";

import {
  firstPartyQuestionContentSchema,
  type FirstPartyQuestionContent,
} from "@/features/interview-evaluation/evidence-model";
import type { Json } from "@/types/database";

const firstPartyInterviewQuestionSchema =
  firstPartyQuestionContentSchema.extend({
    privateEvaluatorTests: z
      .array(
        z
          .object({
            expected: z.custom<Json>(),
            input: z.custom<Json>(),
            name: z.string().min(1).max(120),
          })
          .strict(),
      )
      .min(1)
      .max(100),
  });

export type FirstPartyInterviewQuestion = z.infer<
  typeof firstPartyInterviewQuestionSchema
>;

// Intentionally empty until original/licensed prompts and private tests are
// authored. Catalog titles and external links are not treated as answer keys.
const questionsBySlug: ReadonlyMap<string, FirstPartyInterviewQuestion> =
  new Map();

export function getFirstPartyInterviewQuestion(problemSlug: string) {
  const question = questionsBySlug.get(problemSlug);
  return question ? firstPartyInterviewQuestionSchema.parse(question) : null;
}

export function getFirstPartyQuestionContent(
  problemSlug: string,
): FirstPartyQuestionContent | null {
  const question = getFirstPartyInterviewQuestion(problemSlug);
  if (!question) return null;
  const { privateEvaluatorTests, ...content } = question;
  void privateEvaluatorTests;
  return firstPartyQuestionContentSchema.parse(content);
}
