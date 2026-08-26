import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

type LocalStatus = {
  API_URL: string;
  SECRET_KEY?: string;
  SERVICE_ROLE_KEY?: string;
};

function readLocalStatus(): LocalStatus {
  const cliPath = resolve(
    process.cwd(),
    "node_modules/supabase/dist/supabase.js",
  );
  const output = execFileSync(
    process.execPath,
    [cliPath, "status", "-o", "json"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );
  return JSON.parse(output) as LocalStatus;
}

test("a learner can onboard, return, and persist lesson progress", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const email = `browser-${randomUUID()}@example.com`;
  const password = "BrowserFlow123";

  try {
    await page.goto("/signup");
    await page.getByLabel("Display name").fill("Browser Learner");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/onboarding$/);
    await page.getByRole("checkbox", { name: "Google" }).check();
    await page.getByLabel("Weekly study hours").fill("8");
    await page.getByLabel("Timezone").fill("Asia/Jerusalem");
    await page.getByRole("button", { name: "Create my plan" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: "Welcome, Browser Learner" }),
    ).toBeVisible();
    await expect(page.getByText("Asia/Jerusalem")).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: "Welcome, Browser Learner" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Learn" }).click();
    await expect(
      page.getByRole("heading", { name: "Your curriculum" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Open topic" })).toHaveCount(
      21,
    );
    await page.getByRole("link", { name: "Open topic" }).first().click();

    await expect(page).toHaveURL(/\/learn\/interview-fundamentals$/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Interview Fundamentals",
      }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Start lesson" }).click();
    await expect(
      page.getByRole("heading", {
        name: "The interview problem-solving loop",
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Mark lesson complete" }).click();
    await expect(page.getByText("Lesson completed")).toBeVisible();

    await page.reload();
    await expect(page.getByText("Lesson completed")).toBeVisible();
    await page.getByRole("link", { name: "Curriculum" }).click();
    await expect(page.getByText("1 of 21 lessons completed")).toBeVisible();

    await page.getByRole("link", { name: "Problems" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Problem library" }),
    ).toBeVisible();
    await page.getByLabel("Topic").selectOption("two-pointers");
    await page.getByLabel("Difficulty").selectOption("hard");
    await page.getByRole("button", { name: "Apply filters" }).click();

    await expect(page).toHaveURL(/topic=two-pointers/);
    await expect(page).toHaveURL(/difficulty=hard/);
    await expect(
      page.getByRole("heading", { level: 2, name: "1 result" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Trapping Rain Water" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "View metadata" }).click();

    await expect(page).toHaveURL(/\/problems\/42$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Trapping Rain Water" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open on LeetCode" }),
    ).toHaveAttribute(
      "href",
      "https://leetcode.com/problems/trapping-rain-water/",
    );

    await page.getByRole("link", { name: "Practice this problem" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Selected problem" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Start practice attempt" }).click();
    await expect(page).toHaveURL(/\/practice\/[0-9a-f-]{36}$/);
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await page
      .getByLabel("What pattern would you try first?")
      .fill("two pointers");
    await page
      .getByLabel("What is a brute-force approach?")
      .fill("Try every pair of boundaries.");
    await page
      .getByLabel("What runtime would brute force require?")
      .fill("O(n^2)");
    await page.getByLabel("How confident are you?").selectOption("3");
    await page
      .getByRole("button", { name: "Save prediction and plan" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Turn the idea into steps" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Begin coding" }).click();
    await page
      .getByLabel("Code snapshot")
      .fill("function trap(height) { return 0; }");
    await page.getByRole("button", { name: "Save draft" }).click();
    await page.getByRole("button", { name: "Reveal next hint" }).click();
    await expect(page.getByText("Socratic question")).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Implement independently" }),
    ).toBeVisible();
    await expect(page.getByText("Socratic question")).toBeVisible();
    await page.getByRole("button", { name: "Move to testing" }).click();
    await expect(
      page.getByRole("heading", { name: "Test before judging the result" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Stop timer and reflect" }).click();
    await expect(
      page.getByRole("heading", { name: "Log an honest reflection" }),
    ).toBeVisible();

    await page.getByLabel("Did you solve it?").selectOption("partial");
    await page
      .getByLabel("Was your predicted pattern correct?")
      .selectOption("true");
    await page.getByLabel("What was the correct pattern?").fill("two pointers");
    await page.getByLabel("How confident are you now?").selectOption("4");
    await page.getByLabel("Optimal time complexity").fill("O(n)");
    await page.getByLabel("Space complexity").fill("O(1)");
    await page
      .getByLabel("Is the complexity analysis correct?")
      .selectOption("true");
    await page
      .getByLabel("Biggest mistake (one per line)")
      .fill("Moved the wrong boundary");
    await page
      .getByLabel("Edge case missed (one per line)")
      .fill("Empty input");
    await page
      .getByLabel("What should you notice earlier next time?")
      .fill("Track the bounded side before moving a pointer.");
    await page.getByRole("button", { name: "Complete attempt" }).click();

    await expect(page.getByText("Attempt saved")).toBeVisible();
    await expect(page.getByText("small hint", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Get next recommendation" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Recommended next problem" }),
    ).toBeVisible();
  } finally {
    const status = readLocalStatus();
    const secretKey = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;
    if (secretKey) {
      const admin = createClient(status.API_URL, secretKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data } = await admin.auth.admin.listUsers();
      const user = data?.users.find((candidate) => candidate.email === email);
      if (user) {
        await admin.auth.admin.deleteUser(user.id);
      }
    }
  }
});
