/**
 * Isolated dry run for the credential-rule proposal.
 *
 * Usage: `bun run evaluate:credential-proposal`
 *
 * This never calls the production rule directly: it runs `analyzeMessage()` and
 * then overlays the candidate signal in evaluation code. Output is aggregate
 * counts and case IDs only.
 */
import { EVALUATION_CASES } from "../src/lib/scam-detection/evaluation/dataset";
import { HOLDOUT_CASES } from "../src/lib/scam-detection/evaluation/holdout";
import {
  formatCandidateSimulation,
  simulateCandidate,
} from "../src/lib/scam-detection/evaluation/credential-proposal";

const datasets = [
  { name: "original 100-case dataset", cases: EVALUATION_CASES },
  { name: "TL-H 50-case holdout", cases: HOLDOUT_CASES },
];

for (const dataset of datasets) {
  for (const candidate of ["A", "B"] as const) {
    console.log(
      formatCandidateSimulation(
        simulateCandidate(dataset.cases, candidate, dataset.name),
      ),
    );
    console.log("");
  }
}
