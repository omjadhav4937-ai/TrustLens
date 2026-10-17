/**
 * Candidate A2 refinement dry run.
 *
 * Usage: `bun run evaluate:credential-a2`
 *
 * Runs the shipped engine once per case and compares four rows on each of the
 * three datasets, separately:
 *
 *   production baseline, Candidate A, Candidate B, Candidate A2.
 *
 * A2 is evaluation-only and is not imported by the application. Output is
 * aggregate counts and case IDs only: no message text, URLs or rationales.
 */
import { EVALUATION_CASES } from "../src/lib/scam-detection/evaluation/dataset";
import {
  formatCandidateSimulation,
  simulateCandidate,
  type CredentialCandidateSimulation,
} from "../src/lib/scam-detection/evaluation/credential-proposal";
import { simulateCandidateA2 } from "../src/lib/scam-detection/evaluation/credential-proposal-a2";
import { evaluateDataset } from "../src/lib/scam-detection/evaluation/run";
import type { BinaryMetrics } from "../src/lib/scam-detection/evaluation/run";
import { HOLDOUT_CASES } from "../src/lib/scam-detection/evaluation/holdout";
import { STRESS_CASES } from "../src/lib/scam-detection/evaluation/stress";
import type { EvaluationCase } from "../src/lib/scam-detection/evaluation/types";

function metric(value: number | null): string {
  return value === null ? "undefined" : value.toFixed(3);
}

function pad(value: string, width: number): string {
  return value.padEnd(width, " ");
}

function numberCell(value: number): string {
  return String(value).padStart(4, " ");
}

function tableRow(
  name: string,
  metrics: BinaryMetrics,
  extra: {
    recovered: number;
    newFalsePositives: number;
    scoreChanges: number;
    bandChanges: number;
    ambiguousFlagged: number;
    card: number;
    recovery: number;
    app: number;
  },
): string {
  return [
    pad(name, 24),
    numberCell(metrics.truePositives),
    numberCell(metrics.falsePositives),
    numberCell(metrics.trueNegatives),
    numberCell(metrics.falseNegatives),
    `  ${metric(metrics.precision)}`,
    ` ${metric(metrics.recall)}`,
    ` ${metric(metrics.f1)}`,
    numberCell(extra.recovered),
    numberCell(extra.newFalsePositives),
    numberCell(extra.scoreChanges),
    numberCell(extra.bandChanges),
    numberCell(extra.ambiguousFlagged),
    numberCell(extra.card),
    numberCell(extra.recovery),
    numberCell(extra.app),
  ].join("");
}

function header(): string {
  return [
    pad("Run", 24),
    "  TP",
    "  FP",
    "  TN",
    "  FN",
    "  Precision",
    " Recall",
    " F1",
    " Recov",
    " NewFP",
    " ScoreD",
    " BandD",
    " Amb+",
    " Card",
    " Recov",
    " App",
  ].join("");
}

interface DatasetRun {
  name: string;
  cases: EvaluationCase[];
  baseline: ReturnType<typeof evaluateDataset>;
  a: CredentialCandidateSimulation;
  b: CredentialCandidateSimulation;
  a2: CredentialCandidateSimulation;
}

function simulateDataset(name: string, cases: EvaluationCase[]): DatasetRun {
  return {
    name,
    cases,
    baseline: evaluateDataset(cases),
    a: simulateCandidate(cases, "A", name),
    b: simulateCandidate(cases, "B", name),
    a2: simulateCandidateA2(cases, name),
  };
}

function idList(ids: readonly string[]): string {
  return ids.length === 0 ? "  (none)" : ids.map((id) => `  ${id}`).join("\n");
}

