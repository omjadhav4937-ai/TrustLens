import { describe, expect, it } from "bun:test";
import { SAMPLE_MESSAGE } from "@/data/trust-lens";
import { MAX_SCORE, analyzeMessage } from "./engine";
import { RULES } from "./rules";
import type { RuleEvaluation, ScamAnalysis } from "./types";

/**
 * The rule-coverage contract: every configured rule must be reported with the
 * decision it reached, so the interface can show all five rules without
 * inferring anything from the findings array.
 *
 * Every message here is fictional. No real credentials or live malicious URLs
 * are used anywhere.
 */

const RULE_IDS = [
  "urgency-pressure",
  "account-threat",
  "suspicious-link",
  "credential-request",
  "prize-bait",
];

const ALL_RULES_MESSAGE =
  "URGENT: your account will be blocked today. Click here http://sbi-kyc-verify.online/update and share the OTP you received to claim your prize.";

const ORDINARY_MESSAGE = "Hi Mum, I'll be home around 7. Do you need anything?";

function evaluationOf(analysis: ScamAnalysis, ruleId: string): RuleEvaluation {
  const found = analysis.ruleEvaluations.find(
    (evaluation) => evaluation.ruleId === ruleId,
  );
  if (!found) throw new Error(`no evaluation reported for ${ruleId}`);
  return found;
}

function statuses(analysis: ScamAnalysis): Record<string, string> {
  return Object.fromEntries(
    analysis.ruleEvaluations.map((evaluation) => [
      evaluation.ruleId,
      evaluation.status,
    ]),
  );
}

describe("rule coverage", () => {
  it("lists every configured rule, in configuration order, whatever the message", () => {
    const messages = ["", "   ", ORDINARY_MESSAGE, ALL_RULES_MESSAGE, SAMPLE_MESSAGE];

    for (const message of messages) {
      const analysis = analyzeMessage(message);
      expect(analysis.ruleEvaluations.map((evaluation) => evaluation.ruleId)).toEqual(
        RULE_IDS,
      );
      expect(analysis.ruleEvaluations).toHaveLength(RULES.length);
    }
  });

  it("reports the published maximum weight and a description for every rule", () => {
    const analysis = analyzeMessage(ORDINARY_MESSAGE);

    for (const rule of RULES) {
      const evaluation = evaluationOf(analysis, rule.id);
      expect(evaluation.weight).toBe(rule.weight);
      expect(evaluation.label).toBe(rule.label);
      expect(evaluation.description.length).toBeGreaterThan(0);
      expect(evaluation.shortLabel.length).toBeGreaterThan(0);
    }
  });

  it("reports identical rule ids and weights as the rule module", () => {
    const analysis = analyzeMessage(ALL_RULES_MESSAGE);
    expect(analysis.ruleEvaluations.map((evaluation) => evaluation.weight)).toEqual(
      RULES.map((rule) => rule.weight),
    );
  });

  it("marks every rule as not evaluated when there is no message to analyse", () => {
    for (const message of ["", "   \n\t "]) {
      const analysis = analyzeMessage(message);
      expect(
        analysis.ruleEvaluations.every(
          (evaluation) => evaluation.status === "not-evaluated",
        ),
      ).toBe(true);
      expect(analysis.evaluatedRuleCount).toBe(0);
      expect(
        analysis.ruleEvaluations.every(
          (evaluation) => evaluation.contributedPoints === 0,
        ),
      ).toBe(true);
      expect(
        analysis.ruleEvaluations.every(
          (evaluation) => evaluation.matchedText === null,
        ),
      ).toBe(true);
    }
  });

  it("does not present a rule it never ran as a non-match", () => {
    const empty = analyzeMessage("");
    expect(statuses(empty)["urgency-pressure"]).toBe("not-evaluated");
    expect(statuses(empty)["urgency-pressure"]).not.toBe("not-matched");
  });

  it("marks every rule as evaluated once a message is submitted", () => {
    const analysis = analyzeMessage(ORDINARY_MESSAGE);
    expect(analysis.evaluatedRuleCount).toBe(RULES.length);
    expect(
      analysis.ruleEvaluations.every((evaluation) => evaluation.status === "not-matched"),
    ).toBe(true);
  });

  it("reports matched and not-matched states independently per rule", () => {
    const urgencyOnly = analyzeMessage(
      "Please respond immediately regarding your query.",
    );
    expect(statuses(urgencyOnly)).toEqual({
      "urgency-pressure": "matched",
      "account-threat": "not-matched",
      "suspicious-link": "not-matched",
      "credential-request": "not-matched",
      "prize-bait": "not-matched",
    });
    expect(urgencyOnly.evaluatedRuleCount).toBe(RULES.length);

    const sample = analyzeMessage(SAMPLE_MESSAGE);
    expect(statuses(sample)).toEqual({
      "urgency-pressure": "matched",
      "account-threat": "matched",
      "suspicious-link": "matched",
      "credential-request": "matched",
      "prize-bait": "not-matched",
    });
  });

  it("keeps the evaluation list in step with the findings array", () => {
    const analysis = analyzeMessage(ALL_RULES_MESSAGE);
    const matchedIds = analysis.ruleEvaluations
      .filter((evaluation) => evaluation.status === "matched")
      .map((evaluation) => evaluation.ruleId);

    expect(matchedIds.sort()).toEqual([...analysis.matchedRuleIds].sort());
    expect(matchedIds).toEqual([...RULE_IDS].sort());
    expect(analysis.findings).toHaveLength(matchedIds.length);

    // The evaluation list keeps configuration order even though the findings
    // are sorted strongest first.
    expect(analysis.ruleEvaluations.map((evaluation) => evaluation.ruleId)).toEqual(
      RULE_IDS,
    );
  });

  it("carries the counted text and its places only for a matched rule", () => {
    const analysis = analyzeMessage(SAMPLE_MESSAGE);

    for (const evaluation of analysis.ruleEvaluations) {
      if (evaluation.status === "matched") {
        expect(evaluation.matchedText).not.toBeNull();
        expect(evaluation.occurrences.length).toBeGreaterThan(0);
        expect(evaluation.matchedPhrases.length).toBeGreaterThan(0);
      } else {
        expect(evaluation.matchedText).toBeNull();
        expect(evaluation.occurrences).toEqual([]);
        expect(evaluation.matchedPhrases).toEqual([]);
      }
    }
  });
});

