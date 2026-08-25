# FAANG Interview Academy

## Master Build Prompt — Build the Entire Product From Scratch

> **Use this document as the single source of truth for the project.**
>
> You are not auditing, migrating, or extending an existing application.
> You are building a complete production-ready application **from zero**.
>
> The goal is to create an end-to-end learning platform that can take a learner from **little or no technical-interview preparation** to being ready for Software Engineering interviews at companies such as Google, Amazon, Meta, Microsoft, Apple, Uber, Stripe, and similar companies.

---

# 0. EXECUTION CONTRACT

You are acting as all of the following:

- Staff-level full-stack engineer
- Software architect
- Product engineer
- UX engineer
- Database designer
- Technical-interview curriculum designer
- Adaptive-learning engineer
- AI application engineer
- QA engineer
- DevOps engineer

You must **build the actual application**, not only describe it.

You must:

1. Initialize the repository.
2. Create the frontend.
3. Create the backend.
4. Create the database schema.
5. Create migrations.
6. Create seed data.
7. Implement authentication.
8. Implement all MVP workflows.
9. Implement the adaptive learning engine.
10. Implement spaced repetition.
11. Implement interview simulations.
12. Implement the AI coaching architecture.
13. Implement a real-time mock interviewer architecture.
14. Add tests.
15. Add local development configuration.
16. Add deployment instructions.
17. Keep documentation updated.
18. Run linting, type checking, tests, and production builds.
19. Fix errors before declaring a phase complete.
20. Leave the repository in a runnable state after every phase.

Do not stop after scaffolding.

Do not create non-functional placeholder buttons.

Do not create fake screens that pretend to save data.

Do not leave critical flows mocked unless they are explicitly marked as development-only adapters.

If an external API cannot be configured because credentials are unavailable, implement:

- the full interface,
- the backend endpoint,
- validation,
- error handling,
- a clearly separated local development mock provider,

so replacing the mock with a real API key requires minimal work.

---

# 1. PRODUCT VISION

Build a product tentatively called:

# **FAANG Interview Academy**

The product is an intelligent personal coach for Software Engineering interview preparation.

It should answer this question every time the learner opens the application:

> **What should I study, practice, or review next to become interview-ready?**

The product must not behave like a static LeetCode list.

It must combine:

- structured curriculum,
- algorithm pattern recognition,
- coding practice,
- adaptive recommendations,
- spaced repetition,
- mistake tracking,
- interview simulations,
- performance analytics,
- AI coaching,
- voice mock interviews.

The product must guide the learner from:

```text
BEGINNER
   ↓
FOUNDATIONS
   ↓
DATA STRUCTURES
   ↓
CORE ALGORITHM PATTERNS
   ↓
ADVANCED PATTERNS
   ↓
TIMED PRACTICE
   ↓
MOCK INTERVIEWS
   ↓
INTERVIEW READY
```

---

# 2. CORE PRODUCT LOOP

Everything in the application must support this loop:

```text
LEARN
  ↓
RECOGNIZE
  ↓
ATTEMPT
  ↓
REFLECT
  ↓
MEASURE
  ↓
REVIEW
  ↓
ADAPT
  ↓
TRY AGAIN
```

Do not optimize the product around the raw number of problems solved.

Optimize it around **independent interview performance**.

---

# 3. PRODUCT DIFFERENTIATION

Most coding-preparation tools do one or more of the following poorly:

- give the user thousands of problems,
- expect the learner to choose what to study,
- treat accepted solutions as mastery,
- do not distinguish hints from independent solving,
- do not force review,
- do not teach pattern recognition,
- do not simulate interview communication,
- do not connect mistakes to future study recommendations.

This application must solve those problems.

The learner should rarely have to ask:

> "What should I do today?"

The platform should decide intelligently.

---

# 4. TARGET USERS

## Primary

Computer Science students and junior engineers preparing for:

- Software Engineering internships
- Graduate Software Engineering roles
- Junior Software Engineering roles

Typical targets:

- Google
- Amazon
- Microsoft
- Meta
- Apple
- Uber
- Stripe
- similar high-bar technology companies

## Secondary

- career switchers,
- experienced engineers returning to interviewing,
- bootcamp graduates,
- engineers preparing after several years away from algorithms.

---

# 5. USER EXPERIENCE PRINCIPLES

## 5.1 Teach Before Testing

A beginner must not immediately receive random medium/hard problems.

Each topic should progress from:

```text
intuition
→ recognition
→ guided example
→ guided coding problem
→ independent problem
→ timed problem
→ review
→ interview mode
```

---

## 5.2 Recognition Is a Separate Skill

Before coding, the learner should frequently be asked:

```text
What pattern would you try?
Why?
What in the problem statement suggests it?
```

Track recognition independently from code correctness.

---

## 5.3 Independence Matters

A successful attempt must distinguish between:

```text
Solved completely alone
Needed a tiny hint
Needed a conceptual hint
Needed the pattern
Needed pseudocode
Viewed a full solution
Copied code
```

An accepted result after viewing the solution is not equivalent to independent mastery.

---

## 5.4 Mistakes Become Future Learning Material

Every meaningful mistake should influence future learning.

Example:

Learner writes:

> "I forgot that the sorted input allowed two pointers."

Later the system may create a recall prompt:

> "When an array is sorted and you need to find a pair, which technique should you consider?"

---

## 5.5 Spaced Repetition Is Mandatory

Previously learned patterns and problems must return automatically.

The learner should not be allowed to "finish" a topic once and forget it.

---

## 5.6 Interview Behavior Matters

Train the full interview process:

```text
clarify
→ examples
→ brute force
→ complexity
→ optimize
→ explain
→ implement
→ test
→ analyze complexity
→ reflect
```

---

# 6. MVP BOUNDARY

Build the following as the first complete production MVP:

1. Landing page
2. Authentication
3. User onboarding
4. Learner profile
5. Initial diagnostic
6. Curriculum
7. Lessons
8. Problem metadata library
9. Adaptive problem recommendation
10. Practice session
11. Timer
12. Assistance tracking
13. Pattern recognition question
14. Time complexity input
15. Space complexity input
16. Takeaway / mistake logging
17. Practice history
18. Topic mastery system
19. Spaced repetition
20. Daily study plan
21. Dashboard
22. Progress analytics
23. Review queue
24. Mock interview mode
25. AI coach abstraction
26. AI progressive hints
27. AI post-attempt analysis
28. Real-time AI interviewer foundation
29. User settings
30. Data export/delete
31. Responsive UI
32. Automated tests
33. Deployment configuration

Do not build social features in the MVP.

Do not build a recruiter marketplace.

Do not build competitive rankings.

---

# 7. RECOMMENDED TECH STACK

Use stable, mainstream technologies.

Before installation, verify current stable versions and compatibility.

## Application

- Next.js
- React
- TypeScript
- App Router

## UI

- Tailwind CSS
- shadcn/ui
- Lucide icons

## Forms

- React Hook Form
- Zod

## Backend

Use Next.js server-side capabilities for normal application APIs.

