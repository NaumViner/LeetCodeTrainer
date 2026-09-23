# AI Mock Interview: Beta Readiness Implementation Plan

**Prepared:** September 19, 2026  
**Audience:** An implementation LLM working in this repository, with a human owner providing external service access when needed.  
**Objective:** Deliver a reliable, observable, and deployable voice interview experience for an initial cohort of 5–10 invited users, then establish evidence-based criteria for wider distribution.

This is an implementation handoff, not a completion report. All tasks below remain to be verified and implemented. Do not interpret a checkbox, example, proposed behavior, or historical test result as evidence that work has been completed.

## Owner decisions and prerequisites

**Deployment decision confirmed by the owner on September 19, 2026:** Continue with Vercel for the Next.js application and Supabase for PostgreSQL and authentication. This selection is now confirmed; do not ask the owner to choose the hosting stack again unless a material incompatibility is discovered. It does not by itself identify cloud projects, approve paid plans, or authorize publication of an unverified release.

### What is needed to begin local implementation

No new cloud accounts, domain purchase, or production secrets are required to begin the code fixes, migrations, and deterministic tests. The implementing LLM needs repository access and a working local Node.js environment. Database and browser integration tests also require the local Docker/Supabase services and the test browser. If Docker is unavailable, continue independent code/unit-test work and mark database-dependent verification pending.

### What the owner must provide before hosted verification and release

| Requirement | Purpose | Owner action and timing |
| --- | --- | --- |
| Vercel account and selected project/team | Host the application and its server routes | Create an account or identify the existing one before hosted setup; connect the intended repository/project |
| Supabase account and selected projects | Hosted database, authentication, and guest account linking | Create an account or identify existing projects before hosted setup; keep staging and production isolated as specified below |
| Access to the remote Git repository | Deploy the intended release and enable CI | Authorize the chosen hosting integration; reuse the existing repository rather than creating a duplicate unnecessarily |
| Gemini API project/key with appropriate model access and quota | Real voice interviews and AI feedback | Reuse working existing credentials if suitable; supply them through private service settings before live AI tests |
| SMTP service and verified sender | Verification and password-recovery emails for external users | Choose or reuse a service, configure it in Supabase, and validate delivery before external account tests |
| Budget and operational contact | Bound paid usage and receive failure/support reports | Specify a spending limit/alert policy and a real contact before enabling paid external usage |
| A usable test email and a person for real microphone tests | Confirm delivery, spoken interview quality, and the complete account journey | Participate at the hosted acceptance phase; automated mocks do not replace these checks |
| Optional custom domain and DNS access | Branded public address | Optional for an initial beta using a stable HTTPS hosting URL; a mail provider may separately require a verified sending domain |

Do not require the owner to paste passwords, administrative keys, or API secrets into chat. Help them enter secrets directly into the appropriate service settings. Check which accounts and credentials already exist before requesting new ones. A working local Gemini key, if present, is not automatically evidence that its project, quotas, or billing are suitable for external users.

Start the local implementation without waiting for the entire account checklist. Resolve missing external setup when the corresponding phase depends on it, then record the actual project identifiers and verified configuration without secret values.

## 1. Instructions to the implementing LLM

Implement this plan in phases. Inspect the current repository first, reproduce findings where practical, make focused changes, run meaningful tests, and record evidence before declaring a phase complete. Continue all independent local work when cloud access or owner information is unavailable. Report external dependencies precisely instead of pretending deployment or live verification succeeded.

### Repository and sources of truth

- The inspected application root is `C:\Dev\leetCodeTrainer\v3`. The parent directory is not the application repository.
- All repository paths in this document are relative to that application root.
- Read `AGENTS.md` before changing code. It requires consulting the installed Next.js documentation under `node_modules/next/dist/docs/` for relevant framework changes.
- Read `package.json`, the actual implementation, current migrations, and relevant tests before choosing an approach.
- Read `docs/ai-mock-interview-first-spec.md`, `docs/interview-first-implementation.md`, and `docs/public-launch-runbook.md` for product context.
- Older documentation contains stale statements about text fallback, onboarding, administrative keys, and deployment status. Reconcile documentation with the implemented behavior; do not restore obsolete flows accidentally.
- Follow the user's current instructions and applicable repository instructions. This plan does not grant permission to purchase services, change DNS, contact testers, or modify an unidentified cloud project.

### Execution rules

1. Preserve unrelated user changes. Inspect Git status and the diff before editing; do not reset the working tree.
2. Prefer the existing architecture, components, providers, validation, database functions, and testing tools. Avoid a framework rewrite or broad dependency upgrades.
3. Add forward migrations for existing databases. Do not edit historical migrations as the only implementation of a schema change.
4. Keep authorization and quotas enforced on the server/database. A disabled button is not an authorization boundary.
5. Never print, commit, or place real secrets in this document, screenshots, browser logs, client assets, fixtures, or test reports.
6. Keep automated CI tests deterministic and free of paid AI calls. Execute genuine provider tests separately with an explicitly selected test environment and budget.
7. Complete code, migration plans, validation, and reviewable deployment configuration before requesting any missing authorization for an external action. Do not request repeated approval for actions already authorized.
8. Never run a destructive reset against hosted data. Clean-database tests must use a positively identified disposable local/test database.
9. Do not mark a check as passed when it was skipped because Docker, credentials, email access, a browser, or microphone access was unavailable.
10. Produce a final implementation report with changed files, migrations, actual test results, known limitations, and any remaining owner actions.

### Preserve these product invariants

- A visitor can start the first interview without signup, mandatory onboarding, or a diagnostic.
- Keep English/Hebrew interview selection, Python/Java coding, interviewer styles, and the existing interview phase/follow-up behavior.
- The guest trial is consumed at the correct voice activation boundary, not merely by opening a page. Pre-activation failure must remain recoverable.
- Resume must retain interview identity, code, elapsed time, and conversation context.
- Interview completion, transcript, submitted code, and guest-to-account ownership survive evaluation failure.
- Preserve guest/member isolation, immutable submitted evidence, cross-tab version checks, and atomic claim handling.
- Keep optional learning tools available without turning them back into a prerequisite.
- Do not silently replace a requested difficulty, invent full-topic coverage, or claim code execution when no execution occurred.

