import { describe, expect, it } from "bun:test";
import { analyzeMessage } from "../engine";
import {
  detectCredentialSignal,
  formatCandidateSimulation,
  simulateCandidate,
} from "./credential-proposal";
import {
  A2_SAFEGUARDS,
  cardSafeguardFor,
  detectCredentialSignalA2,
  simulateCandidateA2,
} from "./credential-proposal-a2";
import { EVALUATION_CASES } from "./dataset";
import { formatReport } from "./format";
import { HOLDOUT_CASES } from "./holdout";
import { evaluateDataset } from "./run";
import { STRESS_CASES } from "./stress";
import type { EvaluationCase } from "./types";

/**
 * Candidate A2 refinement tests.
 *
 * Every safeguard is tested in both directions: the legitimate wording it is
 * meant to release, and a genuine request that must survive. A and B are also
 * pinned here so the new experiment cannot silently change them.
 *
 * All messages are synthetic fixtures written for this test file. None contains
 * a live URL or personal data.
 */

function caseOf(id: string, message: string): EvaluationCase {
  return {
    id,
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message,
    rationale: "Synthetic test fixture for the A2 safeguard experiment.",
  };
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

const STRESS_A2 = simulateCandidateA2(STRESS_CASES, "TL-C stress dataset (60 cases)");
const STRESS_A = simulateCandidate(STRESS_CASES, "A", "TL-C stress dataset (60 cases)");
const STRESS_B = simulateCandidate(STRESS_CASES, "B", "TL-C stress dataset (60 cases)");

function a2Case(id: string) {
  return STRESS_A2.outcomes.find((entry) => entry.id === id)!;
}

describe("Candidate A2 — safeguard definitions", () => {
  it("declares exactly the five documented safeguards", () => {
    expect(A2_SAFEGUARDS.map((entry) => entry.id)).toEqual([
      "excluded-object",
      "not-needed",
      "self-directed",
      "conditional-official-flow",
      "official-portal-no-link",
    ]);
  });

  it("labels its own candidate without reusing A or B", () => {
    const result = detectCredentialSignalA2("Send a photo of your card to this chat.");
    expect(result.candidate).toBe("A2");
    expect(result.families).toEqual(["card-image"]);
    expect(result.suppressed).toEqual([]);
  });

  it("leaves A and B signals free of suppression records", () => {
    expect(
      detectCredentialSignal("Send a photo of your card to this chat.", "A").suppressed,
    ).toEqual([]);
    expect(
      detectCredentialSignal("Send a photo of your card to this chat.", "B").suppressed,
    ).toEqual([]);
  });
});

describe("Candidate A2 — excluded object", () => {
  const legitimate = "Send a photo of your receipt, not your card.";

  it("releases a receipt request that explicitly excludes the card", () => {
    const result = detectCredentialSignalA2(legitimate);
    expect(result.matched).toBe(false);
    expect(result.families).toEqual([]);
    expect(result.suppressed).toEqual([
      { family: "card-image", safeguard: "excluded-object" },
    ]);
    expect(a2Case("TL-C-029").candidateMatched).toBe(false);
    expect(a2Case("TL-C-029").newFalsePositive).toBe(false);
    expect(a2Case("TL-C-029").suppressedSafeguards).toEqual(["excluded-object"]);
  });

  it("still flags a card request that excludes something else", () => {
    const result = detectCredentialSignalA2(
      "Send a photo of your card, not your receipt, to this chat.",
    );
    expect(result.matched).toBe(true);
    expect(result.families).toEqual(["card-image"]);
    expect(result.suppressed).toEqual([]);
  });

  it("does not treat 'instead of' as a card request", () => {
    expect(
      detectCredentialSignalA2(
        "Upload a bank statement instead of your card photo in the portal.",
      ).matched,
    ).toBe(false);
  });
});

describe("Candidate A2 — not needed", () => {
  it("recognises an explicit statement that no card image is wanted", () => {
    expect(
      cardSafeguardFor("We do not need a photo of your card; a receipt is enough.", false),
    ).toBe("not-needed");
    expect(
      detectCredentialSignalA2(
        "We do not need a photo of your card; a receipt is enough.",
      ).matched,
    ).toBe(false);
    expect(a2Case("TL-C-030").candidateMatched).toBe(false);
    expect(a2Case("TL-C-030").newFalsePositive).toBe(false);
  });

  it("suppresses card evidence when the clause closes the request", () => {
    const result = detectCredentialSignalA2(
      "Send a photo of your card, but a card photo is not needed for this refund.",
    );
    expect(result.matched).toBe(false);
    expect(result.suppressed).toContainEqual({
      family: "card-image",
      safeguard: "not-needed",
    });
  });

  it("does not treat an unrelated 'not needed' as a card exclusion", () => {
    const result = detectCredentialSignalA2(
      "Send a photo of your card; no further documents are needed.",
    );
    expect(result.matched).toBe(true);
    expect(result.suppressed).toEqual([]);
  });
});

describe("Candidate A2 — self-directed", () => {
  it("releases a card photo the recipient sends to themselves", () => {
    const result = detectCredentialSignalA2(
      "Send a photo of your card to yourself before travelling, so you can block it if it is lost.",
    );
    expect(result.matched).toBe(false);
    expect(result.suppressed).toEqual([
      { family: "card-image", safeguard: "self-directed" },
    ]);
    expect(a2Case("TL-C-034").candidateMatched).toBe(false);
    expect(a2Case("TL-C-034").newFalsePositive).toBe(false);
    expect(a2Case("TL-C-034").suppressedSafeguards).toEqual(["self-directed"]);
  });

  it("still flags a card photo sent to someone else", () => {
    expect(
      detectCredentialSignalA2("Send a photo of your card to me before travelling.")
        .matched,
    ).toBe(true);
    expect(
      detectCredentialSignalA2("Email a scan of your card to our verification team.")
        .matched,
    ).toBe(true);
  });

  it("keeps a self-copy request that also goes to a third party", () => {
    const result = detectCredentialSignalA2(
      "Send a photo of your card to yourself, then forward it to me.",
    );
    expect(result.matched).toBe(true);
    expect(result.suppressed).toEqual([]);
  });
});

describe("Candidate A2 — conditional official flow", () => {
  it("releases guidance conditioned on the official app asking", () => {
    const result = detectCredentialSignalA2(
      "Upload a card photo only if the bank's app asks for it during verification.",
    );
    expect(result.matched).toBe(false);
    expect(result.suppressed).toEqual([
      { family: "card-image", safeguard: "conditional-official-flow" },
    ]);
    expect(a2Case("TL-C-033").candidateMatched).toBe(false);
    expect(a2Case("TL-C-033").newFalsePositive).toBe(false);
    expect(a2Case("TL-C-033").suppressedSafeguards).toEqual([
      "conditional-official-flow",
    ]);
  });

  it("keeps the request when the same flow also asks for a transfer", () => {
    const result = detectCredentialSignalA2(
      "Upload a card photo only if the bank's app asks, then send it to me.",
    );
    expect(result.matched).toBe(true);
    expect(result.suppressed).toEqual([]);
  });

  it("does not trust an official-looking flow that carries a link", () => {
    const result = detectCredentialSignalA2(
      "Upload a card photo only if the bank's app asks. Confirm at http://198.51.100.9/verify.",
    );
    expect(result.matched).toBe(true);
  });

  it("does not suppress an unconditional card-photo request", () => {
    expect(
      detectCredentialSignalA2(
        "Upload a card photo to finish verification in the bank's app today.",
      ).matched,
    ).toBe(true);
  });
});

describe("Candidate A2 — official portal without a link", () => {
  it("releases a card upload to a named portal", () => {
    const result = detectCredentialSignalA2(
      "Upload a card photo in the secure portal to complete verification.",
    );
    expect(result.matched).toBe(false);
    expect(result.suppressed).toEqual([
      { family: "card-image", safeguard: "official-portal-no-link" },
    ]);
  });

  it("keeps a portal upload that carries a sender-supplied link", () => {
    expect(
      detectCredentialSignalA2(
        "Upload a card photo to the secure portal at http://198.51.100.12/upload.",
      ).matched,
    ).toBe(true);
  });

  it("does not let an identity-document upload become a card match", () => {
    expect(a2Case("TL-C-026").candidateMatched).toBe(false);
    expect(a2Case("TL-C-026").newFalsePositive).toBe(false);
    expect(
      detectCredentialSignalA2(
        "Upload a photo of your passport in the secure portal to complete KYC.",
      ).matched,
    ).toBe(false);
  });
});

describe("Candidate A2 — recoveries and genuine requests survive", () => {
  it("keeps every scam case Candidate A recovered on the stress set", () => {
    expect(STRESS_A2.recoveredIds).toEqual(STRESS_A.recoveredIds);
    for (const id of [
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
    ]) {
      expect(a2Case(id).candidateMatched).toBe(true);
      expect(a2Case(id).suppressedSafeguards).toEqual([]);
    }
  });

  it("keeps the original and holdout recoveries", () => {
    const original = simulateCandidateA2(EVALUATION_CASES, "original");
    const holdout = simulateCandidateA2(HOLDOUT_CASES, "holdout");
    expect(original.recoveredIds).toEqual(["TL-E-001", "TL-E-019"]);
    expect(holdout.recoveredIds).toEqual([
      "TL-H-003",
      "TL-H-004",
      "TL-H-009",
    ]);
    expect(original.newFalsePositiveIds).toEqual([]);
    expect(holdout.newFalsePositiveIds).toEqual([]);
  });

  it("still flags a plain card-image disclosure request", () => {
    expect(
      detectCredentialSignalA2("Send a photo of your debit card to this chat.").families,
    ).toEqual(["card-image"]);
  });

  it("does not treat ordinary card verification as a card image", () => {
    expect(
      detectCredentialSignalA2(
        "Please read the last four digits on the card to verify the account.",
      ).matched,
    ).toBe(false);
  });

  it("applies card safeguards only to the card-image family", () => {
    const result = detectCredentialSignalA2(
      "Forward the recovery code to yourself before the phone is wiped.",
    );
    expect(result.families).toEqual(["recovery-code"]);
    expect(result.suppressed).toEqual([]);
  });
});

describe("Candidate A2 — recovery codes and negation", () => {
  it("keeps genuine recovery-code requests", () => {
    const result = detectCredentialSignalA2(
      "Forward me the recovery code the app just sent.",
    );
    expect(result.families).toEqual(["recovery-code"]);
  });

  it("keeps recovery-code warnings and storage advice quiet", () => {
    expect(
      detectCredentialSignalA2(
        "Store your backup codes in the password manager, and never share them with anyone.",
      ).matched,
    ).toBe(false);
    expect(
      detectCredentialSignalA2("Never share your recovery code with anyone.").matched,
    ).toBe(false);
  });

  it("does not catch the documented recovery-key miss", () => {
    expect(a2Case("TL-C-009").candidateMatched).toBe(false);
  });

  it("keeps negated card requests quiet and mixed clauses clause-scoped", () => {
    expect(
      detectCredentialSignalA2(
        "Do not send a photo of your card; send a bank statement instead.",
      ).matched,
    ).toBe(false);
    expect(
      detectCredentialSignalA2(
        "Send a photo of your card, not your receipt, to this chat.",
      ).matched,
    ).toBe(true);
  });
});

describe("Candidate A2 — overlay arithmetic", () => {
  const cardScam = caseOf(
    "TL-A2-001",
    "Send a photo of your debit card to confirm the refund.",
  );

  it("reaches Medium from a single credential finding", () => {
    const simulation = simulateCandidateA2([cardScam], "test");
    const outcome = simulation.outcomes[0];
    expect(outcome.baselineScore).toBe(0);
    expect(outcome.simulatedScore).toBe(40);
    expect(outcome.simulatedRisk).toBe("medium");
    expect(outcome.recovered).toBe(true);
  });

  it("never double-counts an existing credential finding", () => {
    const message =
      "Share the OTP you received. Also send a photo of your card to this chat.";
    const baseline = analyzeMessage(message);
    expect(baseline.matchedRuleIds).toContain("credential-request");

    const simulation = simulateCandidateA2(
      [caseOf("TL-A2-002", message)],
      "test",
    );
    const outcome = simulation.outcomes[0];
    expect(outcome.existingCredentialFinding).toBe(true);
    expect(outcome.candidateMatched).toBe(true);
    expect(outcome.simulatedScore).toBe(baseline.score);
    expect(outcome.scoreChanged).toBe(false);
  });

  it("preserves the 100-point cap and the High threshold", () => {
    const message =
      "Congratulations! Your account will be blocked within 24 hours. Click here: http://198.51.100.10/verify and send a photo of your card.";
    const baseline = analyzeMessage(message);
    expect(baseline.score).toBe(80);
    expect(baseline.matchedRuleIds).not.toContain("credential-request");

    const simulation = simulateCandidateA2([caseOf("TL-A2-003", message)], "test");
    const outcome = simulation.outcomes[0];
    expect(outcome.simulatedScore).toBe(100);
    expect(outcome.simulatedRisk).toBe("high");
  });

  it("leaves a non-matching message untouched", () => {
    const simulation = simulateCandidateA2(
      [caseOf("TL-A2-004", "The meeting is at 3 pm.")],
      "test",
    );
    const outcome = simulation.outcomes[0];
    expect(outcome.candidateMatched).toBe(false);
    expect(outcome.simulatedScore).toBe(outcome.baselineScore);
    expect(outcome.simulatedRisk).toBe("low");
  });

  it("is deterministic across repeated runs", () => {
    expect(simulateCandidateA2(STRESS_CASES, "TL-C")).toEqual(
      simulateCandidateA2(STRESS_CASES, "TL-C"),
    );
    expect(detectCredentialSignalA2("Send a photo of your card to this chat.")).toEqual(
      detectCredentialSignalA2("Send a photo of your card to this chat."),
    );
  });
});

describe("Candidate A2 — measured metrics", () => {
  it("reports the refined stress metrics", () => {
    expect(STRESS_A2.simulated).toMatchObject({
      total: 50,
      predictedPositive: 18,
      truePositives: 14,
      falsePositives: 4,
      trueNegatives: 26,
      falseNegatives: 6,
    });
    expect(STRESS_A2.simulated.precision).toBeCloseTo(14 / 18, 10);
    expect(STRESS_A2.simulated.recall).toBeCloseTo(14 / 20, 10);
    expect(STRESS_A2.simulated.f1).toBeCloseTo(0.7368, 4);
    expect(STRESS_A2.newFalsePositiveIds).toEqual([]);
    expect(STRESS_A2.suppressedCaseIds).toEqual([
      "TL-C-029",
      "TL-C-033",
      "TL-C-034",
      "TL-C-060",
    ]);
    expect(STRESS_A2.suppressionCounts).toEqual({
      "excluded-object": 1,
      "not-needed": 0,
      "self-directed": 1,
      "conditional-official-flow": 1,
      "official-portal-no-link": 1,
    });
    expect(STRESS_A2.matchCounts).toEqual({
      "card-image": 5,
      "recovery-code": 5,
      "app-code": 9,
    });
    expect(STRESS_A2.matchedCaseIds).toHaveLength(19);
    expect(STRESS_A2.scoreChanges).toBe(17);
    expect(STRESS_A2.riskBandChanges).toBe(17);
  });

  it("matches Candidate A on the original dataset and holdout", () => {
    const originalA = simulateCandidate(EVALUATION_CASES, "A", "original");
    const originalA2 = simulateCandidateA2(EVALUATION_CASES, "original");
    expect(originalA2.simulated).toEqual(originalA.simulated);
    expect(originalA2.suppressedCaseIds).toEqual([]);

    const holdoutA = simulateCandidate(HOLDOUT_CASES, "A", "holdout");
    const holdoutA2 = simulateCandidateA2(HOLDOUT_CASES, "holdout");
    expect(holdoutA2.simulated).toEqual(holdoutA.simulated);
    expect(holdoutA2.suppressedCaseIds).toEqual([]);
  });

  it("keeps ambiguous cases outside the binary metrics", () => {
    expect(STRESS_A2.binaryTotal).toBe(50);
    expect(STRESS_A2.ambiguous.total).toBe(10);
    expect(STRESS_A2.simulated.total).toBe(50);
    expect(
      STRESS_A2.simulated.truePositives +
        STRESS_A2.simulated.falsePositives +
        STRESS_A2.simulated.trueNegatives +
        STRESS_A2.simulated.falseNegatives,
    ).toBe(50);
    expect(STRESS_A2.ambiguous.newlyFlaggedIds).toEqual([
      "TL-C-051",
      "TL-C-053",
      "TL-C-054",
      "TL-C-055",
      "TL-C-057",
      "TL-C-059",
    ]);
    expect(a2Case("TL-C-060").label).toBe("ambiguous");
    expect(a2Case("TL-C-060").candidateMatched).toBe(false);
    expect(a2Case("TL-C-060").suppressedSafeguards).toEqual([
      "official-portal-no-link",
    ]);
  });

  it("does not change the A or B measurements", () => {
    expect(STRESS_A.simulated).toMatchObject({
      truePositives: 14,
      falsePositives: 7,
      trueNegatives: 23,
      falseNegatives: 6,
    });
    expect(STRESS_A.newFalsePositiveIds).toEqual([
      "TL-C-029",
      "TL-C-033",
      "TL-C-034",
    ]);
    expect(STRESS_A.suppressedCaseIds).toEqual([]);

    expect(STRESS_B.simulated).toMatchObject({
      truePositives: 16,
      falsePositives: 9,
      trueNegatives: 21,
      falseNegatives: 4,
    });
    expect(STRESS_B.newFalsePositiveIds).toEqual([
      "TL-C-026",
      "TL-C-029",
      "TL-C-030",
      "TL-C-033",
      "TL-C-034",
    ]);

    // The two Candidate B-only false positives never had A2 card evidence.
    expect(a2Case("TL-C-026").families).toEqual([]);
    expect(a2Case("TL-C-030").families).toEqual([]);
  });
});

describe("Candidate A2 — dataset and baseline protection", () => {
  it("keeps the three dataset contents frozen", () => {
    expect(contentFingerprint(EVALUATION_CASES)).toBe("f09babc7");
    expect(contentFingerprint(HOLDOUT_CASES)).toBe("1747e87e");
    expect(contentFingerprint(STRESS_CASES)).toBe("4509fd78");
  });

  it("keeps the existing baseline reports byte-identical", () => {
    expect(textFingerprint(formatReport(evaluateDataset(EVALUATION_CASES)))).toBe(
      "7da6717f",
    );
    expect(
      textFingerprint(
        formatReport(evaluateDataset(HOLDOUT_CASES), {
          title: "TrustLens holdout evaluation",
          dataset: "TL-H independently authored holdout (50 cases)",
        }),
      ),
    ).toBe("9ddc53a9");
    expect(evaluateDataset(STRESS_CASES).binary).toMatchObject({
      truePositives: 3,
      falsePositives: 4,
      trueNegatives: 26,
      falseNegatives: 17,
    });
  });
});

describe("Candidate A2 — output privacy", () => {
  it("runs with fetch disabled", () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (() => {
      throw new Error("network access attempted during A2 evaluation");
    }) as unknown as typeof fetch;

    try {
      expect(() => simulateCandidateA2(STRESS_CASES, "TL-C")).not.toThrow();
      expect(() => simulateCandidateA2(EVALUATION_CASES, "original")).not.toThrow();
      expect(() => detectCredentialSignalA2("Send a photo of your card.")).not.toThrow();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("prints case IDs and aggregate counts only", () => {
    const output = formatCandidateSimulation(STRESS_A2);
    expect(output).toContain("NOT production output");
    expect(output).toContain("Candidate: A2");
    expect(output).not.toMatch(/https?:\/\//);
    for (const entry of [...STRESS_CASES, ...EVALUATION_CASES, ...HOLDOUT_CASES]) {
      if (entry.message.length > 30) {
        expect(output).not.toContain(entry.message);
      }
      expect(output).not.toContain(entry.rationale);
    }
  });
});
