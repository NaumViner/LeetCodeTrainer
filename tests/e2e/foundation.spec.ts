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