Recommended:

- Route Handlers
- Server Actions where appropriate

Keep business logic independent from transport.

## Database

Preferred:

- PostgreSQL
- Supabase

Use:

- Supabase Auth
- Supabase PostgreSQL
- Row Level Security

If Supabase is unavailable, use:

- PostgreSQL
- Prisma
- Auth.js

Choose **one architecture** and use it consistently.

Preferred default: **Supabase**.

## Charts

- Recharts

## Testing

- Vitest
- React Testing Library
- Playwright

## Deployment

- Vercel
- Supabase

---

# 8. ARCHITECTURAL PRINCIPLES

Use a modular architecture.

Do not put business logic inside presentation components.

Suggested structure:

```text
/
├─ src/
│  ├─ app/
│  │  ├─ (marketing)/
│  │  ├─ (auth)/
│  │  ├─ (app)/
│  │  │  ├─ dashboard/
│  │  │  ├─ learn/
│  │  │  ├─ practice/
│  │  │  ├─ review/
│  │  │  ├─ interview/
│  │  │  ├─ progress/
│  │  │  ├─ history/
│  │  │  └─ settings/
│  │  └─ api/
│  │
│  ├─ components/
│  │  ├─ ui/
│  │  ├─ navigation/
│  │  ├─ dashboard/
│  │  ├─ learning/
│  │  ├─ practice/
│  │  ├─ interview/
│  │  └─ analytics/
│  │
│  ├─ features/
│  │  ├─ auth/
│  │  ├─ onboarding/
│  │  ├─ curriculum/
│  │  ├─ problems/
│  │  ├─ attempts/
│  │  ├─ mastery/
│  │  ├─ recommendations/
│  │  ├─ spaced-repetition/
│  │  ├─ daily-plan/
│  │  ├─ interviews/
│  │  └─ ai-coach/
│  │
│  ├─ domain/
│  │  ├─ mastery/
│  │  ├─ recommendations/
│  │  ├─ reviews/
│  │  └─ interviews/
│  │
│  ├─ lib/
│  │  ├─ db/
│  │  ├─ auth/
│  │  ├─ ai/
│  │  ├─ validation/
│  │  └─ analytics/
│  │
│  └─ types/
│
├─ content/
│  └─ curriculum/
│
├─ data/
│  └─ seed/
│
├─ supabase/
│  └─ migrations/
│
├─ tests/
│
└─ docs/
```

---

# 9. DOMAIN MODEL

Use UUIDs as internal identifiers.

Use timestamps in UTC.

---

# 10. USER MODEL

Create a user profile containing:

```ts
type UserProfile = {
  id: string;
  displayName: string | null;

  preferredLanguage: "java" | "python" | "cpp" | "javascript" | "typescript";

  targetRole: "intern" | "new_grad" | "junior" | "mid_level" | "senior";

  targetCompanies: string[];

  interviewDate: string | null;

  weeklyStudyMinutes: number;

  experienceLevel:
    | "complete_beginner"
    | "basic_programming"
    | "some_leetcode"
    | "active_interview_prep"
    | "experienced";

  timezone: string;

  onboardingCompleted: boolean;

  createdAt: string;
  updatedAt: string;
};
```

---

# 11. TOPIC MODEL

```ts
type Topic = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;

  curriculumOrder: number;

  prerequisiteTopicIds: string[];

  active: boolean;
};
```

Seed the following topics:

1. Interview Fundamentals
2. Big-O
3. Programming Foundations
4. Arrays & Hashing
5. Two Pointers
6. Sliding Window
7. Stack
8. Binary Search
9. Linked List
10. Trees
11. Heap / Priority Queue
12. Backtracking
13. Graphs
14. Tries
15. Intervals
16. Greedy
17. 1-D Dynamic Programming
18. 2-D Dynamic Programming
19. Advanced Graphs
20. Bit Manipulation
21. Math & Geometry

---

# 12. LESSON MODEL

```ts
type Lesson = {
  id: string;
  topicId: string;

  slug: string;
  title: string;

  lessonOrder: number;

  estimatedMinutes: number;

  learningObjectives: string[];

  recognitionSignals: string[];

  commonMistakes: string[];

  contentPath: string;

  prerequisiteLessonIds: string[];

  active: boolean;
};
```

Initially store lesson bodies as MDX or Markdown.

Do not hardcode long lesson text inside React components.

---

# 13. PROBLEM MODEL

Do not store copyrighted problem statements copied from LeetCode.

Store educational metadata and links.

```ts
type Problem = {
  id: string;

  source: "leetcode" | "custom";

  externalId: string | null;

  title: string;

  difficulty: "easy" | "medium" | "hard";

  externalUrl: string | null;

  primaryTopicId: string;

  secondaryTopicIds: string[];

  patternTags: string[];

  recognitionSignals: string[];

  prerequisiteTopicIds: string[];

  estimatedMinutes: number;

  curriculumLevel:
    "foundation" | "guided" | "independent" | "timed" | "interview";

  premium: boolean;

  companyTags: string[];

  active: boolean;
};
```

---

# 14. INITIAL PROBLEM DATASET

Create a reproducible seed dataset.

The product should eventually contain approximately **300+ carefully categorized coding interview problems across ~18–20 major algorithm categories**.

For the first implementation:

- seed enough high-quality metadata for the entire curriculum,
- include at least the core NeetCode-style interview set,
- build the importer so adding hundreds of additional problems requires only editing JSON/CSV.

Problem metadata should include:

```text
external ID
title
difficulty
primary topic
secondary topics
pattern tags
curriculum level
URL
```

Do not scrape or copy full problem statements.

---

# 15. ATTEMPT MODEL

This is one of the most important models.

```ts
type Attempt = {
  id: string;

  userId: string;
  problemId: string;

  mode: "learn" | "practice" | "review" | "interview";

  status: "started" | "completed" | "abandoned";

  startedAt: string;
  completedAt: string | null;

  durationSeconds: number | null;

  result: "solved" | "partial" | "failed" | "abandoned" | null;

  helpLevel:
    | "none"
    | "small_hint"
    | "concept_hint"
    | "pattern_hint"
    | "pseudocode"
    | "full_solution"
    | "copied"
    | null;

  predictedPattern: string | null;

  recognizedPatternCorrectly: boolean | null;

  submittedTimeComplexity: string | null;
  submittedSpaceComplexity: string | null;

  complexityCorrect: boolean | null;

  confidenceBefore: number | null;
  confidenceAfter: number | null;

  takeaway: string | null;

  mistakes: string[];

  edgeCasesMissed: string[];

  codeSnapshot: string | null;

  createdAt: string;
  updatedAt: string;
};
```

---

# 16. HELP LEVEL SCORING

Use default scores:

```text
none           1.00
small_hint     0.90
concept_hint   0.80
pattern_hint   0.65
pseudocode     0.45
full_solution  0.20
copied         0.05
```

Store these in configuration, not scattered constants.

---

# 17. TOPIC MASTERY MODEL

