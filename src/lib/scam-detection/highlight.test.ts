import { describe, expect, it } from "bun:test";

import {
  buildHighlightPlan,
  buildHighlightSegments,
  findHighlightTarget,
  groupTargetsBySegment,
  type ScamFinding,
} from "@/lib/scam-detection";
import { analyzeMessage } from "@/lib/scam-detection/engine";

/**
 * Unit tests for highlight segmentation and navigation-target resolution.
 *
 * These are pure-data tests: no DOM, no React. Findings are constructed by hand
 * with exact character ranges, which is the only way to pin down the boundary
 * cases (containment, shared edges, several overlapping rules, repeated text)
 * without depending on what a particular rule's regex happens to match.
 */

/** A finding whose only meaningful field is its matched ranges. */
function finding(
  ruleId: string,
  ranges: Array<[number, number]>,
  label = `${ruleId} label`,
): ScamFinding {
  return {
    ruleId,
    label,
    shortLabel: ruleId,
    severity: "high",
    weight: 20,
    matchedText: "",
    matchedPhrases: [],
    occurrences: ranges.map(([start, end]) => ({ start, end })),
    explanation: "",
    safeNextStep: "",
  };
}

/** The text of every accepted mark, in document order. */
function markTexts(message: string, findings: ScamFinding[]): string[] {
  return buildHighlightSegments(message, findings)
    .filter((segment) => segment.severity)
    .map((segment) => segment.text);
}

/** The message must always come back unchanged, marks or no marks. */
function reconstructed(message: string, findings: ScamFinding[]): string {
  return buildHighlightSegments(message, findings)
    .map((segment) => segment.text)
    .join("");
}

describe("highlight segments", () => {
  it("reconstructs the message exactly, including with overlaps", () => {
    const message = "abcdefghij";
    const findings = [finding("a", [[0, 10]]), finding("b", [[3, 6]])];

    expect(reconstructed(message, findings)).toBe(message);
    expect(reconstructed("", [])).toBe("");
    expect(reconstructed(message, [])).toBe(message);
  });

  it("keeps the earlier-starting range and drops the overlapping one", () => {
    const message = "abcdefghij";
    const findings = [finding("late", [[3, 6]]), finding("early", [[0, 10]])];

    // Same resolution as before: start ascending, then longer first.
    expect(markTexts(message, findings)).toEqual(["abcdefghij"]);
    const segments = buildHighlightSegments(message, findings);
    const marked = segments.filter((segment) => segment.severity);
    expect(marked.map((segment) => segment.ruleId)).toEqual(["early"]);
  });

  it("records the exact intersection for a dropped range", () => {
    const message = "abcdefghij";
    const findings = [finding("a", [[0, 10]]), finding("b", [[3, 6]])];
    const segments = buildHighlightSegments(message, findings);

    const mark = segments.find((segment) => segment.ruleId === "a");
    expect(mark?.coveredEvidence).toEqual([
      { ruleId: "b", start: 3, end: 6 },
    ]);
    // The dropped rule gets no mark of its own.
    expect(segments.some((segment) => segment.ruleId === "b")).toBe(false);
  });

  it("records only the overlapping part when ranges only partly intersect", () => {
    // "b" starts inside "a" and runs past its end.
    const message = "abcdefghij";
    const findings = [finding("a", [[0, 4]]), finding("b", [[2, 8]])];

    const segments = buildHighlightSegments(message, findings);
    expect(markTexts(message, findings)).toEqual(["abcd"]);

    const mark = segments.find((segment) => segment.ruleId === "a");
    expect(mark?.coveredEvidence).toEqual([{ ruleId: "b", start: 2, end: 4 }]);
  });

  it("records a dropped range that starts at the containing mark's start", () => {
    // Same start, shorter: the sort puts the longer range first, so the shorter
    // one is dropped from its very first character.
    const message = "abcdefghij";
    const findings = [finding("short", [[0, 4]]), finding("long", [[0, 10]])];

    const segments = buildHighlightSegments(message, findings);
    expect(markTexts(message, findings)).toEqual(["abcdefghij"]);

    const mark = segments.find((segment) => segment.ruleId === "long");
    expect(mark?.coveredEvidence).toEqual([{ ruleId: "short", start: 0, end: 4 }]);
  });

  it("handles two rules claiming the identical range", () => {
    const message = "abcdefghij";
    const findings = [finding("first", [[0, 10]]), finding("second", [[0, 10]])];

    const segments = buildHighlightSegments(message, findings);
    // One mark, owned by whichever rule sorted first.
    expect(markTexts(message, findings)).toEqual(["abcdefghij"]);

    const target = findHighlightTarget(segments, findings, "second");
    expect(target.kind).toBe("shared");
    expect(target.ownerRuleId).toBe("first");
    // Every character of the evidence is on screen, inside the other's mark.
    expect(target.showsOnlyPart).toBe(false);
    expect(target.coveredLength).toBe(10);
  });

  it("does not treat a shared edge as an overlap", () => {
    const message = "abcdefghij";
    const findings = [finding("a", [[0, 5]]), finding("b", [[5, 10]])];

    expect(markTexts(message, findings)).toEqual(["abcde", "fghij"]);
    const segments = buildHighlightSegments(message, findings);
    expect(segments.every((segment) => segment.coveredEvidence === undefined)).toBe(
      true,
    );
  });
});

