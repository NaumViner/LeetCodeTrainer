// @vitest-environment node
import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { expansionOracles } from "./fixtures/neetcode-reference";

vi.mock("server-only", () => ({}));

import {
  APPROVED_INTERVIEW_QUESTION_SLUGS,
  getActiveInterviewQuestionPrompt,
  getApprovedQuestionContentVersion,
  getFirstPartyQuestionContent,
  getEvaluationQuestionContent,
  getLearnerVisibleQuestionContent,
} from "@/features/interview-evaluation/question-content";

const stockSlug = "best-time-to-buy-and-sell-stock";

describe("published interview content versions", () => {
  it("uses an explicitly corrected evaluator reference without rewriting the learner's historical prompt", () => {
    const reference = getEvaluationQuestionContent(stockSlug, 1)!;
    expect(reference.contentVersion).toBe(2);
    expect(reference.examples[0]?.output).toBe("7");
    expect(reference.prompt).toContain("Do not penalize the learner");
    expect(
      getLearnerVisibleQuestionContent(stockSlug, 1)?.examples[0]?.output,
    ).toBe("6");
    expect(getFirstPartyQuestionContent(stockSlug, 2)?.prompt).not.toContain(
      "Evaluator erratum",
    );
  });
  it("validates current stock examples using every allowed buy/sell pair", () => {
    const content = getFirstPartyQuestionContent(stockSlug)!;
    expect(content.contentVersion).toBe(2);
    for (const example of content.examples) {
      const prices = JSON.parse(example.input.split(" = ")[1]!) as number[];
      const profits = prices.flatMap((buy, index) =>
        prices.slice(index + 1).map((sell) => sell - buy),
      );
      expect(Number(example.output)).toBe(Math.max(0, ...profits));
    }
    expect(content.examples[0]?.explanation).toBe(
      "Buy at 1 and sell later at 8.",
    );
    expect(getApprovedQuestionContentVersion(stockSlug)).toBe(2);
  });

  it("retains the historical stock version without silently correcting old evidence", () => {
    const historical = getFirstPartyQuestionContent(stockSlug, 1)!;
    expect(historical.contentVersion).toBe(1);
    expect(historical.examples[0]?.output).toBe("6");
    expect(historical.examples[0]?.explanation).toBe(
      "Buy at 2 and sell later at 8.",
    );
    expect(
      getFirstPartyQuestionContent(stockSlug, 2)?.examples[0]?.output,
    ).toBe("7");
    historical.examples[0]!.output = "mutated by caller";
    expect(
      getFirstPartyQuestionContent(stockSlug, 1)?.examples[0]?.output,
    ).toBe("6");
  });

  it("resolves every previously published version and keeps private invariants hidden", () => {
    for (const slug of APPROVED_INTERVIEW_QUESTION_SLUGS) {
      const historical = getFirstPartyQuestionContent(slug, 1);
      expect(historical, slug).not.toBeNull();
      const key = createHash("md5")
        .update(`${slug}:mock-interview-active-v1:8f4d23ac`)
        .digest("hex");
      const active = getActiveInterviewQuestionPrompt(key, 1)!;
      if (Object.hasOwn(expansionOracles, slug)) {
        expect(active.startsWith(historical!.prompt)).toBe(true);
        for (const constraint of historical!.constraints)
          expect(active).toContain(constraint);
        for (const example of historical!.examples) {
          expect(active).toContain(example.input);
          expect(active).toContain(example.output);
        }
        for (const invariant of historical!.expectedInvariants)
          expect(active).not.toContain(invariant);
      } else expect(active).toBe(historical?.prompt);
      const visible = getLearnerVisibleQuestionContent(slug, 1);
      expect(visible).not.toHaveProperty("expectedInvariants");
      expect(historical?.expectedInvariants.length).toBeGreaterThan(0);
    }
  });

  it("does not substitute current content for an unknown requested version", () => {
    for (const version of [0, -1, 3, 1.5, Number.NaN]) {
      expect(getFirstPartyQuestionContent(stockSlug, version)).toBeNull();
    }
    expect(getFirstPartyQuestionContent("unknown-question", 1)).toBeNull();
    expect(getFirstPartyQuestionContent("binary-search", 2)).toBeNull();
    expect(getFirstPartyQuestionContent(stockSlug, null)?.contentVersion).toBe(
      2,
    );
  });
});
