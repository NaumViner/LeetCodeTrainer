import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

test("registration opens interviews immediately and assessment is optional", async ({
  page,
}) => {
  test.setTimeout(90000);
  const email = `browser-${randomUUID()}@example.com`;
  const password = "BrowserFlow123";
  try {
    await page.goto("/signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/interviews$/);
    await expect(
      page.getByRole("button", { name: "Start interview" }),
    ).toBeEnabled();
    await page
      .getByRole("link", { name: "Optional skills assessment" })
      .click();
    await expect(page).toHaveURL(/\/diagnostic$/);
    await expect(
      page.getByRole("heading", { name: "Find the right place to begin." }),
    ).toBeVisible();
    await page.getByLabel("O(n²)").check();
    await page.getByLabel("A hash map").check();
    await page.getByLabel("A base case that stops recursion").check();
    await page.getByLabel("Inorder").check();
    await page.getByLabel("A visited set").check();
    await page.getByLabel("Hash set").check();
    await page.getByLabel("Sliding window").check();
    await page.getByLabel("BFS").check();
    await page.getByRole("button", { name: "Continue to coding" }).click();
    await expect(page.getByText("intermediate coding tier")).toBeVisible();
    await page.goto("/interviews");
    await expect(
      page.getByRole("button", { name: "Start interview" }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.getByRole("link", { name: "Sign in" }).click();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/interviews$/);
  } finally {
    const admin = createClient(
      process.env.E2E_SUPABASE_API_URL!,
      process.env.E2E_SUPABASE_SECRET_KEY!,
      { auth: { persistSession: false } },
    );
    const { data } = await admin.auth.admin.listUsers();
    const user = data.users.find((user) => user.email === email);
    if (user) await admin.auth.admin.deleteUser(user.id);
  }
});