describe("navigation targets", () => {
  it("uses a finding's own mark when it has one", () => {
    const message = "Pay now to release your parcel.";
    const findings = [
      finding("urgency", [[0, 7]]),
      finding("reward", [[11, 30]]),
    ];
    const segments = buildHighlightSegments(message, findings);

    const target = findHighlightTarget(segments, findings, "urgency");
    expect(target.kind).toBe("own");
    expect(target.ownerRuleId).toBe("urgency");
    expect(segments[target.segmentIndex].text).toBe("Pay now");
    expect(target.showsOnlyPart).toBe(false);
    expect(target.coveredLength).toBe(target.evidenceLength);
  });

  it("falls back to the containing mark when the range is inside another", () => {
    const message = "abcdefghij";
    const findings = [finding("outer", [[0, 10]]), finding("inner", [[3, 6]])];
    const segments = buildHighlightSegments(message, findings);

    const target = findHighlightTarget(segments, findings, "inner");
    expect(target.kind).toBe("shared");
    expect(target.ownerRuleId).toBe("outer");
    expect(segments[target.segmentIndex].text).toBe("abcdefghij");
    // The whole of the inner range is visible inside the outer mark.
    expect(target.coveredLength).toBe(3);
    expect(target.evidenceLength).toBe(3);
    expect(target.showsOnlyPart).toBe(false);
  });

  it("resolves a range that ends exactly at the containing mark's end", () => {
    const message = "abcdefghij";
    const findings = [finding("outer", [[0, 10]]), finding("tail", [[5, 10]])];
    const segments = buildHighlightSegments(message, findings);

    const target = findHighlightTarget(segments, findings, "tail");
    expect(target.kind).toBe("shared");
    expect(target.ownerRuleId).toBe("outer");
    expect(target.showsOnlyPart).toBe(false);
  });

  it("reports a partial overlap as partial rather than complete", () => {
    const message = "abcdefghij";
    const findings = [finding("outer", [[0, 4]]), finding("straddle", [[2, 9]])];
    const segments = buildHighlightSegments(message, findings);

    const target = findHighlightTarget(segments, findings, "straddle");
    expect(target.kind).toBe("shared");
    expect(target.coveredLength).toBe(2);
    expect(target.evidenceLength).toBe(7);
    expect(target.showsOnlyPart).toBe(true);
  });

  it("points several overlapping findings at the mark that covers them", () => {
    const message = "abcdefghij";
    const findings = [
      finding("outer", [[0, 10]]),
      finding("second", [[2, 5]]),
      finding("third", [[7, 9]]),
    ];
    const segments = buildHighlightSegments(message, findings);

    for (const ruleId of ["second", "third"]) {
      const target = findHighlightTarget(segments, findings, ruleId);
      expect(target.kind).toBe("shared");
      expect(target.ownerRuleId).toBe("outer");
      expect(segments[target.segmentIndex].text).toBe("abcdefghij");
    }

    const mark = segments.find((segment) => segment.ruleId === "outer");
    expect(mark?.coveredEvidence?.map((entry) => entry.ruleId)).toEqual([
      "second",
      "third",
    ]);
  });

  it("chooses the mark covering most of the evidence, not the first one", () => {
    // "wide" covers [5,10] of the middle rule and "later" covers only [10,12].
    const message = "abcdefghijklmnop";
    const findings = [
      finding("wide", [[0, 10]]),
      finding("later", [[10, 16]]),
      finding("middle", [[5, 12]]),
    ];
    const segments = buildHighlightSegments(message, findings);

    const target = findHighlightTarget(segments, findings, "middle");
    expect(target.kind).toBe("shared");
    expect(target.ownerRuleId).toBe("wide");
    expect(segments[target.segmentIndex].text).toBe("abcdefghij");
    // Five characters here, two in the later mark.
    expect(target.sharedLength).toBe(7);
    expect(target.coveredLength).toBe(7);
  });

  it("distinguishes repeated phrases by position, not by text", () => {
    // Three identical words; a text search could not tell them apart.
    const message = "ab ab ab";
    const findings = [
      finding("first", [[0, 2]]),
      finding("second", [[3, 5]]),
      finding("third", [[6, 8]]),
    ];
    const segments = buildHighlightSegments(message, findings);

    const indexes = ["first", "second", "third"].map(
      (ruleId) => findHighlightTarget(segments, findings, ruleId).segmentIndex,
    );
    expect(new Set(indexes).size).toBe(3);
    expect(indexes).toEqual([0, 2, 4]);
    expect(indexes.map((index) => segments[index].text)).toEqual([
      "ab",
      "ab",
      "ab",
    ]);
  });

  it("resolves the same target every time it is asked", () => {
    const message = "abcdefghij";
    const findings = [
      finding("outer", [[0, 10]]),
      finding("a", [[2, 5]]),
      finding("b", [[7, 9]]),
    ];
    const segments = buildHighlightSegments(message, findings);

    const once = findHighlightTarget(segments, findings, "b");
    const twice = findHighlightTarget(segments, findings, "b");
    expect(once).toEqual(twice);
  });

  it("returns no target when the finding has no evidence in the message", () => {
    const message = "abcdefghij";
    const findings = [finding("empty", []), finding("outer", [[0, 10]])];
    const segments = buildHighlightSegments(message, findings);

    const target = findHighlightTarget(segments, findings, "empty");
    expect(target.kind).toBe("absent");
    expect(target.segmentIndex).toBe(-1);
    expect(target.ownerRuleId).toBeNull();
    expect(target.coveredLength).toBe(0);
  });

  it("returns no target for a range that falls outside the message", () => {
    const message = "abc";
    const findings = [
      finding("beyond", [[10, 14]]),
      finding("present", [[0, 3]]),
    ];
    const segments = buildHighlightSegments(message, findings);

    const target = findHighlightTarget(segments, findings, "beyond");
    expect(target.kind).toBe("absent");
    expect(target.segmentIndex).toBe(-1);
    // Clamped, so the reported evidence length matches what could be rendered.
    expect(target.evidenceLength).toBe(0);
  });

  it("returns no target for a rule that is not in this analysis", () => {
    const message = "abcdefghij";
    const findings = [finding("outer", [[0, 10]])];
    const segments = buildHighlightSegments(message, findings);

    const target = findHighlightTarget(segments, findings, "from-a-previous-message");
    expect(target.kind).toBe("absent");
    expect(target.segmentIndex).toBe(-1);
  });

  it("never hands back an index that does not exist", () => {
    const message = "abcdefghij";
    const findings = [
      finding("outer", [[0, 10]]),
      finding("inner", [[3, 6]]),
      finding("empty", []),
      finding("beyond", [[40, 50]]),
    ];
    const segments = buildHighlightSegments(message, findings);

    for (const item of findings) {
      const target = findHighlightTarget(segments, findings, item.ruleId);
      if (target.kind === "absent") {
        expect(target.segmentIndex).toBe(-1);
      } else {
        expect(target.segmentIndex).toBeGreaterThanOrEqual(0);
        expect(target.segmentIndex).toBeLessThan(segments.length);
        expect(segments[target.segmentIndex].severity).toBeDefined();
      }
    }
  });
});

