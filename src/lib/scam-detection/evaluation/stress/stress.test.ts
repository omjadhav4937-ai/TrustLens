import { describe, expect, it } from "bun:test";
import { analyzeMessage } from "../../engine";
import { simulateCandidate } from "../credential-proposal";
import { formatCandidateSimulation } from "../credential-proposal";
import { EVALUATION_CASES } from "../dataset";
import { formatReport } from "../format";
import { HOLDOUT_CASES } from "../holdout";
import { evaluateDataset } from "../run";
import { CASE_BUCKETS, CHALLENGE_CATEGORIES, EXPECTED_LABELS } from "../types";
import type { EvaluationCase } from "../types";
import { STRESS_CASES } from ".";

/**
 * Candidate A stress test.
 *
 * Labels and rationales are frozen in the dataset files. The golden numbers
 * describe this synthetic set only; they are not production results.
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

function contentFingerprint(cases: readonly EvaluationCase[]): string {
  let hash = 2166136261;
  for (const entry of cases) {
    const text = `${entry.id}\u0000${entry.label}\u0000${entry.message}\u0001`;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
  }
  return hash.toString(16).padStart(8, "0");
}

function textFingerprint(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

const stressReport = evaluateDataset(STRESS_CASES);
const candidateA = simulateCandidate(STRESS_CASES, "A", "TL-C stress dataset");
const candidateB = simulateCandidate(STRESS_CASES, "B", "TL-C stress dataset");

describe("stress dataset integrity", () => {
  it("contains exactly 60 cases with the intended distribution", () => {
    expect(STRESS_CASES).toHaveLength(60);
    expect(
      STRESS_CASES.filter((entry) => entry.label === "scam"),
    ).toHaveLength(20);
    expect(
      STRESS_CASES.filter((entry) => entry.label === "legitimate"),
    ).toHaveLength(30);
    expect(
      STRESS_CASES.filter((entry) => entry.label === "ambiguous"),
    ).toHaveLength(10);
    expect(stressReport.totalCases).toBe(60);
  });

  it("uses unique TL-C IDs and mirrors the label in the bucket", () => {
    const ids = STRESS_CASES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe("TL-C-001");
    expect(ids[ids.length - 1]).toBe("TL-C-060");

    for (const entry of STRESS_CASES) {
      expect(entry.id).toMatch(/^TL-C-\d{3}$/);
      expect(entry.bucket).toBe(entry.label);
    }
    expect(STRESS_CASES.some((entry) => entry.bucket === "edge-case")).toBe(false);
  });

  it("uses valid labels and challenge categories", () => {
    for (const entry of STRESS_CASES) {
      expect(EXPECTED_LABELS).toContain(entry.label);
      expect(CHALLENGE_CATEGORIES).toContain(entry.challenge);
      expect(CASE_BUCKETS).toContain(entry.bucket);
    }
  });

  it("has non-empty text and notes where required", () => {
    let difficultyNotes = 0;
    for (const entry of STRESS_CASES) {
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
    for (const entry of STRESS_CASES) {
      for (const host of hostsIn(entry.message)) {
        expect(isReservedHost(host)).toBe(true);
      }
    }
  });

  it("does not overlap the original dataset or the holdout", () => {
    const originalIds = new Set(EVALUATION_CASES.map((entry) => entry.id));
    const originalMessages = new Set(
      EVALUATION_CASES.map((entry) => entry.message),
    );
    const holdoutIds = new Set(HOLDOUT_CASES.map((entry) => entry.id));
    const holdoutMessages = new Set(HOLDOUT_CASES.map((entry) => entry.message));

    for (const entry of STRESS_CASES) {
      expect(originalIds.has(entry.id)).toBe(false);
      expect(holdoutIds.has(entry.id)).toBe(false);
      expect(originalMessages.has(entry.message)).toBe(false);
      expect(holdoutMessages.has(entry.message)).toBe(false);
    }
    expect(EVALUATION_CASES.some((entry) => entry.id.startsWith("TL-C-"))).toBe(
      false,
    );
    expect(HOLDOUT_CASES.some((entry) => entry.id.startsWith("TL-C-"))).toBe(
      false,
    );
  });

  it("freezes dataset contents and existing baseline output", () => {
    expect(contentFingerprint(STRESS_CASES)).toBe("4509fd78");
    expect(contentFingerprint(EVALUATION_CASES)).toBe("f09babc7");
    expect(contentFingerprint(HOLDOUT_CASES)).toBe("1747e87e");

    expect(
      textFingerprint(formatReport(evaluateDataset(EVALUATION_CASES))),
    ).toBe("7da6717f");
    expect(
      textFingerprint(
        formatReport(evaluateDataset(HOLDOUT_CASES), {
          title: "TrustLens holdout evaluation",
          dataset: "TL-H independently authored holdout (50 cases)",
        }),
      ),
    ).toBe("18a51445");
  });
});

describe("stress evaluation results", () => {
  it("reports the production baseline for the stress set", () => {
    expect(stressReport.binary).toMatchObject({
      total: 50,
      predictedPositive: 6,
      truePositives: 2,
      falsePositives: 4,
      trueNegatives: 26,
      falseNegatives: 18,
    });
    expect(stressReport.binary.precision).toBeCloseTo(2 / 6, 10);
    expect(stressReport.binary.recall).toBeCloseTo(2 / 20, 10);
    expect(stressReport.binary.f1).toBeCloseTo(0.1538, 4);
    expect(stressReport.ambiguous.total).toBe(10);
    expect(stressReport.ambiguous.predictedPositive).toBe(0);
  });

  it("reports Candidate A's measured stress metrics", () => {
    expect(candidateA.baseline).toEqual(stressReport.binary);
    expect(candidateA.simulated).toMatchObject({
      total: 50,
      predictedPositive: 20,
      truePositives: 13,
      falsePositives: 7,
      trueNegatives: 23,
      falseNegatives: 7,
    });
    expect(candidateA.simulated.precision).toBeCloseTo(13 / 20, 10);
    expect(candidateA.simulated.recall).toBeCloseTo(13 / 20, 10);
    expect(candidateA.simulated.f1).toBeCloseTo(0.65, 10);
    expect(candidateA.recoveredIds).toEqual([
      "TL-C-001",
      "TL-C-003",
      "TL-C-005",
      "TL-C-006",
      "TL-C-007",
      "TL-C-008",
      "TL-C-010",
      "TL-C-011",
      "TL-C-012",
      "TL-C-015",
      "TL-C-016",
    ]);
    expect(candidateA.newFalsePositiveIds).toEqual([
      "TL-C-029",
      "TL-C-033",
      "TL-C-034",
    ]);
    expect(candidateA.scoreChanges).toBe(21);
    expect(candidateA.riskBandChanges).toBe(21);
    expect(candidateA.matchCounts).toEqual({
      "card-image": 9,
      "recovery-code": 5,
      "app-code": 9,
    });
    expect(candidateA.matchedCaseIds).toHaveLength(23);
  });

  it("reports Candidate B's measured stress metrics", () => {
    expect(candidateB.simulated).toMatchObject({
      total: 50,
      predictedPositive: 24,
      truePositives: 15,
      falsePositives: 9,
      trueNegatives: 21,
      falseNegatives: 5,
    });
    expect(candidateB.simulated.precision).toBeCloseTo(15 / 24, 10);
    expect(candidateB.simulated.recall).toBeCloseTo(15 / 20, 10);
    expect(candidateB.simulated.f1).toBeCloseTo(0.6818, 4);
    expect(candidateB.recoveredIds).toEqual([
      "TL-C-001",
      "TL-C-003",
      "TL-C-004",
      "TL-C-005",
      "TL-C-006",
      "TL-C-007",
      "TL-C-008",
      "TL-C-009",
      "TL-C-010",
      "TL-C-011",
      "TL-C-012",
      "TL-C-015",
      "TL-C-016",
    ]);
    expect(candidateB.newFalsePositiveIds).toEqual([
      "TL-C-026",
      "TL-C-029",
      "TL-C-030",
      "TL-C-033",
      "TL-C-034",
    ]);
    expect(candidateB.scoreChanges).toBe(26);
    expect(candidateB.riskBandChanges).toBe(26);
    expect(candidateB.matchCounts).toEqual({
      "card-image": 13,
      "recovery-code": 6,
      "app-code": 9,
    });
    expect(candidateB.matchedCaseIds).toHaveLength(28);
  });

  it("keeps ambiguous cases outside the binary metrics", () => {
    expect(candidateA.binaryTotal).toBe(50);
    expect(candidateA.ambiguous.total).toBe(10);
    expect(candidateA.simulated.total).toBe(50);
    expect(
      candidateA.simulated.truePositives +
        candidateA.simulated.falsePositives +
        candidateA.simulated.trueNegatives +
        candidateA.simulated.falseNegatives,
    ).toBe(50);

    expect(candidateA.ambiguous.baselineFlaggedIds).toEqual([]);
    expect(candidateA.ambiguous.newlyFlaggedIds).toEqual([
      "TL-C-051",
      "TL-C-053",
      "TL-C-054",
      "TL-C-055",
      "TL-C-057",
      "TL-C-059",
      "TL-C-060",
    ]);
    expect(candidateB.ambiguous.newlyFlaggedIds).toEqual([
      "TL-C-051",
      "TL-C-052",
      "TL-C-053",
      "TL-C-054",
      "TL-C-055",
      "TL-C-057",
      "TL-C-059",
      "TL-C-060",
    ]);
  });

  it("does not turn password setup or code-entry examples into new matches", () => {
    for (const id of ["TL-C-021", "TL-C-022", "TL-C-023", "TL-C-042"]) {
      const outcome = candidateA.outcomes.find((entry) => entry.id === id)!;
      expect(outcome.candidateMatched).toBe(false);
      expect(outcome.newFalsePositive).toBe(false);
    }

    // The first and third are pre-existing engine false positives, not new ones.
    expect(analyzeMessage("Create a password and confirm it on the next screen.").score).toBe(40);
    expect(
      analyzeMessage(
        "Type the verification code from your authenticator into the field.",
      ).score,
    ).toBe(40);
  });

  it("keeps protective wording and negations unmatched", () => {
    for (const id of [
      "TL-C-014",
      "TL-C-024",
      "TL-C-031",
      "TL-C-032",
      "TL-C-037",
      "TL-C-047",
    ]) {
      const a = candidateA.outcomes.find((entry) => entry.id === id)!;
      const b = candidateB.outcomes.find((entry) => entry.id === id)!;
      expect(a.candidateMatched).toBe(false);
      expect(b.candidateMatched).toBe(false);
    }
  });

  it("does not double-count a stress case that already matched", () => {
    for (const id of ["TL-C-002", "TL-C-013"]) {
      const outcome = candidateA.outcomes.find((entry) => entry.id === id)!;
      expect(outcome.existingCredentialFinding).toBe(true);
      expect(outcome.candidateMatched).toBe(true);
      expect(outcome.simulatedScore).toBe(outcome.baselineScore);
      expect(outcome.scoreChanged).toBe(false);
    }
  });

  it("is deterministic for both candidates", () => {
    expect(simulateCandidate(STRESS_CASES, "A", "TL-C")).toEqual(
      simulateCandidate(STRESS_CASES, "A", "TL-C"),
    );
    expect(simulateCandidate(STRESS_CASES, "B", "TL-C")).toEqual(
      simulateCandidate(STRESS_CASES, "B", "TL-C"),
    );
    expect(evaluateDataset(STRESS_CASES)).toEqual(evaluateDataset(STRESS_CASES));
  });
});

describe("stress output privacy", () => {
  it("runs with fetch disabled and does not print messages or rationales", () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (() => {
      throw new Error("network access attempted during stress evaluation");
    }) as unknown as typeof fetch;

    let output: string;
    try {
      output = [
        formatReport(evaluateDataset(STRESS_CASES), {
          title: "TrustLens credential stress test — production baseline",
          dataset: "TL-C stress dataset (60 cases)",
        }),
        formatCandidateSimulation(
          simulateCandidate(STRESS_CASES, "A", "TL-C stress dataset"),
        ),
        formatCandidateSimulation(
          simulateCandidate(STRESS_CASES, "B", "TL-C stress dataset"),
        ),
      ].join("\n");
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(output).not.toMatch(/https?:\/\//);
    for (const entry of STRESS_CASES) {
      if (entry.message.length > 30) {
        expect(output).not.toContain(entry.message);
      }
      expect(output).not.toContain(entry.rationale);
    }
  });
});
