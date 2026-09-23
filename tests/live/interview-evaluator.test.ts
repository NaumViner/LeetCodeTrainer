import { expect, it } from "vitest";
import { evidencePackage } from "../fixtures/interview-evaluation";
import { GeminiInterviewEvaluatorProvider } from "@/features/interview-evaluation/gemini-provider";
import { finalizeInterviewEvaluation } from "@/features/interview-evaluation/model";

it.each(["english", "hebrew"] as const)(
  "validates real Flash-Lite feedback in %s",
  async (language) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is required (do not print it).");
    const provider = new GeminiInterviewEvaluatorProvider(
      key,
      "gemini-3.1-flash-lite",
    );
    const evidence = evidencePackage();
    evidence.interview.language = language;
    // One request per language, no runner retry or automatic larger-model fallback.
    let result;
    try {
      result = await provider.evaluate(evidence);
    } catch (error) {
      const status =
        typeof error === "object" && error !== null && "status" in error
          ? error.status
          : "unknown";
      const detail =
        error instanceof Error
          ? error.message.replaceAll(key, "[REDACTED]").slice(0, 800)
          : "unknown error";
      throw new Error(`Live evaluator failed; status: ${status}; ${detail}`);
    }
    const evaluated = finalizeInterviewEvaluation(result.data, evidence);
    expect(evaluated.dimensions.correctness.confidence).toBeLessThanOrEqual(
      0.35,
    );
    expect(
      Object.values(evaluated.dimensions)
        .flatMap((d) => d.evidence)
        .some((e) => e.source === "test"),
    ).toBe(false);
    if (language === "hebrew") expect(evaluated.summary).toMatch(/[א-ת]/);
    console.info(
      JSON.stringify({
        model: provider.model,
        language,
        usage: result.usage,
        validated: true,
      }),
    );
  },
);
