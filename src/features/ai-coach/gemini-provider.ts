import {
  GoogleGenAI,
  type GenerateContentParameters,
  type GenerateContentResponse,
} from "@google/genai";
import { type ZodType } from "zod";

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

type GenerateContent = (
  parameters: GenerateContentParameters,
) => Promise<GenerateContentResponse>;

export class GeminiLearningCoachProvider implements LearningCoachProvider {
  readonly name = "gemini";
  private readonly generateContent: GenerateContent;

  constructor(
    apiKey: string,
    readonly model: string,
    generateContent?: GenerateContent,
  ) {
    const client = generateContent ? null : new GoogleGenAI({ apiKey });
    this.generateContent =
      generateContent ??
      ((parameters) => client!.models.generateContent(parameters));
  }

  generateHint(input: HintInput): Promise<ProviderResult<CoachHint>> {
    return this.generate(
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
    jsonSchema: Record<string, unknown>,
    validator: ZodType<T>,
    task: string,
    input: { safetyIdentifier: string },
  ): Promise<ProviderResult<T>> {
    const { safetyIdentifier: _safetyIdentifier, ...context } = input;
    void _safetyIdentifier;
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await this.generateContent({
          config: {
            abortSignal: AbortSignal.timeout(8_000),
            maxOutputTokens: 600,
            responseJsonSchema: jsonSchema,
            responseMimeType: "application/json",
            systemInstruction: `${SYSTEM_RULES}\n\nTask: ${task}`,
            temperature: 0.2,
          },
          contents: JSON.stringify(context),
          model: this.model,
        });
        const text = response.text;
        if (!text) throw new Error("gemini_output_missing");
        const data = validator.parse(JSON.parse(text));
        const inputTokens = response.usageMetadata?.promptTokenCount ?? 0;
        const outputTokens = response.usageMetadata?.candidatesTokenCount ?? 0;
        return {
          data,
          usage: {
            inputTokens,
            outputTokens,
            totalTokens:
              response.usageMetadata?.totalTokenCount ??
              inputTokens + outputTokens,
          },
        };
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("gemini_response_invalid");
  }
}

const SYSTEM_RULES =
  "You are a technical-interview learning coach. Teach instead of immediately solving. Use progressive hints, ask the learner to reason, use only supplied problem metadata, never invent constraints, challenge incorrect complexity, refer to recorded mistakes when useful, and stay concise.";
