# Interview-First Product Transformation

## Purpose

This document is an implementation specification for an LLM coding agent. Transform FAANG Interview Academy from an adaptive-learning product that contains mock interviews into an interview-first training product whose primary loop is:

```text
freely choose an interview
→ complete a realistic live mock interview
→ receive evidence-based evaluation
→ update the learner's interview profile
→ receive targeted, non-blocking recommendations
→ choose the next interview or remediation activity
```

The learner must always be allowed to choose any supported interview configuration. Recommendations guide the learner but never act as permissions.

## Working rules for the implementing agent

1. Read the repository `AGENTS.md` and the relevant Next.js documentation under `node_modules/next/dist/docs/` before changing Next.js code.
2. Inspect the current implementation before editing. Do not assume this document replaces existing security, state-machine, or provider behavior.
3. Preserve unrelated user changes and the existing Gemini Live, OpenAI Realtime, AI coach, authentication, RLS, timer, transcript, and interview-level functionality.
4. Use additive Supabase migrations. Never rewrite applied migrations and never use a destructive database reset against user data.
5. Do not expose provider keys to browser code. Gemini browser sessions must continue to use server-created ephemeral tokens.
6. Treat model output and transcripts as untrusted input. Validate all structured output and bound every persisted value.
7. Keep the text interview usable when AI, voice, evaluation, or code execution is unavailable.
8. Implement this transformation in stages. Verify each stage before moving to the next one.
9. Do not commit, push, deploy, or mutate production unless the user explicitly requests it.
10. Update the product documentation and generated database types with every schema change.

## Current product state

### Stack and boundaries

- Next.js 16 App Router and React 19.
- Supabase PostgreSQL, Auth, database functions, and forced Row Level Security.
- Gemini Live is the default realtime voice provider; OpenAI Realtime remains supported.
- Gemini is also available as the structured AI coach provider.
- Mock interviews use a persisted, ordered state machine and refresh-safe timer.
- Interviewer behavior is persisted as `beginner` or `faang_tough`.

### Existing learner data

The learner model is distributed across:

- `profiles`: declared goals, target role and companies, preferred coding language, experience, interview date, timezone, and study availability.
- `diagnostic_attempts` and `diagnostic_responses`: initial concept, pattern, and coding evidence.
- `topic_mastery`: per-topic correctness, independence, recognition, retention, complexity, speed, overall score, attempt counts, and interview counts.
- `attempts` and `attempt_performance`: practice evidence, code, help usage, timing, mistakes, confidence, result, and frozen performance dimensions.
- `problem_reviews` and `review_events`: retention schedule and history.
- `mock_interviews` and `mock_interview_scorecards`: interview configuration, phase evidence, result, ten rubric scores, strengths, and improvements.
- `realtime_interview_sessions` and `realtime_interview_events`: voice lifecycle, transcript, code snapshots, and phase context.
- `ai_coach_interactions`: structured coaching artifacts.

### Current selection defect

`startMockInterviewAction` builds fixed-difficulty choices from `snapshot.ranked`. `rankRecommendations` removes ineligible candidates whenever at least one eligible candidate exists. The later `anyMatch` fallback therefore cannot see Medium or Hard catalog problems that were removed by learning eligibility.

This is both a functional defect and a product-boundary defect. Fixed interview difficulty must not reuse learning eligibility as a permission gate.

### Current evaluation limitations

- The official scorecard is deterministic and relies heavily on saved note volume, the learner-selected result, and learner-provided retrospective ratings.
- The live interviewer does not produce the authoritative scorecard.
- The application does not execute submitted code against trusted tests.
- Interview difficulty, duration, and interviewer level are not meaningfully normalized in readiness calculations.
- Easy and Hard scorecards contribute similarly to the current interview average.
- Beginner and Tough FAANG interviews use different conversational assistance but the profile does not segment or interpret them separately.
- The current readiness number blends topic mastery with a simple average of interview scorecards.

## Product principles

### 1. Recommendation is not permission

The system may say:

> Based on your profile, Medium Trees with a Tough FAANG interviewer is recommended.

