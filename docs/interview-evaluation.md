# Interview evaluation

## Canonical evidence package

Post-interview evaluation consumes one server-assembled, versioned evidence package. The assembler first loads a mock interview through the learner-owned query boundary, accepts only completed interviews, filters realtime rows to the interview owner and session, and validates the final object with a strict Zod schema.

The package contains:

- interview ID, requested and actual difficulty, duration, elapsed time, interviewer level, and safe realtime provider/model metadata;
- primary and secondary topic metadata;
- bounded clarification, examples, brute-force, optimization, testing, and complexity evidence;
- the most recent bounded code snapshot by timestamp across the saved interview workspace and persisted realtime events;
- final learner and interviewer transcript turns;
- available connection events and phase timings derived from persisted phase-context boundaries;
- learner-selected result and retrospective;
- an explicit evidence-coverage summary and optional trusted-test result slot.

It never contains provider call IDs, provider tokens, API keys, external problem URLs, another learner's rows, raw private tests, or an unbounded transcript or code payload.

## Bounds

- At most 80 transcript turns, with at most 1,000 characters per turn and 80,000 characters total.
- At most 30,000 characters of code.
- At most 4,000 characters per phase note and retrospective.
- At most nine derived phase timings, 40 session events, 12 secondary topics, and 30 truncation markers.
- Only bounded, sanitized trusted-test summaries may enter the package; private test inputs and expected outputs remain outside it.

When more than 80 transcript turns exist, the package keeps the first 40 and last 40 so early clarification and final testing/retrospective behavior remain represented. Every clipped field is identified in `coverage.truncatedFields`.

## First-party question-content boundary

The server-only question registry requires a legally usable prompt, constraints, examples, expected invariants, content version, provenance, and approved review state. Private evaluator tests are a separate optional trusted-runner concern rather than a prerequisite for prompt approval. Learner-visible content is derived through a strict schema that omits expected invariants.

The initial registry contains 18 repository-authored version-one prompts, one for every canonical NeetCode topic. Matching catalog rows are explicitly marked `interview_ready`; all other catalog titles and external links remain metadata and cannot enter the versioned selection flow. A matching approved snapshot produces `prompt_only` semantic-correctness coverage. `trusted_tests` remains unavailable until an isolated runner supplies bounded results, so the application still does not claim production-grade code correctness.

## Ownership and lifecycle

The exported assembler is server-only and uses the existing learner-scoped mock-interview query, which applies both the authenticated database session and an explicit `user_id` predicate. Active and abandoned interviews return no evaluation evidence. Realtime events with a different user or session ID are discarded defensively even if supplied to the pure bounded builder in a test.

The final submitted workspace snapshot remains evaluator evidence even when realtime is disabled or disconnected. The live interviewer and learning coach do not own or mutate this contract.

## Evaluator architecture

`InterviewEvaluatorProvider` is independent of both realtime-interview and learning-coach providers. Gemini structured generation is the current external adapter and uses the existing server-only `GEMINI_API_KEY` by default. The feature flag defaults to disabled; missing or invalid configuration selects the deterministic provisional evaluator.

The model returns a strict, unknown-field-rejecting schema containing ten 1–5 dimensions, per-dimension confidence, rationale, one to five evidence references, strengths, improvements, recurring signals, and bounded recommended actions. The application derives the raw 0–100 score as the arithmetic mean of the ten dimension scores multiplied by 20, rather than accepting a potentially inconsistent overall score from the model.

Cross-field validation rejects transcript, code, or test references when the evidence package does not contain that source. Correctness confidence is capped at 0.35 without first-party content, 0.7 with prompt-only content, and 1.0 with trusted tests. Invalid JSON, unknown fields, out-of-range values, fabricated source types, and unsupported confidence cause the external attempt to fail.

## Evaluator safety and reliability

Evaluator system instructions explicitly treat transcript, notes, and code as untrusted data and prohibit following embedded instructions. The rubric evaluates observable behavior rather than personality, accent, or spoken-language fluency; Hebrew and mixed Hebrew/English technical language are not penalized. Communication measures conveyed reasoning, not verbosity or English proficiency. Beginner and Tough FAANG sessions use the same rubric.

Each external request has a ten-second timeout. The runner performs at most two total attempts: the initial request and one safe retry. If configuration is absent, both attempts fail, output is invalid, or the provider times out, the runner returns a schema-valid deterministic evaluation with `provisional` status, an error code, zero external usage, and low confidence where evidence is weak. The fallback never upgrades learner-selected correctness into verified correctness.

## Persistence and profile derivation

Stage 4 persists provider, model, status, error code, usage, version, evidence-linked dimensions, source configuration snapshots, and the provisional/completed evaluation lifecycle in `mock_interview_evaluations`. Final rows are immutable, one version is current, legacy scorecards are represented as version-zero provisional rows without fabricated evidence, and direct learner writes remain revoked. Completion is authoritative: an evaluator outage produces a deterministic provisional result and cannot roll back the interview.

Stage 5 derives the interview-performance profile from current, completed or provisional version-one evaluations. Legacy rows, failed/pending rows, malformed payloads, future timestamps, and zero-confidence results do not affect it. The profile exposes all-time, 30-day, and 90-day views for overall performance, all ten dimensions, topics, difficulty, and interviewer level.

Challenge-adjusted evidence uses an expected-performance model. A raw score of 60 maps to skill anchors 45/60/75 for Easy/Medium/Hard, with a five-point Tough-FAANG anchor shift; deviations from 60 have slope 0.6 and the result is clamped to 0–100. This is not a flat Hard bonus: a weak Hard session remains useful without behaving like the same result on Easy, while one strong Easy session cannot establish Hard readiness.

Aggregation weight is `evaluation confidence × 180-day half-life recency × (0.5 + 0.5 × evidence richness)`. Evidence richness is bounded from code, first-party content, trusted tests, phase timing, and transcript coverage. Profile confidence is a documented weighted sum: 25% sample maturity (`1 − e^(−n/4)`), 25% evaluator confidence, 15% recency, 15% scope-aware topic/difficulty breadth, 10% evidence richness, and 10% recent-score consistency. Level labels are Foundation, Developing, Practicing, Interview Ready, Strong, and Advanced; one interview is capped at Developing regardless of score.

Learning readiness remains the coverage-adjusted topic-mastery calculation. Interview readiness is the challenge-adjusted profile score. The preparation summary reports both scores and both confidences explicitly before showing a confidence-weighted combined summary; no consumer treats them as one opaque readiness number.

## Trusted code-runner boundary

The repository defines an explicit server-only boundary for a future isolated runner. Requests allow only configured languages and bounded source, bind to a first-party question/content version, and reference private tests through an opaque bundle identifier. Results accept only compile status, bounded pass totals, a runner identifier, and at most five sanitized failures. Bundle mismatch or malformed output is rejected before it can enter evaluation evidence.

No isolated runner or legally usable private-test registry is configured in this checkout. The boundary therefore returns `null` and correctness remains `unsupported`; arbitrary learner code is never executed in the Next.js process. Production-grade correctness can be enabled only after an external sandbox demonstrates CPU, memory, process, filesystem, network, timeout, and output isolation.

## Operational events

Interview start/completion/abandonment, realtime connection success/failure, and evaluation request/completion/provisional/failure emit structured JSON events. Events contain only bounded identifiers, configuration labels, status, provider/model, error code, and latency. They never include transcript text, notes, source code, provider tokens, API keys, or private tests. Evaluation token counters remain on the private evaluation row.
