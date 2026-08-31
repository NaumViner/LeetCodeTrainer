import { expect, test } from "@playwright/test";

test("reports application and database readiness", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);
  await expect(response.json()).resolves.toMatchObject({
    checks: { database: "ok" },
    service: "faang-interview-academy",
    status: "ok",
  });
});
