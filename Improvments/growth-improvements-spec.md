# Growth Spec: Landing Page Rewrite + Public Demo Mode

**Audience:** an LLM coding agent (e.g. Claude Code) working directly in the `LeetCodeTrainer` / "FAANG Interview Academy" repository.
**Read first:** `docs/architecture.md`, `docs/implementation-status.md`, `src/app/(marketing)/page.tsx`. Do not start writing code until you've opened these three.

---

## 0. Problem statement

Two conversion leaks were identified in the current product:

1. **The landing page undersells the product.** It currently leads with "Know exactly what to practice next" and a section literally labeled "Phase 1 foundation." That is internal dev-log language, not a pitch. It never mentions the AI learning coach, voice-enabled mock interviews, spaced repetition, or the 150-problem curated catalog anywhere a visitor can see *before* signing up. A student comparing this to NeetCode or AlgoExpert has no way to tell why they should pick this instead.
2. **There is no free taste.** Every feature is gated behind signup *and* a mandatory diagnostic. Students bounce before they see any value. A public, no-signup sample lesson and a public, no-signup demo problem would cut that friction significantly.

This spec covers both fixes. It intentionally does **not** touch the practice engine, mastery/recommendation algorithms, mock-interview state machine, or any RLS policy on existing tables — those are out of scope and should not be modified.

---

## 1. Ground truth about the product (use this, don't invent numbers)

Pull differentiator claims only from what's actually implemented and documented — verify against the referenced doc before using a number in copy:

| Claim | Source of truth |
|---|---|
| 150 curated problems across 18 topics, mapped to patterns and prerequisites (not a raw link dump) | `docs/problem-library.md`, `data/problems.json` |
| Adaptive diagnostic places learners at foundation/intermediate/advanced before they start | `docs/diagnostic.md` |
| Deterministic mastery scoring + spaced repetition tied to actual weak topics, not generic review | `docs/analytics-mastery.md`, `docs/spaced-repetition.md` |
| Personalized daily plan that fits a learner's declared available time | `docs/daily-plan.md` |
| Timed mock interviews with hidden topics, a 10-criterion scorecard, and full session history | `docs/mock-interviews.md` |
| Realtime **voice** AI interviewer over WebRTC (feature-flagged) | `docs/realtime-interviewer.md` |
| AI learning coach: progressive hints, pattern feedback, post-attempt analysis, review-card drafts | `docs/ai-coach.md` |
| Fully deterministic fallback — product works even with AI disabled | `docs/ai-coach.md`, `docs/architecture.md` |

Do not claim anything not backed by one of these docs (no fabricated user counts, testimonials, or pricing — none of that exists yet).

---

## 2. Part 1 — Landing page rewrite

**File:** `src/app/(marketing)/page.tsx` (Server Component — keep it one; no client-side gating hacks, no new design system, reuse `Card`, `Badge`, `buttonVariants` and the existing Tailwind tokens already imported in this file).

### 2.1 Remove
- The "Phase 1 foundation" badge and the entire `foundation` section (`foundationItems` array + its `<section id="foundation">`). This is internal build-status language and has no place in front of a prospective student.
- The vague "Explore the learning loop" / "View the foundation" CTA pairing — replace per 2.3 below.

### 2.2 Rewrite the hero
Keep the structure (badge, h1, subhead, two CTAs, preview card) but change the content to lead with a concrete claim instead of an abstract one. Requirements:
- Headline must reference a specific mechanism (e.g. spaced repetition, adaptive diagnostic, mastery tracking) rather than a generic promise. Do not ship "Know exactly what to practice next" as-is — it's true of every competitor's marketing copy too.
- Subhead must name at least two differentiators explicitly (e.g. "AI-scored mock interviews" and "spaced repetition that targets your actual weak topics").
- Primary CTA changes from `#learning-loop` (anchor scroll) to the new demo entry point built in Part 2 — e.g. "Try a free lesson — no signup." Secondary CTA can remain `/signup` ("Start preparing") or `#learning-loop`.