```ts
type TopicMastery = {
  userId: string;
  topicId: string;

  overallScore: number;

  correctnessScore: number;
  independenceScore: number;
  recognitionScore: number;
  retentionScore: number;
  speedScore: number;
  complexityScore: number;

  totalAttempts: number;
  independentSolves: number;

  lastPracticedAt: string | null;
  nextReviewAt: string | null;

  createdAt: string;
  updatedAt: string;
};
```

Scores use range 0–100.

---

# 18. PROBLEM REVIEW MODEL

```ts
type ProblemReview = {
  userId: string;
  problemId: string;

  repetition: number;

  intervalDays: number;

  easinessFactor: number;

  lastReviewedAt: string | null;

  nextReviewAt: string;

  lastPerformanceScore: number;

  failureStreak: number;

  createdAt: string;
  updatedAt: string;
};
```

---

# 19. MISTAKE MODEL

Create first-class mistakes.

```ts
type Mistake = {
  id: string;

  userId: string;

  attemptId: string;

  topicId: string;

  problemId: string;

  type:
    | "pattern_recognition"
    | "algorithm"
    | "implementation"
    | "edge_case"
    | "complexity"
    | "communication"
    | "testing"
    | "syntax"
    | "other";

  description: string;

  resolved: boolean;

  createdAt: string;
};
```

---

# 20. REVIEW CARD MODEL

```ts
type ReviewCard = {
  id: string;

  userId: string;

  sourceMistakeId: string | null;

  topicId: string | null;

  prompt: string;

  answer: string;

  nextReviewAt: string;

  intervalDays: number;

  repetition: number;

  active: boolean;
};
```

---

# 21. DAILY PLAN MODEL

```ts
type DailyPlan = {
  id: string;

  userId: string;

  localDate: string;

  availableMinutes: number;

  generatedAt: string;

  status: "active" | "completed" | "expired";
};
```

---

# 22. DAILY PLAN ITEM

```ts
type DailyPlanItem = {
  id: string;

  dailyPlanId: string;

  type:
    | "lesson"
    | "problem"
    | "review_problem"
    | "review_card"
    | "mock_interview"
    | "reflection";

  entityId: string;

  title: string;

  estimatedMinutes: number;

  priority: number;

  completed: boolean;

  position: number;
};
```

---

# 23. INTERVIEW SESSION MODEL

```ts
type InterviewSession = {
  id: string;

  userId: string;

  problemId: string;

  type: "text" | "voice" | "voice_and_code";

  durationLimitSeconds: number;

  status: "created" | "active" | "completed" | "abandoned";

  currentPhase:
    | "intro"
    | "clarify"
    | "examples"
    | "brute_force"
    | "optimization"
    | "implementation"
    | "testing"
    | "complexity"
    | "retrospective";

  startedAt: string | null;
  completedAt: string | null;

  transcript: unknown;

  finalScore: number | null;

  feedback: unknown;

  createdAt: string;
};
```

---

# 24. CURRICULUM

Build the curriculum in stages.

---

# 25. STAGE 0 — INTERVIEW FUNDAMENTALS

Teach:

- what coding interviews evaluate,
- what good communication sounds like,
- clarifying requirements,
- thinking out loud,
- brute force first,
- optimizing,
- complexity,
- testing,
- edge cases.

The learner should understand the interview process before difficult algorithms.

---

# 26. STAGE 1 — FOUNDATIONS

Teach:

- arrays
- strings
- hash maps
- sets
- loops
- recursion basics
- Big-O
- time complexity
- space complexity

---

# 27. STAGE 2 — CORE PATTERNS

Recommended order:

1. Arrays & Hashing
2. Two Pointers
3. Sliding Window
4. Stack
5. Binary Search
6. Linked List
7. Trees
8. Heap / Priority Queue

---

# 28. STAGE 3 — SEARCH / STRUCTURAL PATTERNS

1. Backtracking
2. Graphs
3. Tries
4. Intervals
5. Greedy

---

# 29. STAGE 4 — ADVANCED PATTERNS

1. 1-D Dynamic Programming
2. 2-D Dynamic Programming
3. Advanced Graphs
4. Bit Manipulation
5. Math & Geometry

---

# 30. STAGE 5 — INTERVIEW EXECUTION

The user transitions from topic-isolated practice into:

- mixed-topic problems,
- timed problems,
- hidden-topic problems,
- mock interviews.

---

# 31. LESSON TEMPLATE

Every algorithmic topic must follow approximately this structure:

```text
1. Why this pattern exists
2. Intuition
3. Visual explanation
4. Recognition signals
5. Basic template
6. Complexity
7. Common mistakes
8. Guided example
9. Recognition quiz
10. Easy practice
11. Medium practice
12. Review checkpoint
```

---

# 32. RECOGNITION SIGNALS

Examples:

## Sliding Window

```text
contiguous
substring
subarray
longest
shortest
at most K
minimum window
fixed-length K
```

## Two Pointers

```text
sorted input
pair
opposite ends
palindrome
partition
in-place
```

## Heap

```text
top K
K largest
K smallest
continuously retrieve max/min
streaming order statistic
```

## BFS

```text
shortest path
unweighted graph
minimum number of moves
level-by-level
```

## Backtracking

```text
all combinations
all permutations
generate possibilities
choose/unchoose
constraints eliminate branches
```

These are educational hints, not absolute rules.

---

# 33. ONBOARDING

Keep onboarding short.

Ask:

1. Target role
2. Target companies
3. Preferred coding language
4. Approximate interview date
5. Weekly available study hours
6. Current preparation level

Then create a plan.

---

# 34. INITIAL DIAGNOSTIC

Use three sections.

## Concepts

Short questions about:

- complexity
- arrays/maps
- recursion
- trees
- graph traversal

## Pattern Recognition

Show small synthetic prompts.

Ask:

> "What approach would you try first?"

## Coding

Give 1–3 problems chosen based on responses.

The diagnostic must adapt.

Do not throw hard DP at beginners.

---

# 35. DASHBOARD

The dashboard is the application home.

It must answer:

```text
What should I do today?
How ready am I?
What am I weak at?
What is due for review?
Am I improving?
```

Components:

```text
Dashboard
├─ Header
├─ InterviewCountdown
├─ ReadinessScore
├─ TodayPlan
├─ DueReviews
├─ WeakTopics
├─ TopicProgress
├─ WeeklyActivity
├─ RecentAttempts
└─ NextMilestone
```

---

# 36. TODAY'S PLAN

Generate a personalized plan every local day.

Example:

```text
TODAY — 75 MINUTES

10 min — Review: Binary Search
15 min — Lesson: Sliding Window
20 min — Guided Problem
25 min — Independent Problem
 5 min — Reflection
```

Default allocation:

```text
20% review
25% learning
45% problem solving
10% reflection
```

Adjust when the interview date approaches.

---

# 37. DAILY PLAN GENERATION

Input:

- study minutes available,
- curriculum position,
- lessons not completed,
- due reviews,
- topic mastery,
- recent topics,
- weak topics,
- failure streaks,
- interview date,
- recent workload.

Output:

