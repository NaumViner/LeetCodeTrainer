import { expect, test } from "@playwright/test";

test("the application foundation is responsive and navigable", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your next interview starts here.",
  );
  await expect(page.getByRole("combobox")).toHaveCount(4);
  await expect(
    page.getByRole("button", { name: "Start interview" }),
  ).toBeEnabled();
  await expect(
    page.getByText("First interview without signup", { exact: false }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/interview-entry-${testInfo.project.name}.png`,
    fullPage: true,
    caret: "initial",
  });
});

test("the mobile landing page exposes account and theme controls", async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await page.getByRole("button", { name: /system theme/i }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390);
});
