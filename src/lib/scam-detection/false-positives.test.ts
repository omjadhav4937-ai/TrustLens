import { describe, expect, it } from "bun:test";
import { SAMPLE_MESSAGE } from "@/data/trust-lens";
import { analyzeMessage } from "./engine";
import { RULES } from "./rules";
import type { RuleEvaluation, ScamAnalysis } from "./types";

/**
 * Legitimate messages next to the scams that must still be caught.
 *
 * Every message here is fictional. The brand names are used only to shape the
 * wording, and none of the addresses resolves to anything.
 */

function evaluationOf(analysis: ScamAnalysis, ruleId: string): RuleEvaluation {
  const found = analysis.ruleEvaluations.find(
    (evaluation) => evaluation.ruleId === ruleId,
  );
  if (!found) throw new Error(`no evaluation reported for ${ruleId}`);
  return found;
}

describe("legitimate OTP and security notices", () => {
  const genuineNotices = [
    "482193 is your OTP for a transaction of INR 450.00 at a fictional store. Do not share it with anyone, not even bank staff.",
    "123456 is your one-time password for your transaction. Never share your OTP with anyone.",
    "Your OTP for the payment you started is 903112. Do not disclose it to anyone.",
    "Use code 556677 to log in. Never share this code with anyone.",
    "We noticed a sign-in from a new device. If this was not you, call the number on the back of your card. Never share your password with anyone.",
  ];

  it("does not score a genuine notice that names a code and warns against sharing it", () => {
    for (const message of genuineNotices) {
      const analysis = analyzeMessage(message);
      expect(analysis.matchedRuleIds).not.toContain("credential-request");
      expect(analysis.score).toBe(0);
      expect(analysis.riskLevel).toBe("low");
    }
  });

  it("still reports the credential rule as evaluated, with a note explaining the decision", () => {
    const analysis = analyzeMessage(genuineNotices[0]);
    const evaluation = evaluationOf(analysis, "credential-request");

    expect(evaluation.status).toBe("not-matched");
    expect(evaluation.contributedPoints).toBe(0);
    expect(evaluation.note).not.toBeNull();
    expect(evaluation.note).toContain("did not count it");
    expect(analysis.evaluatedRuleCount).toBe(RULES.length);
  });

  it("does not present the skipped credential rule as a clean result", () => {
    const evaluation = evaluationOf(
      analyzeMessage(genuineNotices[1]),
      "credential-request",
    );
    // A note is the difference between "we checked and found nothing" and
    // "we found something we chose not to count".
    expect(evaluation.note).not.toBeNull();
    expect(evaluation.matchedText).toBeNull();
  });

  it("still counts a code that is named without any warning not to share it", () => {
    // Documented limitation: a bare mention with neither a request nor a
    // warning is counted, because a genuine notice normally carries the warning.
    const analysis = analyzeMessage("The OTP you received is valid for 10 minutes.");
    const evaluation = evaluationOf(analysis, "credential-request");

    expect(evaluation.status).toBe("matched");
    expect(evaluation.contributedPoints).toBe(40);
    expect(evaluation.note).toContain("no warning not to share it");
  });

  it("does not score a plain account-security notification", () => {
    const analysis = analyzeMessage(
      "A new sign-in to your account was noticed from an unfamiliar device. If this was you, no action is needed.",
    );
    expect(analysis.score).toBe(0);
    expect(analysis.findings).toHaveLength(0);
  });
});

describe("scam variants that must still be caught", () => {
  it("catches a request for a code with no warning attached", () => {
    const analysis = analyzeMessage(
      "Please share the OTP you received to verify your account.",
    );
    expect(evaluationOf(analysis, "credential-request").status).toBe("matched");
    expect(analysis.score).toBe(40);
    expect(analysis.riskLevel).toBe("medium");
  });

  it("catches a request that hides behind its own warning", () => {
    const analysis = analyzeMessage(
      "Do not share this OTP with anyone except our executive. Share the OTP now to restore services.",
    );

    const evaluation = evaluationOf(analysis, "credential-request");
    expect(evaluation.status).toBe("matched");
    expect(evaluation.contributedPoints).toBe(40);
    expect(evaluation.note).toContain("still asks for it");
  });

  it("catches a request phrased as a command with the code sent separately", () => {
    const analysis = analyzeMessage(
      "Your OTP is 4821. Send it to our agent to unblock your account.",
    );
    expect(evaluationOf(analysis, "credential-request").status).toBe("matched");
  });

  it("catches a request for card details", () => {
    const analysis = analyzeMessage(
      "Share the CVV and card PIN to confirm your identity.",
    );
    expect(evaluationOf(analysis, "credential-request").status).toBe("matched");
    expect(analysis.score).toBe(40);
  });
});

describe("legitimate reward and cashback notifications", () => {
  const ordinaryRewards = [
    "Your cashback of Rs 40 has been credited to your account statement.",
    "You have earned 240 reward points on your credit card this month.",
    "Your gift card balance is Rs 250.",
    "Your voucher was applied at checkout and the balance is zero.",
  ];

  it("does not score ordinary balance and cashback mail", () => {
    for (const message of ordinaryRewards) {
      const analysis = analyzeMessage(message);
      expect(analysis.matchedRuleIds).not.toContain("prize-bait");
      expect(analysis.score).toBe(0);
    }
  });

  it("explains why the reward wording was not counted", () => {
    const evaluation = evaluationOf(
      analyzeMessage(ordinaryRewards[0]),
      "prize-bait",
    );
    expect(evaluation.status).toBe("not-matched");
    expect(evaluation.note).toContain("did not count it");
  });

  it("still counts real bait wording", () => {
    const congratulations = analyzeMessage(
      "Congratulations! You have won a free gift voucher worth Rs 5000. Claim it now.",
    );
    expect(evaluationOf(congratulations, "prize-bait").status).toBe("matched");
    expect(evaluationOf(congratulations, "prize-bait").contributedPoints).toBe(20);
  });

  it("still counts a reward that comes with a claim", () => {
    const claim = analyzeMessage("Claim your cashback of Rs 750 before it expires.");
    expect(evaluationOf(claim, "prize-bait").status).toBe("matched");
  });

  it("still counts a reward that is waiting to be redeemed", () => {
    const waiting = analyzeMessage(
      "Your reward of Rs 25000 is waiting. Redeem it now.",
    );
    expect(evaluationOf(waiting, "prize-bait").status).toBe("matched");
    expect(evaluationOf(waiting, "prize-bait").contributedPoints).toBe(20);
  });
});

