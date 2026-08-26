# Analytics and mastery

## Performance snapshots

Every completed attempt produces an immutable snapshot with six normalized dimensions. The configurable weights are:

```text
Correctness 30% · Independence 30% · Recognition 15%
Retention 10% · Complexity 10% · Speed 5%
```

Correctness maps solved, partial, and failed to 1, 0.5, and 0. Independence uses the centralized help-level scores. Recognition and checked complexity are binary; unchecked complexity is neutral at 0.5. Speed compares elapsed time with the problem's educational time estimate and is multiplied by correctness, so a fast failure receives no speed reward.

The first attempt on a problem uses neutral 0.5 retention because no recall evidence exists. Repeat attempts derive retention from correctness and independence. Phase 7 uses this frozen retention evidence for time-aware scheduling without rewriting historical performance snapshots.

## Topic mastery

Completed attempts update the problem's primary topic. Each dimension is smoothed independently:

```text
new = previous × (1 - alpha) + attempt × 100 × alpha
```

An unseen topic begins with an uncertainty prior of 35 and alpha 0.35. The second attempt uses 0.30; later attempts use the specification baseline of 0.25. This prevents one successful attempt from claiming permanent mastery. The UI shows whole numbers and readiness bands—Learning, Developing, Practicing, Interview-capable, and Strong—to avoid false precision.

## Atomicity and privacy

Attempt completion is the transaction boundary. A database trigger calculates the snapshot, inserts it, and upserts topic mastery before the attempt transaction commits. Browser clients cannot provide scores and receive no analytics write grants.

Performance and mastery tables use forced Row Level Security. Authenticated learners can read only their own records; anonymous and cross-account access is denied.

## Readiness and analytics

Overall readiness begins with mean practiced-topic mastery and applies a coverage factor across the 18 core problem topics. This prevents one strong topic from representing broad interview readiness. It is always labeled “Training estimate, not a prediction of interview outcome.” Interview execution remains unmeasured until mock-interview evidence exists.

The progress view derives total attempts, independent solve rate, average and median time, help usage, recognition and complexity accuracy, repeat improvement, repeated mistakes, mastery dimensions, and topic status from stored records. History and attempt detail expose the evidence behind those aggregates. Review success and scheduled retention now flow through the spaced-repetition schedule and its immutable event history.