### 2.3 Add a differentiator section (replace the vague 3-card "learning loop" or add alongside it)
Build a section that explicitly names, in plain language a non-technical student understands, each of:
1. **Adaptive diagnostic placement** — starts you at the right level instead of guessing.
2. **AI learning coach** — progressive hints and pattern feedback while you practice, not just a checkmark.
3. **Spaced repetition** — resurfaces the topics you actually got wrong, on a schedule, instead of "solve 150 problems and hope."
4. **Voice-enabled mock interviews** — a scored, timed mock interview with hidden topics and a 10-criterion scorecard, not a static problem list.
5. **150 curated, pattern-mapped problems** — organized by the pattern they teach and prerequisite order, not an arbitrary list.

Each item: one short (≤2 sentence) description, an icon from `lucide-react` (already a project dependency), reuse the `Card`/`CardContent` primitives. Keep to 4–6 items max — don't turn this into a feature wall.

### 2.4 Add a short, factual comparison section
Add a section (anchor `#why-different` or similar) titled something like "Not just another problem list." Non-disparaging, factual contrast — do not name competitors' pricing or make unverifiable claims about them, just contrast mechanisms:

| Typical problem-list tool | This product |
|---|---|
| Static list, self-graded | Deterministic mastery tracking per topic |
| No review scheduling | Spaced repetition tied to your mistakes |
| Text-only or no mock interviews | Timed, voice-enabled mock interviews with a scored rubric |
| Generic hints | AI coach hints scoped to your independence level |

Render this as a simple two-column list or table using existing design primitives — do not introduce a new table component if one doesn't already exist in `src/components/ui`; check first.

### 2.5 Demo CTA placement
The primary hero CTA and at least one CTA near the bottom of the page (footer or end of the differentiator section) must link to the public demo route(s) built in Part 2. A visitor should never have to reach `/signup` to understand what the product feels like.

### 2.6 Acceptance criteria
- [ ] "Phase 1 foundation" language and the `foundationItems` section are gone from anything a visitor sees.
- [ ] Above the fold (hero + first section), a visitor can name at least 3 of the 5 differentiators in section 2.3 without scrolling past the fold on a standard desktop viewport.
- [ ] At least one comparison element exists explaining why this isn't "just NeetCode again," without naming or disparaging specific competitors.
- [ ] At least two CTAs point to the new public demo route(s), not directly to `/signup`.
- [ ] Page remains a Server Component; no auth/session logic added to it.
- [ ] Existing Playwright/Vitest suites for the marketing page (if any) still pass; add/update coverage per section 4.

---

## 3. Part 2 — Public demo mode (no signup, no diagnostic)

### 3.1 Scope decision (read before building)
Two demo experiences are in scope for MVP. A third (interactive public mock interview) is explicitly **out of scope** for this pass — see 3.4 for why.

1. **Public sample lesson** (low risk, ship this first)
2. **Public demo problem, practice-lite** (medium risk — no persistence, no auth)

### 3.2 Public sample lesson
- New route outside the `(app)` route group (which is auth-gated by `requireAuthenticatedUser()` in `src/app/(app)/layout.tsx`) and outside `(marketing)`'s single `page.tsx`. Create a new route group, e.g. `src/app/(demo)/demo/lesson/page.tsx`, or a plain public segment `src/app/demo/lesson/page.tsx` — check whether a `(demo)` layout is needed for shared demo chrome (a persistent "You're viewing a free sample — sign up to unlock the full curriculum" banner) before deciding between a route group and a plain segment.
- Pick **one** existing lesson to feature — `content/curriculum/arrays-and-hashing.md` (Arrays & Hashing) is a reasonable default: it's the most universally recognizable pattern to a job-seeking student. Reuse the existing content-loading mechanism from `src/features/curriculum` (Phase 3 implemented "safe, directory-constrained Markdown loading" — reuse that function directly rather than re-implementing Markdown loading/rendering).
- Render read-only. No lesson-completion action, no progress persistence (that table is learner-owned and RLS-protected — do not add an anonymous write path to it).
- End of page: a clear conversion block — "This is 1 of 21 lessons across 18 topics. Sign up to unlock the full curriculum, track mastery, and get a personalized daily plan." with a CTA to `/signup`.

