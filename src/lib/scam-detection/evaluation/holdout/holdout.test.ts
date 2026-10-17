import { describe, expect, it } from "bun:test";
import { EVALUATION_CASES } from "../dataset";
import { formatReport } from "../format";
import { evaluateDataset } from "../run";
import { CASE_BUCKETS, CHALLENGE_CATEGORIES, EXPECTED_LABELS } from "../types";
import { HOLDOUT_CASES } from ".";

/**
 * Holdout integrity and separation checks.
 *
 * The holdout is a new, independently authored dataset. It is scored by the
 * shared runner but must never enter the original 100-case dataset, and the
 * original metrics must not move. Golden numbers are a snapshot of this
 * holdout; they are not a target to tune rules against.
 */

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;

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

const holdoutReport = evaluateDataset(HOLDOUT_CASES);
const holdoutOutput = formatReport(holdoutReport, {
  title: "TrustLens holdout evaluation",
  dataset: "TL-H independently authored holdout (50 cases)",
});

describe("holdout dataset integrity", () => {
  it("contains exactly 50 cases with the target label distribution", () => {
    expect(HOLDOUT_CASES).toHaveLength(50);
    expect(holdoutReport.labelCounts).toEqual({
      scam: 20,
      legitimate: 20,
      ambiguous: 10,
    });
    expect(
      HOLDOUT_CASES.filter((entry) => entry.label === "scam"),
    ).toHaveLength(20);
    expect(
      HOLDOUT_CASES.filter((entry) => entry.label === "legitimate"),
    ).toHaveLength(20);
    expect(
      HOLDOUT_CASES.filter((entry) => entry.label === "ambiguous"),
    ).toHaveLength(10);
  });

  it("uses unique TL-H IDs and mirrors the label in the bucket", () => {
    const ids = HOLDOUT_CASES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe("TL-H-001");
    expect(ids[ids.length - 1]).toBe("TL-H-050");

    for (const entry of HOLDOUT_CASES) {
      expect(entry.id).toMatch(/^TL-H-\d{3}$/);
      expect(entry.bucket).toBe(entry.label);
    }
    expect(HOLDOUT_CASES.filter((entry) => entry.bucket === "edge-case")).toHaveLength(
      0,
    );
  });

  it("uses valid labels and challenge categories", () => {
    for (const entry of HOLDOUT_CASES) {
      expect(EXPECTED_LABELS).toContain(entry.label);
      expect(CHALLENGE_CATEGORIES).toContain(entry.challenge);
      expect(CASE_BUCKETS).toContain(entry.bucket);
    }
  });

  it("has non-empty messages and rationales, plus notes where required", () => {
    let difficultyNotes = 0;

    for (const entry of HOLDOUT_CASES) {
      expect(entry.message.trim().length).toBeGreaterThan(0);
      expect(entry.rationale.trim().length).toBeGreaterThan(0);

      if (entry.label === "ambiguous") {
        expect(entry.notes?.trim().length ?? 0).toBeGreaterThan(0);
      }
      if (entry.difficulty) difficultyNotes += 1;
    }

    expect(difficultyNotes).toBeGreaterThanOrEqual(5);
  });

  it("keeps every URL on a reserved host", () => {
    for (const entry of HOLDOUT_CASES) {
      for (const host of hostsIn(entry.message)) {
        expect(isReservedHost(host)).toBe(true);
      }
    }
  });

  it("is fully separate from the original 100-case dataset", () => {
    const originalIds = new Set(EVALUATION_CASES.map((entry) => entry.id));
    const originalMessages = new Set(EVALUATION_CASES.map((entry) => entry.message));

    expect(EVALUATION_CASES).toHaveLength(100);
    for (const entry of HOLDOUT_CASES) {
      expect(originalIds.has(entry.id)).toBe(false);
      expect(originalMessages.has(entry.message)).toBe(false);
    }
    expect(EVALUATION_CASES.some((entry) => entry.id.startsWith("TL-H-"))).toBe(
      false,
    );
  });
});

