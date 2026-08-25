import { z } from "zod";

import {
  codingLanguages,
  experienceLevels,
  targetCompanies,
  targetRoles,
} from "@/features/profile/model";

const enumValues = <T extends readonly { value: string }[]>(options: T) =>
  options.map((option) => option.value) as [
    T[number]["value"],
    ...T[number]["value"][],
  ];

export const profileFormSchema = z.object({
  displayName: z.string().trim().min(2, "Enter at least 2 characters.").max(80),
  experienceLevel: z.enum(enumValues(experienceLevels)),
  interviewDate: z.preprocess(
    (value) => (value === "" ? null : value),
    z.iso.date("Enter a valid date.").nullable(),
  ),
  preferredLanguage: z.enum(enumValues(codingLanguages)),
  targetCompanies: z
    .array(z.enum(targetCompanies))
    .min(1, "Choose at least one company."),
  targetRole: z.enum(enumValues(targetRoles)),
  timezone: z.string().trim().min(1).max(100),
  weeklyStudyHours: z.coerce.number().int().min(1).max(168),
});

export type ProfileActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  status: "idle" | "error";
};

export const initialProfileActionState: ProfileActionState = { status: "idle" };
