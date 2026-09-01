import type {
  TrustedCodeRunRequest,
  TrustedCodeRunResult,
} from "@/features/code-runner/model";

export type PrivateTestBundleReference = {
  contentVersion: number;
  opaqueBundleId: string;
  questionId: string;
};

export interface TrustedCodeRunnerProvider {
  readonly name: string;
  run(
    request: TrustedCodeRunRequest,
    privateTests: PrivateTestBundleReference,
  ): Promise<TrustedCodeRunResult>;
}