## 2. Audit baseline and scope

The September 19 audit observed the following. Recheck against the current revision before implementation.

| Area                          | Observed state                                | Interpretation                                                                                |
| ----------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Unit/component tests          | 322 tests passed in 41 files                  | Useful automated evidence, not proof of real voice quality                                    |
| Lint, TypeScript, formatting  | Passed                                        | Local code checks were healthy                                                                |
| Production compilation        | Passed                                        | Initial public font download failure was resolved; no unresolved build defect was established |
| Client bundle audit           | Passed across 48 static assets                | Existing scanner passed; its coverage still needs the improvements below                      |
| Database/browser integration  | Not rerun because Docker was unavailable      | Do not count as a fresh pass or a product failure                                             |
| Real voice interviews         | Not performed in this audit                   | Hebrew/English quality, long sessions, and reconnection remain unverified                     |
| Hosted production environment | Not independently inspected                   | Local configuration and repository documents do not prove a live deployment exists            |
| Local post-interview AI       | Evaluator disabled by missing enable flag     | Deterministic provisional feedback is used locally                                            |
| Interview content             | 18 approved prompts: 9 Easy, 8 Medium, 1 Hard | The separate 150-problem catalog is largely metadata                                          |
| Code execution                | No integrated trusted execution provider      | Current feedback is model/deterministic review, not a test-run verdict                        |

### Required work versus later expansion

**Required for the initial beta:** content correction, reliable save/submit recovery, usable repeated interview selection, AI evaluation configuration and retry, password recovery, reliable guest-account linking, basic support/privacy information, usage controls, operational visibility, hosted setup, and genuine acceptance testing.

**Later expansion:** a production code execution sandbox, a substantially larger content library, broader interface localization, payments, growth campaigns, and a sophisticated analytics platform. The code execution limitation must be disclosed during beta; implementing an execution service is not a prerequisite for this release.

## 3. Phase map and dependency order

| Phase | Deliverable                                        | Depends on              | Exit condition                                                               |
| ----- | -------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------- |
| 0     | Reproducible development environment and baseline  | None                    | Current state and environmental blockers recorded                            |
| 1     | Correct, validated interview content               | 0                       | Approved examples are checked independently                                  |
| 2     | Recoverable workspace persistence                  | 0                       | Save/submit survive rejected requests and retries                            |
| 3     | Reliable selection and sufficient beta inventory   | 1                       | Offered difficulty ranges remain usable after completion                     |
| 4     | AI feedback configuration and safe retry lifecycle | 0                       | Provisional feedback can recover without losing evidence or bypassing quotas |
| 5     | Password recovery and guest account continuity     | 0, 4                    | Auth recovery and linking pass their ownership tests                         |
| 6     | Clear beta experience, support, and privacy        | 2–5                     | User-facing failure and help paths are usable                                |
| 7     | Usage protection and operational monitoring        | 4                       | Limits, logs, and operator recovery are verified                             |
| 8     | Staging and production installation                | Local release candidate | Correct projects, configuration, migrations, and email delivery              |
| 9     | Full automated release verification                | 1–8 as applicable       | All required automated checks pass                                           |
| 10    | Genuine hosted acceptance tests                    | 8–9                     | Real interview, recovery, feedback, and account journeys pass                |
| 11    | Invited beta and release operations                | 10                      | Small cohort launched with monitoring and a rollback procedure               |

Phases 1, 2, and independent parts of 5–7 can run in parallel. Coordinate changes to shared authentication, evaluation, and database files. Database lifecycle changes in Phase 4 must be settled before final guest transfer tests.

## 4. Phase 0 — Establish a reproducible environment

### 0.1 Inspect before modifying

Record the revision, branch, working-tree status, runtime versions, installed dependencies, current environment categories, and whether Docker/local Supabase are available. Report configuration keys as present/missing or safe classifications; never expose their values.

```powershell
Set-Location 'C:\Dev\leetCodeTrainer\v3'
git status --short
git log -1 --oneline
node --version
npm --version
docker version
```

Use the Node.js major version required by `package.json`—24.x at the audited revision. Install Docker Desktop if absent, then start it and confirm the engine is usable. Install project dependencies from the lockfile with `npm ci`; do not replace the lockfile merely to get a different dependency tree.

### 0.2 Configure local services

1. If `.env.local` does not exist, copy `.env.example`; do not overwrite an existing private file.
2. Run `npm run db:start`, then `npm run db:migrate` against the local instance.
3. Obtain local Supabase URL and public key privately and configure them in `.env.local`.
4. Treat `db:status` output as potentially sensitive; do not paste administrative credentials into the report.
5. Install Chromium with `npx playwright install chromium` when needed.
6. Run `npm run dev` and verify the landing page.
7. The current minimal local Supabase startup excludes its mail catcher. If local email testing is needed, deliberately enable/configure a local mail test service; do not assume emails will already be visible.
8. Local Auth historically skips email confirmation. Use a separately configured test environment for confirmation/recovery coverage; do not weaken production confirmation to make tests pass.

### 0.3 Capture the baseline

Run lint, typecheck, unit tests, database integration tests when services are available, browser tests, build, client bundle audit, and formatting checks. Record failed assertions separately from missing infrastructure.

**Deliverable:** `docs/beta-readiness-implementation-report.md` with a baseline section and a phase checklist. Create it as a truthful progress report, not a prefilled success report.

## 5. Phase 1 — Correct and validate interview content

**Primary files:** `src/features/interview-evaluation/question-content.ts`, `src/features/interview-evaluation/evidence.ts`, `src/features/interview-evaluation/evidence-model.ts`, `tests/interview-evidence.test.ts`, and the approved-content inventory migration.

### 1.1 Correct the verified stock example

The authored example for `best-time-to-buy-and-sell-stock` uses `prices = [7, 2, 5, 1, 8, 4]` and currently claims profit `6` by buying at `2`. Correct the output to `7` and explain buying at `1` before selling at `8`.

