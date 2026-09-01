import type {
  GenerateContentParameters,
  GenerateContentResponse,
} from "@google/genai";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getAiCoachConfig } from "@/features/ai-coach/config";
import {
  fallbackAttemptAnalysis,
  fallbackComplexityEvaluation,
  fallbackReviewCard,
} from "@/features/ai-coach/fallback";
import {
  attemptAnalysisSchema,
  coachEvaluationSchema,
  reviewCardDraftSchema,
  type HintInput,
} from "@/features/ai-coach/model";
import { GeminiLearningCoachProvider } from "@/features/ai-coach/gemini-provider";
import { OpenAiLearningCoachProvider } from "@/features/ai-coach/openai-provider";

afterEach(() => vi.unstubAllEnvs());

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

describe("GeminiLearningCoachProvider", () => {
  it("keeps Gemini disabled while the setup placeholder is present", () => {
    vi.stubEnv("GEMINI_API_KEY", "replace-with-your-gemini-api-key");
    vi.stubEnv("AI_COACH_ENABLED", "true");
    vi.stubEnv("AI_PROVIDER", "gemini");
    expect(getAiCoachConfig()).toBeNull();
  });

  it("uses the shared Gemini key configuration and structured JSON output", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    vi.stubEnv("AI_COACH_ENABLED", "true");
    vi.stubEnv("AI_PROVIDER", "gemini");
    vi.stubEnv("AI_MODEL", "");
    expect(getAiCoachConfig()).toMatchObject({
      model: "gemini-3.5-flash",
      provider: "gemini",
    });

    const generateContent = vi.fn<
      (
        parameters: GenerateContentParameters,
      ) => Promise<GenerateContentResponse>
    >(async () =>
      geminiResponse(
        '{"content":"What work repeats for each candidate?","title":"Find repeated work"}',
      ),
    );
    const provider = new GeminiLearningCoachProvider(
      "gemini-test-key",
      "gemini-3.5-flash",
      generateContent,
    );
    await expect(provider.generateHint(input)).resolves.toMatchObject({
      data: { title: "Find repeated work" },
      usage: { totalTokens: 30 },
    });
    expect(generateContent.mock.calls[0]?.[0]).toMatchObject({
      config: {
        maxOutputTokens: 600,
        responseMimeType: "application/json",
      },
      model: "gemini-3.5-flash",
    });
  });

  it("retries one invalid Gemini structured response", async () => {
    const generateContent = vi
      .fn()
      .mockResolvedValueOnce(geminiResponse("not-json"))
      .mockResolvedValueOnce(
        geminiResponse(
          '{"content":"Which state could avoid repeated work?","title":"Retain state"}',
        ),
      );
    const provider = new GeminiLearningCoachProvider(
      "gemini-test-key",
      "gemini-3.5-flash",
      generateContent,
    );
    await expect(provider.generateHint(input)).resolves.toMatchObject({
      data: { title: "Retain state" },
    });
    expect(generateContent).toHaveBeenCalledTimes(2);
  });
});

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

  it("validates structured complexity feedback", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      responseWith(
        JSON.stringify({
          feedback: "The stated bounds follow from one pass and stored keys.",
          nextStep: "Connect each bound to the implementation.",
          question: "How many times can each element be visited?",
          verdict: "correct",
        }),
      ),
    );
    const provider = new OpenAiLearningCoachProvider(
      "test-key",
      "gpt-5.4-mini",
      fetcher,
    );
    const result = await provider.evaluateComplexity({
      ...input,
      spaceComplexity: "O(n)",
      timeComplexity: "O(n)",
    });
    expect(result.data.verdict).toBe("correct");
    expect(requestSchemaName(fetcher)).toBe("complexity_evaluation");
  });

  it("validates structured post-attempt analysis", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      responseWith(
        JSON.stringify({
          improvements: ["Trace duplicate inputs before submitting."],
          strengths: ["Recognized the lookup pattern independently."],
          summary: "The attempt showed sound recognition with one testing gap.",
        }),
      ),
    );
    const provider = new OpenAiLearningCoachProvider(
      "test-key",
      "gpt-5.4-mini",
      fetcher,
    );
    const result = await provider.analyzeAttempt({
      ...input,
      codeSnapshot: "function twoSum() {}",
      reflection: "I missed duplicate values.",
      result: "solved",
    });
    expect(result.data.improvements).toHaveLength(1);
    expect(requestSchemaName(fetcher)).toBe("attempt_analysis");
  });

  it("validates a structured active-recall review card", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      responseWith(
        JSON.stringify({
          complexityPrompt: "Why is the lookup-based approach linear?",
          mistakePrompt: "How will you test duplicate values next time?",
          patternPrompt: "Which signal suggests retaining values for lookup?",
        }),
      ),
    );
    const provider = new OpenAiLearningCoachProvider(
      "test-key",
      "gpt-5.4-mini",
      fetcher,
    );
    const result = await provider.generateReviewCard({
      ...input,
      mistakes: ["Missed duplicate values"],
      takeaway: "Test boundary cases before submitting",
    });
    expect(result.data.patternPrompt).toContain("signal");
    expect(requestSchemaName(fetcher)).toBe("review_card");
  });
});

describe("AI coach deterministic fallbacks", () => {
  it("produces schema-valid outputs for every Phase 12B operation", () => {
    const complexityInput = {
      ...input,
      spaceComplexity: "O(n)",
      timeComplexity: "O(n)",
    };
    expect(() =>
      coachEvaluationSchema.parse(
        fallbackComplexityEvaluation(complexityInput),
      ),
    ).not.toThrow();
    expect(() =>
      attemptAnalysisSchema.parse(
        fallbackAttemptAnalysis({
          helpLevel: "none",
          mistakes: ["Missed duplicates"],
          result: "solved",
          takeaway: "Test boundaries",
        }),
      ),
    ).not.toThrow();
    expect(() =>
      reviewCardDraftSchema.parse(
        fallbackReviewCard({
          ...input,
          mistakes: ["Missed duplicates"],
          takeaway: "Test boundaries",
        }),
      ),
    ).not.toThrow();
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

function geminiResponse(text: string) {
  return {
    text,
    usageMetadata: {
      candidatesTokenCount: 10,
      promptTokenCount: 20,
      totalTokenCount: 30,
    },
  } as unknown as GenerateContentResponse;
}

function requestSchemaName(fetcher: ReturnType<typeof vi.fn<typeof fetch>>) {
  const request = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body));
  return request.text.format.name;
}
