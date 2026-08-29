import { describe, expect, it, vi } from "vitest";

import type { HintInput } from "@/features/ai-coach/model";
import { OpenAiLearningCoachProvider } from "@/features/ai-coach/openai-provider";

const input: HintInput = {
  attempt: {
    bruteForceApproach: "Compare every pair.",
    elapsedSeconds: 120,
    helpLevel: "none",
    predictedPattern: "hash map",
  },
  hintLevel: "small_hint",
  learner: {
    experienceLevel: "intermediate",
    relevantMistakes: [],
    topicMastery: 48,
  },
  ordinal: 1,
  problem: {
    difficulty: "easy",
    patternTags: ["hash-map"],
    recognitionSignals: ["fast complement lookup"],
    title: "Two Sum",
    topic: "Arrays & Hashing",
  },
  safetyIdentifier: "safe-user-hash",
};

describe("OpenAiLearningCoachProvider", () => {
  it("uses a non-stored structured Responses request and validates output", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      responseWith(
        '{"content":"What lookup work repeats for each candidate?","title":"Look for repeated work"}',
      ),
    );
    const provider = new OpenAiLearningCoachProvider(
      "test-key",
      "gpt-5.4-mini",
      fetcher,
    );
    const result = await provider.generateHint(input);
    expect(result.data.title).toBe("Look for repeated work");
    expect(result.usage.totalTokens).toBe(30);
    const request = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
    expect(request).toMatchObject({
      model: "gpt-5.4-mini",
      safety_identifier: "safe-user-hash",
      store: false,
      text: { format: { strict: true, type: "json_schema" } },
    });
    expect(String(fetcher.mock.calls[0]?.[1]?.headers)).not.toContain(
      "safe-user-hash",
    );
  });

  it("retries one invalid structured response", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(responseWith('{"title":"Missing content"}'))
      .mockResolvedValueOnce(
        responseWith(
          '{"content":"Which value could be retained for a later lookup?","title":"Retain useful state"}',
        ),
      );
    const provider = new OpenAiLearningCoachProvider(
      "test-key",
      "gpt-5.4-mini",
      fetcher,
    );
    await expect(provider.generateHint(input)).resolves.toMatchObject({
      data: { title: "Retain useful state" },
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("fails gracefully after the single retry is exhausted", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => responseWith("not json"));
    const provider = new OpenAiLearningCoachProvider(
      "test-key",
      "gpt-5.4-mini",
      fetcher,
    );
    await expect(provider.generateHint(input)).rejects.toBeInstanceOf(Error);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

function responseWith(outputText: string) {
  return new Response(
    JSON.stringify({
      output: [{ content: [{ text: outputText, type: "output_text" }] }],
      usage: { input_tokens: 20, output_tokens: 10, total_tokens: 30 },
    }),
    { headers: { "Content-Type": "application/json" } },
  );
}