This example is supplied to the post-interview evaluator. Do not inaccurately describe it as a sample currently displayed in the live question panel: the active experience currently receives only the prompt string.

### 1.2 Verify the entire approved inventory

- Review every approved prompt, constraint, example, explanation, and expected invariant for internal consistency.
- Check examples against a small independent reference calculation or manually documented derivation. Do not create tests that simply compare copied expected literals to themselves.
- Include edge cases such as empty input where permitted, duplicates, boundary values, ordering, and zero-profit/no-solution outcomes.
- Verify that content versions/fingerprints change when content changes and remain deterministic.
- Inspect `getFirstPartyQuestionContent(slug, version)` before incrementing a content version: the audited lookup only accepts the current hard-coded version. Introduce explicit version-aware lookup with retained historical content as needed, so old interview/review pages do not become unreadable. Synchronize the active approved version in the database through a migration.
- Preserve historical submitted evidence and historical evaluation provenance. Do not rewrite completed interview snapshots silently.
- Record an erratum for the stock example. If an affected historical interview is deliberately re-evaluated, identify the corrected content/evidence version explicitly rather than silently reusing the incorrect example or automatically regrading all historical interviews.
- Keep private evaluator invariants and any reference solutions out of active learner payloads and browser bundles.
- Preserve original/first-party content provenance. Do not populate the library by copying third-party statements or solutions without an appropriate basis.

### Acceptance criteria

- The stock example returns `7` under an independent calculation.
- All approved examples have recorded validation coverage.
- Server-only evaluation content remains server-only.
- Content fingerprints and any required inventory metadata remain synchronized.
- Existing completed evidence is unchanged; future interviews use corrected content.

## 6. Phase 2 — Make code saving and submission recoverable

**Primary files:** `src/components/mock-interviews/interview-coding-workspace.tsx`, `src/features/mock-interviews/actions.ts`, `tests/interview-coding-workspace.test.tsx`, and relevant integration/browser tests.

### 2.1 Reproduce the rejected-request defect

The current save promise uses `.then(...)` and is cleared only after a successful `await`. If the server action rejects because the browser loses connectivity, `savePromiseRef` can retain a rejected promise. Later saves then fail immediately. Submission similarly lacks guaranteed cleanup of `submitting`.

Write a regression scenario where the first server-action call rejects and a later call succeeds. Distinguish transport rejection from a server action that resolves normally with `{ status: "error" }`.

### 2.2 Required persistence behavior

1. Use explicit rejection handling and `finally` cleanup for both save and submission.
2. Clear the in-flight reference only if it still points to that request; an old request must not clear a newer one.
3. Preserve the latest unsaved code and scratchpad on failure. Never label them saved until the server confirms their exact snapshot/version.
4. Reset loading/submitting flags on every terminal path, including rejected requests.
5. Show an actionable retry message and keep manual save/submit available after the connection returns.
6. Preserve serialized writes and existing optimistic version checks. Do not solve conflicts by blindly overwriting the server copy.
7. Handle edits made while a save is in flight: after a successful older save, persist the newer snapshot or show it as unsaved.
8. Avoid infinite retry loops and overlapping paid/provider operations. Autosave failures must not create a request storm.
9. Ensure timer-triggered promises have handled rejections and cleanup on unmount.
10. Handle an ambiguous response: the server may have committed the write before the response was lost. Reconcile the server version safely. For submission, inspect existing RPC guarantees and add an idempotency mechanism if necessary so a retry cannot create duplicate submissions or duplicate phase transitions.

### Required tests

- Rejected autosave → visible recoverable error → successful manual retry.
- Rejected submission → controls re-enabled → successful retry exactly once.
- New edits during a pending save are retained and eventually persisted.
- A resolved validation error and a version conflict remain distinct states.
- Rapid repeated clicks do not duplicate writes or submissions.
- A committed write with a lost response does not lose text or silently overwrite another tab.
- Refresh after confirmed save restores code and scratchpad.
- Unmount clears pending timers; no unhandled rejection is emitted.

**Exit condition:** a temporary network failure never permanently jams saving or submission for the open interview.

## 7. Phase 3 — Fix selection exhaustion and strengthen beta inventory

**Primary files:** `src/domain/interview-selection.ts`, `src/domain/interview-coverage.ts`, `src/features/mock-interviews/coverage.ts`, `src/features/mock-interviews/actions.ts`, `src/features/mock-interviews/selection.ts`, `tests/interview-selection.test.ts`, `tests/interview-coverage.test.ts`, and inventory migrations.

### 3.1 Reproduce the current selection behavior

The audited inventory has one question per 18 topics. Hard-only becomes unavailable after one completed interview. Medium-only reaches eight, Easy-only nine, and the default Easy–Medium range seventeen before global Coverage asks for a topic absent from the chosen range. Selecting all difficulties allows repetition after eighteen.

Verify these cases by running the real selection function with the approved inventory, not by mocking the final selection result.

### 3.2 Implement an explicit fallback within the selected range

Use the following behavior for the primary Coverage flow:

1. Construct eligible inventory from active, approved, interview-ready questions within the exact selected difficulties.
2. Prefer uncovered topics that have inventory within that range.
3. If no uncovered eligible topic remains but eligible inventory exists, select among the least-covered eligible topics. Global uncovered topics outside the requested difficulty must not dead-end the session.
4. Avoid recent topics when possible and prefer uncompleted problems within the chosen pool.
5. If every eligible problem has been completed, permit a clearly identified repeat rather than blocking an otherwise valid range.
6. If the range truly has no eligible inventory, return an actionable availability message without creating an interview or consuming guest entitlement.
7. Never silently widen difficulty or expose hidden topic/pattern information during the interview.
8. Preserve global coverage counts and the definition of full coverage. Finishing Easy-only must not falsely unlock any feature requiring all-topic coverage.
9. Update the selection algorithm version and persisted metadata/reasons to describe fallback use. Preserve compatibility with existing snapshots and RPC validation.

This is an intentional product behavior change from the previous global-coverage dead end. Document it in the product specification and selection documentation.

### 3.3 Inventory work

