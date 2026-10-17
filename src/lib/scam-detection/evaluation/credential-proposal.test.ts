import { describe, expect, it } from "bun:test";
import { analyzeMessage } from "../engine";
import {
  detectCredentialSignal,
  formatCandidateSimulation,
  simulateCandidate,
} from "./credential-proposal";
import { EVALUATION_CASES } from "./dataset";
import { HOLDOUT_CASES } from "./holdout";
import type { EvaluationCase, ExpectedLabel } from "./types";

/**
 * Tests for the evaluation-only credential proposal.
 *
 * Nothing here touches the shipped rule: the overlay is measured against the
 * real engine output, and the datasets are read-only fixtures.
 */

function caseOf(
  id: string,
  label: ExpectedLabel,
  message: string,
): EvaluationCase {
  return {
    id,
    bucket: label,
    label,
    challenge: "otp-credential-request",
    message,
    rationale: "Synthetic test fixture for the credential proposal.",
  };
}

function families(message: string, candidate: "A" | "B"): string[] {
  return detectCredentialSignal(message, candidate).families;
}

/** FNV-1a over ID, label and text: a content guard for the frozen datasets. */
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

const CARD_PHOTO =
  "Please send a photo of your debit card to confirm the order.";
const CARD_MENTION = "Keep a photo of your card in a safe place.";
const CARD_NEGATED = "Never send a photo of your card to anyone.";
const CARD_IN_APP =
  "Upload a photo of your ID in the app to finish verification.";
const PASSPORT_SCAN = "Email a scan of your passport before the interview.";
const GIFT_CARD_PHOTO =
  "Can you send me a photo of the gift card you bought?";

const RECOVERY_REQUEST =
  "Forward me the recovery code the app just sent.";
const RECOVERY_WARNING = "Never share your backup codes with anyone.";
const RECOVERY_STORAGE = "Store your backup codes somewhere safe.";

const APP_CODE = "Send the six-digit code shown in the app.";
const APP_CODE_ONBOARDING = "Enter the code shown in the app to sign in.";
const APP_CODE_LONG = "We need the six-digit verification code sent to your mobile number.";
const APP_CODE_HINGLISH = "Turant code bhejiye jo abhi SMS aaya hai.";
const APP_CODE_NO_CONTEXT = "Send me the gift card codes.";
const APP_CODE_MENTION = "Your code is valid for 10 minutes.";
const APP_CODE_NEGATED = "Do not share the code with anyone.";

describe("Candidate A — conservative matchers", () => {
  it("matches a clear payment-card image request", () => {
    const result = detectCredentialSignal(CARD_PHOTO, "A");
    expect(result.matched).toBe(true);
    expect(result.families).toEqual(["card-image"]);
    expect(result.evidence[0].reason).toBe("card-image-request");
  });

  it("ignores card mentions without a request", () => {
    expect(families(CARD_MENTION, "A")).toEqual([]);
  });

  it("ignores negated card-image requests", () => {
    expect(families(CARD_NEGATED, "A")).toEqual([]);
  });

  it("ignores a gift-card photo", () => {
    expect(families(GIFT_CARD_PHOTO, "A")).toEqual([]);
  });

  it("matches a recovery-code disclosure request", () => {
    expect(families(RECOVERY_REQUEST, "A")).toEqual(["recovery-code"]);
  });

  it("ignores recovery-code storage advice and warnings", () => {
    expect(families(RECOVERY_STORAGE, "A")).toEqual([]);
    expect(families(RECOVERY_WARNING, "A")).toEqual([]);
  });

  it("matches a code shown in an app when disclosure is requested", () => {
    expect(families(APP_CODE, "A")).toEqual(["app-code"]);
  });

  it("does not treat an in-app entry instruction as disclosure", () => {
    expect(families(APP_CODE_ONBOARDING, "A")).toEqual([]);
  });

  it("does not recognise the broader or code-mixed forms", () => {
    expect(families(PASSPORT_SCAN, "A")).toEqual([]);
    expect(families(APP_CODE_LONG, "A")).toEqual([]);
    expect(families(APP_CODE_HINGLISH, "A")).toEqual([]);
  });

  it("ignores code mentions, gift-card codes and negated requests", () => {
    expect(families(APP_CODE_MENTION, "A")).toEqual([]);
    expect(families(APP_CODE_NO_CONTEXT, "A")).toEqual([]);
    expect(families(APP_CODE_NEGATED, "A")).toEqual([]);
  });

  it("ignores ordinary password mentions and legitimate password setup", () => {
    expect(
      families(
        "Your password manager reminder: change your password every 90 days.",
        "A",
      ),
    ).toEqual([]);
    expect(
      families("Create a password and confirm it on the next screen.", "B"),
    ).toEqual([]);
  });
});

