import type { EvaluationCase } from "../types";
import { HOLDOUT_AMBIGUOUS_CASES } from "./ambiguous";
import { HOLDOUT_LEGITIMATE_CASES } from "./legitimate";
import { HOLDOUT_SCAM_CASES } from "./scam";

/**
 * The 50-case holdout, kept separate from the original 100-case dataset.
 *
 * It reuses the case schema and the shared runner, but is never appended to
 * `EVALUATION_CASES` and never feeds back into the original metrics. Every
 * message is synthetic and every host is reserved.
 *
 * The bucket mirrors the label because the holdout has no separate edge-case
 * collection; hard cases carry a `difficulty` note instead.
 */
export const HOLDOUT_CASES: EvaluationCase[] = [
  ...HOLDOUT_SCAM_CASES,
  ...HOLDOUT_LEGITIMATE_CASES,
  ...HOLDOUT_AMBIGUOUS_CASES,
];

export {
  HOLDOUT_AMBIGUOUS_CASES,
  HOLDOUT_LEGITIMATE_CASES,
  HOLDOUT_SCAM_CASES,
};
