import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => {
  const abortSignal = vi.fn();
  const eq = vi.fn(() => ({ abortSignal }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { abortSignal, eq, from, select };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: supabaseMocks.from })),
}));

import { GET } from "@/app/api/health/route";

describe("deployment health route", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-test-key");
    supabaseMocks.abortSignal.mockResolvedValue({ count: 21, error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("reports readiness after querying the active curriculum", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      checks: { database: "ok" },
      service: "faang-interview-academy",
      status: "ok",
    });
    expect(supabaseMocks.from).toHaveBeenCalledWith("topics");
    expect(supabaseMocks.eq).toHaveBeenCalledWith("active", true);
  });

  it("returns a safe unavailable response when the database check fails", async () => {
    supabaseMocks.abortSignal.mockResolvedValue({
      count: null,
      error: { message: "private database detail" },
    });

    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(body).not.toContain("private database detail");
    expect(JSON.parse(body)).toMatchObject({
      checks: { database: "error" },
      status: "error",
    });
  });
});