describe("Candidate B — broader matchers", () => {
  it("keeps the payment-card behaviour and adds identity documents", () => {
    expect(families(CARD_PHOTO, "B")).toEqual(["card-image"]);
    expect(families(PASSPORT_SCAN, "B")).toEqual(["card-image"]);
    expect(
      detectCredentialSignal(PASSPORT_SCAN, "B").evidence[0].reason,
    ).toBe("identity-card-image-request");
  });

  it("does not flag an in-app photo upload", () => {
    expect(families(CARD_IN_APP, "B")).toEqual([]);
  });

  it("still ignores negated requests, gift cards and plain mentions", () => {
    expect(families(CARD_NEGATED, "B")).toEqual([]);
    expect(families(GIFT_CARD_PHOTO, "B")).toEqual([]);
    expect(families(CARD_MENTION, "B")).toEqual([]);
  });

  it("matches recovery-code requests but not storage advice or warnings", () => {
    expect(families(RECOVERY_REQUEST, "B")).toEqual(["recovery-code"]);
    expect(families(RECOVERY_STORAGE, "B")).toEqual([]);
    expect(families(RECOVERY_WARNING, "B")).toEqual([]);
  });

  it("needs a nearby code term rather than a loose 'code'", () => {
    expect(families(APP_CODE_LONG, "B")).toEqual(["app-code"]);
    expect(families(APP_CODE_MENTION, "B")).toEqual([]);
    expect(families(APP_CODE_NO_CONTEXT, "B")).toEqual([]);
  });

  it("recognises the code-mixed request and labels its evidence", () => {
    const result = detectCredentialSignal(APP_CODE_HINGLISH, "B");
    expect(result.families).toEqual(["app-code"]);
    expect(result.evidence[0].reason).toBe("code-mixed-code-request");
  });

  it("still ignores a negated disclosure request", () => {
    expect(families(APP_CODE_NEGATED, "B")).toEqual([]);
  });
});

