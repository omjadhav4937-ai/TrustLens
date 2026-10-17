/**
 * Runs the 50-case holdout through the shipped detector.
 *
 * Usage: `bun run evaluate:holdout`
 *
 * The holdout is imported directly, not merged into the original dataset, so
 * `bun run evaluate` keeps reporting the original 100 cases only. This output
 * shows aggregate counts and case IDs, never message bodies or rationales.
 */
import { HOLDOUT_CASES } from "../src/lib/scam-detection/evaluation/holdout";
import { formatReport } from "../src/lib/scam-detection/evaluation/format";
import { evaluateDataset } from "../src/lib/scam-detection/evaluation/run";

console.log(
  formatReport(evaluateDataset(HOLDOUT_CASES), {
    title: "TrustLens holdout evaluation",
    dataset: "TL-H independently authored holdout (50 cases)",
  }),
);