It must never say:

> You cannot start Hard because your mastery is too low.

### 2. Interviews are the primary evidence source

Completed, sufficiently evidenced mock interviews should be the primary source for interview-performance recommendations. Lessons, ordinary practice, and spaced repetition remain important remediation tools.

### 3. Learning mastery and interview performance are related but distinct

Maintain two explicit models:

- **Learning mastery**: concept knowledge, pattern recognition, retention, independent practice, and topic progression.
- **Interview performance**: behavior under interview conditions, including clarification, communication, approach formation, implementation, testing, time management, and independence.

Interview evidence may influence learning recommendations, but it must not erase or silently overwrite the distinction between the two models.

### 4. Every score must be explainable

Each evaluated interview dimension must include bounded evidence from the transcript, code, phase notes, timing, or test results. Do not show a score with no explanation or evidence source.

### 5. Difficulty changes interpretation, not access

A learner may choose Easy, Medium, or Hard at any time. Difficulty affects confidence and skill interpretation, not whether the interview can start.

### 6. Provider failure must degrade gracefully

An evaluator timeout or invalid model response must produce a clearly labeled provisional fallback evaluation rather than losing the interview or blocking profile access.

## Target experience

### Interview setup

Allow the learner to freely choose:

- difficulty: `adaptive`, `easy`, `medium`, or `hard`;
- duration: 30, 45, or 60 minutes;
- interviewer level: Beginner or Tough FAANG;
- language: initially English or Hebrew, with automatic mode if supported;
- optional company style when introduced;
- optional topic or random-topic mode when introduced.

The setup screen should display a recommendation without disabling any option:

```text
Recommended for your next interview:
Medium · Graphs · 45 minutes · Tough FAANG

You can choose any configuration.
```

### During the interview

Preserve:

- topic and pattern hiding;
- ordered interview phases;
- refresh-safe timer;
- optional voice;
- transcript persistence;
- typed fallback;
- code and phase context;
- reconnect and explicit end behavior;
- Beginner and Tough FAANG personas.

The live interviewer and the post-interview evaluator must be separate roles. A strict persona must not grade more harshly merely because its tone is strict.

### After the interview

Show:

1. raw score for the completed interview;
2. evaluation confidence and evaluation source;
3. ten rubric dimensions;
4. evidence for every dimension;
5. strengths and weaknesses;
6. repeated behaviors detected across interviews;
7. topic impact;
8. difficulty-aware interpretation;
9. targeted next actions;
10. the updated overall interview level and trend.

### Always-visible learner profile

The learner must be able to view at any time:

- overall interview level;
- confidence in that level;
- interview count and evidence recency;
- performance by rubric dimension;
- performance by topic;
- performance by Easy, Medium, and Hard;
- performance by Beginner and Tough FAANG;
- recent trend;
- recurring strengths and weaknesses;
- recommended next interview;
- recommended remediation questions or lessons.

## Stage 1 — Decouple interview choice from learning eligibility

### Required behavior

- `adaptive`: use the current adaptive eligibility and ranking behavior.
- fixed `easy`, `medium`, or `hard`: select from the complete active problem catalog for that difficulty, regardless of learning eligibility.
- Continue to avoid recently interviewed problems when alternatives exist.
- Use adaptive scores only to order suitable candidates, not to remove fixed-difficulty candidates.
- If the requested difficulty has no active catalog problems, return a user-facing setup error. Do not throw an opaque server error.
- Duration must remain independent of difficulty.

### Suggested implementation boundary

Refactor selection into a pure domain function with an explicit policy:

```ts
selectInterviewProblem({
  catalog,
  rankedRecommendations,
  recentProblemIds,
  requestedDifficulty,
});
```

For fixed difficulty, construct candidates from `catalog`, then attach a recommendation score when one exists. Do not construct the candidate pool from the filtered ranked list.

### Acceptance criteria

