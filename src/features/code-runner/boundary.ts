import {
  trustedCodeRunRequestSchema,
  trustedCodeRunResultSchema,
  type TrustedCodeRunRequest,
  type TrustedCodeRunResult,
} from "@/features/code-runner/model";
import type {
  PrivateTestBundleReference,
  TrustedCodeRunnerProvider,
} from "@/features/code-runner/provider";

export async function executeTrustedCodeRunnerBoundary(
  requestValue: TrustedCodeRunRequest,
  privateTests: PrivateTestBundleReference | null,
  provider: TrustedCodeRunnerProvider | null,
): Promise<TrustedCodeRunResult | null> {
  if (!privateTests || !provider) return null;
  const request = trustedCodeRunRequestSchema.parse(requestValue);
  if (
    privateTests.questionId !== request.questionId ||
    privateTests.contentVersion !== request.questionContentVersion
  ) {
    throw new Error("trusted_test_bundle_mismatch");
  }
  return trustedCodeRunResultSchema.parse(
    await provider.run(request, privateTests),
  );
}