describe("score contributions", () => {
  it("adds the matched weights to the raw score", () => {
    const analysis = analyzeMessage(
      "Urgent: your account will be suspended immediately.",
    );

    expect(evaluationOf(analysis, "urgency-pressure").contributedPoints).toBe(20);
    expect(evaluationOf(analysis, "account-threat").contributedPoints).toBe(15);
    expect(evaluationOf(analysis, "suspicious-link").contributedPoints).toBe(0);
    expect(analysis.rawScore).toBe(35);
    expect(analysis.score).toBe(35);
    expect(analysis.scoreWasCapped).toBe(false);
  });

  it("keeps the reported contributions equal to the raw score for every message", () => {
    const messages = [
      ORDINARY_MESSAGE,
      "Please respond immediately regarding your query.",
      SAMPLE_MESSAGE,
      ALL_RULES_MESSAGE,
      "Congratulations! You have won a free gift voucher worth Rs 5000.",
    ];

    for (const message of messages) {
      const analysis = analyzeMessage(message);
      const sum = analysis.ruleEvaluations.reduce(
        (total, evaluation) => total + evaluation.contributedPoints,
        0,
      );
      expect(sum).toBe(analysis.rawScore);
      expect(
        analysis.ruleEvaluations
          .filter((evaluation) => evaluation.status !== "matched")
          .every((evaluation) => evaluation.contributedPoints === 0),
      ).toBe(true);
    }
  });

  it("keeps the raw sum while capping the final score", () => {
    const analysis = analyzeMessage(ALL_RULES_MESSAGE);

    expect(analysis.rawScore).toBe(120);
    expect(analysis.score).toBe(MAX_SCORE);
    expect(analysis.scoreWasCapped).toBe(true);
    expect(analysis.riskLevel).toBe("high");
  });

  it("does not report a cap when the sum already fits", () => {
    const analysis = analyzeMessage(SAMPLE_MESSAGE);

    expect(analysis.rawScore).toBe(100);
    expect(analysis.score).toBe(100);
    expect(analysis.scoreWasCapped).toBe(false);
  });

  it("explains the cap instead of silently losing the overflow", () => {
    const capped = analyzeMessage(ALL_RULES_MESSAGE);
    expect(capped.scoreExplanation).toContain("add up to 120 points");
    expect(capped.scoreExplanation).toContain("capped");

    const uncapped = analyzeMessage(SAMPLE_MESSAGE);
    expect(uncapped.scoreExplanation).not.toContain("capped");
  });

  it("counts several URL indicators and click prompts only once", () => {
    const analysis = analyzeMessage(
      "Verify your account at http://203.0.113.9/a or http://198.51.100.7/b or https://bit.ly/xyz1 and click here",
    );

    const suspicious = analysis.links.filter((link) => link.suspicious);
    const indicators = analysis.links.reduce(
      (total, link) => total + link.indicators.length,
      0,
    );

    // Several flags across three links, plus a separate click prompt.
    expect(suspicious).toHaveLength(3);
    expect(indicators).toBeGreaterThan(3);

    const linkRule = evaluationOf(analysis, "suspicious-link");
    expect(linkRule.status).toBe("matched");
    expect(linkRule.weight).toBe(25);
    expect(linkRule.contributedPoints).toBe(25);
    expect(linkRule.occurrences.length).toBeGreaterThan(1);

    // The whole message scores the link weight exactly once.
    expect(analysis.rawScore).toBe(25);
    expect(analysis.score).toBe(25);
  });

  it("counts one link and one click prompt as the same single rule", () => {
    const single = analyzeMessage(
      "Your parcel could not be delivered. Click here: http://203.0.113.9/track",
    );
    expect(evaluationOf(single, "suspicious-link").contributedPoints).toBe(25);
    expect(single.rawScore).toBe(25);
  });
});

