import { analyzeMessage, RISK_THRESHOLD_MEDIUM } from "../engine";
import type { RiskLevel } from "../types";
import { EVALUATION_CASES } from "./dataset";
import { CHALLENGE_CATEGORIES } from "./types";
import type {
  CaseBucket,
  ChallengeCategory,
  EvaluationCase,
  ExpectedLabel,
} from "./types";

/**
 * Runs the shipped detector over the evaluation dataset.
 *
 * This module is a test utility: it never changes a rule, a weight or a
 * threshold, and it never sends anything over the network. The only engine call
 * it makes is `analyzeMessage()`.
 *
 * ## Prediction threshold
 *
 * A case is a **predicted positive** when its risk band is `medium` or `high`,
 * i.e. when its score is at or above `RISK_THRESHOLD_MEDIUM` (30). This matches
 * how the product itself presents risk: Medium already carries "treat with
 * caution and verify" advice, so ignoring it would hide exactly the borderline
 * results this evaluation is meant to surface. Treating only High as positive
 * would report a much better precision at the cost of missing most detections.
 */

/** Risk bands counted as a positive prediction. Documented above. */
export const POSITIVE_RISK_LEVELS: readonly RiskLevel[] = ["medium", "high"];

/** True when a risk band is treated as a positive prediction. */
export function isPredictedPositive(riskLevel: RiskLevel): boolean {
  return POSITIVE_RISK_LEVELS.includes(riskLevel);
}

/** One dataset case, analysed once with the shipped engine. */
export interface CaseOutcome {
  id: string;
  bucket: CaseBucket;
  label: ExpectedLabel;
  challenge: ChallengeCategory;
  score: number;
  riskLevel: RiskLevel;
  predictedPositive: boolean;
  matchedRuleIds: string[];
}

/** Precision, recall and F1, with `null` where the denominator is zero. */
export interface BinaryMetrics {
  total: number;
  predictedPositive: number;
  predictedNegative: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  precision: number | null;
  recall: number | null;
  f1: number | null;
}

/** Summary for one of the four dataset buckets. */
export interface BucketSummary {
  total: number;
  labelCounts: Record<ExpectedLabel, number>;
  riskBandCounts: Record<RiskLevel, number>;
  predictedPositive: number;
  predictedNegative: number;
}

/** The complete, deterministic evaluation result. */
export interface EvaluationReport {
  totalCases: number;
  labelCounts: Record<ExpectedLabel, number>;
  bucketCounts: Record<CaseBucket, number>;
  challengeCounts: Record<ChallengeCategory, number>;
  riskBandCounts: Record<RiskLevel, number>;
  predictedPositive: number;
  predictedNegative: number;
  /** Calculated only over cases labelled `scam` or `legitimate`. */
  binary: BinaryMetrics;
  /** Rows are expected labels, columns are predictions. */
  confusion: {
    expectedPositive: { predictedPositive: number; predictedNegative: number };
    expectedNegative: { predictedPositive: number; predictedNegative: number };
  };
  ambiguous: {
    total: number;
    predictedPositive: number;
    predictedNegative: number;
    /** Every ambiguous case, in dataset order. */
    ids: string[];
    /** Ambiguous cases the detector scored Medium or High. */
    flaggedIds: string[];
  };
  perBucket: Record<CaseBucket, BucketSummary>;
  misclassified: {
    /** Legitimate cases scored Medium or High. */
    falsePositiveIds: string[];
    /** Scam cases scored Low. */
    falseNegativeIds: string[];
  };
  /** Binary errors plus ambiguous cases the detector flagged, sorted by ID. */
  manualReviewIds: string[];
  /** Per-case results, in dataset order. */
  outcomes: CaseOutcome[];
}

const EMPTY_LABEL_COUNTS = (): Record<ExpectedLabel, number> => ({
  scam: 0,
  legitimate: 0,
  ambiguous: 0,
});

const EMPTY_RISK_COUNTS = (): Record<RiskLevel, number> => ({
  low: 0,
  medium: 0,
  high: 0,
});

