import { describe, expect, it } from "vitest";

import { getSiteUrl } from "@/lib/site-url";

describe("getSiteUrl", () => {
  it("prefers the configured canonical application URL", () => {
    expect(
      getSiteUrl({
        NEXT_PUBLIC_APP_URL: "https://academy.example/",
        VERCEL_URL: "preview.vercel.app",
      }),
    ).toBe("https://academy.example");
  });

  it("uses the Vercel deployment URL for previews", () => {
    expect(getSiteUrl({ VERCEL_URL: "preview.vercel.app" })).toBe(
      "https://preview.vercel.app",
    );
  });

  it("falls back to local development", () => {
    expect(getSiteUrl({})).toBe("http://localhost:3000");
  });
});
