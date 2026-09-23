// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  reset: vi.fn(),
  update: vi.fn(),
  current: vi.fn(),
  active: vi.fn(),
  prepare: vi.fn(),
  finish: vi.fn(),
  exchange: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: mocks.getUser,
      resetPasswordForEmail: mocks.reset,
      updateUser: mocks.update,
      exchangeCodeForSession: mocks.exchange,
    },
  }),
}));
vi.mock("@/lib/supabase/config", () => ({
  getSupabasePublicConfig: () => ({
    url: "http://localhost:54321",
    key: "test",
  }),
}));
vi.mock("@/lib/site-url", () => ({ getSiteUrl: () => "https://app.example" }));
vi.mock("@/features/auth/session", () => ({
  getAuthenticatedUser: mocks.current,
}));
vi.mock("@/features/mock-interviews/queries", () => ({
  getActiveMockInterview: mocks.active,
}));
vi.mock("@/features/auth/guest-claim", () => ({
  prepareGuestAccountClaim: mocks.prepare,
  finishGuestAccountClaim: mocks.finish,
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
import {
  requestPasswordRecoveryAction,
  resetPasswordAction,
} from "@/features/auth/recovery-actions";
import { GET } from "@/app/auth/callback/route";
import { NextRequest } from "next/server";
const initial = { status: "idle" as const };
const form = (values: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.current.mockResolvedValue(null);
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "member", is_anonymous: false } },
    error: null,
  });
  mocks.reset.mockResolvedValue({ error: null });
  mocks.update.mockResolvedValue({ error: null });
  mocks.prepare.mockResolvedValue(true);
  mocks.finish.mockResolvedValue({ interviewId: null, pending: false });
  mocks.exchange.mockResolvedValue({
    data: {
      redirectType: "recovery",
      user: { id: "member", is_anonymous: false },
    },
    error: null,
  });
});

describe("password recovery", () => {
  it("uses a canonical PKCE callback and the same neutral response for absent/throttled accounts", async () => {
    const data = form({ email: " A@Example.com " });
    const accepted = await requestPasswordRecoveryAction(initial, data);
    expect(mocks.reset).toHaveBeenCalledWith("a@example.com", {
      redirectTo: "https://app.example/auth/callback?next=/reset-password",
    });
    mocks.reset.mockResolvedValueOnce({
      error: { message: "unknown or throttled account" },
    });
    expect(await requestPasswordRecoveryAction(initial, data)).toEqual(
      accepted,
    );
  });
  it("rejects invalid email without sending", async () => {
    expect(
      (await requestPasswordRecoveryAction(initial, form({ email: "bad" })))
        .status,
    ).toBe("error");
    expect(mocks.reset).not.toHaveBeenCalled();
  });
  it("blocks recovery during an active guest interview", async () => {
    mocks.current.mockResolvedValue({ id: "guest", isAnonymous: true });
    mocks.active.mockResolvedValue({ id: "interview" });
    expect(
      (
        await requestPasswordRecoveryAction(
          initial,
          form({ email: "a@example.com" }),
        )
      ).status,
    ).toBe("error");
    expect(mocks.reset).not.toHaveBeenCalled();
  });
  it("preserves guest proof before requesting recovery", async () => {
    mocks.current.mockResolvedValue({ id: "guest", isAnonymous: true });
    await requestPasswordRecoveryAction(
      initial,
      form({ email: "a@example.com" }),
    );
    expect(mocks.prepare).toHaveBeenCalledOnce();
    expect(mocks.prepare.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.reset.mock.invocationCallOrder[0]!,
    );
  });
  it.each([
    { password: "weak", confirmation: "weak" },
    { password: "StrongPassword123", confirmation: "different" },
  ])("rejects invalid password input", async (values) => {
    expect((await resetPasswordAction(initial, form(values))).status).toBe(
      "error",
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it.each([null, { id: "guest", is_anonymous: true }])(
    "requires a server-verified registered user",
    async (user) => {
      mocks.getUser.mockResolvedValue({ data: { user }, error: null });
      expect(
        (
          await resetPasswordAction(
            initial,
            form({
              password: "StrongPassword123",
              confirmation: "StrongPassword123",
            }),
          )
        ).status,
      ).toBe("error");
      expect(mocks.update).not.toHaveBeenCalled();
    },
  );
  it("updates the password before continuing a pending claim", async () => {
    mocks.finish.mockResolvedValue({ pending: true, interviewId: null });
    await expect(
      resetPasswordAction(
        initial,
        form({
          password: "StrongPassword123",
          confirmation: "StrongPassword123",
        }),
      ),
    ).rejects.toThrow("redirect:/signup/transfer");
    expect(mocks.update.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.finish.mock.invocationCallOrder[0]!,
    );
  });
  it("handles update failure without consuming a claim", async () => {
    mocks.update.mockRejectedValue(new Error("network"));
    expect(
      (
        await resetPasswordAction(
          initial,
          form({
            password: "StrongPassword123",
            confirmation: "StrongPassword123",
          }),
        )
      ).status,
    ).toBe("error");
    expect(mocks.finish).not.toHaveBeenCalled();
  });
});

describe("recovery callback priority", () => {
  it("routes verified recovery to reset before guest transfer", async () => {
    const response = await GET(
      new NextRequest(
        "https://app.example/auth/callback?code=valid&next=/interviews",
      ),
    );
    expect(response.headers.get("location")).toBe(
      "https://app.example/reset-password",
    );
    expect(mocks.finish).not.toHaveBeenCalled();
  });
  it("does not trust a recovery URL without a successful exchange", async () => {
    mocks.exchange.mockResolvedValue({
      data: {},
      error: { message: "expired" },
    });
    const response = await GET(
      new NextRequest(
        "https://app.example/auth/callback?code=expired&next=/reset-password&type=recovery",
      ),
    );
    expect(response.headers.get("location")).toBe(
      "https://app.example/forgot-password?notice=invalid",
    );
    expect(mocks.finish).not.toHaveBeenCalled();
  });
  it("rejects an anonymous exchange claiming a recovery destination", async () => {
    mocks.exchange.mockResolvedValue({
      data: { redirectType: null, user: { is_anonymous: true } },
      error: null,
    });
    const response = await GET(
      new NextRequest(
        "https://app.example/auth/callback?code=ordinary&next=/reset-password",
      ),
    );
    expect(response.headers.get("location")).toContain(
      "/forgot-password?notice=invalid",
    );
  });
  it("does not switch guest identity during active work", async () => {
    mocks.current.mockResolvedValue({ id: "guest", isAnonymous: true });
    mocks.active.mockResolvedValue({ id: "interview" });
    const response = await GET(
      new NextRequest(
        "https://app.example/auth/callback?code=valid&next=/reset-password",
      ),
    );
    expect(response.headers.get("location")).toBe(
      "https://app.example/interviews",
    );
    expect(mocks.exchange).not.toHaveBeenCalled();
  });
});
