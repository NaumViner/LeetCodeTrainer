import { z, type ZodType } from "zod";

import {
  attemptAnalysisSchema,
  coachEvaluationSchema,
  coachHintSchema,
  reviewCardDraftSchema,
  type AttemptAnalysis,
  type AttemptAnalysisInput,
  type CoachEvaluation,
  type CoachHint,
  type ComplexityEvaluationInput,
  type HintInput,
  type PatternEvaluationInput,
  type ProviderResult,
  type ReviewCardDraft,
  type ReviewCardInput,
} from "@/features/ai-coach/model";
import type { LearningCoachProvider } from "@/features/ai-coach/provider";

const evaluationJsonSchema = {
  additionalProperties: false,
  properties: {
    feedback: { type: "string" },
    nextStep: { type: "string" },
    question: { type: "string" },
    verdict: {
      enum: ["correct", "partially_correct", "incorrect", "uncertain"],
      type: "string",
    },
  },
  required: ["feedback", "nextStep", "question", "verdict"],
  type: "object",
} as const;

const responseSchema = z.object({
  output: z
    .array(
      z
        .object({
          content: z
            .array(z.object({ text: z.string().optional(), type: z.string() }))
            .optional(),
        })
        .passthrough(),
    )
    .optional(),
  output_text: z.string().optional(),
  usage: z
    .object({
      input_tokens: z.number().int().nonnegative().optional(),
      output_tokens: z.number().int().nonnegative().optional(),
      total_tokens: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

type Fetcher = typeof fetch;

export class OpenAiLearningCoachProvider implements LearningCoachProvider {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string,
    readonly model: string,
    private readonly fetcher: Fetcher = fetch,
  ) {}

  generateHint(input: HintInput): Promise<ProviderResult<CoachHint>> {
    return this.generate(
      "coach_hint",
      {
        additionalProperties: false,
        properties: {
          content: { type: "string" },
          title: { type: "string" },
        },
        required: ["content", "title"],
        type: "object",
      },
      coachHintSchema,
      `Give one concise progressive hint at level ${input.hintLevel}. Teach rather than solve. Ask the learner to reason, respect the requested level, and do not invent constraints. Do not reveal more than this level permits.`,
      input,
    );
  }

  evaluatePattern(
    input: PatternEvaluationInput,
  ): Promise<ProviderResult<CoachEvaluation>> {
    return this.generate(
      "pattern_evaluation",
      evaluationJsonSchema,
      coachEvaluationSchema,
      "Evaluate the learner's predicted pattern against only the supplied metadata. Explain the reasoning signal without giving a solution. End with one Socratic question and one concrete next step.",
      input,
    );
  }

  evaluateComplexity(
    input: ComplexityEvaluationInput,
  ): Promise<ProviderResult<CoachEvaluation>> {
    return this.generate(
      "complexity_evaluation",
      evaluationJsonSchema,
      coachEvaluationSchema,
      "Challenge the submitted time and space complexity using the supplied approach. Do not invent constraints or provide a full solution.",
      input,
    );
  }

  analyzeAttempt(
    input: AttemptAnalysisInput,
  ): Promise<ProviderResult<AttemptAnalysis>> {
    return this.generate(
      "attempt_analysis",
      {
        additionalProperties: false,
        properties: {
          improvements: {
            items: { type: "string" },
            maxItems: 4,
            minItems: 1,
            type: "array",
          },
          strengths: {
            items: { type: "string" },
            maxItems: 4,
            type: "array",
          },
          summary: { type: "string" },
        },
        required: ["improvements", "strengths", "summary"],
        type: "object",
      },
      attemptAnalysisSchema,
      "Analyze the attempt as a learning coach. Be evidence-based, concise, and actionable. Never claim code correctness that the supplied evidence cannot establish.",
      input,
    );
  }

  generateReviewCard(
    input: ReviewCardInput,
  ): Promise<ProviderResult<ReviewCardDraft>> {
    return this.generate(
      "review_card",
      {
        additionalProperties: false,
        properties: {
          complexityPrompt: { type: "string" },
          mistakePrompt: { type: "string" },
          patternPrompt: { type: "string" },
        },
        required: ["complexityPrompt", "mistakePrompt", "patternPrompt"],
        type: "object",
      },
      reviewCardDraftSchema,
      "Draft short recall questions, not answers. Ground them in the learner's recorded mistake and takeaway.",
      input,
    );
  }

  private async generate<T>(
    schemaName: string,
    jsonSchema: Record<string, unknown>,
    validator: ZodType<T>,
    task: string,
    input: { safetyIdentifier: string },
  ): Promise<ProviderResult<T>> {
    const { safetyIdentifier, ...context } = input;
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await this.fetcher(
          "https://api.openai.com/v1/responses",
          {
            body: JSON.stringify({
              input: JSON.stringify(context),
              instructions: `${SYSTEM_RULES}\n\nTask: ${task}`,
              max_output_tokens: 600,
              model: this.model,
              safety_identifier: safetyIdentifier,
              store: false,
              text: {
                format: {
                  name: schemaName,
                  schema: jsonSchema,
                  strict: true,
                  type: "json_schema",
                },
              },
            }),
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              "Content-Type": "application/json",
            },
            method: "POST",
            signal: AbortSignal.timeout(8_000),
          },
        );
        if (!response.ok) throw new Error(`openai_http_${response.status}`);
        const parsedResponse = responseSchema.parse(await response.json());
        const text = extractOutputText(parsedResponse);
        const data = validator.parse(JSON.parse(text));
        const inputTokens = parsedResponse.usage?.input_tokens ?? 0;
        const outputTokens = parsedResponse.usage?.output_tokens ?? 0;
        return {
          data,
          usage: {
            inputTokens,
            outputTokens,
            totalTokens:
              parsedResponse.usage?.total_tokens ?? inputTokens + outputTokens,
          },
        };
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("openai_response_invalid");
  }
}

const SYSTEM_RULES =
  "You are a technical-interview learning coach. Teach instead of immediately solving. Use progressive hints, ask the learner to reason, use only supplied problem metadata, never invent constraints, challenge incorrect complexity, refer to recorded mistakes when useful, and stay concise.";

function extractOutputText(response: z.infer<typeof responseSchema>) {
  if (response.output_text) return response.output_text;
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  throw new Error("openai_output_missing");
}
