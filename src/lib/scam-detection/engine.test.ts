import { describe, expect, it } from "bun:test";
import { SAMPLE_MESSAGE } from "@/data/trust-lens";
import {
  MAX_SCORE,
  RISK_THRESHOLD_HIGH,
  RISK_THRESHOLD_MEDIUM,
  analyzeMessage,
  riskLevelForScore,
} from "./engine";
import { buildHighlightSegments } from "./highlight";
import { extractLinks } from "./links";
import { RULES } from "./rules";

/**
 * Every message in this suite is fictional. No real credentials, accounts or
 * live malicious URLs are used anywhere.
 */

function expectRuleIds(actual: string[], expected: string[]) {
  for (const id of expected) {
    expect(actual).toContain(id);
  }
}

function indicatorIds(urlText: string): string[] {
  const links = extractLinks(urlText);
  if (links.length === 0) throw new Error(`expected a link in: ${urlText}`);
  return links[0].indicators.map((indicator) => indicator.id);
}

describe("empty and blank input", () => {
  it("returns a zero score and no findings for an empty string", () => {
    const result = analyzeMessage("");
    expect(result.score).toBe(0);
    expect(result.riskLevel).toBe("low");
    expect(result.findings).toEqual([]);
    expect(result.matchedRuleIds).toEqual([]);
    expect(result.links).toEqual([]);
    expect(result.summary.toLowerCase()).toContain("no configured warning signs");
  });

  it("treats whitespace-only input as empty", () => {
    const result = analyzeMessage("   \n\t  \r\n ");
    expect(result.score).toBe(0);
    expect(result.findings).toEqual([]);
    expect(result.riskLevel).toBe("low");
  });

  it("never throws on non-string input", () => {
    const result = analyzeMessage(undefined as unknown as string);
    expect(result.score).toBe(0);
    expect(result.findings).toEqual([]);
  });
});

describe("ordinary messages", () => {
  const harmless = [
    "Hi Mum, I'll be home around 7. Do you need anything from the shop?",
    "Your appointment with Dr. Rao is confirmed for Tuesday at 10:30am.",
    "Team, the sprint review moves to Thursday. The agenda is in the shared doc.",
    "Your order 4821 has been dispatched and should arrive on 12 March.",
    "Please find the invoice attached. Let me know if you have questions.",
  ];

  it("finds no warning signs in everyday messages", () => {
    for (const message of harmless) {
      const result = analyzeMessage(message);
      expect(result.findings).toHaveLength(0);
      expect(result.score).toBe(0);
      expect(result.riskLevel).toBe("low");
      expect(result.summary.toLowerCase()).toContain(
        "no configured warning signs",
      );
    }
  });

  it("still warns that a low score is not proof of safety", () => {
    const result = analyzeMessage("See you at lunch.");
    expect(result.summary.toLowerCase()).toContain("not proof");
  });
});

describe("individual rules", () => {
  it("scores an urgency-only message at the urgency weight", () => {
    const result = analyzeMessage("Please respond immediately regarding your query.");
    expectRuleIds(result.matchedRuleIds, ["urgency-pressure"]);
    expect(result.score).toBe(20);
    expect(result.riskLevel).toBe("low");
  });

  it("scores an account-blocking threat at the threat weight", () => {
    const result = analyzeMessage(
      "Your account will be suspended if you do not update your details.",
    );
    expectRuleIds(result.matchedRuleIds, ["account-threat"]);
    expect(result.score).toBe(15);
    expect(result.riskLevel).toBe("low");
  });

  it("scores a suspicious link at the link weight", () => {
    const result = analyzeMessage("Track your parcel at http://203.0.113.9/track");
    expectRuleIds(result.matchedRuleIds, ["suspicious-link"]);
    expect(result.score).toBe(25);
    expect(result.riskLevel).toBe("low");
  });

  it("scores a credential request at the credential weight", () => {
    const result = analyzeMessage(
      "Please share the OTP you received so we can verify your identity.",
    );
    expectRuleIds(result.matchedRuleIds, ["credential-request"]);
    expect(result.score).toBe(40);
    expect(result.riskLevel).toBe("medium");
  });

  it("scores prize bait at the prize weight", () => {
    const result = analyzeMessage(
      "Congratulations! You have won a free gift voucher worth Rs 5000.",
    );
    expectRuleIds(result.matchedRuleIds, ["prize-bait"]);
    expect(result.score).toBe(20);
  });

  it("keeps the published weights stable", () => {
    const weights = Object.fromEntries(RULES.map((rule) => [rule.id, rule.weight]));
    expect(weights["urgency-pressure"]).toBe(20);
    expect(weights["account-threat"]).toBe(15);
    expect(weights["suspicious-link"]).toBe(25);
    expect(weights["credential-request"]).toBe(40);
    expect(weights["prize-bait"]).toBe(20);
    expect(RULES.reduce((total, rule) => total + rule.weight, 0)).toBe(120);
  });
});

