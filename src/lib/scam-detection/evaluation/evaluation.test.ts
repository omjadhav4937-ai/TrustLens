import { describe, expect, it } from "bun:test";
import { RISK_THRESHOLD_MEDIUM } from "../engine";
import { EVALUATION_CASES } from "./dataset";
import { formatReport } from "./format";
import {
  POSITIVE_THRESHOLD_SCORE,
  evaluateDataset,
  isPredictedPositive,
} from "./run";
import {
  CASE_BUCKETS,
  CHALLENGE_CATEGORIES,
  EXPECTED_LABELS,
  type CaseBucket,
} from "./types";

/**
 * Dataset integrity and runner reproducibility.
 *
 * These checks never weaken the detector's own suites: they read the shipped
 * engine's output and assert that the evaluation artefact stays well formed and
 * stable. The golden numbers below are a snapshot; when a rule or dataset case
 * changes deliberately, update them and say why in the report.
 */

const ID_PREFIX: Record<CaseBucket, string> = {
  scam: "TL-S",
  legitimate: "TL-L",
  ambiguous: "TL-A",
  "edge-case": "TL-E",
};

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;

/** Documentation ranges, reserved for examples and never routable. */
function isDocumentationIp(host: string): boolean {
  return (
    /^192\.0\.2\.\d{1,3}$/.test(host) ||
    /^198\.51\.100\.\d{1,3}$/.test(host) ||
    /^203\.0\.113\.\d{1,3}$/.test(host)
  );
}

function isReservedHost(host: string): boolean {
  return (
    host.endsWith(".invalid") ||
    host.endsWith(".example") ||
    host === "example.com" ||
    host.endsWith(".example.com") ||
    isDocumentationIp(host)
  );
}

function hostsIn(message: string): string[] {
  return (message.match(URL_PATTERN) ?? []).map((raw) => {
    const cleaned = raw.replace(/[.,;:!?)}\]'"]+$/, "");
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(cleaned)
      ? cleaned
      : `http://${cleaned}`;
    return new URL(withScheme).hostname.toLowerCase();
  });
}

