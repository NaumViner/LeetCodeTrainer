import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const sql = (query: string) =>
  execFileSync(
    "docker",
    [
      "exec",
      "supabase_db_faang-interview-academy",
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-At",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      query,
    ],
    { encoding: "utf8" },
  ).trim();

test("a guest starts a Hebrew tough interview, resumes, then saves the same identity", async ({
  page,
}) => {
  test.setTimeout(90000);
  let userId = "";
  // The test uses a synthetic microphone and no paid AI provider requests.
  await page.route("**/api/realtime/**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Test voice transport unavailable" }),
    }),
  );
  try {
    await page.goto("/");
    await page.getByLabel("Difficulty range").selectOption("hard");
    await page.getByLabel("Coding language").selectOption("java");
    await page.getByLabel("Interview language").selectOption("hebrew");
    await page.getByRole("radio", { name: "קשוח" }).check();
    await page.getByRole("button", { name: "התחלת ראיון" }).click();
    await expect(page).toHaveURL(/\/interviews\/[0-9a-f-]{36}$/);
    const id = page.url().split("/").at(-1)!;
    userId = sql(
      `select user_id from public.mock_interviews where id = '${id}'`,
    );
    expect(
      sql(`select is_anonymous from auth.users where id = '${userId}'`),
    ).toBe("t");
    expect(
      sql(
        `select selection_mode || ':' || interview_language || ':' || interviewer_level || ':' || coding_language from public.mock_interviews where id = '${id}'`,
      ),
    ).toBe("coverage:hebrew:faang_tough:java");
    await expect(
      page.getByRole("heading", { name: "Live interviewer" }),
    ).toBeVisible();
    await expect(page.getByLabel("Java code editor")).toBeVisible();
    // Represent a successfully activated provider transport at the DB boundary.
    sql(
      `update public.mock_interviews set voice_activated_at = now(), voice_last_heartbeat_at = now(), timer_running = true where id = '${id}'`,
    );
    await page.reload();
    await page
      .getByLabel("Interview scratchpad")
      .fill("Check empty input and complexity.");
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(page.viewportSize()!.width);
    await page.getByRole("button", { name: "Save now" }).click();
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Interview scratchpad")).toHaveValue(
      "Check empty input and complexity.",
    );
    await page.getByRole("button", { name: "End interview" }).click();
    await expect(page).toHaveURL(/\/ended$/);
    await page.goto("/interviews");
    await expect(page.getByRole("button", { name: "התחלת ראיון" })).toHaveCount(
      0,
    );
    await page.goto("/signup");
    await page
      .getByLabel("Email", { exact: true })
      .fill(`guest-browser-${randomUUID()}@example.com`);
    await page
      .getByRole("button", { name: "Verify email & save interview" })
      .click();
    await expect(page).toHaveURL(/\/signup\/complete$/);
    await page.getByLabel("Choose a password").fill("GuestBrowser123");
    await page.getByRole("button", { name: "Save account" }).click();
    await expect(page).toHaveURL(/\/interviews\?notice=saved$/);
    await expect(page.getByLabel("שפת קוד")).toHaveValue("java");
    await expect(page.getByRole("radio", { name: "קשוח" })).toBeChecked();
    expect(
      sql(`select is_anonymous from auth.users where id = '${userId}'`),
    ).toBe("f");
    expect(
      sql(`select user_id from public.mock_interviews where id = '${id}'`),
    ).toBe(userId);
    await page.goto("/interviews/history");
    await page.getByRole("link", { name: "View saved work" }).click();
    await expect(page).toHaveURL(new RegExp(`/interviews/${id}/ended$`));
    await expect(
      page.getByText("Check empty input and complexity.", { exact: true }),
    ).toBeVisible();
  } finally {
    if (userId) {
      const admin = createClient(
        process.env.E2E_SUPABASE_API_URL!,
        process.env.E2E_SUPABASE_SECRET_KEY!,
        { auth: { persistSession: false } },
      );
      await admin.auth.admin.deleteUser(userId);
    }
  }
});