3–6 tasks.

Rules:

- prioritize overdue reviews,
- avoid excessive repetition of one topic,
- do not give advanced problems before prerequisites,
- favor weak but learnable areas,
- include new learning when appropriate,
- include independent practice,
- prevent overload.

---

# 38. PRACTICE MODES

Implement:

## Learn Mode

- topic visible
- hints allowed
- untimed by default
- guided prompts

## Practice Mode

- timer optional
- topic may be visible
- hints available
- post-attempt reflection

## Review Mode

- prior problems
- ask pattern before showing notes
- compare against previous attempt

## Interview Mode

- topic hidden
- timer mandatory
- hints limited
- structured interview phases

## Recognition Sprint

- short prompt
- 30–60 seconds
- choose approach only
- no implementation

---

# 39. PROBLEM SELECTION ENGINE

Do not use pure random selection.

Implement a deterministic scoring engine with controlled randomness.

Conceptual formula:

```text
priority =
    weaknessScore
  + dueReviewScore
  + curriculumFit
  + prerequisiteFit
  + topicBalanceScore
  + difficultyFit
  + interviewUrgency
  + novelty
  - recentTopicPenalty
  - repeatedProblemPenalty
  - frustrationPenalty
```

---

# 40. INITIAL RECOMMENDATION ALGORITHM

Example:

```ts
function scoreProblem(problem: Problem, ctx: RecommendationContext): number {
  let score = 0;

  const mastery = ctx.masteryByTopic[problem.primaryTopicId] ?? 0;

  score += (100 - mastery) * 1.2;

  if (ctx.dueProblemIds.has(problem.id)) {
    score += 100;
  }

  if (ctx.recentTopicIds.includes(problem.primaryTopicId)) {
    score -= 30;
  }

  if (ctx.recentProblemIds.includes(problem.id)) {
    score -= 120;
  }

  score += curriculumFit(problem, ctx) * 50;
  score += difficultyFit(problem, ctx) * 40;

  if (!prerequisitesSatisfied(problem, ctx)) {
    score -= 500;
  }

  score -= frustrationPenalty(problem, ctx);

  return score;
}
```

Then:

```text
1. filter eligibility
2. score
3. sort
4. choose randomly among top 3–5
```

This prevents repetitive deterministic behavior.

---

# 41. DIFFICULTY ADAPTATION

Progress:

```text
guided easy
↓
independent easy
↓
guided medium
↓
independent medium
↓
timed medium
↓
mixed interview
```

If repeated failures occur:

```text
medium failure
↓
pattern review
↓
easy related problem
↓
similar medium
```

Do not keep throwing problems the learner cannot solve.

---

# 42. ATTEMPT FLOW

Use this state machine:

```text
SELECTED
↓
PRE_ATTEMPT
↓
PLANNING
↓
CODING
↓
TESTING
↓
REFLECTION
↓
COMPLETED
```

Persist active attempts.

A page refresh must not destroy the session.

---

# 43. PRE-ATTEMPT QUESTIONS

Before coding, ask:

```text
What pattern would you try first?
What is a brute-force approach?
What runtime would brute force require?
How confident are you?
```

Allow skipping in Learn Mode.

Require it in Interview Mode.

---

# 44. TIMER

Provide:

- Start
- Pause in practice
- Reset only before logging
- visible elapsed time
- fixed countdown in interview mode

Store elapsed time server-side when reasonable.

---

# 45. HINT SYSTEM

Hints must be progressive.

## Level 1 — Socratic

Ask a question.

Do not reveal the technique.

## Level 2 — Concept

Nudge toward a concept.

## Level 3 — Pattern

Reveal the likely pattern.

## Level 4 — Structural Hint

Describe algorithm structure.

## Level 5 — Pseudocode

Give pseudocode.

## Level 6 — Full Explanation

Explain solution.

## Level 7 — Code

Only when explicitly requested.

Every hint automatically updates attempt assistance level.

---

# 46. POST-ATTEMPT REFLECTION

Ask:

```text
Did you solve it?
What was the correct pattern?
What was the optimal time complexity?
What was the space complexity?
What was your biggest mistake?
Which edge case did you miss?
What should you notice earlier next time?
How confident are you now?
```

---

# 47. MASTERY MODEL

Calculate mastery across multiple dimensions.

Initial weights:

```text
Correctness          30%
Independence         30%
Pattern recognition  15%
Retention            10%
Complexity analysis  10%
Speed                 5%
```

Keep weights configurable.

---

# 48. PERFORMANCE SCORE

Example:

```ts
performance =
  correctness * 0.3 +
  independence * 0.3 +
  recognition * 0.15 +
  retention * 0.1 +
  complexity * 0.1 +
  speed * 0.05;
```

Range 0–1.

---

# 49. MASTERY UPDATE

Use smoothing.

```ts
newScore = oldScore * 0.75 + attemptPerformance * 100 * 0.25;
```

For very few attempts, use stronger uncertainty.

Do not display false precision.

One lucky solve must not immediately produce 100 mastery.

---

# 50. READINESS LEVELS

Internal interpretation:

```text
0–39   Learning
40–59  Developing
60–74  Practicing
75–84  Interview-capable
85–100 Strong
```

Avoid the word "permanently mastered."

---

# 51. SPACED REPETITION

Implement an SM-2-inspired scheduler.

Performance must depend on:

- correctness,
- help level,
- confidence,
- time,
- retention,
- repeated failure.

Baseline:

```text
failed:
1 day

solved with full solution:
1–2 days

pattern hint:
3 days

small hint:
5 days

independent:
7–14 days

strong repeated independent:
14–30 days
```

Adapt intervals.

---

# 52. REVIEW QUEUE

The `/review` screen should show:

```text
Due now
Due today
Upcoming
```

Support:

- problem review,
- mistake recall cards,
- complexity questions,
- pattern recognition cards.

---

# 53. PERSONALIZED MISTAKE CARDS

After attempts, optionally use AI to transform takeaways into recall cards.

Example:

Input:

```text
I forgot that BFS gives shortest path in an unweighted graph.
```

Output:

```text
Prompt:
Which traversal should you usually consider for the shortest path in an unweighted graph?

Answer:
Breadth-first search because it explores nodes by distance level.
```

AI-created cards require user confirmation before permanent save.

---

# 54. ANALYTICS

Track:

- attempts
- independent solve rate
- average / median solve time
- help usage
- pattern recognition accuracy
- topic mastery
- retention
- review success rate
- first-attempt vs repeat-attempt improvement
- complexity accuracy
- repeated mistakes

---

# 55. PROGRESS PAGE

Show:

```text
Overall readiness

Core Patterns
Independent Solving
Recognition
Retention
Timed Performance
Complexity
Interview Execution
```

Also show topic table:

```text
Topic
Mastery
Recognition
Independence
Retention
Attempts
Next Review
Status
```

---

# 56. TOPIC PAGE

Example:

```text
SLIDING WINDOW

Overall:       68
Recognition:   82
Independence:  55
Retention:     71
Speed:         62

Lessons: 4/5
Attempts: 13
Independent solves: 8
Due reviews: 2

Recommended next:
Variable window practice
```