function divide(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

/**
 * Analyses every case and computes counts and metrics.
 *
 * Deterministic: `analyzedAt` from the engine is deliberately not copied into
 * the report, and every list is either in dataset order or sorted by ID.
 */
export function evaluateDataset(
  cases: readonly EvaluationCase[] = EVALUATION_CASES,
): EvaluationReport {
  const outcomes: CaseOutcome[] = cases.map((entry) => {
    const analysis = analyzeMessage(entry.message);
    return {
      id: entry.id,
      bucket: entry.bucket,
      label: entry.label,
      challenge: entry.challenge,
      score: analysis.score,
      riskLevel: analysis.riskLevel,
      predictedPositive: isPredictedPositive(analysis.riskLevel),
      matchedRuleIds: [...analysis.matchedRuleIds],
    };
  });

  const labelCounts = EMPTY_LABEL_COUNTS();
  const bucketCounts: Record<CaseBucket, number> = {
    scam: 0,
    legitimate: 0,
    ambiguous: 0,
    "edge-case": 0,
  };
  const challengeCounts = Object.fromEntries(
    CHALLENGE_CATEGORIES.map((category) => [category, 0]),
  ) as Record<ChallengeCategory, number>;
  const riskBandCounts = EMPTY_RISK_COUNTS();

  const perBucket: Record<CaseBucket, BucketSummary> = {
    scam: {
      total: 0,
      labelCounts: EMPTY_LABEL_COUNTS(),
      riskBandCounts: EMPTY_RISK_COUNTS(),
      predictedPositive: 0,
      predictedNegative: 0,
    },
    legitimate: {
      total: 0,
      labelCounts: EMPTY_LABEL_COUNTS(),
      riskBandCounts: EMPTY_RISK_COUNTS(),
      predictedPositive: 0,
      predictedNegative: 0,
    },
    ambiguous: {
      total: 0,
      labelCounts: EMPTY_LABEL_COUNTS(),
      riskBandCounts: EMPTY_RISK_COUNTS(),
      predictedPositive: 0,
      predictedNegative: 0,
    },
    "edge-case": {
      total: 0,
      labelCounts: EMPTY_LABEL_COUNTS(),
      riskBandCounts: EMPTY_RISK_COUNTS(),
      predictedPositive: 0,
      predictedNegative: 0,
    },
  };

  let truePositives = 0;
  let falsePositives = 0;
  let trueNegatives = 0;
  let falseNegatives = 0;
  const falsePositiveIds: string[] = [];
  const falseNegativeIds: string[] = [];
  const ambiguousIds: string[] = [];
  const ambiguousFlaggedIds: string[] = [];

  for (const outcome of outcomes) {
    labelCounts[outcome.label] += 1;
    bucketCounts[outcome.bucket] += 1;
    challengeCounts[outcome.challenge] += 1;
    riskBandCounts[outcome.riskLevel] += 1;

    const bucket = perBucket[outcome.bucket];
    bucket.total += 1;
    bucket.labelCounts[outcome.label] += 1;
    bucket.riskBandCounts[outcome.riskLevel] += 1;
    if (outcome.predictedPositive) bucket.predictedPositive += 1;
    else bucket.predictedNegative += 1;

    // Ambiguous cases are reported separately and never enter the binary
    // metrics: the dataset does not know whether they are scams.
    if (outcome.label === "ambiguous") {
      ambiguousIds.push(outcome.id);
      if (outcome.predictedPositive) ambiguousFlaggedIds.push(outcome.id);
      continue;
    }

    if (outcome.label === "scam") {
      if (outcome.predictedPositive) truePositives += 1;
      else {
        falseNegatives += 1;
        falseNegativeIds.push(outcome.id);
      }
    } else if (outcome.predictedPositive) {
      falsePositives += 1;
      falsePositiveIds.push(outcome.id);
    } else {
      trueNegatives += 1;
    }
  }

  const binaryTotal = truePositives + falsePositives + trueNegatives + falseNegatives;
  const binaryPredictedPositive = truePositives + falsePositives;
  const precision = divide(truePositives, binaryPredictedPositive);
  const recall = divide(truePositives, truePositives + falseNegatives);
  const f1 =
    precision === null || recall === null || precision + recall === 0
      ? null
      : (2 * precision * recall) / (precision + recall);

  return {
    totalCases: outcomes.length,
    labelCounts,
    bucketCounts,
    challengeCounts,
    riskBandCounts,
    predictedPositive: outcomes.filter((outcome) => outcome.predictedPositive).length,
    predictedNegative: outcomes.filter((outcome) => !outcome.predictedPositive).length,
    binary: {
      total: binaryTotal,
      predictedPositive: binaryPredictedPositive,
      predictedNegative: trueNegatives + falseNegatives,
      truePositives,
      falsePositives,
      trueNegatives,
      falseNegatives,
      precision,
      recall,
      f1,
    },
    confusion: {
      expectedPositive: {
        predictedPositive: truePositives,
        predictedNegative: falseNegatives,
      },
      expectedNegative: {
        predictedPositive: falsePositives,
        predictedNegative: trueNegatives,
      },
    },
    ambiguous: {
      total: ambiguousIds.length,
      predictedPositive: ambiguousFlaggedIds.length,
      predictedNegative: ambiguousIds.length - ambiguousFlaggedIds.length,
      ids: [...ambiguousIds],
      flaggedIds: [...ambiguousFlaggedIds],
    },
    perBucket,
    misclassified: {
      falsePositiveIds: sortedUnique(falsePositiveIds),
      falseNegativeIds: sortedUnique(falseNegativeIds),
    },
    manualReviewIds: sortedUnique([
      ...falsePositiveIds,
      ...falseNegativeIds,
      ...ambiguousFlaggedIds,
    ]),
    outcomes,
  };
}

/** Exposed so the report and tests agree on the threshold they describe. */
export const POSITIVE_THRESHOLD_SCORE = RISK_THRESHOLD_MEDIUM;