- A newly diagnosed learner can start Easy, Medium, or Hard.
- The same learner can choose 30, 45, or 60 minutes for every difficulty.
- Adaptive mode still respects progression gates.
- Fixed choice does not mutate or fake learning mastery to unlock the interview.
- Every difficulty-duration-interviewer-level combination is accepted when catalog inventory exists.
- Existing one-active-interview and no-overlapping-practice constraints remain enforced.

## Stage 2 — Create a canonical interview evidence package

Create a server-only evidence assembler. It must read only learner-owned data and produce a bounded evaluation input.

### Include

- interview ID and configuration;
- actual problem difficulty and topic metadata;
- interviewer level and provider;
- duration, elapsed time, and phase timings if available;
- clarification, examples, brute-force, optimization, testing, and complexity notes;
- latest code snapshot;
- completed learner and interviewer transcript turns;
- interruption/help events where available;
- learner-selected result and retrospective;
- trusted test execution results when Stage 7 is available.

### Do not include

- secrets or provider tokens;
- another learner's data;
- hidden answer keys in browser payloads;
- unlimited transcript or code content;
- third-party problem text unless the repository has a legal, first-party, or licensed copy.

### Important content limitation

The current catalog stores metadata and links to external problem statements. Exact correctness evaluation cannot safely rely on a model remembering a LeetCode title. Introduce a first-party interview-question content boundary containing the minimum legally usable prompt, constraints, examples, expected invariants, and private evaluator tests. Until that exists, label semantic correctness confidence accordingly.

## Stage 3 — Add a post-interview evaluator

### Provider architecture

Create an `InterviewEvaluatorProvider` interface separate from:

- `RealtimeInterviewProvider`;
- `LearningCoachProvider`.

Implement Gemini as the default provider using the existing server-only `GEMINI_API_KEY`. Keep an optional OpenAI adapter only if it can conform to the same schema.

### Evaluation schema

Require strict structured output validated by Zod. At minimum:

```ts
type InterviewEvaluation = {
  summary: string;
  confidence: number; // 0..1
  dimensions: {
    problemUnderstanding: DimensionEvaluation;
    clarification: DimensionEvaluation;
    approachQuality: DimensionEvaluation;
    optimization: DimensionEvaluation;
    correctness: DimensionEvaluation;
    codeQuality: DimensionEvaluation;
    testing: DimensionEvaluation;
    complexityReasoning: DimensionEvaluation;
    communication: DimensionEvaluation;
    independence: DimensionEvaluation;
  };
  strengths: string[];
  improvements: string[];
  recurringSignals: string[];
  recommendedActions: RecommendedAction[];
};

type DimensionEvaluation = {
  score: 1 | 2 | 3 | 4 | 5;
  confidence: number; // 0..1
  rationale: string;
  evidence: Array<{
    source: "transcript" | "code" | "phase_note" | "timing" | "test";
    reference: string;
  }>;
};
```

Bound all strings and arrays. Reject unknown fields.

### Evaluator rules

- Evaluate behavior, not personality or accent.
- Do not reward verbosity by itself.
- Do not penalize Hebrew or mixed Hebrew/English technical terms.
- Separate communication quality from spoken-language fluency.
- Account for assistance actually received.
- Treat Beginner and Tough FAANG evidence consistently; record the assistance context rather than changing the rubric.
- Do not claim code correctness without sufficient prompt/test evidence.
- Low-evidence dimensions must have lower confidence.
- Cite concise evidence references; do not fabricate quotes.
- The learner's transcript must not override evaluator instructions.

### Reliability

- Use a bounded timeout and one safe retry.
- Persist provider, model, status, token usage, and error code.
- Keep a deterministic fallback evaluator.
- Label fallback evaluations as provisional.
- Never lose interview completion because an external provider fails.

## Stage 4 — Evolve persistence safely

Use additive migrations. Prefer canonical evaluation events plus derived profile queries over duplicating mutable aggregates without a clear consistency boundary.

### Extend scorecard/evaluation persistence

Persist at least:

