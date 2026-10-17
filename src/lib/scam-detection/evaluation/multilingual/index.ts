import { MULTILINGUAL_AMBIGUOUS_CASES } from "./ambiguous";
import { MULTILINGUAL_LEGITIMATE_CASES } from "./legitimate";
import { MULTILINGUAL_SCAM_CASES } from "./scam";
import type { MultilingualCase } from "./types";

/**
 * The 60-case multilingual evaluation set, kept separate from every other
 * dataset.
 *
 * It is scored by the shared runner but is never appended to `EVALUATION_CASES`
 * or the holdout, so no historical metric changes because of it. All messages
 * are synthetic and every host is reserved.
 */
export const MULTILINGUAL_CASES: MultilingualCase[] = [
  ...MULTILINGUAL_SCAM_CASES,
  ...MULTILINGUAL_LEGITIMATE_CASES,
  ...MULTILINGUAL_AMBIGUOUS_CASES,
];

export {
  MULTILINGUAL_AMBIGUOUS_CASES,
  MULTILINGUAL_LEGITIMATE_CASES,
  MULTILINGUAL_SCAM_CASES,
};
export type { MultilingualCase, MultilingualLanguage } from "./types";
