"use client";

import { useActionState, useState } from "react";

import { FieldShell, Input, Select } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  codingLanguages,
  experienceLevels,
  targetCompanies,
  targetRoles,
} from "@/features/profile/model";
import { saveProfileAction } from "@/features/profile/actions";
import { initialProfileActionState } from "@/features/profile/schema";
import type { Profile } from "@/features/profile/queries";

type ProfileFormProps = {
  onboarding?: boolean;
  profile: Profile;
  submitLabel?: string;
};

export function ProfileForm({
  onboarding = false,
  profile,
  submitLabel = "Create my plan",
}: ProfileFormProps) {
  const [state, formAction] = useActionState(
    saveProfileAction,
    initialProfileActionState,
  );
  const [timezone, setTimezone] = useState(profile.timezone);

  const useDeviceTimezone = () => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) setTimezone(detected);
  };

  return (
    <form action={formAction} className="space-y-7">
      {onboarding ? (
        <div className="bg-primary-soft rounded-xl p-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="text-primary text-sm font-semibold">
              Step 1 of 2 · Personalize your plan
            </p>
            <p className="text-muted mt-1 text-sm">
              Next: a short diagnostic to find your starting level.
            </p>
          </div>
          <div
            className="mt-3 flex w-full max-w-48 gap-1.5 sm:mt-0"
            aria-hidden="true"
          >
            <span className="bg-primary h-2 flex-1 rounded-full" />
            <span className="bg-surface h-2 flex-1 rounded-full" />
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="text-lg font-semibold">Your goals and study setup</h2>
        <p className="text-muted mt-1 text-sm">
          Nothing here is permanent—you can adjust every setting later.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FieldShell
          error={state.fieldErrors?.displayName?.[0]}
          htmlFor="displayName"
          label="Display name"
        >
          <Input
            aria-invalid={Boolean(state.fieldErrors?.displayName)}
            aria-describedby={
              state.fieldErrors?.displayName ? "displayName-error" : undefined
            }
            defaultValue={profile.display_name ?? ""}
            id="displayName"
            name="displayName"
            required
          />
        </FieldShell>

        <FieldShell
          error={state.fieldErrors?.targetRole?.[0]}
          htmlFor="targetRole"
          label="Target role"
        >
          <Select
            aria-invalid={Boolean(state.fieldErrors?.targetRole)}
            aria-describedby={
              state.fieldErrors?.targetRole ? "targetRole-error" : undefined
            }
            defaultValue={profile.target_role}
            id="targetRole"
            name="targetRole"
          >
            {targetRoles.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FieldShell>

        <FieldShell
          error={state.fieldErrors?.preferredLanguage?.[0]}
          htmlFor="preferredLanguage"
          label="Preferred coding language"
        >
          <Select
            aria-invalid={Boolean(state.fieldErrors?.preferredLanguage)}
            aria-describedby={
              state.fieldErrors?.preferredLanguage
                ? "preferredLanguage-error"
                : undefined
            }
            defaultValue={profile.preferred_language}
            id="preferredLanguage"
            name="preferredLanguage"
          >
            {codingLanguages.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FieldShell>

        <FieldShell
          error={state.fieldErrors?.experienceLevel?.[0]}
          htmlFor="experienceLevel"
          label="Current preparation level"
        >
          <Select
            aria-invalid={Boolean(state.fieldErrors?.experienceLevel)}
            aria-describedby={
              state.fieldErrors?.experienceLevel
                ? "experienceLevel-error"
                : undefined
            }
            defaultValue={profile.experience_level}
            id="experienceLevel"
            name="experienceLevel"
          >
            {experienceLevels.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FieldShell>

        <FieldShell
          error={state.fieldErrors?.weeklyStudyHours?.[0]}
          htmlFor="weeklyStudyHours"
          label="Weekly study hours"
        >
          <Input
            aria-invalid={Boolean(state.fieldErrors?.weeklyStudyHours)}
            aria-describedby={
              state.fieldErrors?.weeklyStudyHours
                ? "weeklyStudyHours-error"
                : undefined
            }
            defaultValue={Math.max(
              1,
              Math.round(profile.weekly_study_minutes / 60),
            )}
            id="weeklyStudyHours"
            max={168}
            min={1}
            name="weeklyStudyHours"
            required
            type="number"
          />
        </FieldShell>

        <FieldShell
          description="Optional — this helps the plan shift toward timed practice as the date approaches."
          error={state.fieldErrors?.interviewDate?.[0]}
          htmlFor="interviewDate"
          label="Approximate interview date"
        >
          <Input
            aria-invalid={Boolean(state.fieldErrors?.interviewDate)}
            aria-describedby={`interviewDate-description${state.fieldErrors?.interviewDate ? " interviewDate-error" : ""}`}
            defaultValue={profile.interview_date ?? ""}
            id="interviewDate"
            name="interviewDate"
            type="date"
          />
        </FieldShell>

        <FieldShell
          description="Use an IANA timezone such as Asia/Jerusalem or America/New_York."
          error={state.fieldErrors?.timezone?.[0]}
          htmlFor="timezone"
          label="Timezone"
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              aria-invalid={Boolean(state.fieldErrors?.timezone)}
              aria-describedby={`timezone-description${state.fieldErrors?.timezone ? " timezone-error" : ""}`}
              id="timezone"
              name="timezone"
              onChange={(event) => setTimezone(event.target.value)}
              required
              value={timezone}
            />
            <button
              className="text-primary hover:bg-primary-soft min-h-11 shrink-0 rounded-lg px-3 text-sm font-semibold"
              onClick={useDeviceTimezone}
              type="button"
            >
              Use device
            </button>
          </div>
        </FieldShell>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">Target companies</legend>
        <p className="text-muted mt-1 text-xs">
          Choose at least one. You can change this later.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {targetCompanies.map((company) => (
            <label
              className="bg-surface flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm"
              key={company}
            >
              <input
                defaultChecked={profile.target_companies.includes(company)}
                name="targetCompanies"
                type="checkbox"
                value={company}
              />
              {company}
            </label>
          ))}
        </div>
        {state.fieldErrors?.targetCompanies?.[0] ? (
          <p
            aria-live="polite"
            className="mt-2 text-sm text-red-600 dark:text-red-400"
            id="targetCompanies-error"
          >
            {state.fieldErrors.targetCompanies[0]}
          </p>
        ) : null}
      </fieldset>

      {state.message ? (
        <p
          aria-live="polite"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton
        className="w-full sm:w-auto"
        label={submitLabel}
        pendingLabel="Saving…"
      />
    </form>
  );
}