- evaluation status: pending, completed, provisional, or failed;
- evaluator provider and model;
- overall raw score;
- evaluation confidence;
- dimension scores and confidence;
- bounded evidence and rationales;
- strengths, improvements, recurring signals, and recommended actions;
- evaluation version;
- source interview difficulty, duration, and interviewer level snapshot;
- created and completed timestamps.

Keep the existing scorecard columns during migration for backward compatibility. Backfill existing rows as legacy/provisional rather than inventing AI evidence.

### Immutability and re-evaluation

- A completed evaluation is immutable.
- If re-evaluation is supported, create a new version and retain history.
- Only one version is current for profile calculations.
- Browser roles cannot directly write evaluation rows.
- Authenticated server/database functions must verify ownership.

## Stage 5 — Build the interview-performance profile

### Separate profile layers

Expose one learner profile composed of:

```text
Declared preferences
+ Learning mastery
+ Interview performance
+ Recommendation state
```

Do not merge learning mastery and interview performance into one opaque number.

### Interview profile scopes

Calculate or persist profiles for:

- overall;
- each rubric dimension;
- each primary and secondary topic;
- each difficulty;
- each interviewer level;
- recent time windows and all-time history.

### Level labels

Use stable, documented labels such as:

- Foundation;
- Developing;
- Practicing;
- Interview Ready;
- Strong;
- Advanced.

Do not expose a high-certainty label from one interview. Return both score and confidence.

### Confidence

Confidence must consider:

- number of completed evaluated interviews;
- evaluation confidence;
- recency;
- topic and difficulty coverage;
- amount of transcript/code/test evidence;
- consistency across recent interviews.

Document the exact deterministic formula and cover it with unit tests.

### Difficulty-aware interpretation

Store both:

- **raw interview score**: performance in that specific session;
- **challenge-adjusted skill evidence**: interpretation relative to question difficulty and evaluation confidence.

Do not simply add bonus points for Hard. Use a documented expected-performance or rating model. A weak Hard attempt should provide useful evidence without automatically damaging the learner as much as the same behavior on Easy. A strong Easy result should not by itself establish Hard readiness.

### Current readiness migration

Replace the current simple `80% topic mastery + 20% average interview score` interpretation with explicit outputs:

- learning readiness;
- interview readiness;
- combined preparation summary;
- confidence for each.

Existing UI consumers must be migrated without silently changing field meaning.

## Stage 6 — Rebuild recommendations around interview evidence

### Recommendation goals

Generate non-blocking recommendations for:

- the next mock interview configuration;
- specific problems;
- topic-focused problem sets;
- testing practice;
- complexity practice;
- communication/clarification drills;
- spaced review;
- a lesson only when evidence indicates a knowledge gap.

### Inputs

Prioritize:

- recent evaluated interviews;
- weak dimensions;
- weak or under-covered topics;
- repeated mistakes/signals;
- performance by difficulty;
- recency and trend;
- learning mastery and retention;
- target company/role and interview date;
- recent problem repetition.

### Output requirements

Each recommendation must include:

- action type;
- target topic or dimension;
- suggested difficulty and duration when applicable;
- one to three plain-language reasons;
- the evidence that triggered it;
- a direct application route;
- priority and estimated time.

### Rules

- Recommendations never disable setup options.
- Avoid immediate repetition unless intentional remediation is recommended.
- Do not recommend Hard solely because one Easy interview scored highly.
- Prefer a follow-up interview after targeted remediation.
- Preserve deterministic fallback behavior when AI is unavailable.

## Stage 7 — Add trustworthy code correctness evidence

This stage is required before claiming production-grade correctness evaluation.

### Requirements

- Use first-party/private evaluator test cases associated with interview questions.
- Execute code only in an isolated, resource-limited sandbox.
- Support only explicitly configured languages.
- Enforce CPU, memory, process, filesystem, network, and output limits.
- Never execute arbitrary code inside the Next.js application process.
- Persist only bounded results: compile status, passed/total tests, runtime class evidence where available, and sanitized failures.
- Keep private tests server-side.
- Do not reveal hidden tests during the live interview unless the interviewer intentionally provides one test case.
- Treat sandbox unavailability as missing evidence, not automatic failure.

