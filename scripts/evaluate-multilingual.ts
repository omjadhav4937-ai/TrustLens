/**
 * Runs the 60-case multilingual evaluation set through the shipped detector.
 *
 * Usage: `bun run evaluate:multilingual`
 *
 * Local only: every message is synthetic and every host is reserved. The report
 * prints case IDs and aggregate counts, never message bodies.
 */
import {
  evaluateMultilingual,
  formatMultilingualReport,
} from "../src/lib/scam-detection/evaluation/multilingual/run";

console.log(formatMultilingualReport(evaluateMultilingual()));
