import type { EvaluationCase } from "../types";
import { STRESS_AMBIGUOUS_CASES } from "./ambiguous";
import { STRESS_LEGITIMATE_CASES } from "./legitimate";
import { STRESS_SCAM_CASES } from "./scam";

/**
 * 60-case Candidate A stress dataset, separate from the original and holdout.
 *
 * Reuses the case schema and evaluation runner. Never appended to either
 * existing dataset. The bucket mirrors the label; there is no edge-case bucket.
 */
export const STRESS_CASES: EvaluationCase[] = [
  ...STRESS_SCAM_CASES,
  ...STRESS_LEGITIMATE_CASES,
  ...STRESS_AMBIGUOUS_CASES,
];

export {
  STRESS_AMBIGUOUS_CASES,
  STRESS_LEGITIMATE_CASES,
  STRESS_SCAM_CASES,
};
