"use client";

import { ArrowRight, LockKeyhole } from "lucide-react";
import { type FormEvent, useActionState, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form-field";
import type {
  InterviewDifficulty,
  InterviewSelectionMode,
} from "@/domain/interview-selection";
import { startMockInterviewAction } from "@/features/mock-interviews/actions";
import { initialMockInterviewStartActionState } from "@/features/mock-interviews/schema";

type SelectionTopic = {
  completedInterviews: number;
  id: string;
  inventory: Record<InterviewDifficulty, number>;
  name: string;
  ordinal: number;
  slug: string;
};

type SelectionSetup = {
  collection: { name: string; version: number };
  coverage: {
    complete: boolean;
    coveredTopicCount: number;
    missingTopicNames: string[];
    totalTopicCount: number;
  };
  improvement: {
    available: boolean;
    unavailableReason: string | null;
    weakTopics: Array<{
      adjustedScore: number;
      confidence: number;
      id: string;
      name: string;
    }>;
  };
  learning: { available: boolean; reasons: string[] };
  topics: SelectionTopic[];
};

const difficulties = ["easy", "medium", "hard"] as const;

export function MockInterviewSetupForm({
  defaultCodingLanguage = "python",
  defaultDurationMinutes = "45",
  defaultMode,
  recommendedDifficulty = "easy",
  recommendedDurationMinutes = "30",
  selectionModesEnabled = true,
  setup,
  voiceAvailable = true,
}: {
  defaultCodingLanguage?: "java" | "python";
  defaultDurationMinutes?: "30" | "45" | "60";
  defaultMode?: InterviewSelectionMode;
  recommendedDifficulty?: InterviewDifficulty;
  recommendedDurationMinutes?: "30" | "45" | "60";
  selectionModesEnabled?: boolean;
  setup: SelectionSetup;
  voiceAvailable?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    startMockInterviewAction,
    initialMockInterviewStartActionState,
  );
  const preferredMode = selectionModesEnabled
    ? (defaultMode ?? (setup.coverage.complete ? "learning" : "coverage"))
    : "learning";
  const [selectionMode, setSelectionMode] = useState<InterviewSelectionMode>(
    preferredMode === "improvement" && !setup.improvement.available
      ? "coverage"
      : preferredMode,
  );
  const [selectedDifficulties, setSelectedDifficulties] = useState<
    InterviewDifficulty[]
  >([...difficulties]);
  const [requestedTopicId, setRequestedTopicId] = useState(
    setup.topics[0]?.id ?? "",
  );
  const [customDifficulty, setCustomDifficulty] =
    useState<InterviewDifficulty>("easy");
  const [microphoneError, setMicrophoneError] = useState("");
  const microphonePreflightPassedRef = useRef(false);
  const selectedTopic = setup.topics.find(
    (topic) => topic.id === requestedTopicId,
  );
  const customInventory = selectedTopic?.inventory[customDifficulty] ?? 0;
  const blocked =
    !voiceAvailable ||
    (selectionMode === "improvement" && !setup.improvement.available) ||
    ((selectionMode === "coverage" || selectionMode === "improvement") &&
      selectedDifficulties.length === 0) ||
    (selectionMode === "learning" && !setup.learning.available) ||
    (selectionMode === "custom" && customInventory === 0);
  const aboveRecommendation =
    selectionMode === "custom" &&
    difficulties.indexOf(customDifficulty) >
      difficulties.indexOf(recommendedDifficulty);

  function toggleDifficulty(difficulty: InterviewDifficulty) {
    setSelectedDifficulties((current) =>
      current.includes(difficulty)
        ? current.filter((item) => item !== difficulty)
        : difficulties.filter(
            (item) => item === difficulty || current.includes(item),
          ),
    );
  }

  async function preflightMicrophone(event: FormEvent<HTMLFormElement>) {
    if (microphonePreflightPassedRef.current) return;
    event.preventDefault();
    setMicrophoneError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicrophoneError(
        "This browser cannot provide the microphone access required for a mock interview.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      for (const track of stream.getTracks()) track.stop();
      microphonePreflightPassedRef.current = true;
      event.currentTarget.requestSubmit();
    } catch {
      setMicrophoneError(
        "Microphone access is required. Allow it in the browser and try again.",
      );
    }
  }

  return (
    <>
      <section
        aria-labelledby="topic-coverage-title"
        className="bg-primary-soft mt-6 rounded-xl border p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold" id="topic-coverage-title">
              Topic coverage: {setup.coverage.coveredTopicCount} /{" "}
              {setup.coverage.totalTopicCount}
            </h3>
            <p className="text-muted mt-1 text-sm leading-6">
              {setup.coverage.complete
                ? `Every ${setup.collection.name} topic now has interview evidence.`
                : `${setup.coverage.missingTopicNames.length} topics still need a completed interview.`}
            </p>
          </div>
          <span className="bg-surface rounded-full border px-3 py-1 text-xs font-semibold">
            Collection v{setup.collection.version}
          </span>
        </div>
        {!setup.coverage.complete ? (
          <details className="text-muted mt-3 text-xs leading-5">
            <summary className="text-foreground cursor-pointer font-semibold">
              Topics still missing
            </summary>
            <p className="mt-2">
              {setup.coverage.missingTopicNames.join(", ")}
            </p>
          </details>
        ) : null}
      </section>

      <div className="bg-surface-subtle mt-5 rounded-lg border p-4 text-sm">
        <p className="font-semibold">Recommended setup</p>
        <p className="text-muted mt-1 capitalize">
          {recommendedDifficulty} · {recommendedDurationMinutes} minutes
        </p>
        <p className="text-muted mt-1 text-xs leading-5">
          Guidance from your evaluated profile. It never locks a mode, duration,
          or difficulty.
        </p>
      </div>

      <form
        action={formAction}
        className="mt-6 space-y-7"
        onSubmit={preflightMicrophone}
      >
        <section
          className={`rounded-xl border p-4 ${voiceAvailable ? "bg-primary-soft" : "bg-danger-soft text-danger"}`}
        >
          <p className="font-semibold">Full voice interview</p>
          <p className="mt-1 text-sm leading-6">
            {voiceAvailable
              ? "A live microphone connection is required for the entire interview. The browser will verify access before creating the session."
              : "Mock interviews are unavailable until a realtime voice provider is configured."}
          </p>
        </section>
        {selectionModesEnabled ? (
          <fieldset>
            <legend className="text-base font-semibold">
              How should we choose the question?
            </legend>
            <p className="text-muted mt-1 text-sm leading-6">
              The question is selected only after you press Start.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ModeCard
                checked={selectionMode === "coverage"}
                description={
                  setup.coverage.complete
                    ? "Randomly uses your least-covered topics, avoids two recent topics, and prefers a fresh problem."
                    : "Randomly uses only missing topics, avoiding recent topics and repeated problems when possible."
                }
                label={setup.coverage.complete ? "Balanced random" : "Coverage"}
                mode="coverage"
                onSelect={setSelectionMode}
              />
              <ModeCard
                checked={selectionMode === "improvement"}
                description="Randomly uses one of your three weakest evaluated interview topics, then prefers a fresh problem."
                disabled={!setup.improvement.available}
                label="Improvement"
                mode="improvement"
                onSelect={setSelectionMode}
                unavailableReason={setup.improvement.unavailableReason}
              />
              <ModeCard
                checked={selectionMode === "learning"}
                description="Uses Adaptive mastery, prerequisites, practice recency, failures, reviews, and interview urgency."
                disabled={!setup.learning.available}
                label="Learning"
                mode="learning"
                onSelect={setSelectionMode}
                unavailableReason={
                  setup.learning.available ? null : setup.learning.reasons[0]
                }
              />
              <ModeCard
                checked={selectionMode === "custom"}
                description="Choose one NeetCode topic and exact difficulty. Completion counts normally in history and coverage."
                label="Choose topic"
                mode="custom"
                onSelect={setSelectionMode}
              />
            </div>
          </fieldset>
        ) : (
          <section
            aria-labelledby="adaptive-selection-title"
            className="bg-surface-subtle rounded-xl border p-4"
          >
            <h3 className="font-semibold" id="adaptive-selection-title">
              Adaptive Learning selection
            </h3>
            <p className="text-muted mt-2 text-sm leading-6">
              Advanced selection modes are temporarily paused. The next question
              uses your current adaptive readiness and does not use
              interview-weakness ranking.
            </p>
          </section>
        )}

        {selectionMode === "coverage" || selectionMode === "improvement" ? (
          <fieldset className="rounded-xl border p-4">
            <legend className="px-1 text-sm font-semibold">
              Allowed difficulties
            </legend>
            <p className="text-muted text-xs leading-5">
              We never escape to a covered or stronger topic just to satisfy a
              narrow filter.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {difficulties.map((difficulty) => (
                <label
                  className="bg-surface flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold capitalize"
                  key={difficulty}
                >
                  <input
                    checked={selectedDifficulties.includes(difficulty)}
                    name="difficulties"
                    onChange={() => toggleDifficulty(difficulty)}
                    type="checkbox"
                    value={difficulty}
                  />
                  {difficulty}
                </label>
              ))}
            </div>
            {selectedDifficulties.length === 0 ? (
              <p className="mt-3 text-sm text-red-700 dark:text-red-300">
                Select at least one difficulty.
              </p>
            ) : null}
            {selectionMode === "improvement" ? (
              <ul className="bg-surface-subtle text-muted mt-4 space-y-1 rounded-lg p-3 text-xs leading-5">
                {setup.improvement.weakTopics.map((topic) => (
                  <li key={topic.id}>
                    {topic.name}: {topic.adjustedScore} adjusted score,{" "}
                    {Math.round(topic.confidence)}% confidence
                  </li>
                ))}
              </ul>
            ) : null}
          </fieldset>
        ) : null}

        {selectionMode === "learning" ? (
          <section
            aria-label="Learning details"
            className="rounded-xl border p-4"
          >
            <h3 className="text-sm font-semibold">How Learning chooses</h3>
            <ul className="text-muted mt-2 list-disc space-y-1 pl-5 text-xs leading-5">
              {setup.learning.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p className="text-muted mt-3 text-xs leading-5">
              Difficulty remains adaptive. Interview weakness is not mixed into
              this choice.
            </p>
          </section>
        ) : null}

        {selectionMode === "custom" ? (
          <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              NeetCode topic
              <Select
                className="mt-2"
                name="requestedTopicId"
                onChange={(event) => setRequestedTopicId(event.target.value)}
                value={requestedTopicId}
              >
                {setup.topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-sm font-semibold">
              Exact difficulty
              <Select
                className="mt-2 capitalize"
                name="customDifficulty"
                onChange={(event) =>
                  setCustomDifficulty(event.target.value as InterviewDifficulty)
                }
                value={customDifficulty}
              >
                {difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty[0]!.toUpperCase() + difficulty.slice(1)} (
                    {selectedTopic?.inventory[difficulty] ?? 0})
                  </option>
                ))}
              </Select>
            </label>
            <p
              className={`text-xs leading-5 sm:col-span-2 ${
                customInventory === 0
                  ? "text-red-700 dark:text-red-300"
                  : "text-muted"
              }`}
            >
              {customInventory === 0
                ? "No approved interview prompt exists for this combination. Choose another one."
                : `${customInventory} approved interview prompt${customInventory === 1 ? "" : "s"} available. A fresh one is preferred.`}
            </p>
          </div>
        ) : null}

        <input name="selectionMode" type="hidden" value={selectionMode} />
        <div className="grid gap-5 sm:grid-cols-2">
          <h3 className="text-base font-semibold sm:col-span-2">
            Interview conditions
          </h3>
          <label className="text-sm font-semibold">
            Duration
            <Select
              className="mt-2"
              defaultValue={defaultDurationMinutes}
              name="durationMinutes"
            >
              <option value="30">30 minutes — focused</option>
              <option value="45">45 minutes — standard</option>
              <option value="60">60 minutes — extended</option>
            </Select>
          </label>
          <label className="text-sm font-semibold">
            Coding language
            <Select
              className="mt-2"
              defaultValue={defaultCodingLanguage}
              name="codingLanguage"
            >
              <option value="python">Python</option>
              <option value="java">Java</option>
            </Select>
            <span className="text-muted mt-1 block text-xs leading-5 font-normal">
              Saved with the interview and used by the code workspace.
            </span>
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Interview language
            <Select
              className="mt-2"
              defaultValue="auto"
              name="interviewLanguage"
            >
              <option value="auto">Automatic — follow the learner</option>
              <option value="english">English</option>
              <option value="hebrew">עברית (Hebrew)</option>
            </Select>
            <span className="text-muted mt-1 block text-xs leading-5 font-normal">
              Controls conversation language, not source-code direction.
            </span>
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-semibold">Interviewer level</legend>
            <p className="text-muted mt-1 text-xs leading-5">
              Controls interviewer behavior for the entire session.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <PersonaOption
                defaultChecked
                description="Restrained guidance and gentle redirection when you get stuck."
                label="Beginner interviewer"
                value="beginner"
              />
              <PersonaOption
                description="Cold evaluation, zero hints, no validation, and bug-revealing dry runs."
                label="Tough FAANG interviewer"
                value="faang_tough"
              />
            </div>
          </fieldset>
        </div>

        {state.message ? (
          <p
            aria-live="polite"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}
        {microphoneError ? (
          <p
            aria-live="polite"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
            role="alert"
          >
            {microphoneError}
          </p>
        ) : null}
        {aboveRecommendation ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            This is above the current recommendation and may produce
            lower-confidence evidence. You can still start it.
          </p>
        ) : null}
        <Button disabled={pending || blocked} size="lg" type="submit">
          {pending ? "Starting interview…" : "Start mock interview"}
          {!pending ? (
            <ArrowRight aria-hidden="true" className="size-4" />
          ) : null}
        </Button>
      </form>
    </>
  );
}