---

# 57. READINESS SCORE

Create an internal score.

Example:

```text
Overall Readiness

Core Patterns          78%
Independent Solving    66%
Recognition            82%
Retention              73%
Timed Performance      61%
Interview Execution    64%
```

Clearly label:

> "Training estimate, not a prediction of interview outcome."

---

# 58. MOCK INTERVIEW MODE

Mock Interview must simulate real interview behavior.

Default session:

```text
Duration: 45 minutes
Difficulty: adaptive
Topic: hidden
Hints: minimal
```

State machine:

```text
INTRO
↓
CLARIFY
↓
EXAMPLES
↓
BRUTE_FORCE
↓
OPTIMIZATION
↓
IMPLEMENTATION
↓
TESTING
↓
COMPLEXITY
↓
RETROSPECTIVE
```

---

# 59. MOCK INTERVIEW RUBRIC

Score:

```text
Problem understanding
Clarification
Approach quality
Optimization
Correctness
Code quality
Testing
Complexity reasoning
Communication
Independence
```

Use 1–5 or 1–10.

Show actionable feedback.

---

# 60. REAL-TIME AI MOCK INTERVIEWER

This is a strategic product feature.

The application should eventually allow:

```text
USER SPEAKS
      ↓
REAL-TIME AUDIO
      ↓
AI INTERVIEWER

while simultaneously

USER WRITES CODE
      ↓
CODE SNAPSHOTS / EVENTS
      ↓
AI INTERVIEW CONTEXT
```

The AI interviewer should understand both:

- what the learner says,
- what code the learner currently has.

---

# 61. REAL-TIME INTERVIEW ARCHITECTURE

Use a provider abstraction.

```ts
interface RealtimeInterviewProvider {
  createSession(input: CreateRealtimeSessionInput): Promise<Session>;
  sendText(...): Promise<void>;
  sendCodeSnapshot(...): Promise<void>;
  sendInterviewEvent(...): Promise<void>;
  closeSession(...): Promise<void>;
}
```

Support an initial provider such as:

```text
Gemini Live API
```

but do not tightly couple the domain layer to Gemini.

Possible later providers:

```text
OpenAI Realtime
other realtime multimodal providers
```

---

# 62. REAL-TIME SECURITY

Never expose provider API keys in browser JavaScript.

Use:

```text
Browser
↓
authenticated backend
↓
short-lived / proxied realtime session
↓
AI provider
```

Follow the current official provider documentation.

Because realtime SDKs and APIs change rapidly:

> **Before implementing this integration, check the current official documentation for the selected provider and use the current recommended browser/server architecture.**

Do not guess outdated API signatures.

---

# 63. AUDIO EXPERIENCE

The interview UI should support:

- microphone permission
- mute/unmute
- input level
- interviewer speaking indicator
- transcript
- reconnect state
- audio error state
- end session

Do not require audio for normal practice.

---

# 64. CODE EDITOR

Phase after core MVP:

Use a browser code editor such as Monaco.

Support:

- Java
- Python
- C++
- JavaScript
- TypeScript

The application does not initially need to execute arbitrary code server-side.

The user may write code and manually reason/test.

Do not build an insecure arbitrary-code execution backend in MVP.

---

# 65. CODE AWARENESS

During AI interview sessions, do not send every keystroke.

Debounce snapshots.

Example:

```text
send code when:
- user pauses typing
- user requests interviewer feedback
- phase changes
- every reasonable interval while coding
```

Strip unnecessary metadata.

---

# 66. AI COACH

Separate the learning coach from realtime interviewer.

```ts
interface LearningCoachProvider {
  generateHint(input): Promise<Hint>;
  evaluatePattern(input): Promise<Evaluation>;
  evaluateComplexity(input): Promise<Evaluation>;
  analyzeAttempt(input): Promise<AttemptAnalysis>;
  generateReviewCard(input): Promise<ReviewCardDraft>;
}
```

---

# 67. AI PROVIDER ARCHITECTURE

Create adapters.

Example:

```text
GeminiLearningCoachProvider
OpenAILearningCoachProvider
AnthropicLearningCoachProvider
```

Choose one default provider based on available credentials.

The product must function without AI.

---

# 68. AI OUTPUT VALIDATION

Use structured responses.

Validate every AI response with Zod.

Do not trust arbitrary JSON.

If validation fails:

- retry once if safe,
- otherwise show a graceful fallback.

---

# 69. AI COACH SYSTEM RULES

The coach should:

- teach rather than immediately solve,
- use progressive hints,
- ask the learner to reason,
- respect the requested hint level,
- use known problem metadata,
- not invent constraints,
- challenge incorrect complexity,
- refer to previous learner mistakes when useful,
- remain concise during timed interviews.

---

# 70. AI CONTEXT

Provide only necessary context.

Example:

```json
{
  "mode": "pattern_hint",
  "problem": {
    "title": "...",
    "difficulty": "...",
    "patternTags": []
  },
  "attempt": {
    "elapsedSeconds": 900,
    "predictedPattern": "...",
    "helpLevel": "small_hint"
  },
  "learner": {
    "experienceLevel": "...",
    "topicMastery": 52
  },
  "relevantMistakes": []
}
```

---

# 71. AI COST CONTROL

Implement:

- rate limits
- token limits
- configurable model names
- feature flags
- usage counters
- timeout handling
- retry handling

Do not call an expensive model unnecessarily.

---

# 72. COMPANY TRACKS

Do not make company-specific preparation the core MVP.

Create data structures supporting:

```text
Google
Amazon
Microsoft
Meta
```

A company track may later influence:

- recommended topics
- mock interview format
- behavioral modules
- study-plan emphasis

Do not hardcode volatile claims.

---

# 73. BEHAVIORAL MODULE — FUTURE

Design database extensibility for:

- STAR stories
- competencies
- company values
- behavioral prompts
- voice answers
- AI feedback

Do not prioritize implementation before coding prep MVP is stable.

---

# 74. SYSTEM DESIGN — FUTURE

For experienced users.

Possible curriculum:

```text
requirements
capacity estimation
APIs
databases
caching
queues
replication
partitioning
consistency
observability
complete designs
```

Do not force this on interns/new grads.

---

# 75. AUTHENTICATION

Support:

- email/password
- Google OAuth
- GitHub OAuth

Add guest/demo mode if simple to implement safely.

Guest data migration is optional for MVP.

---

# 76. AUTHORIZATION

Every user-owned entity must be protected.

Examples:

- attempts
- mastery
- plans
- mistakes
- interview sessions
- settings

Use RLS when using Supabase.

Never trust a client-provided user ID.

---

# 77. DATABASE

Create migrations for all schema changes.

Do not manually rely on dashboard-created tables.

Provide:

```text
supabase/migrations/
```

and seed commands.

---

# 78. DATABASE INDEXES

Add indexes for common queries:

