import { detectLanguage } from "../../language";
import { evaluateDataset } from "../run";
import type { EvaluationReport } from "../run";
import { MULTILINGUAL_CASES } from ".";
import {
  MULTILINGUAL_LANGUAGES,
  MULTILINGUAL_LANGUAGE_LABELS,
  type MultilingualLanguage,
} from "./types";

/** Metrics for one language variety. */
export interface LanguageSummary {
  language: MultilingualLanguage;
  label: string;
  cases: number;
  report: EvaluationReport;
  /** How many cases the detector labelled `en`, `hi`, `mr`, `hinglish`, etc. */
  identification: Record<string, number>;
  /** Cases where the detector's label agreed with the authored variety. */
  identificationMatches: number;
}

export interface MultilingualReport {
  totalCases: number;
  overall: EvaluationReport;
  languages: LanguageSummary[];
  /** Cases where heuristic identification disagreed with the authored variety. */
  identificationMismatches: { id: string; expected: MultilingualLanguage; detected: string }[];
}

function detectLabelFor(message: string): string {
  return detectLanguage(message).code;
}

/**
 * Scores every multilingual case, then the same cases grouped by variety.
 *
 * The overall metrics are the shared runner's binary metrics over all 60
 * cases; ambiguous cases are excluded there exactly as they are everywhere
 * else. Per-language groups are evaluated independently, so a shortage of one
 * variety cannot change another's precision.
 */
export function evaluateMultilingual(): MultilingualReport {
  const overall = evaluateDataset(MULTILINGUAL_CASES);
  const detectionById = new Map(
    MULTILINGUAL_CASES.map((entry) => [entry.id, detectLabelFor(entry.message)]),
  );

  const mismatches: MultilingualReport["identificationMismatches"] = [];
  for (const entry of MULTILINGUAL_CASES) {
    const detected = detectionById.get(entry.id) ?? "uncertain";
    if (detected !== entry.language) {
      mismatches.push({
        id: entry.id,
        expected: entry.language,
        detected,
      });
    }
  }

  const languages = MULTILINGUAL_LANGUAGES.map((language) => {
    const cases = MULTILINGUAL_CASES.filter((entry) => entry.language === language);
    const identification: Record<string, number> = {};
    let identificationMatches = 0;

    for (const entry of cases) {
      const detected = detectionById.get(entry.id) ?? "uncertain";
      identification[detected] = (identification[detected] ?? 0) + 1;
      if (detected === language) identificationMatches += 1;
    }

    return {
      language,
      label: MULTILINGUAL_LANGUAGE_LABELS[language],
      cases: cases.length,
      report: evaluateDataset(cases),
      identification,
      identificationMatches,
    };
  });

  return {
    totalCases: overall.totalCases,
    overall,
    languages,
    identificationMismatches: mismatches,
  };
}

function metric(value: number | null): string {
  return value === null ? "undefined" : value.toFixed(3);
}

function listOrNone(ids: readonly string[]): string {
  return ids.length === 0 ? "  (none)" : ids.map((id) => `  ${id}`).join("\n");
}

/**
 * Plain-text report. Message bodies are never printed, only case IDs.
 */
export function formatMultilingualReport(report: MultilingualReport): string {
  const { overall } = report;
  const { binary } = overall;
  const languageRows = report.languages.map((summary) => {
    const sub = summary.report.binary;
    return [
      summary.language.padEnd(9),
      String(summary.cases).padStart(5),
      String(sub.truePositives).padStart(4),
      String(sub.falsePositives).padStart(4),
      String(sub.trueNegatives).padStart(4),
      String(sub.falseNegatives).padStart(4),
      metric(sub.precision).padStart(9),
      metric(sub.recall).padStart(7),
      metric(sub.f1).padStart(7),
      String(summary.report.ambiguous.predictedPositive).padStart(10),
    ].join("  ");
  });

  return [
    "TrustLens multilingual evaluation",
    "=================================",
    "Dataset: TL-M synthetic multilingual set (60 cases)",
    "",
    `Cases: ${report.totalCases} synthetic evaluation examples.`,
    "These are hand-written examples, not a representative sample of real-world messages.",
    `Labels:  scam ${overall.labelCounts.scam} | legitimate ${overall.labelCounts.legitimate} | ambiguous ${overall.labelCounts.ambiguous}`,
    `Risk bands: low ${overall.riskBandCounts.low} | medium ${overall.riskBandCounts.medium} | high ${overall.riskBandCounts.high}`,
    "",
    "Prediction rule",
    "---------------",
    "Predicted positive: risk band medium or high (score >= 30).",
    "Predicted negative: risk band low (score < 30).",
    "Low means few configured warning signs matched; it does not mean the message is safe.",
    "",
    "Overall binary subset (labels scam and legitimate; ambiguous excluded)",
    "---------------------------------------------------------------------",
    `Cases: ${binary.total}`,
    `True positives: ${binary.truePositives}`,
    `False positives: ${binary.falsePositives}`,
    `True negatives: ${binary.trueNegatives}`,
    `False negatives: ${binary.falseNegatives}`,
    `Precision: ${metric(binary.precision)}`,
    `Recall:    ${metric(binary.recall)}`,
    `F1:        ${metric(binary.f1)}`,
    "",
    "Confusion matrix",
    "                predicted positive  predicted negative",
    `expected scam   ${String(binary.truePositives).padStart(18)}  ${String(binary.falseNegatives).padStart(18)}`,
    `expected legit  ${String(binary.falsePositives).padStart(18)}  ${String(binary.trueNegatives).padStart(18)}`,
    "",
    "By language variety",
    "-------------------",
    "language   cases    TP    FP    TN    FN  precision   recall      F1  amb. flagged",
    ...languageRows,
    "Overall ambiguous cases:",
    `  total ${overall.ambiguous.total} | scored medium/high ${overall.ambiguous.predictedPositive} | scored low ${overall.ambiguous.predictedNegative}`,
    "  Flagged for review:",
    listOrNone(overall.ambiguous.flaggedIds),
    "",
    "False positives (legitimate scored medium/high):",
    listOrNone(overall.misclassified.falsePositiveIds),
    "",
    "False negatives (scam scored low):",
    listOrNone(overall.misclassified.falseNegativeIds),
    "",
    "Language identification (heuristic)",
    "-----------------------------------",
    "Devanagari is shared by Hindi and Marathi; these labels are not a reliable language ID.",
    ...report.languages.map((summary) => {
      const counts = Object.entries(summary.identification)
        .map(([code, count]) => `${code} ${count}`)
        .join(", ");
      return `${summary.language.padEnd(9)} agreement ${summary.identificationMatches}/${summary.cases} (${counts})`;
    }),
    "",
    `Label disagreements: ${report.identificationMismatches.length}`,
    listOrNone(
      report.identificationMismatches.map(
        (mismatch) => `${mismatch.id} expected ${mismatch.expected}, detected ${mismatch.detected}`,
      ),
    ),
    "",
    "No message text is printed by this report.",
  ].join("\n");
}