- Maintain an auditable inventory summary by topic and difficulty, distinguishing catalog metadata from approved interview prompts.
- For the initial beta, target at least three validated Hard prompts across three topics. Add the missing prompts as original content for appropriate catalog entries; do not relabel difficulty just to satisfy counts.
- Validate additions using the Phase 1 procedure and update inventory through a forward migration.
- Include a deterministic check that code content and database interview-ready inventory agree.
- Make repetition expectations honest. Do not advertise 150 full interview questions unless 150 are actually usable.
- Expand further based on beta usage; a complete rewrite of the catalog is outside this release.

### Acceptance criteria

- Two consecutive completed Hard interviews no longer cause an artificial range-exhaustion failure.
- Easy, Medium, Easy–Medium, and all-difficulty sequences remain selectable whenever matching approved inventory exists.
- No chosen question falls outside the requested difficulties.
- Global coverage stays accurate when a user practices only a subset.
- Empty inventory fails safely without consuming a trial.
- All new content is synchronized, validated, and covered by a migration upgrade test.

## 8. Phase 4 — Enable real AI feedback and implement safe retries

**Primary files:** `src/features/interview-evaluation/{config,service,runner,model}.ts`, the scorecard page under `src/app/(app)/interviews/[interviewId]/scorecard/`, evaluation actions, generated database types, and evaluation migrations/tests.

### 4.1 Configure the evaluator deliberately

- The local audit found `INTERVIEW_EVALUATOR_ENABLED` absent. Confirm the current environment before changing it.
- Enable the evaluator in configured development/staging/production environments and provide the selected provider's server-only key.
- Verify the configured model is actually accessible to that project and supports the required structured response. Repository model names are a snapshot, not proof of current availability.
- Preserve a clearly marked provisional fallback when configuration or provider calls fail.
- The current implementation gives `GEMINI_API_KEY` precedence over feature-specific keys. Do not assume `INTERVIEW_EVALUATOR_API_KEY` overrides it. Document and test the selected precedence; use a single shared key initially unless separate keys are intentionally supported.
- Preserve structured output validation, evidence provenance, language handling, and provider timeouts.

### 4.2 Implement retry as a database lifecycle change

Adding a button alone is insufficient. The current reservation function returns `shouldEvaluate` only for a pending record. Finalized evaluations are immutable, and the request limit is counted per evaluation ID.

Required design:

1. Keep finalized evaluation payloads immutable. Do not reset a provisional row to pending or overwrite its historical evidence.
2. Introduce a controlled retry operation for an owned completed interview whose result is provisional or failed. Reuse a pending operation when one already exists.
3. Use a new evaluation attempt/version or an explicit attempt model, with an atomic current-result selection mechanism. Inspect existing uniqueness constraints and immutability triggers before implementing it.
4. Keep the last useful result visible while a retry is pending or fails. A retry must not temporarily erase the scorecard or interview history.
5. Serialize reservations per interview and retain an expiring cross-request lease. Page refreshes, duplicate clicks, and two tabs must not trigger concurrent paid work.
6. Apply the retry budget across the interview/evaluation lineage. Creating a new evaluation ID must not reset the three-attempt policy or evade per-user/global quotas.
7. Account for the runner's internal provider retry when defining the cost budget. Distinguish UI retry operations, reserved evaluation attempts, and actual provider requests.
8. Use lease ownership/fencing or equivalent validation so a late result from an expired attempt cannot overwrite a newer accepted result.
9. Preserve language, difficulty, interviewer style, evidence version, provider/model, and source snapshots on every attempt.
10. Update guest claim and cleanup behavior for new attempts. An in-progress retry must not permanently prevent account linking; explain a temporary wait and allow recovery after completion or lease expiry.
11. Handle existing provisional/failed rows with a forward migration and a backward-compatible read path.
12. Ensure quota denial cannot leave a newly created pending row permanently blocking guest transfer. Keep profile/readiness queries reading exactly one accepted current result per interview; a retry must neither remove the prior score from metrics nor double-count the replacement.

### 4.3 User-facing states

Provide distinct states for completed AI feedback, provisional feedback with retry available, retry pending, temporary quota/cooldown, exhausted retry budget, and provider unavailable. Use actionable copy. Do not offer an enabled retry button when the server already knows retry is impossible.

Refresh the scorecard and history after successful evaluation. Do not require the user to repeat the interview or register to recover eligible guest feedback.

### Required tests

- Provisional → retry → completed AI result; old result remains unchanged.
- Failed retry retains the last useful scorecard.
- Two concurrent retries result in one accepted reservation/provider workflow.
- An expired lease can recover; a late stale completion cannot replace the newer result.
- New evaluation IDs cannot reset the retry budget.
- Completed AI feedback is not repeatedly regenerated without an explicit separate policy.
- Another user cannot reserve, finalize, read, or promote the owner's evaluation.
- Guest-to-account transfer preserves all evaluation attempts and their evidence.
- Existing completed/provisional rows still render after migration.
- Provider exceptions, malformed output, timeout, and missing configuration produce truthful states.

### 4.4 Keep the code execution boundary honest

Current application flows do not invoke an isolated code runner and do not supply trusted execution results. Preserve clear wording that code is submitted for interviewer review and was not executed. Do not display fabricated pass counts, Accepted labels, or verified-correctness claims. Do not run untrusted code inside the Next.js process or ordinary serverless functions as a shortcut.

## 9. Phase 5 — Password recovery and account continuity

**Primary files:** `src/features/auth/actions.ts`, `src/features/auth/guest-actions.ts`, `src/features/auth/guest-claim.ts`, `src/features/auth/access.ts`, `src/app/auth/callback/route.ts`, auth pages/components, `src/lib/supabase/`, and auth/guest integration tests.

### 5.1 Add password recovery