function reportDataset(run: DatasetRun): string {
  const { baseline, a, b, a2 } = run;

  return [
    `Dataset: ${run.name}`,
    `  ${run.cases.length} cases; ${baseline.binary.total} binary; ${baseline.ambiguous.total} ambiguous`,
    "",
    header(),
    tableRow("Production baseline", baseline.binary, {
      recovered: 0,
      newFalsePositives: 0,
      scoreChanges: 0,
      bandChanges: 0,
      ambiguousFlagged: baseline.ambiguous.predictedPositive,
      card: 0,
      recovery: 0,
      app: 0,
    }),
    tableRow("Candidate A", a.simulated, {
      recovered: a.recoveredIds.length,
      newFalsePositives: a.newFalsePositiveIds.length,
      scoreChanges: a.scoreChanges,
      bandChanges: a.riskBandChanges,
      ambiguousFlagged: a.ambiguous.simulatedFlaggedIds.length,
      card: a.matchCounts["card-image"],
      recovery: a.matchCounts["recovery-code"],
      app: a.matchCounts["app-code"],
    }),
    tableRow("Candidate B", b.simulated, {
      recovered: b.recoveredIds.length,
      newFalsePositives: b.newFalsePositiveIds.length,
      scoreChanges: b.scoreChanges,
      bandChanges: b.riskBandChanges,
      ambiguousFlagged: b.ambiguous.simulatedFlaggedIds.length,
      card: b.matchCounts["card-image"],
      recovery: b.matchCounts["recovery-code"],
      app: b.matchCounts["app-code"],
    }),
    tableRow("Candidate A2", a2.simulated, {
      recovered: a2.recoveredIds.length,
      newFalsePositives: a2.newFalsePositiveIds.length,
      scoreChanges: a2.scoreChanges,
      bandChanges: a2.riskBandChanges,
      ambiguousFlagged: a2.ambiguous.simulatedFlaggedIds.length,
      card: a2.matchCounts["card-image"],
      recovery: a2.matchCounts["recovery-code"],
      app: a2.matchCounts["app-code"],
    }),
    "",
    "Candidate A2 detail",
    `  Recovered from baseline false negatives (${a2.recoveredIds.length}):`,
    idList(a2.recoveredIds),
    `  New false positives (${a2.newFalsePositiveIds.length}):`,
    idList(a2.newFalsePositiveIds),
    `  Clause-level safeguards applied to (${a2.suppressedCaseIds.length}):`,
    idList(a2.suppressedCaseIds),
    "",
  ].join("\n");
}

function compare(run: DatasetRun): string {
  const aMatched = new Set(run.a.matchedCaseIds);
  const a2Matched = new Set(run.a2.matchedCaseIds);
  const dropped = [...aMatched].filter((id) => !a2Matched.has(id)).sort();
  const added = [...a2Matched].filter((id) => !aMatched.has(id)).sort();

  return [
    `Dataset: ${run.name}`,
    `  Caught by A, missed by A2 (${dropped.length}):`,
    idList(dropped),
    `  Missed by A, caught by A2 (${added.length}):`,
    idList(added),
  ].join("\n");
}

const datasets: Array<{ name: string; cases: EvaluationCase[] }> = [
  { name: "original 100-case dataset", cases: EVALUATION_CASES },
  { name: "TL-H 50-case holdout", cases: HOLDOUT_CASES },
  { name: "TL-C 60-case stress dataset", cases: STRESS_CASES },
];

const runs = datasets.map((dataset) =>
  simulateDataset(dataset.name, dataset.cases),
);

console.log(
  [
    "TrustLens credential-rule refinement — Candidate A2 simulated overlay",
    "=====================================================================",
    "NOT production output. A2 is evaluation-only and is not used by the app.",
    "The three datasets are reported separately; no combined metric is computed.",
    "No message text, URLs or rationales are printed by this report.",
    "",
  ].join("\n"),
);

for (const run of runs) {
  console.log(reportDataset(run));
  console.log("");
}

console.log("Cross-candidate comparison (matched cases, not binary errors)");
console.log("=============================================================");
for (const run of runs) {
  console.log(compare(run));
  console.log("");
}

console.log("Candidate A2 full report — TL-C 60-case stress dataset");
console.log("=======================================================");
console.log(
  formatCandidateSimulation(runs[2].a2),
);
