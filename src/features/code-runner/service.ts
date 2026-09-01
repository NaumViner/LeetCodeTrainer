import "server-only";

import { executeTrustedCodeRunnerBoundary } from "@/features/code-runner/boundary";
import type {
  TrustedCodeRunRequest,
  TrustedCodeRunResult,
} from "@/features/code-runner/model";
import type {
  PrivateTestBundleReference,
  TrustedCodeRunnerProvider,
} from "@/features/code-runner/provider";

export async function runTrustedCodeEvidence(
  requestValue: TrustedCodeRunRequest,
  privateTests: PrivateTestBundleReference | null,
  provider: TrustedCodeRunnerProvider | null,
): Promise<TrustedCodeRunResult | null> {
  return executeTrustedCodeRunnerBoundary(requestValue, privateTests, provider);
}
