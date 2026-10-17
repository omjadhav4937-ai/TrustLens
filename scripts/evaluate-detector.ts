/**
 * Runs the TrustLens evaluation dataset through the shipped detector.
 *
 * Usage: `bun run evaluate`
 *
 * Local only: the dataset contains synthetic messages and reserved example
 * domains, the engine performs no I/O, and this script prints case IDs rather
 * than message text.
 */
import { EVALUATION_CASES } from "../src/lib/scam-detection/evaluation/dataset";
import { formatReport } from "../src/lib/scam-detection/evaluation/format";
import { evaluateDataset } from "../src/lib/scam-detection/evaluation/run";

console.log(formatReport(evaluateDataset(EVALUATION_CASES)));