describe("score explanation", () => {
  it("names the single warning sign that matched", () => {
    const analysis = analyzeMessage(
      "Please respond immediately regarding your query.",
    );
    expect(analysis.scoreExplanation).toContain("One configured warning sign matched");
    expect(analysis.scoreExplanation).toContain("urgency pressure");
  });

  it("says several when more than one matched", () => {
    const analysis = analyzeMessage(
      "Urgent: your account will be suspended immediately.",
    );
    expect(analysis.scoreExplanation).toContain("Several warning signs matched");
  });

  it("counts the matched rules against the configured total when most match", () => {
    const analysis = analyzeMessage(ALL_RULES_MESSAGE);
    expect(analysis.scoreExplanation).toContain(
      `5 of the ${RULES.length} configured warning signs matched`,
    );
    expect(analysis.scoreExplanation).toContain("a request for sensitive credentials");
  });

  it("never presents a clean result as proof of safety", () => {
    const analysis = analyzeMessage(ORDINARY_MESSAGE);
    expect(analysis.scoreExplanation).toContain("No configured warning signs matched");
    expect(analysis.scoreExplanation).toContain("does not guarantee");
  });

  it("does not claim a measured accuracy", () => {
    const messages = ["", ORDINARY_MESSAGE, SAMPLE_MESSAGE, ALL_RULES_MESSAGE];

    for (const message of messages) {
      const explanation = analyzeMessage(message).scoreExplanation.toLowerCase();
      expect(explanation).not.toContain("accuracy");
      expect(explanation).not.toContain("%");
      expect(explanation).not.toContain("prevent");
    }
  });

  it("agrees with the findings it was generated from", () => {
    const analysis = analyzeMessage(SAMPLE_MESSAGE);

    expect(analysis.findings).toHaveLength(4);
    expect(analysis.scoreExplanation).toContain("4 of the 5 configured warning signs");
    expect(analysis.scoreExplanation).not.toContain("No configured warning signs");
    // The number itself is rendered next to the sentence, so the sentence never
    // repeats a score that could drift away from the ring.
    expect(analysis.scoreExplanation).not.toContain("100");
  });
});
