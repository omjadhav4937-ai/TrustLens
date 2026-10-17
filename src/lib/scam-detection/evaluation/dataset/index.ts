import type { EvaluationCase } from "../types";
import { AMBIGUOUS_CASES } from "./ambiguous";
import { EDGE_CASE_CASES } from "./edge-cases";
import { LEGITIMATE_CASES } from "./legitimate";
import { SCAM_CASES } from "./scam";

/**
 * The complete evaluation dataset, in a fixed order.
 *
 * Every message is synthetic. Hosts use reserved example domains (`.invalid`,
 * `.example`) or documentation IP ranges (192.0.2.0/24, 198.51.100.0/24,
 * 203.0.113.0/24), so no entry points at a live service. The messages are
 * evaluation examples, not a representative sample of real-world scams.
 */
export const EVALUATION_CASES: EvaluationCase[] = [
  ...SCAM_CASES,
  ...LEGITIMATE_CASES,
  ...AMBIGUOUS_CASES,
  ...EDGE_CASE_CASES,
];

export { AMBIGUOUS_CASES, EDGE_CASE_CASES, LEGITIMATE_CASES, SCAM_CASES };