describe("scoring and risk bands", () => {
  it("maps scores onto the documented bands", () => {
    expect(riskLevelForScore(0)).toBe("low");
    expect(riskLevelForScore(29)).toBe("low");
    expect(riskLevelForScore(30)).toBe("medium");
    expect(riskLevelForScore(59)).toBe("medium");
    expect(riskLevelForScore(60)).toBe("high");
    expect(riskLevelForScore(100)).toBe("high");
  });

  it("documents the thresholds the interface quotes", () => {
    expect(RISK_THRESHOLD_MEDIUM).toBe(30);
    expect(RISK_THRESHOLD_HIGH).toBe(60);
    expect(MAX_SCORE).toBe(100);
  });

  it("reports medium when urgency stacks with an account threat", () => {
    const result = analyzeMessage(
      "Urgent: your account will be suspended immediately.",
    );
    expect(result.score).toBe(35);
    expect(result.riskLevel).toBe("medium");
  });

  it("reports high once threat, link and credential rules stack", () => {
    const result = analyzeMessage(
      "Your account will be blocked. Click here http://sbi-kyc-verify.online and share the OTP.",
    );
    expect(result.score).toBe(80);
    expect(result.riskLevel).toBe("high");
  });

  it("caps the score at 100 when every rule matches", () => {
    const result = analyzeMessage(
      "URGENT: your account will be blocked today. Click here http://sbi-kyc-verify.online/update and share the OTP you received to claim your prize.",
    );
    expectRuleIds(result.matchedRuleIds, [
      "urgency-pressure",
      "account-threat",
      "suspicious-link",
      "credential-request",
      "prize-bait",
    ]);
    expect(result.score).toBe(100);
    expect(result.riskLevel).toBe("high");
  });

  it("sorts the strongest finding first", () => {
    const result = analyzeMessage(
      "Urgent: your account will be blocked. Share the OTP now.",
    );
    expect(result.findings[0].ruleId).toBe("credential-request");
  });
});

