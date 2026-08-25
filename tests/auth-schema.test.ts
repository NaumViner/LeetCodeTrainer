import { describe, expect, it } from "vitest";

import { loginSchema, signupSchema } from "@/features/auth/schema";
import { profileFormSchema } from "@/features/profile/schema";

describe("authentication schemas", () => {
  it("normalizes a valid signup", () => {
    const result = signupSchema.parse({
      displayName: "  Ada Lovelace  ",
      email: "  ADA@EXAMPLE.COM ",
      password: "Interview123",
    });

    expect(result.displayName).toBe("Ada Lovelace");
    expect(result.email).toBe("ada@example.com");
  });

  it("rejects weak signup passwords", () => {
    expect(
      signupSchema.safeParse({
        displayName: "Ada",
        email: "ada@example.com",
        password: "password",
      }).success,
    ).toBe(false);
  });

  it("requires credentials to log in", () => {
    expect(loginSchema.safeParse({ email: "", password: "" }).success).toBe(
      false,
    );
  });
});

describe("profile schema", () => {
  it("converts study hours and an empty interview date", () => {
    const result = profileFormSchema.parse({
      displayName: "Ada",
      experienceLevel: "some_leetcode",
      interviewDate: "",
      preferredLanguage: "python",
      targetCompanies: ["Google"],
      targetRole: "new_grad",
      timezone: "Asia/Jerusalem",
      weeklyStudyHours: "8",
    });

    expect(result.interviewDate).toBeNull();
    expect(result.weeklyStudyHours).toBe(8);
  });
});