describe("holdout evaluation runner", () => {
  it("is deterministic and stable across runs", () => {
    const second = evaluateDataset(HOLDOUT_CASES);
    expect(second).toEqual(holdoutReport);
    expect(
      formatReport(second, {
        title: "TrustLens holdout evaluation",
        dataset: "TL-H independently authored holdout (50 cases)",
      }),
    ).toBe(holdoutOutput);
  });

  it("labels the report as the holdout dataset, distinct from the original", () => {
    expect(holdoutOutput).toContain("TrustLens holdout evaluation");
    expect(holdoutOutput).toContain("Dataset: TL-H");
    expect(holdoutOutput).not.toContain("Buckets: scam 25");
  });

  it("counts every case once and reports the measured risk bands", () => {
    expect(holdoutReport.totalCases).toBe(50);
    expect(holdoutReport.riskBandCounts).toEqual({
      low: 34,
      medium: 16,
      high: 0,
    });
    expect(
      holdoutReport.predictedPositive + holdoutReport.predictedNegative,
    ).toBe(50);
    expect(holdoutReport.predictedPositive).toBe(16);
  });

  it("excludes ambiguous cases from the binary metrics", () => {
    expect(holdoutReport.binary.total).toBe(40);
    expect(holdoutReport.ambiguous.total).toBe(10);
    expect(holdoutReport.binary.total + holdoutReport.ambiguous.total).toBe(50);

    const binaryOutcomes = holdoutReport.outcomes.filter(
      (outcome) => outcome.label !== "ambiguous",
    );
    expect(binaryOutcomes).toHaveLength(40);
    expect(
      binaryOutcomes.reduce(
        (total, outcome) => total + (outcome.predictedPositive ? 1 : 0),
        0,
      ),
    ).toBe(holdoutReport.binary.predictedPositive);
  });

  it("reports the measured confusion matrix and metrics", () => {
    expect(holdoutReport.confusion).toEqual({
      expectedPositive: { predictedPositive: 11, predictedNegative: 9 },
      expectedNegative: { predictedPositive: 1, predictedNegative: 19 },
    });
    expect(holdoutReport.binary).toMatchObject({
      predictedPositive: 12,
      predictedNegative: 28,
      truePositives: 11,
      falsePositives: 1,
      trueNegatives: 19,
      falseNegatives: 9,
    });

    const precision = 11 / 12;
    const recall = 11 / 20;
    expect(holdoutReport.binary.precision).toBeCloseTo(precision, 10);
    expect(holdoutReport.binary.recall).toBeCloseTo(recall, 10);
    expect(holdoutReport.binary.f1).toBeCloseTo(
      (2 * precision * recall) / (precision + recall),
      10,
    );
    expect(holdoutOutput).toContain("Precision: 0.917");
    expect(holdoutOutput).toContain("Recall:    0.550");
    expect(holdoutOutput).toContain("F1:        0.687");
  });

  it("lists the exact holdout errors and ambiguous flags", () => {
    expect(holdoutReport.misclassified.falsePositiveIds).toEqual(["TL-H-040"]);
    expect(holdoutReport.misclassified.falseNegativeIds).toEqual([
      "TL-H-003",
      "TL-H-004",
      "TL-H-007",
      "TL-H-009",
      "TL-H-012",
      "TL-H-014",
      "TL-H-015",
      "TL-H-016",
      "TL-H-019",
    ]);
    expect(holdoutReport.ambiguous.flaggedIds).toEqual([
      "TL-H-045",
      "TL-H-046",
      "TL-H-048",
      "TL-H-049",
    ]);

    for (const ids of [
      holdoutReport.misclassified.falsePositiveIds,
      holdoutReport.misclassified.falseNegativeIds,
      holdoutReport.manualReviewIds,
    ]) {
      expect(new Set(ids).size).toBe(ids.length);
      expect([...ids].sort()).toEqual([...ids]);
    }
  });

  it("reports per-bucket results that add up to the overall counts", () => {
    expect(holdoutReport.perBucket.scam).toMatchObject({
      total: 20,
      predictedPositive: 11,
      riskBandCounts: { low: 9, medium: 11, high: 0 },
    });
    expect(holdoutReport.perBucket.legitimate).toMatchObject({
      total: 20,
      predictedPositive: 1,
      riskBandCounts: { low: 19, medium: 1, high: 0 },
    });
    expect(holdoutReport.perBucket.ambiguous).toMatchObject({
      total: 10,
      predictedPositive: 4,
      riskBandCounts: { low: 6, medium: 4, high: 0 },
    });
    expect(holdoutReport.perBucket["edge-case"].total).toBe(0);
  });

  it("reports undefined metrics when a denominator is zero", () => {
    const single = evaluateDataset(
      HOLDOUT_CASES.filter((entry) => entry.id === "TL-H-021"),
    );
    expect(single.binary.truePositives).toBe(0);
    expect(single.binary.falseNegatives).toBe(0);
    expect(single.binary.recall).toBeNull();
    expect(single.binary.precision).toBeNull();
    expect(single.binary.f1).toBeNull();
    expect(holdoutOutput).not.toContain("undefined");
    expect(
      formatReport(single, { title: "Holdout zero-denominator check" }),
    ).toContain("Precision: undefined");
  });

  it("runs without network access and never prints messages or rationales", () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (() => {
      throw new Error("network access attempted during holdout evaluation");
    }) as unknown as typeof fetch;

    let output: string;
    try {
      output = formatReport(evaluateDataset(HOLDOUT_CASES), {
        title: "TrustLens holdout evaluation",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(output).not.toMatch(/https?:\/\//);
    for (const entry of HOLDOUT_CASES) {
      if (entry.message.length > 30) {
        expect(output).not.toContain(entry.message);
      }
      expect(output).not.toContain(entry.rationale);
    }
  });
});

describe("original dataset regression", () => {
  it("still holds 100 cases and its prior metrics", () => {
    const original = evaluateDataset(EVALUATION_CASES);

    expect(original.totalCases).toBe(100);
    expect(original.labelCounts).toEqual({
      scam: 38,
      legitimate: 36,
      ambiguous: 26,
    });
    expect(original.binary).toMatchObject({
      total: 74,
      truePositives: 25,
      falsePositives: 3,
      trueNegatives: 33,
      falseNegatives: 13,
    });
    expect(original.binary.precision).toBeCloseTo(25 / 28, 10);
    expect(original.binary.recall).toBeCloseTo(25 / 38, 10);
    expect(original.binary.f1).toBeCloseTo(50 / 66, 10);

    const output = formatReport(original);
    expect(output.startsWith("TrustLens detector evaluation\n")).toBe(true);
    expect(output).not.toContain("Dataset: TL-H");
  });
});
