import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { GET } from "@/app/api/internal/guest-cleanup/route";
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/config", () => ({
  getSupabasePublicConfig: () => ({
    url: "https://test.supabase.co",
    key: "public-test-key",
  }),
}));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe("scheduled guest cleanup", () => {
  it("rejects absent and incorrect authorization without creating an administrative client", async () => {
    vi.stubEnv("CRON_SECRET", "s".repeat(32));
    for (const authorization of ["", "Bearer " + "x".repeat(32)]) {
      expect(
        (
          await GET(
            new Request("https://interview.test/api/internal/guest-cleanup", {
              headers: { authorization },
            }),
          )
        ).status,
      ).toBe(401);
    }
    expect(createClient).not.toHaveBeenCalled();
  });
  it("fails closed when the administrative credential is missing", async () => {
    vi.stubEnv("CRON_SECRET", "s".repeat(32));
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(
      (
        await GET(
          new Request("https://interview.test/api/internal/guest-cleanup", {
            headers: { authorization: "Bearer " + "s".repeat(32) },
          }),
        )
      ).status,
    ).toBe(503);
    expect(createClient).not.toHaveBeenCalled();
  });
  it("calls only the cleanup RPC and returns a non-cacheable count", async () => {
    vi.stubEnv("CRON_SECRET", "s".repeat(32));
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-admin-key");
    const rpc = vi.fn().mockResolvedValue({ data: 2, error: null });
    vi.mocked(createClient).mockReturnValue({ rpc } as unknown as ReturnType<
      typeof createClient
    >);
    const response = await GET(
      new Request("https://interview.test/api/internal/guest-cleanup", {
        headers: { authorization: "Bearer " + "s".repeat(32) },
      }),
    );
    expect(rpc).toHaveBeenCalledWith("cleanup_expired_guest_interviews");
    expect(await response.json()).toEqual({ deletedInterviews: 2 });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