1. Add a visible “Forgot password?” link and an email request form, plus a reset-password screen. Suggested routes are `/forgot-password` and `/reset-password`; fit them into the existing route structure.
2. Use the installed Supabase client's supported recovery flow. Send a neutral response that does not reveal whether an email address is registered.
3. Validate email/password inputs, use existing password rules, provide accessible field errors, handle transport failures, and apply appropriate server/provider rate controls.
4. Implement a server-verified recovery callback/session exchange. A query parameter claiming `type=recovery` is not proof of identity.
5. Inspect `safeAuthNextPath`: it currently allows interview destinations only. Add narrowly scoped recovery routing without weakening redirect protection.
6. Give recovery routing priority over ordinary post-login/guest-claim redirects. A valid recovery link must reach password reset rather than being redirected to interview history.
7. Decide and implement the supported PKCE/token-hash/OTP path using current official Supabase guidance. Test same-browser and different-device behavior explicitly; do not assume the PKCE verifier exists on another device.
8. For a guest returning to an existing account, preserve valid guest ownership proof before replacing identity, block disruptive switching during an active interview, and resume claim handling after password reset when the proof remains valid.
9. Handle expired/reused links, missing verification state, resend, password policy errors, and session expiration without an infinite redirect loop.
10. Test the chosen post-reset session policy and ensure the new password can sign in while the old password cannot.