describe("target grouping", () => {
  it("groups findings by the segment their evidence resolves to", () => {
    const message = "abcdefghij";
    const findings = [
      finding("outer", [[0, 10]]),
      finding("second", [[2, 5]]),
      finding("third", [[7, 9]]),
    ];
    const plan = buildHighlightPlan(message, findings);
    const grouped = groupTargetsBySegment(plan.targets);

    // One mark answers for all three, because all three resolve to it.
    expect(grouped.size).toBe(1);
    expect([...grouped.keys()]).toEqual([0]);
    expect(grouped.get(0)).toEqual(["outer", "second", "third"]);
  });

  it("keeps each owned mark to its own rule", () => {
    const message = "ab ab ab";
    const findings = [
      finding("first", [[0, 2]]),
      finding("second", [[3, 5]]),
      finding("third", [[6, 8]]),
    ];
    const plan = buildHighlightPlan(message, findings);
    const grouped = groupTargetsBySegment(plan.targets);

    expect([...grouped.entries()]).toEqual([
      [0, ["first"]],
      [2, ["second"]],
      [4, ["third"]],
    ]);
  });

  it("omits a finding with no target instead of grouping it anywhere", () => {
    const message = "abcdefghij";
    const findings = [
      finding("outer", [[0, 10]]),
      finding("inner", [[3, 6]]),
      finding("empty", []),
      finding("beyond", [[40, 50]]),
    ];
    const plan = buildHighlightPlan(message, findings);
    const grouped = groupTargetsBySegment(plan.targets);

    const flattened = [...grouped.values()].flat();
    expect(flattened).toEqual(["outer", "inner"]);
    expect(flattened).not.toContain("empty");
    expect(flattened).not.toContain("beyond");
  });

  it("registers the covering mark for the finding that lost its range", () => {
    // The real engine output: the credential range is inside the link mark.
    const message =
      "URGENT: your account will be blocked today. Click here http://sbi-kyc-verify.online/update and share the OTP you received to claim your prize.";
    const analysis = analyzeMessage(message);
    const plan = buildHighlightPlan(message, analysis.findings);
    const grouped = groupTargetsBySegment(plan.targets);

    const credentialSegment = plan.targets.get("credential-request")?.segmentIndex ?? -1;
    const clickHereSegment = plan.targets.get("suspicious-link")?.segmentIndex ?? -1;

    expect(credentialSegment).not.toBe(-1);
    expect(clickHereSegment).not.toBe(-1);
    expect(credentialSegment).not.toBe(clickHereSegment);

    // The covered finding is registered on the mark that actually shows it…
    expect(grouped.get(credentialSegment)).toEqual(["credential-request"]);
    expect(plan.segments[credentialSegment].text).toBe(
      "http://sbi-kyc-verify.online/update",
    );
    // …and the link keeps its own first mark.
    expect(grouped.get(clickHereSegment)).toEqual(["suspicious-link"]);
    expect(plan.segments[clickHereSegment].text).toBe("Click here");
  });
});