```text
attempts(user_id, created_at)
attempts(user_id, problem_id)
topic_mastery(user_id, topic_id)
problem_reviews(user_id, next_review_at)
review_cards(user_id, next_review_at)
daily_plans(user_id, local_date)
interview_sessions(user_id, created_at)
```

---

# 79. RLS

Policies should allow:

- public read access only where appropriate for curriculum/problem metadata,
- authenticated user access to their own progress,
- no cross-user reads.

Test RLS.

---

# 80. LANDING PAGE

Create a polished landing page.

Sections:

```text
Hero
Problem
How it works
Adaptive learning
Pattern recognition
Mock interviews
Progress
CTA
```

Example core message:

> Stop guessing what to practice.
> Follow a personalized path from fundamentals to real technical interviews.

---

# 81. APPLICATION NAVIGATION

Desktop sidebar:

```text
Dashboard
Learn
Practice
Review
Mock Interview
Progress
History
Settings
```

Mobile:

- bottom navigation for major routes,
- menu for secondary routes.

---

# 82. UI STYLE

Use a polished technical-product aesthetic.

Direction:

```text
Linear
+
modern learning app
+
technical interview utility
```

Use:

- clear typography
- strong hierarchy
- restrained color
- dark mode
- light mode
- subtle motion
- accessible contrast

Avoid:

- childish design
- unnecessary gradients
- excessive glass effects
- giant empty cards
- clutter.

---

# 83. DESIGN SYSTEM

Create reusable components:

```text
AppShell
PageHeader
Card
StatCard
ProgressBar
MasteryBadge
TopicBadge
DifficultyBadge
Timer
EmptyState
ErrorState
LoadingState
ConfirmDialog
HintPanel
AttemptSummary
ReviewQueueItem
DailyPlanItem
```

---

# 84. ACCESSIBILITY

Implement:

- semantic HTML
- keyboard navigation
- visible focus
- proper labels
- accessible dialogs
- aria-live for timer/session state if appropriate
- sufficient contrast

---

# 85. RESPONSIVENESS

Must work on:

- desktop
- laptop
- tablet
- phone

The full coding editor may have a desktop-first optimized experience, but other workflows must remain mobile-friendly.

---

# 86. SETTINGS

Include:

```text
Profile
Preferred coding language
Target role
Target companies
Interview date
Weekly study time
Theme
AI settings
Notifications
Privacy
Export data
Delete account
```

---

# 87. DATA EXPORT

Allow exporting personal training data as JSON.

Include:

- attempts
- mastery
- reviews
- mistakes
- daily-plan history

---

# 88. ACCOUNT DELETION

Implement a real deletion flow.

Require confirmation.

Delete or anonymize associated user-owned records according to the architecture.

---

# 89. SEARCH / PROBLEM LIBRARY

Provide a secondary manual browser.

Filters:

- topic
- difficulty
- attempted
- unattempted
- solved independently
- due for review
- favorites
- company tag

Recommendations remain primary.

---

# 90. FAVORITES

Allow bookmarking a problem.

Use for manual revisit.

Do not let favorites override due-review logic automatically.

---

# 91. HISTORY

Show attempts with:

```text
date
problem
difficulty
topic
mode
result
help level
time
pattern accuracy
```

Allow opening attempt detail.

---

# 92. ATTEMPT DETAIL

Show:

- problem metadata
- duration
- mode
- help
- predicted pattern
- correct pattern
- complexity
- takeaway
- mistakes
- previous attempts
- next review date

---

# 93. WEEKLY REPORT

Generate a deterministic weekly report.

Example:

```text
Study Time
Problems Attempted
Independent Solve Rate
Recognition Accuracy
Reviews Completed

Biggest Improvement
Biggest Weakness
Repeated Mistake
Suggested Focus
```

AI may improve wording but core metrics must be deterministic.

---

# 94. STREAKS

Optional lightweight streak.

Count a day if user completes a meaningful activity.

Do not overemphasize it.

---

# 95. GAMIFICATION

Good:

- learning streak
- milestone
- topic completion
- consistency
- review completion

Avoid XP systems that encourage low-quality grinding.

---

# 96. PRODUCT ANALYTICS

Implement analytics abstraction.

Track events such as:

```text
onboarding_completed
diagnostic_completed
lesson_started
lesson_completed
problem_started
hint_requested
attempt_completed
review_completed
mock_interview_started
mock_interview_completed
daily_plan_completed
```

Do not log private code/notes unless explicitly necessary.

---

# 97. ERROR HANDLING

Every major feature must have:

- loading state
- empty state
- error state
- retry where appropriate

AI failures must never break normal study workflows.

---

# 98. SECURITY

Follow production standards.

Requirements:

- Zod validation
- server authorization
- RLS
- no secrets client-side
- AI rate limits
- input sanitization
- CSRF-safe framework patterns
- secure cookies
- no arbitrary eval
- no arbitrary user code execution
- dependency review

---

# 99. PROMPT INJECTION DEFENSE

User-provided text may be included in AI prompts.

Treat:

- code
- notes
- takeaways
- pasted text

as untrusted data.

Explicitly delimit user content.

Do not allow user notes to override system instructions.

---

# 100. PRIVACY

Collect minimal data.

Avoid sending full learner history to AI when not needed.

Allow users to delete AI-related content.

---

# 101. PERFORMANCE

Optimize:

- server-side data aggregation where appropriate
- database indexes
- avoid N+1
- lazy charts
- pagination
- cache static curriculum
- avoid unnecessary client components

---

# 102. TESTING STRATEGY

Every core domain calculation needs unit tests.

---

# 103. UNIT TESTS

Required:

```text
recommendation scoring
help-level scoring
mastery update
spaced repetition
difficulty adaptation
daily-plan generation
readiness scoring
review scheduling
```

---

# 104. INTEGRATION TESTS

Required:

```text
start attempt
complete attempt
mastery updates
review scheduled
daily plan includes due item
hint updates assistance
interview session persistence
```

---

# 105. E2E TESTS

Playwright workflows:

## Flow A

```text
sign up
→ onboarding
→ dashboard
→ start lesson
→ complete lesson
→ start problem
→ submit attempt
→ see updated dashboard
```

## Flow B

```text
login
→ review queue
→ complete review
→ review disappears/reschedules
```

## Flow C

```text
start mock interview
→ proceed through phases
→ complete session
→ view scorecard
```

---

# 106. CODE QUALITY

Configure:

- ESLint
- Prettier
- strict TypeScript

Avoid `any`.

Use explicit domain types.

---

# 107. CI

Create GitHub Actions.

On pull request:

```text
install
lint
typecheck
unit tests
production build
```

E2E may run separately.

---

# 108. DEPLOYMENT

Document:

```text
Vercel
Supabase
environment variables
database migrations
seed
OAuth callback URLs
AI provider configuration
```

---

# 109. ENVIRONMENT VARIABLES

Example:

```env
NEXT_PUBLIC_APP_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

AI_PROVIDER=
AI_MODEL=
AI_API_KEY=

REALTIME_AI_PROVIDER=
REALTIME_AI_MODEL=
REALTIME_AI_API_KEY=

ANALYTICS_PROVIDER=
```

