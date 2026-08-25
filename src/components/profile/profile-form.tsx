"use client";

import { useActionState } from "react";

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
  profile: Profile;
  submitLabel?: string;
};

export function ProfileForm({
  profile,
  submitLabel = "Create my plan",
}: ProfileFormProps) {
  const [state, formAction] = useActionState(
    saveProfileAction,
    initialProfileActionState,
  );
  return (
    <form action={formAction} className="space-y-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <FieldShell
          error={state.fieldErrors?.displayName?.[0]}
          htmlFor="displayName"
          label="Display name"
        >
          <Input
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
          <Input
            defaultValue={profile.timezone}
            id="timezone"
            name="timezone"
            required
          />
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
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
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
