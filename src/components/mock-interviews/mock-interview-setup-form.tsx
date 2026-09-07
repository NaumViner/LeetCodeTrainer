"use client";

import { useRef, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { ArrowRight, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form-field";
import {
  defaultInterviewPreferences,
  interviewDifficultyRangeLabels,
  type InterviewPreferences,
} from "@/domain/interview-setup";
import { startMockInterviewAction } from "@/features/mock-interviews/actions";
import { initialMockInterviewStartActionState } from "@/features/mock-interviews/schema";

export function MockInterviewSetupForm({
  defaults = defaultInterviewPreferences,
  voiceAvailable = true,
  isGuest = true,
}: {
  defaults?: InterviewPreferences;
  voiceAvailable?: boolean;
  isGuest?: boolean;
}) {
  const [preferences, setPreferences] = useState(defaults);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const submitting = useRef(false);
  const hebrew = preferences.interviewLanguage === "hebrew";
  async function submit(formData: FormData) {
    if (submitting.current) return;
    submitting.current = true;
    setMessage("");
    startTransition(async () => {
      try {
        // Open the interview first. Its voice transport requests microphone
        // access once and consumes the trial only after successful activation.
        const begin = async () => {
          const result = await startMockInterviewAction(
            initialMockInterviewStartActionState,
            formData,
          );
          setMessage(result.message);
        };
        // Serialize start actions across tabs until the response sets the guest
        // cookie. Database locks also protect the trial for that identity.
        if (navigator.locks) {
          const controller = new AbortController();
          const timeout = window.setTimeout(() => controller.abort(), 10_000);
          try {
            await navigator.locks.request(
              "mock-interview-start",
              { signal: controller.signal },
              async () => {
                window.clearTimeout(timeout);
                await begin();
              },
            );
          } finally {
            window.clearTimeout(timeout);
          }
        } else await begin();
      } catch (error) {
        unstable_rethrow(error);
        setMessage(
          error instanceof DOMException && error.name === "AbortError"
            ? hebrew
              ? "התחלת ראיון ממתינה בלשונית אחרת. חזור ללשונית ההיא או סגור אותה ונסה שוב."
              : "Another tab is starting an interview. Return to that tab or close it and try again."
            : hebrew
              ? "לא הצלחנו לפתוח את הראיון. בדוק את החיבור ונסה שוב."
              : "We couldn't open your interview. Check your connection and try again.",
        );
      } finally {
        submitting.current = false;
      }
    });
  }
  return (
    <form action={submit} className="space-y-6" dir={hebrew ? "rtl" : "ltr"}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          <span className="block">
            {hebrew ? "שפת הראיון" : "Interview language"}
          </span>
          <Select
            name="interviewLanguage"
            value={preferences.interviewLanguage}
            disabled={pending}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                interviewLanguage: e.target
                  .value as InterviewPreferences["interviewLanguage"],
              })
            }
          >
            <option value="english">ENGLISH</option>
            <option value="hebrew">HEBREW</option>
          </Select>
        </label>
        <label className="space-y-2 text-sm font-medium">
          <span className="block">
            {hebrew ? "שפת קוד" : "Coding language"}
          </span>
          <Select
            name="codingLanguage"
            value={preferences.codingLanguage}
            disabled={pending}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                codingLanguage: e.target
                  .value as InterviewPreferences["codingLanguage"],
              })
            }
          >
            <option value="python">Python</option>
            <option value="java">Java</option>
          </Select>
        </label>
        <label className="space-y-2 text-sm font-medium">
          <span className="block">
            {hebrew ? "טווח קושי" : "Difficulty range"}
          </span>
          <Select
            name="difficultyRange"
            value={preferences.difficultyRange}
            disabled={pending}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                difficultyRange: e.target
                  .value as InterviewPreferences["difficultyRange"],
              })
            }
          >
            {Object.entries(interviewDifficultyRangeLabels).map(
              ([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ),
            )}
          </Select>
        </label>
        <label className="space-y-2 text-sm font-medium">
          <span className="block">
            {hebrew ? "משך הראיון" : "Interview duration"}
          </span>
          <Select
            name="durationMinutes"
            value={preferences.durationMinutes}
            disabled={pending}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                durationMinutes: Number(
                  e.target.value,
                ) as InterviewPreferences["durationMinutes"],
              })
            }
          >
            {[30, 45, 60].map((value) => (
              <option key={value} value={value}>
                {value} {hebrew ? "דקות" : "minutes"}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <fieldset
        className="flex flex-wrap items-center gap-3 border-t pt-5"
        disabled={pending}
      >
        <legend className="sr-only">
          {hebrew ? "סגנון המראיין" : "Interviewer style"}
        </legend>
        <span className="text-muted text-sm">
          {hebrew ? "המראיין שלך" : "Your interviewer"}
        </span>
        {(["beginner", "faang_tough"] as const).map((value) => (
          <label
            key={value}
            className="bg-surface flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm"
          >
            <input
              type="radio"
              name="interviewerLevel"
              value={value}
              checked={preferences.interviewerLevel === value}
              onChange={() =>
                setPreferences({ ...preferences, interviewerLevel: value })
              }
            />
            {value === "beginner"
              ? hebrew
                ? "נוח"
                : "Comfortable"
              : hebrew
                ? "קשוח"
                : "Tough"}
          </label>
        ))}
      </fieldset>
      {!voiceAvailable ? (
        <p role="status" className="text-muted text-sm">
          {hebrew
            ? "המראיין אינו זמין כרגע. אפשר לנסות שוב בקרוב."
            : "The live interviewer is temporarily unavailable. Please try again shortly."}
        </p>
      ) : null}
      {message ? (
        <p
          role="alert"
          className="bg-danger-soft text-danger rounded-lg p-3 text-sm"
        >
          {message}
        </p>
      ) : null}
      <Button
        className="w-full py-6 text-base"
        disabled={pending || !voiceAvailable}
        type="submit"
      >
        {pending
          ? hebrew
            ? "מכינים את הראיון…"
            : "Preparing your interview…"
          : hebrew
            ? "התחלת ראיון"
            : "Start interview"}
        <ArrowRight aria-hidden="true" className="size-4" />
      </Button>
      <p className="text-muted flex items-center justify-center gap-2 text-center text-xs">
        <Mic aria-hidden="true" className="size-3.5" />
        {hebrew
          ? isGuest
            ? "ראיון ראשון ללא הרשמה · נדרש מיקרופון"
            : "נדרש מיקרופון"
          : isGuest
            ? "First interview without signup · Microphone required"
            : "Microphone required"}
      </p>
      <p className="text-muted text-center text-xs leading-5">
        {hebrew
          ? "הקול מועבר לספק AI לצורך הראיון. הקוד והתמלול נשמרים לצורך המשוב."
          : "Audio is sent to the AI provider for your interview. Code and transcript are saved for your feedback."}
      </p>
    </form>
  );
}