function ModeCard({
  checked,
  description,
  disabled = false,
  label,
  mode,
  onSelect,
  unavailableReason,
}: {
  checked: boolean;
  description: string;
  disabled?: boolean;
  label: string;
  mode: InterviewSelectionMode;
  onSelect: (mode: InterviewSelectionMode) => void;
  unavailableReason?: string | null;
}) {
  return (
    <label
      className={`relative flex min-h-40 items-start gap-3 rounded-xl border p-4 transition-colors ${
        disabled
          ? "bg-surface-subtle cursor-not-allowed opacity-70"
          : "bg-surface hover:border-primary cursor-pointer"
      } ${checked ? "border-primary ring-primary/20 ring-2" : ""}`}
    >
      <input
        checked={checked}
        className="mt-1"
        disabled={disabled}
        name="selectionModeChoice"
        onChange={() => onSelect(mode)}
        type="radio"
        value={mode}
      />
      <span>
        <span className="flex items-center gap-2 text-sm font-semibold">
          {label}
          {disabled ? (
            <LockKeyhole aria-hidden="true" className="size-4" />
          ) : null}
        </span>
        <span className="text-muted mt-2 block text-xs leading-5">
          {description}
        </span>
        {unavailableReason ? (
          <span className="mt-2 block text-xs leading-5 text-amber-800 dark:text-amber-200">
            Unavailable: {unavailableReason}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function PersonaOption({
  defaultChecked = false,
  description,
  label,
  value,
}: {
  defaultChecked?: boolean;
  description: string;
  label: string;
  value: "beginner" | "faang_tough";
}) {
  return (
    <label className="bg-surface hover:border-primary flex cursor-pointer items-start gap-3 rounded-xl border p-4">
      <input
        className="mt-1"
        defaultChecked={defaultChecked}
        name="interviewerLevel"
        required
        type="radio"
        value={value}
      />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="text-muted mt-1 block text-xs leading-5">
          {description}
        </span>
      </span>
    </label>
  );
}
