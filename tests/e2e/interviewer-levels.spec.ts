import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

test("a newly diagnosed learner can start a hard tough-FAANG interview", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const email = `interviewer-level-${randomUUID()}@example.com`;
  const password = "InterviewerLevel123";

  try {
    await page.goto("/signup");
    await page.getByLabel("Display name").fill("Interviewer Level Learner");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    await page.getByRole("checkbox", { name: "Google" }).check();
    await page.getByLabel("Weekly study hours").fill("8");
    await page.getByLabel("Timezone").fill("Asia/Jerusalem");
    await page.getByRole("button", { name: "Create my plan" }).click();

    await page.getByLabel("O(n²)").check();
    await page.getByLabel("A hash map").check();
    await page.getByLabel("A base case that stops recursion").check();
    await page.getByLabel("Inorder").check();
    await page.getByLabel("A visited set").check();
    await page.getByLabel("Hash set").check();
    await page.getByLabel("Sliding window").check();
    await page.getByLabel("BFS").check();
    await page.getByRole("button", { name: "Continue to coding" }).click();
    await page
      .getByLabel(
        "Compare the midpoint, then discard only the half that cannot contain the target.",
      )
      .check();
    await page
      .getByLabel(
        "Return 0 for null; otherwise return 1 + max(depth(left), depth(right)).",
      )
      .check();
    await page.getByRole("button", { name: "Finish diagnostic" }).click();

    await page.goto("/interviews");
    await page.getByLabel("Duration").selectOption("30");
    await page.getByLabel("Difficulty").selectOption("hard");
    await page.getByLabel("Interview language").selectOption("hebrew");
    await page.getByRole("radio", { name: /Tough FAANG interviewer/ }).check();
    await page.getByRole("button", { name: "Start mock interview" }).click();

    await expect(page).toHaveURL(/\/interviews\/[0-9a-f-]{36}$/);
    await expect(
      page.getByText("Tough FAANG interviewer", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("Tough FAANG interviewer", { exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Begin clarification" }).click();
    await page
      .getByLabel("Clarifying questions and assumptions")
      .fill("What input bounds and edge cases should I consider?");
    await page.getByRole("button", { name: "Continue to examples" }).click();
    await page
      .getByLabel("Examples and expected behavior")
      .fill("Normal input\nMinimal input\nBoundary input");
    await page.getByRole("button", { name: "Continue to brute force" }).click();
    await page
      .getByLabel("Brute-force reasoning")
      .fill(
        "Enumerate candidates.\nValidate each candidate.\nFind repeated work.",
      );
    await page
      .getByRole("button", { name: "Continue to optimization" })
      .click();
    await page
      .getByLabel("Optimized approach and invariant")
      .fill("Maintain state once per input and preserve the stated invariant.");
    await page.getByRole("button", { name: "Begin implementation" }).click();
    await page
      .getByLabel("Code snapshot")
      .fill("function solve(input) { return input.length; }");
    await page.getByRole("button", { name: "Move to testing" }).click();
    await page
      .getByLabel("Tests and traces")
      .fill("Minimal input\nBoundary input\nOrdinary input");
    await page.getByRole("button", { name: "Continue to complexity" }).click();
    await page.getByLabel("Time complexity").fill("O(n)");
    await page.getByLabel("Space complexity").fill("O(1)");
    await page.getByRole("button", { name: "Stop timer and reflect" }).click();
    await page.getByLabel("Outcome").selectOption("partial");
    await page
      .getByLabel("What went well, what broke down, and what will you change?")
      .fill("I will validate the invariant against boundary cases earlier.");
    await page.getByRole("button", { name: "Generate scorecard" }).click();

    await expect(page).toHaveURL(/\/interviews\/[0-9a-f-]{36}\/scorecard$/);
    const completedInterviewId = page.url().split("/").at(-2)!;
    const apiUrl = process.env.E2E_SUPABASE_API_URL!;
    const secretKey = process.env.E2E_SUPABASE_SECRET_KEY!;
    const admin = createClient(apiUrl, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: evaluation, error: evaluationError } = await admin
      .from("mock_interview_evaluations")
      .select(
        "status, provider, model, raw_score, confidence, dimensions, source_interview_language",
      )
      .eq("mock_interview_id", completedInterviewId)
      .eq("is_current", true)
      .single();
    expect(evaluationError).toBeNull();
    expect(evaluation).toMatchObject({
      model: "deterministic-v1",
      provider: "deterministic",
      status: "provisional",
      source_interview_language: "hebrew",
    });
    expect(evaluation?.raw_score).toBeGreaterThan(0);
    expect(evaluation?.confidence).toBeGreaterThan(0);
    expect(evaluation?.dimensions).toBeTruthy();

    await page.goto("/interview-profile");
    await expect(
      page.getByRole("heading", { name: "Your interview performance" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Interview dimensions" }),
    ).toBeVisible();
    await expect(page.getByText(/Profile confidence/i)).toBeVisible();

    await page.goto("/interviews");
    await expect(
      page.getByLabel("Difficulty").locator('option[value="hard"]'),
    ).toBeEnabled();
  } finally {
    const apiUrl = process.env.E2E_SUPABASE_API_URL;
    const secretKey = process.env.E2E_SUPABASE_SECRET_KEY;
    if (apiUrl && secretKey) {
      const admin = createClient(apiUrl, secretKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data } = await admin.auth.admin.listUsers();
      const user = data?.users.find((candidate) => candidate.email === email);
      if (user) await admin.auth.admin.deleteUser(user.id);
    }
  }
});