describe("highlight plans", () => {
  it("resolves a target for every finding on the real engine output", () => {
    const message =
      "URGENT: your account will be blocked today. Click here http://sbi-kyc-verify.online/update and share the OTP you received to claim your prize.";
    const analysis = analyzeMessage(message);
    const plan = buildHighlightPlan(message, analysis.findings);

    expect(plan.targets.size).toBe(analysis.findings.length);
    expect(plan.segments.map((segment) => segment.text).join("")).toBe(message);

    // Every finding has somewhere honest to point.
    for (const item of analysis.findings) {
      const target = plan.targets.get(item.ruleId);
      expect(target).toBeDefined();
      expect(target?.kind).not.toBe("absent");
    }

    // The credential finding lost its range to the earlier-starting link range,
    // so it resolves to the link's mark instead of to nothing.
    const credential = plan.targets.get("credential-request");
    expect(credential?.kind).toBe("shared");
    expect(credential?.ownerRuleId).toBe("suspicious-link");
    expect(plan.segments[credential?.segmentIndex ?? -1].ruleId).toBe(
      "suspicious-link",
    );
    // A link click and a whole sentence are not the same amount of text.
    expect(credential?.showsOnlyPart).toBe(true);
  });

  it("leaves every finding with its own mark when nothing overlaps", () => {
    const analysis = analyzeMessage(
      "Please share the OTP you received to verify your account.",
    );
    const plan = buildHighlightPlan(analysis.message, analysis.findings);

    for (const item of analysis.findings) {
      expect(plan.targets.get(item.ruleId)?.kind).toBe("own");
    }
  });

  it("builds nothing from empty input", () => {
    const plan = buildHighlightPlan("", []);

    expect(plan.segments).toEqual([]);
    expect(plan.targets.size).toBe(0);
    expect(findHighlightTarget([], [], "anything").kind).toBe("absent");
  });

  it("does not carry a target across a new message", () => {
    const first = analyzeMessage(
      "URGENT: your account will be blocked today. Click here http://sbi-kyc-verify.online/update and share the OTP you received to claim your prize.",
    );
    const firstPlan = buildHighlightPlan(first.message, first.findings);
    expect(firstPlan.targets.get("credential-request")?.kind).toBe("shared");

    // A second, unrelated analysis: the old rule id must not resolve in it.
    const second = analyzeMessage("Hi Mum, I'll be home around 7.");
    const secondPlan = buildHighlightPlan(second.message, second.findings);

    expect(secondPlan.targets.get("credential-request")).toBeUndefined();
    expect(findHighlightTarget(secondPlan.segments, second.findings, "credential-request"))
      .toEqual({
        kind: "absent",
        segmentIndex: -1,
        ownerRuleId: null,
        ownerRuleLabel: null,
        ownerRuleShortLabel: null,
        coveredLength: 0,
        evidenceLength: 0,
        sharedLength: 0,
        showsOnlyPart: false,
      });
  });
});
