import { describe, expect, it } from "vitest";
import { interviewRouteAccess, safeAuthNextPath } from "@/features/auth/access";
describe("interview-first route boundaries", () => {
  it("makes setup public while keeping history and learning member-only", () => {
    expect(interviewRouteAccess("/interviews")).toBe("public");
    expect(
      interviewRouteAccess(
        "/interviews/00000000-0000-4000-8000-000000000001/ended",
      ),
    ).toBe("interview");
    for (const route of [
      "/interviews/history",
      "/diagnostic",
      "/settings/profile",
      "/interview-profile",
    ])
      expect(interviewRouteAccess(route)).toBe("member");
  });
  it("does not accept external, encoded or onboarding callback destinations", () => {
    for (const route of [
      "//evil.example",
      "/\\evil.example",
      "https://evil.example",
      "/%2f%2fevil.example",
      "/onboarding",
      "/diagnostic",
    ])
      expect(safeAuthNextPath(route)).toBe("/interviews");
    expect(
      safeAuthNextPath(
        "/interviews/00000000-0000-4000-8000-000000000001/review",
      ),
    ).toContain("/review");
  });
});
