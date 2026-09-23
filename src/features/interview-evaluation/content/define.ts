import type { FirstPartyQuestionContent } from "../evidence-model";

// Original interview material. JSON examples are a display notation, not a
// required function signature. References and solutions remain server-only.
export function draft(
  prompt: string,
  constraints: string[],
  expectedInvariants: string[],
  ...examples: [input: unknown, output: unknown][]
): FirstPartyQuestionContent {
  return {
    contentVersion: 1,
    prompt,
    constraints,
    expectedInvariants,
    examples: examples.map(([input, output]) => ({
      input: JSON.stringify(input),
      output: JSON.stringify(output),
      explanation: null,
    })),
  };
}