describe("dataset integrity", () => {
  it("contains at least 100 cases, exactly 25 per bucket", () => {
    expect(EVALUATION_CASES.length).toBeGreaterThanOrEqual(100);
    expect(EVALUATION_CASES).toHaveLength(100);

    for (const bucket of CASE_BUCKETS) {
      expect(
        EVALUATION_CASES.filter((entry) => entry.bucket === bucket),
      ).toHaveLength(25);
    }
  });

  it("uses unique, stable IDs whose prefix matches the bucket", () => {
    const ids = EVALUATION_CASES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const entry of EVALUATION_CASES) {
      expect(entry.id).toMatch(
        new RegExp(`^${ID_PREFIX[entry.bucket]}-\\d{3}$`),
      );
    }
    expect(EVALUATION_CASES[0].id).toBe("TL-S-001");
    expect(EVALUATION_CASES[EVALUATION_CASES.length - 1].id).toBe("TL-E-025");
  });

  it("uses only valid labels and challenge categories", () => {
    for (const entry of EVALUATION_CASES) {
      expect(EXPECTED_LABELS).toContain(entry.label);
      expect(CHALLENGE_CATEGORIES).toContain(entry.challenge);
    }
  });

  it("has non-empty message text and a rationale for every case", () => {
    for (const entry of EVALUATION_CASES) {
      expect(entry.message.trim().length).toBeGreaterThan(0);
      expect(entry.rationale.trim().length).toBeGreaterThan(0);
    }
  });

  it("documents why edge cases are hard and what ambiguous cases lack", () => {
    for (const entry of EVALUATION_CASES) {
      if (entry.bucket === "edge-case") {
        expect(entry.difficulty?.trim().length ?? 0).toBeGreaterThan(0);
      }
      if (entry.label === "ambiguous") {
        expect(entry.notes?.trim().length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it("keeps label and bucket counts internally consistent", () => {
    const labelTotal = EXPECTED_LABELS.reduce(
      (total, label) =>
        total + EVALUATION_CASES.filter((entry) => entry.label === label).length,
      0,
    );
    const bucketTotal = CASE_BUCKETS.reduce(
      (total, bucket) =>
        total + EVALUATION_CASES.filter((entry) => entry.bucket === bucket).length,
      0,
    );

    expect(labelTotal).toBe(EVALUATION_CASES.length);
    expect(bucketTotal).toBe(EVALUATION_CASES.length);
    expect(EVALUATION_CASES.filter((entry) => entry.label === "scam")).toHaveLength(38);
    expect(
      EVALUATION_CASES.filter((entry) => entry.label === "legitimate"),
    ).toHaveLength(36);
    expect(
      EVALUATION_CASES.filter((entry) => entry.label === "ambiguous"),
    ).toHaveLength(26);
  });

  it("uses only reserved example hosts and documentation addresses", () => {
    for (const entry of EVALUATION_CASES) {
      for (const host of hostsIn(entry.message)) {
        expect(isReservedHost(host)).toBe(true);
        expect(host).not.toMatch(/^(bit\.ly|tinyurl\.com|t\.co|goo\.gl)$/);
      }
    }
  });
});

describe("evaluation runner", () => {
  const report = evaluateDataset(EVALUATION_CASES);

  it("is deterministic and stable across runs", () => {
    const second = evaluateDataset(EVALUATION_CASES);
    expect(second).toEqual(report);
    expect(formatReport(second)).toBe(formatReport(report));
  });

  it("treats Medium and High as positive at the documented threshold", () => {
    expect(POSITIVE_THRESHOLD_SCORE).toBe(RISK_THRESHOLD_MEDIUM);
    expect(POSITIVE_THRESHOLD_SCORE).toBe(30);

    for (const outcome of report.outcomes) {
      expect(outcome.predictedPositive).toBe(outcome.riskLevel !== "low");
      expect(outcome.predictedPositive).toBe(isPredictedPositive(outcome.riskLevel));
      expect(outcome.predictedPositive).toBe(outcome.score >= 30);
    }
  });

  it("counts every case once and keeps the totals consistent", () => {
    expect(report.outcomes).toHaveLength(EVALUATION_CASES.length);
    expect(report.totalCases).toBe(EVALUATION_CASES.length);

    expect(
      report.predictedPositive + report.predictedNegative,
    ).toBe(report.totalCases);
    expect(
      report.riskBandCounts.low +
        report.riskBandCounts.medium +
        report.riskBandCounts.high,
    ).toBe(report.totalCases);

    const bucketTotal = CASE_BUCKETS.reduce(
      (total, bucket) => total + report.perBucket[bucket].total,
      0,
    );
    expect(bucketTotal).toBe(report.totalCases);

    expect(report.labelCounts).toEqual({
      scam: 38,
      legitimate: 36,
      ambiguous: 26,
    });
    expect(report.riskBandCounts).toEqual({ low: 67, medium: 21, high: 12 });
    expect(report.predictedPositive).toBe(33);
    expect(report.ambiguous).toMatchObject({
      total: 26,
      predictedPositive: 5,
      predictedNegative: 21,
    });
  });

  it("excludes ambiguous cases from the binary metrics", () => {
    expect(report.binary.total).toBe(
      report.labelCounts.scam + report.labelCounts.legitimate,
    );
    expect(report.binary.total).toBe(74);
    expect(report.ambiguous.total).toBe(report.labelCounts.ambiguous);

    const binaryOutcomes = report.outcomes.filter(
      (outcome) => outcome.label !== "ambiguous",
    );
    expect(binaryOutcomes).toHaveLength(report.binary.total);
    expect(
      binaryOutcomes.reduce(
        (total, outcome) => total + (outcome.predictedPositive ? 1 : 0),
        0,
      ),
    ).toBe(report.binary.predictedPositive);
  });

  it("reports the measured confusion matrix and metrics", () => {
    expect(report.confusion).toEqual({
      expectedPositive: { predictedPositive: 25, predictedNegative: 13 },
      expectedNegative: { predictedPositive: 3, predictedNegative: 33 },
    });
    expect(report.binary).toMatchObject({
      predictedPositive: 28,
      predictedNegative: 46,
      truePositives: 25,
      falsePositives: 3,
      trueNegatives: 33,
      falseNegatives: 13,
    });

    // Recompute from the counts rather than trusting the stored numbers.
    const precision = 25 / 28;
    const recall = 25 / 38;
    expect(report.binary.precision).toBeCloseTo(precision, 10);
    expect(report.binary.recall).toBeCloseTo(recall, 10);
    expect(report.binary.f1).toBeCloseTo((2 * precision * recall) / (precision + recall), 10);
    expect(formatReport(report)).toContain("Precision: 0.893");
    expect(formatReport(report)).toContain("Recall:    0.658");
    expect(formatReport(report)).toContain("F1:        0.758");
  });

  it("lists the exact misclassified cases, sorted and unique", () => {
    expect(report.misclassified.falsePositiveIds).toEqual([
      "TL-E-006",
      "TL-E-008",
      "TL-E-023",
    ]);
    expect(report.misclassified.falseNegativeIds).toEqual([
      "TL-E-001",
      "TL-E-002",
      "TL-E-005",
      "TL-E-013",
      "TL-E-015",
      "TL-E-019",
      "TL-E-020",
      "TL-E-024",
      "TL-S-003",
      "TL-S-008",
      "TL-S-020",
      "TL-S-022",
      "TL-S-023",
    ]);

    for (const ids of [
      report.misclassified.falsePositiveIds,
      report.misclassified.falseNegativeIds,
      report.manualReviewIds,
    ]) {
      expect(new Set(ids).size).toBe(ids.length);
      expect([...ids].sort()).toEqual([...ids]);
    }
  });

  it("reports per-bucket results that add up to the overall counts", () => {
    expect(report.perBucket.scam).toMatchObject({
      total: 25,
      predictedPositive: 20,
      riskBandCounts: { low: 5, medium: 11, high: 9 },
    });
    expect(report.perBucket.legitimate).toMatchObject({
      total: 25,
      predictedPositive: 0,
      riskBandCounts: { low: 25, medium: 0, high: 0 },
    });
    expect(report.perBucket.ambiguous).toMatchObject({
      total: 25,
      predictedPositive: 5,
      riskBandCounts: { low: 20, medium: 4, high: 1 },
    });
    expect(report.perBucket["edge-case"]).toMatchObject({
      total: 25,
      predictedPositive: 8,
      riskBandCounts: { low: 17, medium: 6, high: 2 },
    });

    const low = CASE_BUCKETS.reduce(
      (total, bucket) => total + report.perBucket[bucket].riskBandCounts.low,
      0,
    );
    const medium = CASE_BUCKETS.reduce(
      (total, bucket) => total + report.perBucket[bucket].riskBandCounts.medium,
      0,
    );
    const high = CASE_BUCKETS.reduce(
      (total, bucket) => total + report.perBucket[bucket].riskBandCounts.high,
      0,
    );
    expect({ low, medium, high }).toEqual(report.riskBandCounts);
  });

  it("reports undefined metrics when a denominator is zero", () => {
    const onlyLegitimate = EVALUATION_CASES.filter(
      (entry) => entry.id === "TL-L-001",
    );
    const tiny = evaluateDataset(onlyLegitimate);

    expect(tiny.binary.truePositives).toBe(0);
    expect(tiny.binary.falsePositives).toBe(0);
    expect(tiny.binary.falseNegatives).toBe(0);
    expect(tiny.binary.recall).toBeNull();
    expect(tiny.binary.precision).toBeNull();
    expect(tiny.binary.f1).toBeNull();
    expect(formatReport(tiny)).toContain("Precision: undefined");
    expect(formatReport(tiny)).toContain("Recall:    undefined");
  });

  it("runs with fetch disabled and never prints message text", () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (() => {
      throw new Error("network access attempted during evaluation");
    }) as unknown as typeof fetch;

    let escaped: string;
    try {
      escaped = formatReport(evaluateDataset(EVALUATION_CASES));
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(escaped).not.toMatch(/https?:\/\//);
    for (const entry of EVALUATION_CASES) {
      if (entry.message.length > 30) {
        expect(escaped).not.toContain(entry.message);
      }
    }
  });
});
