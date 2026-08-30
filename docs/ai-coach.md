# AI learning coach

## Phase 12 scope

Phase 12 implements a complete optional learning coach with five learner-facing capabilities: AI-enhanced progressive hints, pattern analysis, complexity feedback, post-attempt analysis, and review-card drafting. Generated review cards become active-recall prompts when the learner next reviews that problem.

The interface already defines all five operations so provider adapters do not leak into practice UI or domain code. The current adapter uses the OpenAI Responses API. Its model name is configurable and defaults to `gpt-5.4-mini` when OpenAI is enabled; no model call occurs by default. The implementation follows the official [Responses API](https://developers.openai.com/api/reference/cli/resources/responses/methods/create) and [GPT-5.4 mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini) documentation.

## Configuration

The coach is server-only and disabled unless all required configuration is present:

```env
AI_COACH_ENABLED=true
AI_PROVIDER=openai
AI_MODEL=gpt-5.4-mini
AI_API_KEY=replace-in-secret-storage
```

`AI_PROVIDER` may be omitted when an OpenAI key is present. An unsupported provider leaves the feature disabled. Never expose these values with a `NEXT_PUBLIC_` prefix or commit them to `.env.local`.

## Safety, reliability, and cost

Every provider operation requests a strict JSON schema and validates the decoded result again with Zod. Requests set provider storage to false, send a hashed learner safety identifier, cap output at 600 tokens, time out after eight seconds, and retry once. Only problem metadata and relevant learner evidence are included; third-party problem statements are not stored or transmitted by the academy.

When the feature is disabled, the complete deterministic practice experience continues unchanged. When a configured provider fails or returns invalid output, every coaching operation uses a bounded deterministic fallback. A private reservation is created before each provider call. The database permits 20 requests per learner in a rolling 24-hour window and records model, status, structured response, and reported token usage.

## Teaching rules

The provider instructions require the coach to teach rather than solve, respect the requested hint level, ask the learner to reason, use only supplied metadata, avoid invented constraints, challenge unsupported complexity, use relevant recorded mistakes, and stay concise.
