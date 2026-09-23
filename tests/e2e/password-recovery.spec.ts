import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

// Requires the local mail catcher on 127.0.0.1:54324. No external email is sent.
for (const differentBrowser of [false, true]) {
  test(`password recovery ${differentBrowser ? "rejects missing PKCE state in another browser" : "changes the password and rejects a reused link"}`, async ({
    page,
    request,
    browser,
  }) => {
    test.setTimeout(90000);
    const email = `recovery-${randomUUID()}@example.com`;
    const oldPassword = "PreviousPass123";
    const newPassword = "UpdatedPass456";
    const admin = createClient(
      process.env.E2E_SUPABASE_API_URL!,
      process.env.E2E_SUPABASE_SECRET_KEY!,
      { auth: { persistSession: false } },
    );
    const created = await admin.auth.admin.createUser({
      email,
      password: oldPassword,
      email_confirm: true,
    });
    expect(created.error).toBeNull();
    let mailId = "";
    try {
      await page.goto("/login");
      await page.getByRole("link", { name: "Forgot password?" }).click();
      await expect(page).toHaveURL(/\/forgot-password$/);
      await page.getByLabel("Email", { exact: true }).fill(email);
      await expect(page.getByLabel("Email", { exact: true })).toHaveValue(
        email,
      );
      await page.getByRole("button", { name: "Send reset link" }).click();
      await expect(page.getByRole("status")).toContainText(
        "If this address has an account",
      );
      await expect
        .poll(
          async () => {
            const response = await request.get(
              "http://127.0.0.1:54324/api/v1/messages",
            );
            const inbox = (await response.json()) as {
              messages: { ID: string; To: { Address: string }[] }[];
            };
            mailId =
              inbox.messages.find((m) => m.To.some((t) => t.Address === email))
                ?.ID ?? "";
            return Boolean(mailId);
          },
          { timeout: 15000 },
        )
        .toBe(true);
      const message = (await (
        await request.get(`http://127.0.0.1:54324/api/v1/message/${mailId}`)
      ).json()) as { HTML: string };
      const link = message.HTML.match(/href="([^"]+)"/)?.[1]?.replaceAll(
        "&amp;",
        "&",
      );
      expect(Boolean(link)).toBe(true);
      if (differentBrowser) {
        const other = await browser.newContext();
        try {
          const tab = await other.newPage();
          await tab.goto(link!);
          await expect(tab).toHaveURL(
            (url) =>
              url.pathname === "/forgot-password" &&
              url.searchParams.get("notice") === "invalid",
          );
          await expect(
            tab.getByLabel("New password", { exact: true }),
          ).toHaveCount(0);
        } finally {
          await other.close();
        }
      } else {
        await page.goto(link!);
        await expect(page).toHaveURL(/\/reset-password$/);
        await page
          .getByLabel("New password", { exact: true })
          .fill(newPassword);
        await page
          .getByLabel("Confirm new password", { exact: true })
          .fill(newPassword);
        await page.getByRole("button", { name: "Save new password" }).click();
        await expect(page).toHaveURL(/\/interviews\?notice=password_updated$/);
        // Use a separate client to verify credentials, not the page's existing session.
        const client = createClient(
          process.env.E2E_SUPABASE_API_URL!,
          process.env.E2E_SUPABASE_SECRET_KEY!,
          { auth: { persistSession: false } },
        );
        expect(
          (
            await client.auth.signInWithPassword({
              email,
              password: oldPassword,
            })
          ).error,
        ).not.toBeNull();
        expect(
          (
            await client.auth.signInWithPassword({
              email,
              password: newPassword,
            })
          ).error,
        ).toBeNull();
        await page.goto(link!);
        await expect(page).toHaveURL(
          (url) =>
            url.pathname === "/forgot-password" &&
            url.searchParams.get("notice") === "invalid",
        );
      }
    } finally {
      if (created.data.user)
        await admin.auth.admin.deleteUser(created.data.user.id);
      if (mailId)
        await request.delete(`http://127.0.0.1:54324/api/v1/messages`, {
          data: { IDs: [mailId] },
        });
    }
  });
}
