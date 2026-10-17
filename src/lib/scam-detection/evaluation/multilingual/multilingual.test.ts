import { describe, expect, it } from "bun:test";
import { EVALUATION_CASES } from "../dataset";
import { HOLDOUT_CASES } from "../holdout";
import { formatReport } from "../format";
import { evaluateDataset } from "../run";
import { STRESS_CASES } from "../stress";
import { CASE_BUCKETS, CHALLENGE_CATEGORIES, EXPECTED_LABELS } from "../types";
import type { EvaluationCase } from "../types";
import { MULTILINGUAL_CASES } from ".";
import { evaluateMultilingual, formatMultilingualReport } from "./run";
import { MULTILINGUAL_LANGUAGES, MULTILINGUAL_LANGUAGE_LABELS } from "./types";

/**
 * Multilingual integrity and measurement checks.
 *
 * Golden numbers describe this hand-written set only. They are a snapshot of
 * the shipped detector on these 60 messages, not a target and not a claim about
 * real-world accuracy.
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

const report = evaluateMultilingual();
const output = formatMultilingualReport(report);

describe("multilingual dataset integrity", () => {
  it("contains 60 cases with the intended labels and varieties", () => {
    expect(MULTILINGUAL_CASES).toHaveLength(60);
    expect(report.overall.labelCounts).toEqual({
      scam: 24,
      legitimate: 28,
      ambiguous: 8,
    });

    for (const language of MULTILINGUAL_LANGUAGES) {
      expect(
        MULTILINGUAL_CASES.filter((entry) => entry.language === language),
      ).toHaveLength(15);
    }
  });

  it("uses ordered TL-M IDs, valid vocabularies and matching buckets", () => {
    const ids = MULTILINGUAL_CASES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe("TL-M-001");
    expect(ids[ids.length - 1]).toBe("TL-M-060");

    for (const entry of MULTILINGUAL_CASES) {
      expect(entry.id).toMatch(/^TL-M-\d{3}$/);
      expect(entry.bucket).toBe(entry.label);
      expect(EXPECTED_LABELS).toContain(entry.label);
      expect(CASE_BUCKETS).toContain(entry.bucket);
      expect(CHALLENGE_CATEGORIES).toContain(entry.challenge);
      expect(MULTILINGUAL_LANGUAGES).toContain(entry.language);
      expect(entry.message.trim().length).toBeGreaterThan(0);
      expect(entry.rationale.trim().length).toBeGreaterThan(0);

      if (entry.label === "ambiguous") {
        expect(entry.notes?.trim().length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it("has a human-readable label for every variety", () => {
    for (const language of MULTILINGUAL_LANGUAGES) {
      expect(MULTILINGUAL_LANGUAGE_LABELS[language].trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps every URL on a reserved host", () => {
    let urls = 0;
    for (const entry of MULTILINGUAL_CASES) {
      for (const host of hostsIn(entry.message)) {
        urls += 1;
        expect(isReservedHost(host)).toBe(true);
      }
    }
    expect(urls).toBeGreaterThan(0);
  });

  it("shares no ID or message text with any historical dataset", () => {
    const others = [...EVALUATION_CASES, ...HOLDOUT_CASES, ...STRESS_CASES];
    const ids = new Set(others.map((entry) => entry.id));
    const messages = new Set(others.map((entry) => entry.message));

    for (const entry of MULTILINGUAL_CASES) {
      expect(ids.has(entry.id)).toBe(false);
      expect(messages.has(entry.message)).toBe(false);
    }

    for (const dataset of [EVALUATION_CASES, HOLDOUT_CASES, STRESS_CASES]) {
      expect(dataset.some((entry) => entry.id.startsWith("TL-M-"))).toBe(false);
    }
  });

  it("freezes the authored dataset contents", () => {
    expect(contentFingerprint(MULTILINGUAL_CASES)).toBe("ed5c2b95");
  });
});

describe("multilingual measurement", () => {
  it("reports the measured overall confusion matrix and metrics", () => {
    expect(report.overall.binary).toMatchObject({
      total: 52,
      predictedPositive: 23,
      predictedNegative: 29,
      truePositives: 22,
      falsePositives: 1,
      trueNegatives: 27,
      falseNegatives: 2,
    });
    expect(report.overall.binary.precision).toBeCloseTo(22 / 23, 10);
    expect(report.overall.binary.recall).toBeCloseTo(22 / 24, 10);
    expect(report.overall.binary.f1).toBeCloseTo(
      (2 * (22 / 23) * (22 / 24)) / (22 / 23 + 22 / 24),
      10,
    );
    expect(output).toContain("Precision: 0.957");
    expect(output).toContain("Recall:    0.917");
    expect(output).toContain("F1:        0.936");
  });

  it("reports independent per-variety metrics", () => {
    const byLanguage = Object.fromEntries(
      report.languages.map((summary) => [summary.language, summary.report.binary]),
    );

    expect(byLanguage.en).toMatchObject({
      truePositives: 4,
      falsePositives: 1,
      trueNegatives: 6,
      falseNegatives: 2,
    });
    for (const language of ["hi", "mr", "hinglish"] as const) {
      expect(byLanguage[language]).toMatchObject({
        truePositives: 6,
        falsePositives: 0,
        trueNegatives: 7,
        falseNegatives: 0,
      });
    }
    expect(report.languages.map((summary) => summary.cases)).toEqual([15, 15, 15, 15]);
  });

  it("keeps ambiguous cases out of the binary metrics", () => {
    expect(report.overall.ambiguous.total).toBe(8);
    expect(report.overall.ambiguous.predictedPositive).toBe(2);
    expect(report.overall.ambiguous.flaggedIds).toEqual(["TL-M-057", "TL-M-059"]);
    expect(report.overall.binary.total + report.overall.ambiguous.total).toBe(60);
  });

  it("lists the exact binary errors", () => {
    expect(report.overall.misclassified.falsePositiveIds).toEqual(["TL-M-026"]);
    expect(report.overall.misclassified.falseNegativeIds).toEqual([
      "TL-M-003",
      "TL-M-005",
    ]);
    expect(output).toContain("TL-M-026");
    expect(output).toContain("TL-M-003");
  });

  it("reports heuristic identification agreement, not a language claim", () => {
    expect(report.identificationMismatches).toEqual([]);
    for (const summary of report.languages) {
      expect(summary.identificationMatches).toBe(summary.cases);
    }
    expect(output).toContain("Devanagari is shared by Hindi and Marathi");
    expect(output).toContain("agreement 15/15");
  });

  it("is deterministic across runs", () => {
    const second = evaluateMultilingual();
    expect(formatMultilingualReport(second)).toBe(output);
  });

  it("leaves every historical dataset untouched", () => {
    expect(contentFingerprint(EVALUATION_CASES)).toBe("f09babc7");
    expect(contentFingerprint(HOLDOUT_CASES)).toBe("1747e87e");
    expect(contentFingerprint(STRESS_CASES)).toBe("4509fd78");

    expect(EVALUATION_CASES).toHaveLength(100);
    expect(HOLDOUT_CASES).toHaveLength(50);
    expect(STRESS_CASES).toHaveLength(60);
    expect(MULTILINGUAL_CASES).toHaveLength(60);
  });

  it("does not change the original 100-case report", () => {
    const original = evaluateDataset(EVALUATION_CASES);
    expect(original.binary).toMatchObject({
      truePositives: 25,
      falsePositives: 3,
      trueNegatives: 33,
      falseNegatives: 13,
    });
    expect(formatReport(original)).not.toContain("Dataset: TL-M");
  });
});

describe("multilingual output privacy", () => {
  it("runs with fetch disabled and prints no message text or URLs", () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (() => {
      throw new Error("network access attempted during multilingual evaluation");
    }) as unknown as typeof fetch;

    let text: string;
    try {
      text = formatMultilingualReport(evaluateMultilingual());
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(text).not.toMatch(/https?:\/\//);
    for (const entry of MULTILINGUAL_CASES) {
      if (entry.message.length > 30) {
        expect(text).not.toContain(entry.message);
      }
      expect(text).not.toContain(entry.rationale);
    }
  });
});