### 3.3 Public demo problem (practice-lite)
- Same route-group placement question as 3.2 (e.g. `src/app/(demo)/demo/problem/page.tsx`).
- Pick **one** fixed, easy, well-known problem from the existing catalog. Problem metadata is already anonymously readable per the Phase 4 RLS policy ("Anonymous and authenticated learners can read active metadata") — reuse the existing public query path from `src/features/problems`. Do not call into `src/domain/practice.ts` or any attempt-persistence Server Action; those assume an authenticated learner and enforce "one active attempt" — this flow must not create a row anywhere.
- Show: problem metadata (title, difficulty, canonical LeetCode link, recognition signals), a client-side-only timer (React state, not persisted), and 1–2 static progressive hints. **Do not** wire this to the AI coach — an unauthenticated, unrated endpoint calling the AI provider is an abuse/cost vector. Use static canned hint text for the demo problem instead of live AI hints.
- No testing checklist, no code snapshot persistence, no reflection step — this is a taste, not the real practice workspace. On "finish" (client-side only — no server round-trip needed to end the demo), show a conversion block: "Sign up to save your progress, get AI-scored feedback, and get matched to your next problem automatically."

### 3.4 Why the public mock interview is out of scope for this pass
`docs/architecture.md` is explicit that mock interviews "use a separate persisted state machine so practice assistance cannot leak into an interview," with forced RLS and narrow, ownership-checked database functions. Building a real anonymous interview session would mean either (a) weakening that boundary, which this spec forbids, or (b) building a fully parallel non-persisted state machine, which is a large enough surface to deserve its own spec and review. For this pass, if you want to give visitors a taste of the mock-interview product, add a **static, non-interactive preview** on the landing page or demo hub (e.g. a read-only rendering of what a completed scorecard looks like, using fixture data clearly labeled "Sample scorecard") rather than a live session. Flag this explicitly as a follow-up in your PR description rather than attempting a live version.

### 3.5 Hard constraints (do not violate)
- No new `INSERT`/`UPDATE` RLS policies for the `anon` role on any existing table. Forced RLS stays forced.
- All demo-mode state lives in browser React state only. Nothing about the demo touches Supabase for writes.
- Demo routes must not sit inside `(app)`'s layout tree (would trigger `requireAuthenticatedUser()` and redirect to login, defeating the purpose).
- Demo routes must not call the AI coach or realtime interviewer providers — canned/static content only, to avoid unauthenticated cost/abuse exposure.
- Reuse existing content/query loaders (`src/features/curriculum`, `src/features/problems`) rather than duplicating data-fetching logic.

### 3.6 Acceptance criteria
- [ ] An anonymous visitor can reach and fully view one real lesson without hitting a login redirect.
- [ ] An anonymous visitor can reach and interact with one real problem (metadata + timer + static hints) without hitting a login redirect and without any row being written to the database.
- [ ] Neither demo route triggers `requireAuthenticatedUser()` or any AI-provider call.
- [ ] Both demo experiences end with a clear, specific conversion CTA (not just a generic "Sign up").
- [ ] No RLS policy, migration, or `src/domain` file is modified by this work.

---

## 4. Testing & documentation requirements

- **Playwright:** add a test that, as an unauthenticated user, loads the landing page, confirms the differentiator content and demo CTAs are present, clicks into the demo lesson, and clicks into the demo problem — all without any redirect to `/login`.
- **Vitest:** if any new pure data (e.g. the differentiator list, comparison table content) is extracted into a typed module, add a basic shape/content test; most of this work is presentational and may not need new unit tests beyond that.
- **Docs:** add a new entry to `docs/implementation-status.md` following the existing per-phase format (`Status`, `Completed`, `Verification`) — do not renumber existing phases; append as an unnumbered "Growth: landing page & public demo" entry or as a new phase after 15, matching whatever convention is already there when you open the file.
- **Architecture doc:** if you introduce a new invariant (e.g. "demo routes never persist state and never call AI providers"), add one sentence to the relevant part of `docs/architecture.md` so it stays the source of truth. Do not edit any existing security-invariant sentence describing mock interviews or RLS.

---

## 5. Explicitly out of scope

- Any change to the practice engine, recommendation engine, mastery/spaced-repetition formulas, or mock-interview state machine.
- Any new anonymous write path to the database.
- A live, interactive public mock interview (see 3.4).
- Pricing, testimonials, or usage-count claims not backed by an existing doc.
- Deployment (Phase 15) — this spec assumes the app will eventually be deployed; it does not cover how.