describe("matching behaviour", () => {
  it("matches regardless of capitalisation", () => {
    const lower = analyzeMessage("please share the otp immediately");
    const upper = analyzeMessage("PLEASE SHARE THE OTP IMMEDIATELY");
    const mixed = analyzeMessage("Please Share The Otp Immediately");

    expect(upper.matchedRuleIds).toEqual(lower.matchedRuleIds);
    expect(mixed.matchedRuleIds).toEqual(lower.matchedRuleIds);
    expect(upper.score).toBe(60);
    expect(lower.riskLevel).toBe("high");
  });

  it("tolerates non-breaking spaces and curly apostrophes", () => {
    const spaced = analyzeMessage(
      "Please\u00A0share\u00A0the\u00A0OTP\u00A0immediately",
    );
    expectRuleIds(spaced.matchedRuleIds, ["credential-request", "urgency-pressure"]);

    const curly = analyzeMessage("Don\u2019t delay, share the OTP.");
    expectRuleIds(curly.matchedRuleIds, ["urgency-pressure", "credential-request"]);
  });

  it("counts a rule only once however many times it matches", () => {
    const once = analyzeMessage("Your account will be blocked.");
    const repeated = analyzeMessage(
      "Your account will be blocked. Your account will be blocked again, and your account will be blocked once more.",
    );

    expect(once.score).toBe(15);
    expect(repeated.score).toBe(15);

    const finding = repeated.findings.find(
      (item) => item.ruleId === "account-threat",
    );
    expect(finding).toBeDefined();
    expect(finding && finding.occurrences.length).toBeGreaterThan(1);
  });

  it("collapses repeated urgency wording into a single score", () => {
    const result = analyzeMessage(
      "Urgent! Act now! Immediately! Hurry, do not delay!",
    );
    expect(result.matchedRuleIds).toEqual(["urgency-pressure"]);
    expect(result.score).toBe(20);
  });

  it("returns highlight ranges that line up with the message", () => {
    const message = "Share the OTP now.";
    const result = analyzeMessage(message);
    const finding = result.findings.find(
      (item) => item.ruleId === "credential-request",
    );
    expect(finding).toBeDefined();
    if (!finding) throw new Error("expected a credential finding");

    const range = finding.occurrences[0];
    expect(range.start).toBeGreaterThanOrEqual(0);
    expect(range.end).toBeLessThanOrEqual(message.length);
    expect(message.slice(range.start, range.end).toLowerCase()).toContain("otp");
    expect(finding.matchedText.length).toBeGreaterThan(0);
  });
});

describe("link heuristics", () => {
  it("recognises a raw IP address host", () => {
    expect(indicatorIds("go to http://203.0.113.9/x")).toContain("raw-ip-address");
  });

  it("recognises a shortened link", () => {
    expect(indicatorIds("see https://bit.ly/3xZq1")).toContain("url-shortener");
  });

  it("recognises letters swapped for lookalike characters", () => {
    expect(indicatorIds("login at https://paypa1.com/login")).toContain(
      "character-substitution",
    );
  });

  it("recognises a lookalike domain and explains itself", () => {
    const links = extractLinks("Verify at http://sbi-kyc-verify.online/update");
    expect(links).toHaveLength(1);
    expect(links[0].host).toBe("sbi-kyc-verify.online");
    expect(links[0].suspicious).toBe(true);

    const lookalike = links[0].indicators.find(
      (indicator) => indicator.id === "lookalike-domain",
    );
    expect(lookalike).toBeDefined();
    expect(lookalike?.explanation.toLowerCase()).toContain("may be imitating");
  });

  it("leaves ordinary links alone", () => {
    const result = analyzeMessage(
      "The meeting notes are at https://docs.example.com/notes",
    );
    expect(result.links).toHaveLength(1);
    expect(result.links[0].suspicious).toBe(false);
    expect(result.matchedRuleIds).not.toContain("suspicious-link");
    expect(result.score).toBe(0);
  });

  it("does not treat an official domain as a lookalike", () => {
    expect(indicatorIds("open https://www.sbi.co.in/login")).not.toContain(
      "lookalike-domain",
    );
  });

  it("requires weak signals to stack before flagging a link", () => {
    const single = extractLinks("read https://example.xyz/page");
    expect(single[0].indicators.length).toBe(1);
    expect(single[0].suspicious).toBe(false);

    const stacked = extractLinks("read https://login-secure-example.xyz/pay");
    expect(stacked[0].indicators.length).toBeGreaterThanOrEqual(2);
    expect(stacked[0].suspicious).toBe(true);
  });

  it("handles malformed links without throwing", () => {
    const malformed = [
      "http://",
      "https://",
      "http://[",
      "www.",
      "http://@",
      "https://:",
      "http://////",
      "https://192.168.1.1@@evil.example",
      "http://.com",
      "https://-",
      "http://256.256.256.256/x",
      "visit http:// and then https://,",
    ];

    for (const input of malformed) {
      expect(() => analyzeMessage(input)).not.toThrow();
      expect(() => extractLinks(input)).not.toThrow();
    }
  });
});

