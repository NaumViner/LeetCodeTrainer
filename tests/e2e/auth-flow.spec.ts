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