If a secure runner is not available, implement the interfaces and confidence reduction but do not falsely label unexecuted code as correct.

## Stage 8 — Make the UI interview-first

### Dashboard

The primary dashboard hierarchy should become:

1. current interview level and confidence;
2. prominent **Start mock interview** action;
3. recommended next interview;
4. dimension and topic weaknesses;
5. recent trend and interview history;
6. targeted practice/review recommendations;
7. learning-plan details as secondary support.

### Interview profile page

Add a dedicated profile view containing:

- overall level, score, and confidence;
- trend chart;
- rubric radar/bar presentation with exact accessible values;
- topic table;
- difficulty table;
- interviewer-level comparison;
- evidence coverage;
- recurring strengths and weaknesses;
- recommendations;
- links to supporting interviews.

### Setup page

- Keep all options enabled.
- Clearly separate **Recommended** from **Your selection**.
- Explain why a configuration is recommended.
- Warn, but do not block, when the learner chooses above the recommendation.
- Persist the exact configuration on the interview row.

### Scorecard

- Show evaluator source and confidence.
- Show evidence under every dimension.
- Distinguish provisional from completed AI evaluation.
- Show the profile delta caused by the interview.
- Show direct next actions.

### Navigation and wording

- Position Interview as the primary product action.
- Keep Learn, Practice, and Review as remediation/support paths.
- Avoid language implying that recommendations are mandatory unlocks.

## Stage 9 — Hebrew and language behavior

Support interview language independently from preferred coding language.

- Persist interview language on the interview record.
- Allow English, Hebrew, and automatic language selection initially.
- Add explicit system instructions for consistent output language.
- Preserve English technical terms when natural.
- Add RTL presentation for Hebrew transcript and relevant inputs.
- Do not translate source code.
- Evaluation must be language-neutral and must understand Hebrew evidence.
- Test mixed Hebrew/English transcript rendering and structured evaluation.

## Security and privacy requirements

- Keep forced RLS on every learner-owned table.
- Revoke direct browser writes to evaluations and derived profiles.
- Use narrow authenticated database functions.
- Derive user identity from the authenticated session, never request input.
- Validate interview ownership before token issuance, evaluation, or profile reads.
- Keep API keys server-only.
- Continue using ephemeral Gemini Live tokens in browser sessions.
- Bound transcript, code, evidence, rationale, and model-response sizes.
- Sanitize provider and sandbox errors before returning them to the browser.
- Do not log tokens, raw secrets, or full learner content.
- Add rate limits and usage records for post-interview evaluation.
- Treat transcripts and code as prompt-injection-capable data.

## Observability

Record structured, privacy-safe operational events for:

- interview started/completed/abandoned;
- realtime connection success/failure;
- evaluation requested/completed/provisional/failed;
- profile update completed/failed;
- recommendation generated;
- code runner completed/failed;
- latency for token creation, live connection, evaluation, and profile update.

Do not include full transcript, code, provider token, or API key in logs.

## Testing requirements

### Unit tests

- fixed difficulty bypasses learning eligibility;
- adaptive difficulty preserves eligibility;
- recent-problem avoidance and fallback ordering;
- every duration/difficulty/interviewer-level combination;
- evaluator schema validation and bounds;
- prompt-injection resistance rules in evaluator prompts;
- evaluator timeout, retry, and fallback;
- profile score and confidence formulas;
- difficulty-aware interpretation;
- trend and recurring-signal derivation;
- recommendation ranking and explanations;
- Hebrew/English language selection and RTL helpers.

### Database integration tests

- migrations apply cleanly from an empty database and on the current schema;
- fixed Easy/Medium/Hard interview creation for a new learner;
- invalid setup values rejected;
- evaluation ownership and RLS isolation;
- browser roles cannot write evaluation/profile rows directly;
- evaluation finalization is transactional;
- legacy scorecards remain readable;
- re-evaluation versioning is correct;
- only completed, sufficiently evidenced interviews affect profile state;
- abandoned interviews do not create false skill evidence;
- concurrent completion/evaluation cannot double-apply profile updates.