describe("simulation overlay", () => {
  it("never double-counts an existing credential finding", () => {
    const message =
      "Send the six-digit code shown in the app. Share the OTP you received.";
    const baseline = analyzeMessage(message);
    expect(baseline.score).toBe(40);
    expect(baseline.matchedRuleIds).toContain("credential-request");

    const simulation = simulateCandidate(
      [caseOf("TL-T-001", "scam", message)],
      "B",
      "test",
    );
    expect(simulation.outcomes[0].existingCredentialFinding).toBe(true);
    expect(simulation.outcomes[0].simulatedScore).toBe(40);
    expect(simulation.outcomes[0].scoreChanged).toBe(false);
  });

  it("adds the existing 40 points once and preserves the 100 cap", () => {
    const message =
      "Congratulations! Your account will be blocked within 24 hours. Click here: http://198.51.100.10/verify and send the six-digit code shown in the app.";
    const baseline = analyzeMessage(message);
    expect(baseline.score).toBe(80);
    expect(baseline.matchedRuleIds).not.toContain("credential-request");

    const simulation = simulateCandidate(
      [caseOf("TL-T-002", "scam", message)],
      "A",
      "test",
    );
    const outcome = simulation.outcomes[0];
    expect(outcome.simulatedScore).toBe(100);
    expect(outcome.simulatedRisk).toBe("high");
    expect(outcome.scoreChanged).toBe(true);
    expect(outcome.bandChanged).toBe(false);
  });

  it("leaves non-matching messages untouched", () => {
    const message = "The meeting is at 3 pm.";
    const simulation = simulateCandidate(
      [caseOf("TL-T-003", "legitimate", message)],
      "B",
      "test",
    );
    expect(simulation.outcomes[0].candidateMatched).toBe(false);
    expect(simulation.outcomes[0].simulatedScore).toBe(
      simulation.outcomes[0].baselineScore,
    );
    expect(simulation.outcomes[0].simulatedRisk).toBe("low");
  });

  it("changes the band when a recovered case reaches Medium", () => {
    const simulation = simulateCandidate(HOLDOUT_CASES, "A", "holdout");
    const outcome = simulation.outcomes.find(
      (item) => item.id === "TL-H-003",
    )!;

    expect(outcome.baselineScore).toBe(0);
    expect(outcome.baselineRisk).toBe("low");
    expect(outcome.candidateMatched).toBe(true);
    expect(outcome.families).toEqual(["card-image"]);
    expect(outcome.simulatedScore).toBe(40);
    expect(outcome.simulatedRisk).toBe("medium");
    expect(outcome.recovered).toBe(true);
    expect(simulation.recoveredIds).toContain("TL-H-003");
  });

  it("reports the measured simulated metrics for both candidates", () => {
    const originalA = simulateCandidate(EVALUATION_CASES, "A", "original");
    const originalB = simulateCandidate(EVALUATION_CASES, "B", "original");
    const holdoutA = simulateCandidate(HOLDOUT_CASES, "A", "holdout");
    const holdoutB = simulateCandidate(HOLDOUT_CASES, "B", "holdout");

    expect(originalA.simulated).toMatchObject({
      truePositives: 27,
      falsePositives: 3,
      trueNegatives: 33,
      falseNegatives: 11,
    });
    expect(originalB.simulated).toMatchObject({
      truePositives: 29,
      falsePositives: 3,
      trueNegatives: 33,
      falseNegatives: 9,
    });
    expect(holdoutA.simulated).toMatchObject({
      truePositives: 15,
      falsePositives: 1,
      trueNegatives: 19,
      falseNegatives: 5,
    });
    expect(holdoutB.simulated).toMatchObject({
      truePositives: 15,
      falsePositives: 1,
      trueNegatives: 19,
      falseNegatives: 5,
    });

    expect(originalA.recoveredIds).toEqual(["TL-E-001", "TL-E-019"]);
    expect(originalB.recoveredIds).toEqual([
      "TL-E-001",
      "TL-E-002",
      "TL-E-005",
      "TL-E-019",
    ]);
    expect(holdoutA.recoveredIds).toEqual([
      "TL-H-003",
      "TL-H-004",
      "TL-H-009",
    ]);
    expect(holdoutB.recoveredIds).toEqual([
      "TL-H-003",
      "TL-H-004",
      "TL-H-009",
    ]);
    expect(originalA.newFalsePositiveIds).toEqual([]);
    expect(originalB.newFalsePositiveIds).toEqual([]);
    expect(holdoutA.newFalsePositiveIds).toEqual([]);
    expect(holdoutB.newFalsePositiveIds).toEqual([]);

    expect(originalA.scoreChanges).toBe(3);
    expect(originalB.scoreChanges).toBe(5);
    expect(holdoutA.scoreChanges).toBe(3);
    expect(holdoutB.scoreChanges).toBe(4);
  });

  it("keeps the shipped baseline metrics inside the overlay", () => {
    const original = simulateCandidate(EVALUATION_CASES, "A", "original");
    expect(original.baseline).toMatchObject({
      total: 74,
      truePositives: 25,
      falsePositives: 3,
      trueNegatives: 33,
      falseNegatives: 13,
    });
    expect(original.baseline.precision).toBeCloseTo(25 / 28, 10);
    expect(original.baseline.recall).toBeCloseTo(25 / 38, 10);

    const holdout = simulateCandidate(HOLDOUT_CASES, "B", "holdout");
    expect(holdout.baseline).toMatchObject({
      total: 40,
      truePositives: 12,
      falsePositives: 1,
      trueNegatives: 19,
      falseNegatives: 8,
    });
    expect(holdout.baseline.precision).toBeCloseTo(12 / 13, 10);
    expect(holdout.baseline.recall).toBeCloseTo(12 / 20, 10);
  });

  it("excludes ambiguous cases from the binary metrics", () => {
    const simulation = simulateCandidate(HOLDOUT_CASES, "A", "holdout");
    expect(simulation.totalCases).toBe(50);
    expect(simulation.binaryTotal).toBe(40);
    expect(simulation.ambiguous.total).toBe(10);
    expect(simulation.simulated.total).toBe(40);
    expect(
      simulation.simulated.truePositives +
        simulation.simulated.falsePositives +
        simulation.simulated.trueNegatives +
        simulation.simulated.falseNegatives,
    ).toBe(40);
    expect(simulation.ambiguous.newlyFlaggedIds).toEqual([]);
  });

  it("reports undefined metrics when a denominator is zero", () => {
    const simulation = simulateCandidate(
      [caseOf("TL-T-004", "legitimate", "The meeting is at 3 pm.")],
      "A",
      "test",
    );
    expect(simulation.simulated.precision).toBeNull();
    expect(simulation.simulated.recall).toBeNull();
    expect(simulation.simulated.f1).toBeNull();
    expect(formatCandidateSimulation(simulation)).toContain(
      "Precision undefined",
    );
  });

  it("is deterministic across repeated runs", () => {
    expect(simulateCandidate(EVALUATION_CASES, "B", "original")).toEqual(
      simulateCandidate(EVALUATION_CASES, "B", "original"),
    );
    expect(simulateCandidate(HOLDOUT_CASES, "A", "holdout")).toEqual(
      simulateCandidate(HOLDOUT_CASES, "A", "holdout"),
    );
  });

  it("runs with fetch disabled", () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (() => {
      throw new Error("network access attempted during proposal dry run");
    }) as unknown as typeof fetch;

    try {
      expect(() => simulateCandidate(EVALUATION_CASES, "A", "original")).not.toThrow();
      expect(() => simulateCandidate(HOLDOUT_CASES, "B", "holdout")).not.toThrow();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("prints case IDs only, never messages or rationales", () => {
    const output = formatCandidateSimulation(
      simulateCandidate(EVALUATION_CASES, "B", "original"),
    );

    expect(output).toContain("NOT production output");
    expect(output).toContain("Dataset: original");
    expect(output).not.toMatch(/https?:\/\//);
    for (const entry of [...EVALUATION_CASES, ...HOLDOUT_CASES]) {
      if (entry.message.length > 30) {
        expect(output).not.toContain(entry.message);
      }
      expect(output).not.toContain(entry.rationale);
    }
  });
});

describe("dataset protection", () => {
  it("keeps the exact dataset contents frozen", () => {
    expect(contentFingerprint(EVALUATION_CASES)).toBe("f09babc7");
    expect(contentFingerprint(HOLDOUT_CASES)).toBe("1747e87e");
  });

  it("leaves the original 100 cases and holdout 50 cases intact", () => {
    expect(EVALUATION_CASES).toHaveLength(100);
    expect(HOLDOUT_CASES).toHaveLength(50);
    expect(
      EVALUATION_CASES.filter((entry) => entry.label === "scam"),
    ).toHaveLength(38);
    expect(
      EVALUATION_CASES.filter((entry) => entry.label === "legitimate"),
    ).toHaveLength(36);
    expect(
      EVALUATION_CASES.filter((entry) => entry.label === "ambiguous"),
    ).toHaveLength(26);
    expect(
      HOLDOUT_CASES.filter((entry) => entry.label === "scam"),
    ).toHaveLength(20);
    expect(
      HOLDOUT_CASES.filter((entry) => entry.label === "legitimate"),
    ).toHaveLength(20);
    expect(
      HOLDOUT_CASES.filter((entry) => entry.label === "ambiguous"),
    ).toHaveLength(10);

    expect(EVALUATION_CASES.some((entry) => entry.id.startsWith("TL-H-"))).toBe(
      false,
    );
    expect(
      HOLDOUT_CASES.some((entry) =>
        /^TL-(?:S|L|A|E)-/.test(entry.id),
      ),
    ).toBe(false);
  });
});
