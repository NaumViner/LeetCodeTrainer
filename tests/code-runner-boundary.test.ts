import { describe, expect, it, vi } from "vitest";

import { executeTrustedCodeRunnerBoundary } from "@/features/code-runner/boundary";

const request = {
  language: "typescript" as const,
  questionContentVersion: 1,
  questionId: "two-sum-owned",
  source: "export function solve() { return []; }",
};

describe("trusted code-runner boundary", () => {
  it("treats an unavailable sandbox as missing evidence", async () => {
    expect(
      await executeTrustedCodeRunnerBoundary(request, null, null),
    ).toBeNull();
  });

  it("never sends a mismatched private bundle to a runner", async () => {
    const run = vi.fn();
    await expect(
      executeTrustedCodeRunnerBoundary(
        request,
        {
          contentVersion: 2,
          opaqueBundleId: "private-bundle",
          questionId: request.questionId,
        },
        { name: "isolated-runner", run },
      ),
    ).rejects.toThrow("trusted_test_bundle_mismatch");
    expect(run).not.toHaveBeenCalled();
  });

  it("rejects unbounded or malformed runner output", async () => {
    await expect(
      executeTrustedCodeRunnerBoundary(
        request,
        {
          contentVersion: 1,
          opaqueBundleId: "private-bundle",
          questionId: request.questionId,
        },
        {
          name: "isolated-runner",
          run: async () => ({
            compileStatus: "passed",
            failures: [],
            passedTests: 3,
            runner: "isolated-runner",
            totalTests: 2,
          }),
        },
      ),
    ).rejects.toThrow();
  });
});
