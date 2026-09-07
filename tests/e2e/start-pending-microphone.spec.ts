import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

test("Start interview navigates even when microphone permission never resolves", async ({
  page,
}) => {
  let userId = "";
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
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: () => new Promise<MediaStream>(() => {}),
    });
  });
  let providerRequested = false;
  await page.route("**/api/realtime/**", (route) => {
    providerRequested = true;
    return route.fulfill({ status: 503, body: "No AI calls in this test" });
  });
  try {
    await page.goto("/");
    await page.getByRole("button", { name: "Start interview" }).click();
    await expect(page).toHaveURL(/\/interviews\/[0-9a-f-]{36}$/);
    const id = page.url().split("/").at(-1)!;
    userId = sql(
      `select user_id from public.mock_interviews where id = '${id}'`,
    );
    await expect(
      page.getByRole("heading", { name: "Live interviewer" }),
    ).toBeVisible();
    expect(
      sql(
        `select consumed_at is null from interview_private.guest_trials where user_id = '${userId}'`,
      ),
    ).toBe("t");
    expect(providerRequested).toBe(false);
    await page.getByRole("button", { name: "End interview" }).click();
    await expect(page).toHaveURL(/\/interviews$/);
    await expect(
      page.getByRole("button", { name: "Start interview" }),
    ).toBeEnabled();
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