describe("ordinary URLs", () => {
  const ordinaryLinks = [
    "The meeting notes are at https://docs.example.com/notes",
    "Our new website is https://my-blog-site.info/posts",
    "Read the guide at https://example.co.uk/guide",
    "News is at https://timesofindia.indiatimes.com/article/12345678",
    "Bookings are open at https://www.irctc.co.in/",
    "Track your parcel at https://www.indiapost.gov.in/track",
  ];

  it("does not flag an ordinary address as a suspicious link", () => {
    for (const message of ordinaryLinks) {
      const analysis = analyzeMessage(message);
      expect(analysis.links).toHaveLength(1);
      expect(analysis.links[0].suspicious).toBe(false);
      expect(analysis.matchedRuleIds).not.toContain("suspicious-link");
      expect(analysis.score).toBe(0);
    }
  });

  it("still flags a link that raises a strong indicator", () => {
    const analysis = analyzeMessage("Track it at http://203.0.113.9/track");
    expect(evaluationOf(analysis, "suspicious-link").status).toBe("matched");
    expect(analysis.score).toBe(25);
  });

  it("still flags a deceptive domain built to imitate a bank", () => {
    const analysis = analyzeMessage("Verify at http://sbi-kyc-verify.online/update");
    expect(analysis.links[0].suspicious).toBe(true);
    expect(analysis.links[0].indicators.map((item) => item.id)).toContain(
      "lookalike-domain",
    );
  });
});

describe("postal PIN codes", () => {
  const postalMessages = [
    "Your consignment is out for delivery. PIN code 560001, Bengaluru.",
    "Address: 42 MG Road, Pune 411001. PIN code must be mentioned on the packet.",
    "Please confirm the PIN code 110001 before the courier is dispatched.",
  ];

  it("does not treat a postal PIN code as a banking PIN", () => {
    for (const message of postalMessages) {
      const analysis = analyzeMessage(message);
      expect(analysis.matchedRuleIds).not.toContain("credential-request");
      expect(analysis.score).toBe(0);
    }
  });

  it("keeps a banking PIN in the rule", () => {
    const analysis = analyzeMessage("Enter your ATM PIN and CVV to continue.");
    expect(evaluationOf(analysis, "credential-request").status).toBe("matched");
  });

  it("keeps a PIN request that is not written as a postal code", () => {
    const analysis = analyzeMessage("Please confirm your 4-digit PIN to continue.");
    expect(evaluationOf(analysis, "credential-request").status).toBe("matched");
  });

  it("keeps a postal PIN out of the match while the rule still runs", () => {
    const evaluation = evaluationOf(
      analyzeMessage(postalMessages[0]),
      "credential-request",
    );
    expect(evaluation.status).toBe("not-matched");
    expect(evaluation.contributedPoints).toBe(0);
  });
});

describe("the bundled sample message", () => {
  it("still scores as high risk after the false-positive guards", () => {
    const analysis = analyzeMessage(SAMPLE_MESSAGE);

    expect(analysis.score).toBe(100);
    expect(analysis.rawScore).toBe(100);
    expect(analysis.riskLevel).toBe("high");
    expect(analysis.matchedRuleIds).toEqual([
      "credential-request",
      "suspicious-link",
      "urgency-pressure",
      "account-threat",
    ]);
    expect(analysis.evaluatedRuleCount).toBe(RULES.length);
  });

  it("records no guarding note on the rules that simply matched", () => {
    const analysis = analyzeMessage(SAMPLE_MESSAGE);
    expect(evaluationOf(analysis, "credential-request").note).toBeNull();
    expect(evaluationOf(analysis, "prize-bait").note).toBeNull();
  });
});

describe("repeated analysis of different messages", () => {
  it("returns independent results with no carry-over between messages", () => {
    const legitimate = "123456 is your one-time password for your transaction. Never share your OTP with anyone.";
    const scam = "Please share the OTP you received to verify your account.";

    const firstLegit = analyzeMessage(legitimate);
    const firstScam = analyzeMessage(scam);
    const secondLegit = analyzeMessage(legitimate);

    expect(firstLegit.score).toBe(0);
    expect(firstScam.score).toBe(40);
    expect(secondLegit.score).toBe(0);

    expect(secondLegit.matchedRuleIds).toEqual(firstLegit.matchedRuleIds);
    expect(
      secondLegit.ruleEvaluations.map((evaluation) => evaluation.status),
    ).toEqual(firstLegit.ruleEvaluations.map((evaluation) => evaluation.status));
  });

  it("does not leak a note from one message into the next", () => {
    const withNote = analyzeMessage(
      "Your cashback of Rs 40 has been credited to your account statement.",
    );
    const withoutNote = analyzeMessage("Please respond immediately.");

    expect(evaluationOf(withNote, "prize-bait").note).not.toBeNull();
    expect(evaluationOf(withoutNote, "prize-bait").note).toBeNull();
  });
});
