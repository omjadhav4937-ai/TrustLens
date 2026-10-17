/**
 * Candidate A stress-test dry run.
 *
 * Usage: `bun run evaluate:credential-stress`
 *
 * Prints the production baseline plus the Candidate A and B overlays for the
 * TL-C dataset. No message text, URLs or rationales are printed.
 */
import { evaluateDataset } from "../src/lib/scam-detection/evaluation/run";
import { formatReport } from "../src/lib/scam-detection/evaluation/format";
import {
  formatCandidateSimulation,
  simulateCandidate,
} from "../src/lib/scam-detection/evaluation/credential-proposal";
import { STRESS_CASES } from "../src/lib/scam-detection/evaluation/stress";

const dataset = "TL-C stress dataset (60 cases)";

console.log(
  formatReport(evaluateDataset(STRESS_CASES), {
    title: "TrustLens credential stress test — production baseline",
    dataset,
  }),
);
console.log("");

for (const candidate of ["A", "B"] as const) {
  console.log(
    formatCandidateSimulation(
      simulateCandidate(STRESS_CASES, candidate, dataset),
    ),
  );
  console.log("");
}
