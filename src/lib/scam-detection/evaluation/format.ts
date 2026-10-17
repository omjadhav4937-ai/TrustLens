import { POSITIVE_THRESHOLD_SCORE } from "./run";
import type { EvaluationReport } from "./run";
import { CASE_BUCKETS, CHALLENGE_CATEGORIES, EXPECTED_LABELS } from "./types";

function metric(value: number | null): string {
  return value === null ? "undefined" : value.toFixed(3);
}

function percent(value: number | null): string {
  return value === null ? "undefined" : `${(value * 100).toFixed(1)}%`;
}

function listOrNone(ids: readonly string[]): string {
  return ids.length === 0 ? "  (none)" : ids.map((id) => `  ${id}`).join("\n");
}

/**
 * Renders an evaluation report as plain text.
 *
 * Case IDs only: message bodies are deliberately never printed, so running the
 * evaluation cannot spill the dataset into logs or a terminal transcript.
 */
export function formatReport(report: EvaluationReport): string {
  const { binary } = report;
  const bucketLine = CASE_BUCKETS.map(
    (bucket) => `${bucket} ${report.bucketCounts[bucket]}`,
  ).join(" | ");
  const labelLine = EXPECTED_LABELS.map(
    (label) => `${label} ${report.labelCounts[label]}`,
  ).join(" | ");

  return [
    "TrustLens detector evaluation",
    "=============================",
    "",
    `Cases: ${report.totalCases} synthetic evaluation examples.`,
    "These are hand-written examples, not a representative sample of real-world scams.",
    `Buckets: ${bucketLine}`,
    `Labels:  ${labelLine}`,
    `Risk bands: low ${report.riskBandCounts.low} | medium ${report.riskBandCounts.medium} | high ${report.riskBandCounts.high}`,
    "",
    "Prediction rule",
    "---------------",
    `Predicted positive: risk band medium or high (score >= ${POSITIVE_THRESHOLD_SCORE}).`,
    `Predicted negative: risk band low (score < ${POSITIVE_THRESHOLD_SCORE}).`,
    "Low means few configured warning signs matched; it does not mean the message is safe.",
    "",
    "Binary subset (labels scam and legitimate; ambiguous excluded)",
    "-------------------------------------------------------------",
    `Cases: ${binary.total}`,
    `Predicted positive: ${binary.predictedPositive}`,
    `Predicted negative: ${binary.predictedNegative}`,
    `True positives: ${binary.truePositives}`,
    `False positives: ${binary.falsePositives}`,
    `True negatives: ${binary.trueNegatives}`,
    `False negatives: ${binary.falseNegatives}`,
    `Precision: ${metric(binary.precision)} (${percent(binary.precision)})`,
    `Recall:    ${metric(binary.recall)} (${percent(binary.recall)})`,
    `F1:        ${metric(binary.f1)}`,
    "",
    "Confusion matrix",
    "                predicted positive  predicted negative",
    `expected scam   ${String(binary.truePositives).padStart(18)}  ${String(binary.falseNegatives).padStart(18)}`,
    `expected legit  ${String(binary.falsePositives).padStart(18)}  ${String(binary.trueNegatives).padStart(18)}`,
    "",
    "Results by bucket",
    "-----------------",
    "bucket      cases  low  medium  high  predicted positive",
    ...CASE_BUCKETS.map((bucket) => {
      const summary = report.perBucket[bucket];
      return [
        bucket.padEnd(11),
        String(summary.total).padStart(5),
        String(summary.riskBandCounts.low).padStart(4),
        String(summary.riskBandCounts.medium).padStart(7),
        String(summary.riskBandCounts.high).padStart(5),
        String(summary.predictedPositive).padStart(19),
      ].join("  ");
    }),
    "",
    `False positives (legitimate scored medium/high): ${report.misclassified.falsePositiveIds.length}`,
    listOrNone(report.misclassified.falsePositiveIds),
    "",
    `False negatives (scam scored low): ${report.misclassified.falseNegativeIds.length}`,
    listOrNone(report.misclassified.falseNegativeIds),
    "",
    `Ambiguous cases: ${report.ambiguous.total} (reported separately, never counted as errors)`,
    `  scored medium/high: ${report.ambiguous.predictedPositive}`,
    `  scored low: ${report.ambiguous.predictedNegative}`,
    "  IDs:",
    listOrNone(report.ambiguous.ids),
    "  Flagged for review:",
    listOrNone(report.ambiguous.flaggedIds),
    "",
    `Manual review (binary errors plus flagged ambiguous): ${report.manualReviewIds.length}`,
    listOrNone(report.manualReviewIds),
    "",
    "Challenge categories",
    "--------------------",
    ...CHALLENGE_CATEGORIES.filter(
      (category) => report.challengeCounts[category] > 0,
    ).map(
      (category) =>
        `${category.padEnd(30)} ${String(report.challengeCounts[category]).padStart(3)}`,
    ),
    "",
    "No message text is printed by this report.",
  ].join("\n");
}