describe("repeated analysis", () => {
  it("returns independent results for different messages", () => {
    const first = analyzeMessage(
      "Urgent: your account will be suspended immediately.",
    );
    const second = analyzeMessage("Congratulations! You have won a prize.");
    const firstAgain = analyzeMessage(
      "Urgent: your account will be suspended immediately.",
    );

    expect(first.score).toBe(35);
    expect(second.score).toBe(20);
    expect(firstAgain.score).toBe(35);
    expect(firstAgain.matchedRuleIds).toEqual(first.matchedRuleIds);
  });

  it("produces a high-risk result for the bundled sample message", () => {
    const result = analyzeMessage(SAMPLE_MESSAGE);
    expectRuleIds(result.matchedRuleIds, [
      "urgency-pressure",
      "account-threat",
      "suspicious-link",
      "credential-request",
    ]);
    expect(result.score).toBe(100);
    expect(result.riskLevel).toBe("high");
    expect(result.summary).toContain("100 out of 100");
  });

  it("carries the analysed text so a report can show matches in context", () => {
    const message = "Share the OTP now.";
    expect(analyzeMessage(message).message).toBe(message);
  });

  it("records when the analysis was produced", () => {
    const before = Date.now();
    const result = analyzeMessage("Share the OTP.");
    expect(result.analyzedAt).toBeGreaterThanOrEqual(before);
    expect(result.analyzedAt).toBeLessThanOrEqual(Date.now());
  });
});

describe("highlight segments", () => {
  it("returns the whole message as one plain segment when nothing matched", () => {
    const segments = buildHighlightSegments("Hello there.", []);
    expect(segments).toEqual([{ text: "Hello there." }]);
  });

  it("reconstructs the message exactly, with nothing lost or duplicated", () => {
    const message = SAMPLE_MESSAGE;
    const analysis = analyzeMessage(message);
    const segments = buildHighlightSegments(message, analysis.findings);
    expect(segments.map((segment) => segment.text).join("")).toBe(message);
  });

  it("keeps segments from overlapping when several rules match", () => {
    const message =
      "Urgent: your account will be blocked. Click here http://sbi-kyc-verify.online and share the OTP now.";
    const analysis = analyzeMessage(message);
    const segments = buildHighlightSegments(message, analysis.findings);

    expect(segments.map((segment) => segment.text).join("")).toBe(message);

    let cursor = 0;
    for (const segment of segments) {
      cursor += segment.text.length;
    }
    expect(cursor).toBe(message.length);
    expect(segments.some((segment) => segment.severity !== undefined)).toBe(true);
  });

  it("labels the marked phrase with the rule that matched it", () => {
    const message = "Share the OTP now.";
    const analysis = analyzeMessage(message);
    const marked = buildHighlightSegments(message, analysis.findings).filter(
      (segment) => segment.severity !== undefined,
    );

    expect(marked.length).toBeGreaterThan(0);
    expect(marked[0].ruleLabel).toBe(
      "Request for an OTP, password, PIN or other credential",
    );
    expect(marked[0].text.toLowerCase()).toContain("otp");
  });

  it("returns nothing for an empty message", () => {
    expect(buildHighlightSegments("", [])).toEqual([]);
  });
});

describe("privacy", () => {
  it("never performs a network request while analysing", () => {
    const originalFetch = globalThis.fetch;
    let attempted = false;
    globalThis.fetch = (() => {
      attempted = true;
      throw new Error("network access attempted");
    }) as unknown as typeof fetch;

    try {
      analyzeMessage(
        "URGENT: your account will be blocked. Click here http://sbi-kyc-verify.online and share the OTP to claim your prize.",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(attempted).toBe(false);
  });
});
