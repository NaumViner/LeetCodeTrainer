import { expect, test } from "@playwright/test";

test("the application foundation is responsive and navigable", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Know exactly what to practice next",
  );
  await page.getByRole("link", { name: "Explore the learning loop" }).click();
  await expect(page.locator("#learning-loop")).toBeInViewport();
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