Do not commit `.env.local`.

Create `.env.example`.

---

# 110. FEATURE FLAGS

Implement simple feature flags for:

```text
AI coach
Realtime interview
Code editor
Company tracks
```

This lets the application run without optional APIs.

---

# 111. CONTENT SEEDING

Create curriculum seed content.

At minimum, build full starter modules for:

```text
Big-O
Arrays & Hashing
Two Pointers
Sliding Window
Stack
Binary Search
Linked List
Trees
Backtracking
Graphs
```

For each include:

- overview
- recognition signals
- common mistakes
- complexity
- guided example
- practice mapping

The remaining topics may start with lighter content but must have valid curriculum metadata.

---

# 112. CONTENT QUALITY

Lessons must be:

- concise
- interview-focused
- actionable
- not academic textbook chapters
- pattern-oriented

The user should quickly understand:

```text
what it is
when to use it
how to recognize it
what can go wrong
```

---

# 113. LEGAL / CONTENT RULE

Do not reproduce proprietary paid problem statements.

Use:

- title
- external ID
- difficulty
- educational metadata
- link

For custom teaching exercises, write original statements.

---

# 114. INTERVIEW COMMUNICATION TRAINING

Create reusable checklists.

Before coding:

```text
Clarify
Example
Brute force
Complexity
Optimization
```

After coding:

```text
Walk through
Edge cases
Test
Complexity
Tradeoffs
```

---

# 115. COMPANY-SPECIFIC BEHAVIOR

Keep configuration data-driven.

Example:

```ts
type CompanyTrack = {
  slug: string;
  displayName: string;
  focusAreas: string[];
  mockInterviewDefaults: {};
  active: boolean;
};
```

Do not claim continuously changing interview formats as permanent truth.

---

# 116. API DESIGN

Keep APIs thin.

Domain functions should be independently testable.

Potential endpoints:

```text
POST /api/onboarding
POST /api/diagnostic

GET  /api/dashboard

GET  /api/recommendations/next

POST /api/attempts
PATCH /api/attempts/:id
POST /api/attempts/:id/complete
POST /api/attempts/:id/hints

GET  /api/reviews
POST /api/reviews/:id/complete

GET  /api/daily-plan

POST /api/interviews
PATCH /api/interviews/:id
POST /api/interviews/:id/complete

POST /api/ai/hint
POST /api/ai/analyze-attempt

POST /api/realtime/session
```

Use Server Actions where they improve architecture.

---

# 117. TRANSACTIONS

When completing an attempt, update atomically where possible:

```text
attempt
mastery
problem review
mistakes
daily-plan item
analytics
```

Avoid partial success.

---

# 118. SERVER-SIDE DOMAIN SERVICE

Create something like:

```ts
completeAttempt();
```

This service should:

1. validate ownership,
2. finalize attempt,
3. calculate performance,
4. update mastery,
5. update problem review schedule,
6. store mistakes,
7. mark daily-plan item if relevant,
8. return updated summaries.

Test it thoroughly.

---

# 119. RECOMMENDATION CONTEXT

Build one normalized structure:

```ts
type RecommendationContext = {
  userId: string;

  masteryByTopic: Record<string, number>;

  recentTopicIds: string[];

  recentProblemIds: string[];

  dueProblemIds: Set<string>;

  completedLessonIds: Set<string>;

  interviewDate: string | null;

  experienceLevel: string;

  recentFailures: Record<string, number>;
};
```

Do not query database repeatedly inside scoring loops.

---

# 120. DAILY PLAN CACHE

Generate once per local day unless:

- user changes available time,
- significant state change,
- explicit regenerate.

Keep completed items stable when regenerating.

---

# 121. TIMEZONE

Use user timezone for:

- daily plans
- streaks
- daily reports

Store DB timestamps UTC.

---

# 122. INTERVIEW COUNTDOWN

If interview date exists, dashboard should show days remaining.

Closer interview dates increase:

- mixed problems
- timed problems
- mock interviews
- review priority

and reduce excessive new-topic learning.

---

# 123. FAILURE / FRUSTRATION CONTROL

Detect patterns such as:

```text
3 consecutive failures in same topic
heavy solution usage
long attempts with low progress
```

Respond with:

```text
topic refresher
easier related problem
guided practice
```

Do not punish the user.

---

# 124. READINESS GATING

Unlock Interview Mode when either:

- user manually chooses it, or
- basic curriculum readiness threshold is reached.

Never fully lock users out of a feature they intentionally want to try.

---

# 125. NO FALSE SCIENTIFIC CLAIMS

Mastery/readiness scores are product heuristics.

UI should avoid claiming that a score guarantees an interview pass.

---

# 126. LOCAL DEVELOPMENT EXPERIENCE

A developer should be able to run:

```bash
git clone ...
npm install
cp .env.example .env.local
npm run db:start
npm run db:migrate
npm run db:seed
npm run dev
```

Adapt commands to selected database tooling.

Document exact steps.

---

# 127. DEMO DATA

Create an optional demo seed user or development fixture with:

- several attempts
- multiple mastery scores
- due reviews
- daily plan

Do not create production credentials.

---

# 128. README

README must contain:

```text
Product overview
Architecture
Tech stack
Local setup
Environment variables
Database
Seed data
Testing
AI configuration
Realtime interviewer configuration
Deployment
Security notes
```

---

# 129. DOCS

Create:

```text
docs/
├─ architecture.md
├─ database.md
├─ curriculum.md
├─ mastery.md
├─ recommendation-engine.md
├─ spaced-repetition.md
├─ daily-plan.md
├─ mock-interviews.md
├─ ai-coach.md
├─ realtime-interviewer.md
├─ security.md
└─ deployment.md
```

---

# 130. IMPLEMENTATION PHASES

You must build in this order.

---

# PHASE 1 — REPOSITORY FOUNDATION

Implement:

- Next.js
- TypeScript strict
- Tailwind
- UI system
- lint
- formatter
- tests
- environment configuration
- base app shell

Verify:

```text
lint passes
typecheck passes
test passes
production build passes
```

---

# PHASE 2 — DATABASE + AUTH

Implement:

- Supabase setup
- schema
- migrations
- RLS
- auth
- profile
- onboarding

Verify:

```text
user signs up
user logs in
user logs out
user cannot access another user's data
profile persists
```

---

# PHASE 3 — CURRICULUM

Implement:

- topics
- lessons
- prerequisites
- progress
- learn screens
- seed content

Verify:

```text
user can open topic
complete lesson
refresh
progress persists
```

---

# PHASE 4 — PROBLEM LIBRARY

Implement:

- problem schema
- seed importer
- topics/tags
- filtering
- problem library screen

Verify dataset integrity.

---

# PHASE 5 — PRACTICE ENGINE

Implement:

- recommended problem
- practice screen
- timer
- attempt states
- pattern prediction
- help tracking
- complexity input
- reflection
- attempt save

Verify complete workflow.

---

# PHASE 6 — ANALYTICS + MASTERY