Implementation references: [Supabase password recovery API](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [password authentication guide](https://supabase.com/docs/guides/auth/passwords), and [SSR authentication guidance](https://supabase.com/docs/guides/auth/server-side/advanced-guide). Recheck SDK compatibility before coding.

### 5.2 Preserve guest conversion and transfer

- Verify email upgrade keeps the same user identity and interview ownership.
- Verify login to an existing account uses the existing atomic proof-based claim, including all transcript, submission, and evaluation evidence.
- Preserve the limited lifetime and one-time nature of the transfer proof. Never recover an expired claim by accepting a client-supplied guest ID.
- Test evaluation retry races and explain temporary transfer delays.
- Keep signup and recovery independent of mandatory onboarding/diagnostics.
- Keep OAuth providers hidden until their credentials, redirect URLs, and guest linking have been tested.

### Acceptance matrix

Test registered/unregistered email request responses; valid, expired, reused, and tampered recovery links; cross-device recovery or its documented recovery path; password validation; callback redirects; guest upgrade; guest-to-existing-account transfer; repeated claim; claim expiry; and an unrelated user's attempts to access the interview.

## 10. Phase 6 — Finish the beta-facing experience

### 6.1 Recovery and compatibility copy

- Explain microphone permission, pending permission, denied permission, connection failure, and reconnection in plain language.
- Keep the current voice-first product. Do not promise a text interview fallback that does not exist.
- Ensure the initial Start action remains responsive while microphone permission is pending inside the interview.
- Test abandoning/navigating away while permission is pending. If permission later resolves, stop late media tracks and discard stale connection work; no background session should start after leaving.
- Keep code, phase, transcript, elapsed time, and feedback states understandable after recovery.
- Verify keyboard navigation, focus, screen-reader status announcements, dark/light modes, and narrow layouts.
- Maintain Hebrew interview support with code displayed left-to-right. Translate critical failure/help states where needed; describe any remaining English interface portions honestly.

### 6.2 Support and feedback

Add a discoverable support/feedback entry from the landing page, settings, and completed interview. For the first cohort, a configured contact link is sufficient; a new ticketing system is unnecessary.

Obtain the actual owner contact destination rather than inventing one. Allow an optional interview reference and short problem category. Do not automatically attach code, transcripts, audio, email, or provider tokens. Test empty/error/success behavior for any new form. Implementing a support link does not authorize sending messages to testers.

### 6.3 Privacy and deletion information

Provide a public privacy information page and link it near the existing audio/data disclosure. Describe the implemented facts: audio sent to the selected AI provider, saved code/transcript/evaluation, purposes, relevant processors, guest retention, account data retention, and a real contact/deletion request route.

Audit actual storage before making claims about raw audio retention. The existing guest cleanup is scheduled, not a guarantee of deletion exactly seven days after an event. Anonymous identity/trial-consumption records are retained separately from interview content. State this accurately.

Have the owner supply the operator identity, contact information, and approved retention decisions. Do not invent legal guarantees or claim compliance certification. For beta, a verified manual account-deletion request procedure is acceptable; document how ownership is verified and data is removed without exposing administrative keys. Keep full self-service account deletion as a separately scoped improvement unless required by the owner.

**Exit condition:** users can understand the service's limitations, recover from common failures, contact the operator, and find accurate information about their data.

## 11. Phase 7 — Usage protection, configuration checks, and monitoring

### 7.1 Preserve and verify shared limits

The audited defaults are listed below. Recheck the current migrations and live database; these are allocation limits, not guaranteed currency spending caps.

| Control                              | Audited default                      |
| ------------------------------------ | ------------------------------------ |
| Daily allocated voice duration       | 600 minutes per UTC day              |
| Concurrent voice connections         | 5, including pending connections     |
| Connection allocations per user      | 6 per 10 minutes                     |
| Connection allocations per interview | 20                                   |
| Evaluation request reservations      | 60 per UTC day                       |
| Evaluation reservations per user     | 10 per 10 minutes                    |
| Evaluation request lease             | 3 minutes                            |
| Evaluation attempt policy            | 3; fix lineage accounting in Phase 4 |

Test limits across parallel requests and guest/member identities. Confirm failed reservations release capacity as designed. Trial eligibility is per anonymous identity, not per human; clearing browser state can create another identity. Do not market it as a fraud-proof one-person limit.

For the initial cohort, obtain an actual provider budget, set supported provider-side limits and alerts, and verify the operator can stop new allocations. Before wider anonymous sharing, assess bot protection at anonymous signup and token creation; do not rely solely on an IP address or browser storage.

### 7.2 Constrain Gemini ephemeral access

**Primary files:** `src/app/api/realtime/gemini-session/route.ts`, `src/features/realtime-interviews/gemini-live-provider.ts`, provider configuration/instructions, and realtime tests.

The audited route issues a one-use token with a 70-minute expiry, while the browser supplies model/session configuration. Review the installed SDK's `liveConnectConstraints` support and bind supported model/session settings on the server. Inspect `lockAdditionalFields` semantics before locking omitted fields: freezing a changing session-resumption handle can break legitimate reconnects. Preserve legitimate resumption fields and test constrained-token reconnects. Derive validity from the server-authorized session window, subject to provider constraints; token expiry is not automatically an active-session spending cutoff. Keep permanent keys server-only. Validate enforcement with a controlled mismatched-client test and verify allowed sessions still work. See [official Gemini ephemeral token documentation](https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens).

### 7.3 Strengthen environment and bundle checks

- Align `scripts/check-production-env.mjs`, `src/lib/env.ts`, and the deployment template so they agree on required capabilities and valid values.
- Validate canonical application origin, HTTPS, public key presence/placeholders, required secrets, evaluator/voice flags, and all intended rollout flags, including review timeline if required for this release.
- Reject production localhost/dummy values without rejecting documented Vercel Preview behavior.
- Add negative-case tests for malformed URLs, embedded credentials, unexpected paths/query/fragment, invalid booleans, missing provider keys, and incomplete release configuration.
- Inspect `scripts/audit-client-bundle.mjs`: include all server-only secret categories, including `CRON_SECRET` and administrative keys.
- The standalone scanner does not automatically receive values from `.env.local`. Use controlled sentinel values or an explicitly supplied private environment to test value detection without exposing credentials.
- Keep scanners limited to client artifacts when checking for legitimate server-only identifiers; test that real server-only bundles do not cause meaningless failures.
- A green environment check proves configuration shape, not provider/model/SMTP readiness.

### 7.4 Implement actionable observability

Extend the existing structured event mechanism rather than scattering arbitrary logs. Define stable events for interview start, voice connection/activation/failure/reconnect, completion/abandonment, evaluation outcome/retry, signup invitation, account claim, and guest cleanup outcome.

Record only necessary IDs or pseudonymous references, language, duration bucket, provider, reason code, timestamps, latency, and outcome. Redact secrets and exclude full code/transcripts/audio by default. Avoid logging raw upstream errors that may contain sensitive material.

For beta, a documented query/dashboard over existing platform logs is sufficient. If durable event storage is added, define retention, restricted access, and event deduplication. Setting `ANALYTICS_PROVIDER` alone does not connect analytics.

The operator must be able to determine voice activation rate, completed/started interviews, provider failure rate, provisional feedback rate, account-save conversion, connection latency, last successful cleanup, and provider usage/spend. Configure actionable alerts and verify one synthetic failure reaches the intended operator channel without exposing user content.

## 12. Phase 8 — Install and configure hosted environments

### 8.1 Owner inputs and external access

Collect only missing information: intended repository/release branch, staging and production project identifiers, canonical public URL or domain, SMTP provider and verified sender, private provider credentials, supported AI models, budget/alerts, operator contact, and approved data retention wording.

Use service secret settings or a private secret store for credentials. Continue code and test work while these inputs are pending. Custom domain purchase is optional for a small beta if an appropriate stable HTTPS deployment URL is used and Auth is configured for it.

### 8.2 Database and Auth installation

1. Use isolated staging and production Supabase projects. Confirm project identity before each remote command; linking the CLI changes the target of later commands.
2. Verify the release includes all historical migrations plus new migrations from this plan.
3. Apply and test on staging first. Review a dry run before applying production migrations and prepare an appropriate backup if data already exists.

```powershell
# Replace the placeholder only after verifying the intended environment.
npx supabase login
npx supabase link --project-ref 'REPLACE_WITH_VERIFIED_PROJECT_REF'
npx supabase db push --dry-run
# Execute only after reviewing the target, migration list, and authorization.
npx supabase db push
```

4. Verify inventory, constraints, grants, RLS, guest start, evaluation retry, and claim RPCs against the deployed schema. Do not run the repository's local integration suite blindly against production.
5. Configure Anonymous Sign-Ins and Manual Identity Linking in Supabase. Preserve email verification before adding a password to an upgraded anonymous identity. These are provider settings, not invented app environment flags. [Supabase anonymous authentication](https://supabase.com/docs/guides/auth/auth-anonymous).
6. Set the canonical Site URL and exact allowed callback/recovery destinations matching the implementation. Keep preview/staging redirects separate from production; avoid broad production wildcards.
7. Test Google/GitHub only if enabled. The provider's Supabase callback and the application's callback are different endpoints; configure both correctly.

Follow the [official migration workflow](https://supabase.com/docs/guides/deployment/database-migrations). Never use a linked database reset as a deployment command.

### 8.3 SMTP and email templates

Configure custom SMTP for external testers; the default Supabase sender is not an adequate public delivery setup. Verify the sender/domain and required DNS records with the selected mail provider. Test real delivery to addresses outside the project team. Configure email-change, signup, and password-recovery templates to match the implemented callbacks. Preserve the verification-code option for guest conversion when supported. Check expired/reused links, spam delivery, resend limits, and link rewriting by email security tools. See [Supabase custom SMTP guidance](https://supabase.com/docs/guides/auth/auth-smtp).

### 8.4 Environment variable matrix

Start from `deploy/production.env.example`. Keep the tracked template free of real credentials. The repository's model strings must be verified with the selected provider at implementation time.

| Variable or group                                           | Required configuration                                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_APP_URL`                                       | Exact canonical production HTTPS origin; follow existing preview detection for Preview     |
| `NEXT_PUBLIC_SUPABASE_URL`                                  | Correct environment's hosted Supabase URL                                                  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`                      | Public key for that project; legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` only when required     |
| `GEMINI_API_KEY`                                            | Server-only shared Gemini key when using the existing shared-key configuration             |
| `REALTIME_AI_ENABLED`                                       | `true` for the offered voice experience                                                    |
| `REALTIME_AI_PROVIDER`, `REALTIME_AI_MODEL`                 | Selected supported provider and verified live model                                        |
| `REALTIME_AI_API_KEY`                                       | Provider-specific alternative where supported; respect documented precedence               |
| `REALTIME_AI_VOICE`, `REALTIME_AI_TRANSCRIPTION_MODEL`      | Supported optional provider settings; verify compatibility                                 |
| `INTERVIEW_EVALUATOR_ENABLED`                               | `true` for release AI feedback                                                             |
| `INTERVIEW_EVALUATOR_PROVIDER`, `INTERVIEW_EVALUATOR_MODEL` | Existing evaluator supports Gemini; verify chosen model                                    |
| `INTERVIEW_EVALUATOR_API_KEY`                               | Optional feature key under the chosen, tested precedence                                   |
| `INTERVIEW_SELECTION_MODES_ENABLED`                         | `true`                                                                                     |
| `INTERVIEW_PROMPT_CONTENT_ENABLED`                          | `true`                                                                                     |
| `INTERVIEW_CODING_WORKSPACE_ENABLED`                        | `true`                                                                                     |
| `INTERVIEW_LIVE_STAGE_ENABLED`                              | `true`                                                                                     |
| `INTERVIEW_FOLLOW_UP_ENABLED`                               | `true`                                                                                     |
| `INTERVIEW_REVIEW_TIMELINE_ENABLED`                         | `true` for this release                                                                    |
| `AI_COACH_ENABLED`                                          | Keep `false` unless the optional learning coach is separately configured/tested            |
| `AUTH_GOOGLE_ENABLED`, `AUTH_GITHUB_ENABLED`                | `false` until each provider passes its own setup/linking tests                             |
| `CRON_SECRET`                                               | Random server-only secret of at least 32 characters, as required by this application       |
| `SUPABASE_SERVICE_ROLE_KEY`                                 | Server-only administrative key for the scheduled cleanup boundary                          |
| `ANALYTICS_PROVIDER`                                        | Configure only if an actual integration is implemented; not a functioning switch by itself |

Additional support/monitoring settings must be explicitly implemented, validated, and documented before being added to the template. Do not imply an unused environment variable provides functionality.

For private local validation, create `.env.production.local` only if absent, keep it ignored, and run:

```powershell
node --env-file=.env.production.local scripts/check-production-env.mjs
```

The checker normally reads process environment; it does not load that file automatically. Use secrets from the intended environment, never development placeholders.

### 8.5 Vercel installation and URLs

- Connect the verified repository and release branch. The audited Git root is already `v3`; do not set Vercel Root Directory to a nonexistent nested `v3` without inspecting the connected repository.
- Use the repository's Next.js configuration, Node requirement, and `npm run build:production` build command.
- Scope production and preview environment variables separately and use staging data/providers for Preview. Redeploy when build-time public variables change. See [Vercel environment variables](https://vercel.com/docs/environment-variables).
- If adding a custom domain, use the exact records shown by the hosting project. Preserve existing email DNS records, verify HTTPS, then update canonical app/Auth URLs and redeploy.
- Verify the intended tester URL opens without an unexpected hosting-account login. Keep access controls appropriate to the invited cohort until release gates pass.
- Run `npm run verify:deployment -- https://YOUR_VERIFIED_HOST` and inspect `/api/health`. This checks availability, not a complete interview.

### 8.6 Scheduled guest cleanup

The current job is `/api/internal/guest-cleanup`, scheduled in `vercel.json` for `0 3 * * *` UTC. Configure its server secrets and verify a real scheduled run, not just the presence of configuration. Vercel supplies the configured `CRON_SECRET` in the authorization header; preserve endpoint verification. See [Vercel cron management](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

Test unauthorized requests returning 401, valid authorized execution, repeated execution, eligible expired data removal, member data preservation, pending evaluation/claim races, and persistence of consumed trial eligibility. Test deletion on disposable staging fixtures, not production accounts. Record the last successful cleanup and alert on missed/failed runs. Verify the chosen hosting plan's actual scheduling behavior and recheck the job after deployment or rollback.

## 13. Phase 9 — Automated release verification

Run the following from the application root after all code and migrations are integrated. Install dependencies/browser once as needed; do not repeatedly reinstall for every test.

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test
npm run db:start
npm run db:migrate
npm run test:integration
npm run test:e2e
npm run build
npm run audit:client-bundle
```

Separately verify the strict production environment/build path with the intended environment. Ensure CI runs meaningful coverage for the new behavior and scans client artifacts with controlled secret sentinels.

### Required database verification

- Upgrade an existing disposable database with representative completed, provisional, pending, guest, and member records.
- Build a separate clean disposable database from the full migration history.
- Verify owned reads/writes and cross-user denials for new retry, recovery-related data, and observability storage.
- Verify concurrency, leases, retry budgets, late-result rejection, and guest claim behavior after evaluation changes.
- Regenerate `src/types/database.ts` from the verified local schema when schema changes require it.
- Preserve cleanup/claim/retention behavior for historical data.

### Required browser verification

Add cases for rejected save/submit recovery, retryable provisional feedback, exhausted/limited retry states, password reset routing, guest conversion/transfer, selected-difficulty continuation, responsive layouts, and pending microphone cancellation.

Keep deterministic provider mocks, but label their evidence correctly. Existing browser tests use synthetic microphone behavior and blocked/stubbed provider calls. Directly updating a test database to simulate voice activation must not be presented as a real voice success.

**Exit condition:** required local/CI tests pass against the final release revision; skipped environmental checks remain explicitly pending.

## 14. Phase 10 — Genuine hosted acceptance tests

Use real microphones, actual configured providers, and test identities in staging. Capture test date, release revision, browser/device, configuration identifiers without secrets, elapsed time, result, and any issue reference. Do not include raw private transcripts in general logs.

### Real interview matrix

| Test                                              | Expected outcome                                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| English, beginner interviewer, Python, 30 minutes | Conversation starts, code is preserved, interview finishes, useful AI feedback appears            |
| Hebrew, tough interviewer, Java, 30 minutes       | Spoken Hebrew and technical terminology are usable; selected style and code context are respected |
| Other language/style combinations                 | Focused live checks show no incorrect fallback language or style                                  |
| 45- and 60-minute offerings                       | Each offered duration is exercised end-to-end, including provider/session renewal behavior        |
| Follow-up discussion                              | Existing follow-up/phase rules hold; no repeated or contradictory completion                      |
| Code submission                                   | The interviewer receives the submitted snapshot; no false claim that code was executed            |
| Refresh during interview                          | Same interview, code, remaining time, and coherent context resume                                 |
| Brief network interruption                        | Clear disconnect state; safe reconnection; no duplicate activation or permanent save failure      |
| Microphone pending/denied/unavailable             | Recoverable explanation; no consumed trial before valid activation                                |
| Leave while permission is pending, then grant it  | No leaked microphone tracks or connection after leaving                                           |
| Interviewer ends voice                            | Feedback can still be requested and account saving remains available                              |
| Provider evaluation failure then recovery         | Provisional result remains; authorized retry produces updated AI feedback                         |

Run actual desktop Chrome and at least the other browser/device combinations advertised to testers. If mobile participation is intended, include a real mobile device rather than relying only on viewport emulation. Do not advertise untested browser support or duration options; fix or temporarily restrict an offering if its acceptance test fails.

### Real account and infrastructure matrix

- Private window → first interview → completed feedback → verified email → saved account/history.
- Completed guest interview → existing account login → ownership and all evidence transferred.
- Password recovery email to an external address → verified reset → successful login and history.
- Same-browser and different-device email flows, including expired and reused links.
- Second guest trial blocked without losing the first result; registered user can continue without mandatory diagnostics.
- Two tabs cannot duplicate a first start, overwrite newer code silently, or create concurrent evaluation retries.
- Quota exhaustion gives a useful state; unrelated users' data remains private.
- Cleanup works and monitoring can detect a deliberate staging failure.
- The public URL, canonical redirects, SMTP sender, OAuth visibility, and secret configuration match the intended environment.

**Release gate:** complete at least one genuine end-to-end interview in each spoken language, all offered duration checks, the real email/account journey, network recovery, and AI feedback retry. Resolve data loss, ownership, paid-request duplication, and unusable start/finish failures before inviting users.

## 15. Phase 11 — Run an invited beta and prepare rollback

### 11.1 Initial release

1. Record the release revision, deployed migration list, environment, verified URL, known supported devices/durations, and any accepted limitations.
2. Confirm the owner-approved budget, operational alerts, support contact, privacy information, and cleanup monitoring are active.
3. Invite 5–10 people only when the owner authorizes outreach. Prepare a short invitation and feedback questions if useful; do not send them merely because this plan mentions a beta.
4. Ask testers to complete an interview, assess whether feedback is useful and fair, report where they became stuck, and indicate whether they would return.
5. Review activation, completion, provisional feedback, account saving, repeated usage, and spend. With a small cohort, inspect individual failures rather than treating percentages as statistically strong evidence.
6. Fix the dominant blockers before widening distribution. Expand question content according to actual demand and repeated-question complaints.

### 11.2 Incident and rollback procedure

- Keep an identified previously working application release and a compatible database recovery plan.
- Verify the existing server/database switch can stop new voice allocations while leaving histories and feedback accessible. Document how valid active sessions/reconnections behave.
- On a serious issue, stop new allocations as appropriate, preserve diagnostic evidence without user content leakage, and deploy a compatible fix or roll back the application.
- An application rollback does not undo migrations. Use forward-compatible corrective migrations; never reset production data to undo a release.
- Recheck environment settings, active cron behavior, callback URLs, and health after rollback. Do not assume all external configuration follows the application revision.
- Test this procedure in staging before relying on it.

### Criteria for wider distribution

Widen access only after the cohort demonstrates repeatable interview completion, helpful feedback, working account recovery, manageable cost, and operator visibility. Broader anonymous traffic also requires validated abuse controls and sufficient content variety. Record the evidence and unresolved limitations behind the decision.

## 16. Completion checklist and required handoff

The implementing LLM must update the implementation report with explicit `Passed`, `Failed`, `Blocked`, or `Not run` status for every applicable gate.

- [ ] Baseline and current repository state recorded.
- [ ] All approved examples reviewed; stock example corrected and independently checked.
- [ ] Save/submit transport failures recover without data loss or duplicate submission.
- [ ] Difficulty selection continues safely within the requested range.
- [ ] Inventory counts and advertised availability agree; beta Hard variety improved.
- [ ] Real evaluator configured and model access verified in the intended environment.
- [ ] Provisional/failed feedback retry works with immutable history, leases, and lineage budgets.
- [ ] Password recovery works without guest-claim or redirect regressions.
- [ ] Guest upgrade/transfer preserves code, transcript, submissions, and all evaluations.
- [ ] Voice/code execution limitations are accurately disclosed.
- [ ] Support and privacy/deletion information use real operator details.
- [ ] Shared quotas, provider limits, token constraints, and operator stop controls verified.
- [ ] Environment and client-bundle checks cover the release configuration and secrets.
- [ ] Monitoring, actionable alerts, and cleanup success tracking verified.
- [ ] Staging migrations pass both upgrade and fresh-database checks.
- [ ] Hosted Auth, SMTP, URLs, secrets, and scheduled cleanup verified.
- [ ] Required automated checks pass on the final release revision.
- [ ] Genuine language/duration/interview/recovery/account acceptance matrix completed.
- [ ] Rollback procedure tested and initial beta access explicitly authorized.

The final handoff must include: a concise behavior summary; changed files and migration names; actual commands/results; test environment and release identifiers; completed live acceptance evidence; operator setup and rollback instructions; any owner-dependent remaining actions; and explicitly deferred work.

Update `README.md`, `docs/public-launch-runbook.md`, `docs/deployment.md`, `docs/security.md`, relevant evaluation/selection/auth documentation, and `deploy/production.env.example` so they match the final implementation. Remove stale claims, including full text fallback, service-role usage assumptions, obsolete uncommitted-file warnings, and historical test counts presented as current verification.

## 17. Suggested prompt to start implementation

> Implement `docs/beta-readiness-implementation-plan.md` in this repository. Read the plan and `AGENTS.md`, inspect the current code, and execute the phases in dependency order. Preserve the guest-first interview experience and existing data isolation. Start with a baseline, then implement the required local fixes and regression tests. Maintain `docs/beta-readiness-implementation-report.md` with actual evidence. Continue independent work when external access is missing, and identify the exact remaining setup or authorization needed. Do not claim real voice, email delivery, hosted deployment, or production readiness from mocked tests. Finish with a reviewable implementation, migration/deployment instructions, and truthful release-gate status.