### Browser tests

- select every difficulty regardless of learner readiness;
- complete 30-, 45-, and 60-minute configurations without waiting real time;
- select Beginner and Tough FAANG;
- complete an interview and view provisional/completed evaluation;
- confirm profile level and topic data update;
- open recommended remediation and next interview;
- verify options remain enabled after a weak result;
- refresh/reconnect persistence;
- mobile and desktop profile views;
- Hebrew transcript and RTL rendering.

### Provider contract tests

- Gemini structured request uses the expected schema;
- invalid JSON and out-of-range values are rejected;
- one retry only;
- low-evidence correctness returns low confidence;
- provider failure uses deterministic fallback;
- permanent Gemini key never appears in client bundles or responses.

### Code-runner tests

- compile failure;
- timeout;
- memory limit;
- forbidden network access;
- output limit;
- correct and incorrect solutions;
- private tests not exposed to the client.

## Migration and rollout strategy

1. Add free interview choice first; this is independent and immediately resolves the current product mismatch.
2. Add new evaluation persistence alongside existing scorecards.
3. Backfill existing scorecards as legacy/provisional with no fabricated evidence.
4. Release evaluator behind a feature flag.
5. Add profile aggregation and compare new results with existing readiness in shadow mode.
6. Migrate the dashboard and scorecard after validation.
7. Switch recommendations to interview-first inputs while preserving deterministic fallback.
8. Add the secure code runner before making strong correctness claims.
9. Remove obsolete readiness logic only after all consumers and historical data are migrated.

Every stage must remain backward compatible until its consumers are migrated.

## Files and areas likely to change

Inspect these paths rather than editing blindly:

- `src/features/mock-interviews/actions.ts`
- `src/features/mock-interviews/schema.ts`
- `src/features/mock-interviews/queries.ts`
- `src/domain/recommendation.ts`
- `src/domain/analytics.ts`
- `src/domain/mastery.ts`
- `src/features/realtime-interviews/instructions.ts`
- `src/features/realtime-interviews/actions.ts`
- `src/app/(app)/interviews/**`
- `src/components/mock-interviews/**`
- `src/features/analytics/**`
- `src/app/(app)/dashboard/**`
- `src/types/database.ts`
- `supabase/migrations/**`
- `tests/**`
- relevant documentation under `docs/**`

Create new bounded modules for interview evaluation and interview-profile calculations rather than expanding unrelated files indefinitely.

## Definition of Done

The transformation is complete only when all of the following are true:

- Any eligible signed-in learner can start any active Easy, Medium, or Hard interview at 30, 45, or 60 minutes.
- Adaptive mode still recommends an appropriate configuration without controlling fixed choices.
- Beginner and Tough FAANG behavior remain functional across Gemini and OpenAI.
- Every completed interview produces a persisted evaluation or clearly labeled provisional fallback.
- Evaluation contains bounded, source-linked evidence and confidence.
- The learner can always view overall interview level, confidence, dimensions, topics, difficulty performance, trends, strengths, and weaknesses.
- Interview profile and learning mastery are visible as separate concepts.
- Completed interview feedback updates the interview profile and informs recommendations.
- Recommendations are explainable, actionable, and never block manual interview selection.
- Historical interviews remain readable.
- RLS and direct-write restrictions are verified by integration tests.
- Provider secrets never reach the browser.
- The application never claims code correctness without trusted evidence.
- Formatting, lint, strict TypeScript, unit tests, integration tests, browser tests, database lint, and production build all pass.
- Product and deployment documentation describe the interview-first model accurately.

## Final implementation report expected from the agent

When all work is complete, report:

1. the product behavior delivered;
2. schema migrations added and applied locally;
3. evaluation and fallback behavior;
4. learner-profile and recommendation formulas;
5. security boundaries preserved;
6. tests executed and exact results;
7. any provider-key, sandbox, deployment, or live-acceptance steps that still require the user;
8. files changed, with direct links;
9. remaining limitations without overstating completion.
