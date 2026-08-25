import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."));

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z.object({
  displayName: z.string().trim().min(2, "Enter at least 2 characters.").max(80),
  email: emailSchema,
  password: passwordSchema,
});

export type AuthActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message?: string;
  status: "idle" | "error" | "success";
};

export const initialAuthActionState: AuthActionState = { status: "idle" };