Implement:

- performance scoring
- mastery
- topic dashboard
- history
- overall progress

Add unit tests.

---

# PHASE 7 — SPACED REPETITION

Implement:

- review scheduler
- due queue
- review mode
- review history

Add deterministic tests for date calculations.

---

# PHASE 8 — ADAPTIVE RECOMMENDATIONS

Implement:

- recommendation scoring
- curriculum fit
- weakness weighting
- topic balance
- recent-topic avoidance
- repeat minimization
- difficulty adaptation
- frustration control

Test scenarios with synthetic learner histories.

---

# PHASE 9 — DAILY PLAN

Implement:

- daily-plan generation
- plan persistence
- task completion
- regeneration
- dashboard integration

---

# PHASE 10 — DIAGNOSTIC

Implement:

- onboarding diagnostic
- concept quiz
- pattern quiz
- coding assessment
- initial mastery initialization

---

# PHASE 11 — MOCK INTERVIEWS

Implement:

- session setup
- timer
- hidden topic
- phase state machine
- post-interview scorecard
- interview history

---

# PHASE 12 — AI LEARNING COACH

Implement:

- provider interface
- progressive hints
- pattern analysis
- complexity feedback
- attempt analysis
- review-card draft

Keep feature behind flag.

---

# PHASE 13 — REAL-TIME AI INTERVIEWER

Implement:

- realtime provider interface
- secure session creation
- audio connection
- transcript
- code snapshot events
- interview phase context
- reconnect/error handling

Keep feature behind flag until configured.

---

# PHASE 14 — POLISH

Implement:

- responsive behavior
- empty states
- errors
- accessibility
- onboarding polish
- charts
- dark/light theme
- performance review

---

# PHASE 15 — DEPLOYMENT

Implement:

- production env docs
- Vercel
- Supabase production migration
- OAuth configuration
- CI
- health verification

---

# 131. ACCEPTANCE TEST — NEW USER

A new user must be able to:

```text
visit landing page
→ create account
→ complete onboarding
→ complete diagnostic
→ receive personalized dashboard
→ open first lesson
→ finish lesson
→ get recommended problem
→ start attempt
→ use timer
→ request hint
→ finish problem
→ log reflection
→ see mastery update
→ see review scheduled
→ see daily plan update
```

This is the most important E2E flow.

---

# 132. ACCEPTANCE TEST — RETURNING USER

A returning user must be able to:

```text
log in
→ see today's plan
→ see due reviews
→ complete review
→ see updated retention
→ receive appropriate next problem
```

---

# 133. ACCEPTANCE TEST — INTERVIEW USER

A user must be able to:

```text
start mock interview
→ receive hidden-topic problem
→ move through interview phases
→ write code
→ finish
→ receive scorecard
→ see weaknesses reflected in later recommendations
```

---

# 134. AI INTERVIEW ACCEPTANCE TEST

When AI realtime provider is configured:

```text
start voice interview
→ microphone connects
→ AI greets learner
→ transcript appears
→ user speaks
→ AI responds
→ code snapshot reaches interview context
→ session completes
→ transcript and summary save
```

---

# 135. FEATURE DEFINITION OF DONE

A feature is complete only when:

- real UI exists
- persistence works
- authorization works
- validation exists
- loading state exists
- empty state exists
- error state exists
- tests exist where meaningful
- mobile behavior is acceptable
- accessibility basics are satisfied
- docs updated
- lint passes
- typecheck passes
- build passes

---

# 136. DEVELOPMENT BEHAVIOR

During implementation:

1. Do not ask unnecessary clarification questions.
2. Choose reasonable defaults.
3. Document important assumptions.
4. Work phase-by-phase.
5. Do not implement twenty incomplete features simultaneously.
6. Keep the application runnable.
7. Run tests frequently.
8. Fix regressions immediately.
9. Prefer clear code over clever code.
10. Avoid premature microservices.
11. Avoid premature machine learning.
12. Use deterministic scoring first.
13. Do not hide errors.
14. Do not silently skip requirements.

---

# 137. SOURCE CONTROL

Make logical commits.

Example:

```text
feat: initialize application shell
feat: add auth and profiles
feat: add curriculum schema
feat: add problem seed pipeline
feat: implement practice attempts
feat: add mastery engine
```

Do not commit secrets.

---

# 138. WORK LOG

Maintain:

```text
docs/implementation-status.md
```

For each phase:

```text
Status
Completed
Tests
Remaining
Known limitations
```

This is important for long autonomous coding sessions.

---

# 139. WHEN SOMETHING IS AMBIGUOUS

Prioritize:

```text
learning effectiveness
then data correctness
then maintainability
then UX polish
then feature breadth
```

---

# 140. DO NOT DO THESE THINGS

Do not:

- build only static mockups,
- use hardcoded fake analytics,
- pretend an API works,
- put all logic into one file,
- store secrets in frontend,
- make random selection the main algorithm,
- treat copied solutions as mastery,
- reveal interview topic in Interview Mode,
- copy proprietary LeetCode statements,
- build insecure remote code execution,
- introduce machine learning without need,
- make AI a hard dependency for basic functionality.

---

# 141. NORTH STAR

The product's north-star behavior is:

> Increase the learner's ability to solve interview problems **independently, correctly, under realistic interview conditions, and retain those skills over time.**

---

# 142. FINAL PRODUCT EXPERIENCE

The intended experience is:

```text
User:
"I want to get ready for Google/Amazon/Microsoft interviews."

Application:
"Great. Here is today's 70-minute plan."

User studies a topic.

Application teaches recognition signals.

User attempts a problem.

Application records:
- time
- independence
- pattern recognition
- complexity
- mistakes

Application detects weakness.

Application schedules review.

Application later tests the same concept again.

Once ready, application switches to realistic mixed mock interviews.

The AI interviewer talks to the learner while observing their code.

After the interview, the system updates the learning plan.

Repeat until interview day.
```

---

# 143. FIRST MESSAGE YOU SHOULD OUTPUT BEFORE CODING

Before writing code, output a concise implementation plan containing:

```text
Chosen stack
Repository structure
Database approach
Major domain modules
Implementation phases
Important assumptions
```

Then begin implementation immediately.

Do not stop and wait for approval unless a critical external dependency genuinely prevents implementation.

---

# 144. FINAL INSTRUCTION

Build this as a real end-to-end product.

Not a prototype.

Not a design exercise.

Not a static demo.

Not a collection of disconnected screens.

At completion, the repository should contain a deployable application with:

```text
frontend
backend
authentication
database
curriculum
problem metadata
adaptive recommendations
practice engine
attempt tracking
mastery
spaced repetition
daily plans
analytics
mock interviews
AI coach architecture
realtime interviewer architecture
tests
documentation
deployment configuration
```

The product must work without AI credentials for all non-AI learning functionality.

The adaptive learning loop is the heart of the system.

When forced to choose between:

```text
more features
```

and:

```text
better recommendation / review / mastery behavior
```

choose the second.

---

# END OF MASTER BUILD PROMPT
