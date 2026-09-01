# AI learning coach

## Phase 12 scope

Phase 12 implements a complete optional learning coach with five learner-facing capabilities: AI-enhanced progressive hints, pattern analysis, complexity feedback, post-attempt analysis, and review-card drafting. Generated review cards become active-recall prompts when the learner next reviews that problem.

The interface defines all five operations so provider adapters do not leak into practice UI or domain code. Gemini structured output is the default adapter and uses `gemini-3.5-flash` unless overridden. The OpenAI Responses adapter remains available with a configurable model. No model call occurs when the feature is disabled.

## Configuration

The coach is server-only and disabled unless all required configuration is present. The same Gemini key can power both the coach and the realtime interviewer:

```env
GEMINI_API_KEY=replace-with-your-gemini-api-key
AI_COACH_ENABLED=true
AI_PROVIDER=gemini
AI_MODEL=gemini-3.5-flash
```

OpenAI can be selected instead with `AI_PROVIDER=openai`, `AI_API_KEY`, and an OpenAI model. An unsupported provider leaves the feature disabled. Never expose provider keys with a `NEXT_PUBLIC_` prefix or commit real keys to Git.

## Safety, reliability, and cost

Every provider operation requests a strict JSON schema and validates the decoded result again with Zod. Requests cap output at 600 tokens, time out after eight seconds, and retry once. Only problem metadata and relevant learner evidence are included; third-party problem statements are not stored or transmitted by the academy. The OpenAI adapter additionally disables provider storage and sends a hashed learner safety identifier. Provider data-use terms can differ between free and paid tiers and should be reviewed before production use.

When the feature is disabled, the complete deterministic practice experience continues unchanged. When a configured provider fails or returns invalid output, every coaching operation uses a bounded deterministic fallback. A private reservation is created before each provider call. The database permits 20 requests per learner in a rolling 24-hour window and records model, status, structured response, and reported token usage.

## Teaching rules

The provider instructions require the coach to teach rather than solve, respect the requested hint level, ask the learner to reason, use only supplied metadata, avoid invented constraints, challenge unsupported complexity, use relevant recorded mistakes, and stay concise.
