import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";

import { FindingCard } from "@/components/trust-lens/finding-card";
import { HighlightedMessage } from "@/components/trust-lens/highlighted-message";
import { LinkInspector } from "@/components/trust-lens/link-inspector";
import { MessageInspector } from "@/components/trust-lens/message-inspector";
import { ResultsExplorer } from "@/components/trust-lens/results-explorer";
import { RiskOverview } from "@/components/trust-lens/risk-overview";
import { RuleCoverage, RuleRow } from "@/components/trust-lens/rule-coverage";
import { SafetyActions } from "@/components/trust-lens/safety-actions";
import {
  SCORE_CAVEAT,
  SAMPLE_MESSAGE,
  SAFETY_CHECKLIST_NOTE,
} from "@/data/trust-lens";
import {
  RULES,
  analyzeMessage,
  buildHighlightPlan,
  buildHighlightSegments,
  extractLinks,
  type ScamAnalysis,
  type ScamFinding,
} from "@/lib/scam-detection";

/**
 * Static render tests for the interactive results experience.
 *
 * These run the real components through `react-dom/server`, so they cover the
 * markup, the ARIA wiring and the text that is actually produced. They do not
 * cover pointer behaviour, scroll position, focus movement, real viewport
 * layout or screen-reader output — those need a browser, and nothing here
 * claims otherwise.
 */

const HIGH_RISK =
  "URGENT: your account will be blocked today. Click here http://sbi-kyc-verify.online/update and share the OTP you received to claim your prize.";
const LINK_MESSAGE =
  "Your parcel could not be delivered. Click here http://203.0.113.9/track or verify at https://bit.ly/xyz1";
const ORDINARY = "Hi Mum, I'll be home around 7. Do you need anything?";
/** Two rules whose matched ranges genuinely overlap on "expired". */
const OVERLAPPING = "Your KYC has expired, please respond immediately.";
const REPEATED =
  "Your account will be blocked. Your account will be blocked again.";

function render(element: ReactElement): string {
  return renderToStaticMarkup(element);
}

/** React escapes text children, so compare against the escaped form. */
function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/'/g, "&#x27;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** The visible text of every highlight button, in document order. */
function markTexts(html: string): string[] {
  const pattern = /<button[^>]*lens-mark[^>]*>([\s\S]*?)(?:<!-- -->)?<span class="sr-only">/g;
  return [...html.matchAll(pattern)].map((match) => unescapeText(match[1]));
}

function unescapeText(value: string): string {
  return value
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Opening tags that can receive keyboard focus, for the structural a11y checks. */
function focusableTagNames(html: string): string[] {
  const tags: string[] = [];
  for (const match of html.matchAll(/<([a-z0-9]+)([^>]*)>/g)) {
    const [, name, attributes] = match;
    if (name === "button" || name === "a" || name === "input") {
      tags.push(name);
      continue;
    }
    if (/tabindex="(0|[1-9][0-9]*)"/.test(attributes)) tags.push(name);
  }
  return tags;
}

/** The segments and navigation targets the message views both read. */
function planForAnalysis(analysis: ScamAnalysis) {
  return buildHighlightPlan(analysis.message, analysis.findings);
}

/** Swaps in hand-built findings, for states the engine cannot produce. */
function withFindings(analysis: ScamAnalysis, findings: ScamFinding[]): ScamAnalysis {
  return { ...analysis, findings };
}

function inspectorProps(analysis: ScamAnalysis) {
  return {
    analysis,
    plan: planForAnalysis(analysis),
    selectedRuleId: null,
    showAll: false,
    pulsingRuleId: null,
    unreachableRuleId: null,
    onSelectRule: () => {},
    onShowAll: () => {},
    onClearSelection: () => {},
    registerMark: () => {},
  };
}

/* ------------------------------------------------------------------ */
/* 1. Score and risk band                                              */
/* ------------------------------------------------------------------ */

describe("risk overview", () => {
  it("shows the engine's score, band and counts", () => {
    const analysis = analyzeMessage(HIGH_RISK);
    const html = render(
      <RiskOverview
        analysis={analysis}
        selectedRuleId={null}
        onSelectFinding={() => {}}
      />,
    );

    expect(analysis.score).toBe(100);
    expect(analysis.riskLevel).toBe("high");
    expect(html).toContain("High risk");
    expect(html).toContain("100 out of 100");
    expect(html).toContain(`${analysis.findings.length}`);
    expect(html).toContain(`5 of ${RULES.length}`);
  });

  it("uses the published band label for every risk level", () => {
    const cases: Array<[string, string]> = [
      [ORDINARY, "Low risk"],
      ["Please share the OTP you received to verify your account.", "Medium risk"],
      [HIGH_RISK, "High risk"],
    ];

    for (const [message, label] of cases) {
      const analysis = analyzeMessage(message);
      const html = render(
        <RiskOverview
          analysis={analysis}
          selectedRuleId={null}
          onSelectFinding={() => {}}
        />,
      );
      expect(html).toContain(label);
      // The ring's number is the engine's score, not a recomputed one.
      expect(html).toContain(`>${analysis.score}<`);
    }
  });

  it("keeps the risk caveat verbatim", () => {
    const html = render(
      <RiskOverview
        analysis={analyzeMessage(HIGH_RISK)}
        selectedRuleId={null}
        onSelectFinding={() => {}}
      />,
    );
    expect(html).toContain(escapeText(SCORE_CAVEAT));
  });

  it("says there is nothing to open when no rule matched", () => {
    const html = render(
      <RiskOverview
        analysis={analyzeMessage(ORDINARY)}
        selectedRuleId={null}
        onSelectFinding={() => {}}
      />,
    );
    expect(html).toContain("No configured warning sign matched");
    expect(html).not.toContain("Warning signs found");
  });
});

/* ------------------------------------------------------------------ */
/* 2. Chips correspond to findings                                     */
/* ------------------------------------------------------------------ */

describe("warning-sign chips", () => {
  const analysis = analyzeMessage(HIGH_RISK);

  it("gives every finding exactly one chip carrying its rule id", () => {
    const html = render(
      <RiskOverview
        analysis={analysis}
        selectedRuleId={null}
        onSelectFinding={() => {}}
      />,
    );

    for (const finding of analysis.findings) {
      const chip = new RegExp(
        `<button[^>]*data-rule-id="${finding.ruleId}"[^>]*>`,
      );
      expect(chip.test(html)).toBe(true);
      expect(html).toContain(escapeText(finding.label));
    }

    // One chip per matched rule, so the chip set is exactly the finding set.
    const chipIds = [
      ...html.matchAll(/<button[^>]*data-rule-id="([^"]+)"/g),
    ].map((match) => match[1]);
    expect(chipIds.sort()).toEqual(
      analysis.findings.map((finding) => finding.ruleId).sort(),
    );
  });

  it("marks exactly one chip as pressed when a finding is selected", () => {
    const selected = analysis.findings[0].ruleId;
    const html = render(
      <RiskOverview
        analysis={analysis}
        selectedRuleId={selected}
        onSelectFinding={() => {}}
      />,
    );

    const pressed = [...html.matchAll(/aria-pressed="true"/g)].length;
    expect(pressed).toBe(1);
    expect(html).toContain("Selected");
  });

  it("renders no chip as pressed when nothing is selected", () => {
    const html = render(
      <RiskOverview
        analysis={analysis}
        selectedRuleId={null}
        onSelectFinding={() => {}}
      />,
    );
    expect(html.match(/aria-pressed="true"/g)).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* 3 and 4. Finding cards, expanded and collapsed                      */
/* ------------------------------------------------------------------ */

describe("finding cards", () => {
  const analysis = analyzeMessage(HIGH_RISK);
  const finding = analysis.findings[0];

  it("keeps the collapsed card compact but informative", () => {
    const html = render(
      <FindingCard
        finding={finding}
        open={false}
        selected={false}
        onOpenChange={() => {}}
        onShowInMessage={() => {}}
      />,
    );

    expect(html).toContain(escapeText(finding.label));
    expect(html).toContain(`+${finding.weight} points`);
    // A slice of the matched text, and the affordance.
    expect(html).toContain(escapeText(finding.matchedText.slice(0, 20)));
    expect(html).toContain("lens-panel-chevron");
    // The long-form content is not repeated in every visible card.
    expect(html).not.toContain(escapeText(finding.explanation));
    expect(html).not.toContain("Show in message");
  });

  it("reveals the evidence, the explanation and the next step when open", () => {
    const html = render(
      <FindingCard
        finding={finding}
        open
        selected={false}
        onOpenChange={() => {}}
        onShowInMessage={() => {}}
      />,
    );

    expect(html).toContain("Matched evidence");
    expect(html).toContain(escapeText(finding.matchedText));
    expect(html).toContain("Why this matters");
    expect(html).toContain(escapeText(finding.explanation));
    expect(html).toContain(escapeText(finding.safeNextStep));
    expect(html).toContain("Show in message");
  });

  it("reports the expanded state through aria-expanded", () => {
    const collapsed = render(
      <FindingCard
        finding={finding}
        open={false}
        selected={false}
        onOpenChange={() => {}}
        onShowInMessage={() => {}}
      />,
    );
    const expanded = render(
      <FindingCard
        finding={finding}
        open
        selected={false}
        onOpenChange={() => {}}
        onShowInMessage={() => {}}
      />,
    );

    expect(collapsed).toContain('aria-expanded="false"');
    expect(expanded).toContain('aria-expanded="true"');
  });

  it("points aria-controls at content that exists only when open", () => {
    const expanded = render(
      <FindingCard
        finding={finding}
        open
        selected={false}
        onOpenChange={() => {}}
        onShowInMessage={() => {}}
      />,
    );

    const controls = /aria-controls="([^"]+)"/.exec(expanded);
    expect(controls).not.toBeNull();
    const contentId = controls?.[1] ?? "";
    expect(contentId.length).toBeGreaterThan(0);
    expect(expanded).toContain(`id="${contentId}"`);
  });

  it("carries a selected state that is not colour alone", () => {
    const html = render(
      <FindingCard
        finding={finding}
        open={false}
        selected
        onOpenChange={() => {}}
        onShowInMessage={() => {}}
      />,
    );
    expect(html).toContain('data-selected="true"');
    expect(html).toContain("Selected");
  });

  it("never claims what all legitimate organisations do", () => {
    for (const rule of RULES) {
      expect(rule.explanation.toLowerCase()).not.toContain("all banks");
      expect(rule.explanation.toLowerCase()).not.toContain("always");
      expect(rule.safeNextStep.toLowerCase()).not.toContain("all banks");
    }
  });
});

/* ------------------------------------------------------------------ */
/* 5 and 6. Show in message, and text preservation                     */
/* ------------------------------------------------------------------ */

describe("show in message", () => {
  const analysis = analyzeMessage(HIGH_RISK);

  it("associates every card's action with the rule it belongs to", () => {
    const html = render(
      <ul>
        {analysis.findings.map((finding) => (
          <FindingCard
            key={finding.ruleId}
            finding={finding}
            open
            selected={false}
            onOpenChange={() => {}}
            onShowInMessage={() => {}}
          />
        ))}
      </ul>,
    );

    // One action per card, and each card carries its own rule id.
    expect([...html.matchAll(/Show in message/g)]).toHaveLength(
      analysis.findings.length,
    );
    for (const finding of analysis.findings) {
      expect(html).toContain(`data-rule-id="${finding.ruleId}"`);
    }
  });

  it("targets the same rule id in the message as the card", () => {
    const html = render(
      <HighlightedMessage plan={planForAnalysis(analysis)} />,
    );

    const markIds = new Set(
      [...html.matchAll(/data-rule-id="([^"]+)"/g)].map((match) => match[1]),
    );
    for (const ruleId of markIds) {
      expect(analysis.findings.map((finding) => finding.ruleId)).toContain(ruleId);
    }
    expect(markIds.size).toBeGreaterThan(0);
  });

  it("reconstructs the original message exactly from the marks", () => {
    const message = SAMPLE_MESSAGE;
    const result = analyzeMessage(message);
    const html = render(
      <HighlightedMessage plan={planForAnalysis(result)} />,
    );

    const texts = markTexts(html);
    expect(texts.length).toBeGreaterThan(0);

    const segments = buildHighlightSegments(message, result.findings);
    const marked = segments.filter((segment) => segment.severity).map((s) => s.text);
    expect(texts).toEqual(marked);
    // Nothing was trimmed, padded or rewritten to fit the highlighting.
    expect(segments.map((segment) => segment.text).join("")).toBe(message);
  });

  it("renders the message as text, never as markup", () => {
    const hostile = analyzeMessage(
      "URGENT share the OTP <script>alert(1)</script> <img src=x onerror=alert(2)>",
    );
    const html = render(
      <HighlightedMessage plan={planForAnalysis(hostile)} />,
    );

    expect(html).not.toContain("<script>alert(1)");
    expect(html).not.toContain("<img src=x onerror");
    expect(html).toContain("&lt;script&gt;");
  });
});

/* ------------------------------------------------------------------ */
/* 7 and 8. Overlaps, repeats, selection and clearing                  */
/* ------------------------------------------------------------------ */

describe("message highlights", () => {
  it("resolves two rules overlapping the same phrase deterministically", () => {
    const analysis = analyzeMessage(OVERLAPPING);

    // The overlap is real: both rules claim part of "expired".
    expect(analysis.matchedRuleIds).toContain("account-threat");
    expect(analysis.matchedRuleIds).toContain("urgency-pressure");

    const segments = buildHighlightSegments(analysis.message, analysis.findings);
    expect(segments.map((segment) => segment.text).join("")).toBe(analysis.message);

    const marked = segments.filter((segment) => segment.severity);
    for (const segment of marked) {
      expect(segment.ruleId).toBeDefined();
    }
    // One mark per character run, so no phrase is marked twice.
    const covered = marked.reduce((total, segment) => total + segment.text.length, 0);
    expect(covered).toBeLessThanOrEqual(analysis.message.length);
  });

  it("marks every occurrence when a phrase repeats", () => {
    const analysis = analyzeMessage(REPEATED);
    const html = render(
      <HighlightedMessage
        plan={planForAnalysis(analysis)}
      />,
    );

    const accountMarks = [
      ...html.matchAll(/data-rule-id="account-threat"/g),
    ].length;
    expect(accountMarks).toBeGreaterThan(1);
    expect(markTexts(html).length).toBe(accountMarks);
  });

  it("emphasises the selected rule's marks and leaves the rest legible", () => {
    const analysis = analyzeMessage(OVERLAPPING);
    const selected = "account-threat";

    const html = render(
      <HighlightedMessage
        plan={planForAnalysis(analysis)}
        selectedRuleId={selected}
      />,
    );

    const selectedMarks = [
      ...html.matchAll(/data-rule-id="account-threat"[^>]*data-emphasis="selected"/g),
    ].length;
    expect(selectedMarks).toBeGreaterThan(0);
    expect(html).toContain('data-emphasis="none"');
    // Not selected means outlined, never hidden.
    expect(html).not.toContain("display:none");
  });

  it("emphasises every mark under Show all matches", () => {
    const analysis = analyzeMessage(HIGH_RISK);
    const html = render(
      <HighlightedMessage
        plan={planForAnalysis(analysis)}
        showAll
      />,
    );

    const all = [...html.matchAll(/data-emphasis="all"/g)].length;
    const none = [...html.matchAll(/data-emphasis="none"/g)].length;
    expect(all).toBeGreaterThan(0);
    expect(none).toBe(0);
  });

  it("leaves every mark unemphasised by default", () => {
    const analysis = analyzeMessage(HIGH_RISK);
    const html = render(
      <HighlightedMessage plan={planForAnalysis(analysis)} />,
    );
    expect([...html.matchAll(/data-emphasis="none"/g)].length).toBeGreaterThan(0);
    expect(html.match(/data-emphasis="(selected|all)"/g)).toBeNull();
  });

  it("draws the temporary outline on one mark only", () => {
    const analysis = analyzeMessage(REPEATED);
    const html = render(
      <HighlightedMessage
        plan={planForAnalysis(analysis)}
        pulsingRuleId="account-threat"
      />,
    );
    // Two occurrences, one focused mark.
    expect([...html.matchAll(/lens-mark-pulse/g)].length).toBe(1);
  });

  it("gives every mark an accessible name mentioning its rule", () => {
    const analysis = analyzeMessage(HIGH_RISK);
    const html = render(
      <HighlightedMessage plan={planForAnalysis(analysis)} />,
    );
    expect(html).toContain("matched by");
    expect([...html.matchAll(/<button[^>]*class="[^"]*lens-mark/g)].length).toBe(
      markTexts(html).length,
    );
  });
});

/* ------------------------------------------------------------------ */
/* Shared evidence: the fallback target                                */
/* ------------------------------------------------------------------ */

describe("shared evidence", () => {
  const analysis = analyzeMessage(HIGH_RISK);
  const selected = "credential-request";

  it("registers the containing mark as the target of the covered finding", () => {
    const html = render(<HighlightedMessage plan={planForAnalysis(analysis)} />);

    // The credential range lost to the earlier-starting link range, so it has
    // no mark of its own — the link's mark carries its name instead.
    expect(html).toContain('data-focus-target-for="credential-request"');
    expect(html).toMatch(
      /data-rule-id="suspicious-link"[^>]*data-focus-target-for="credential-request"/,
    );
  });

  it("gives every finding exactly one focus target", () => {
    const html = render(<HighlightedMessage plan={planForAnalysis(analysis)} />);

    for (const item of analysis.findings) {
      const pattern = new RegExp(
        `data-focus-target-for="[^"]*\\b${item.ruleId}\\b[^"]*"`,
        "g",
      );
      expect([...html.matchAll(pattern)]).toHaveLength(1);
    }
  });

  it("emphasises the shared mark without claiming the selection", () => {
    const html = render(
      <HighlightedMessage
        plan={planForAnalysis(analysis)}
        selectedRuleId={selected}
      />,
    );

    expect([...html.matchAll(/data-emphasis="shared"/g)]).toHaveLength(1);
    expect(html).not.toContain('data-emphasis="selected"');
    // The other marks stay readable rather than being hidden.
    expect(html).toContain('data-emphasis="none"');
  });

  it("draws the temporary outline on the shared mark", () => {
    const html = render(
      <HighlightedMessage
        plan={planForAnalysis(analysis)}
        selectedRuleId={selected}
        pulsingRuleId={selected}
      />,
    );

    expect([...html.matchAll(/lens-mark-pulse/g)]).toHaveLength(1);
    expect(html).toMatch(/data-emphasis="shared"[^>]*lens-mark-pulse/);
  });

  it("keeps the mark's own rule clickable when it is borrowed", () => {
    const html = render(
      <HighlightedMessage
        plan={planForAnalysis(analysis)}
        selectedRuleId={selected}
      />,
    );

    // The shared mark still belongs to the link rule in the DOM, so activating
    // it selects the link — an explicit choice, not a silent reassignment.
    expect(html).toMatch(/data-rule-id="suspicious-link"[^>]*data-emphasis="shared"/);
  });

  it("emphasises a finding's own mark when it has one", () => {
    const own = analyzeMessage(
      "Please share the OTP you received to verify your account.",
    );
    const ruleId = own.findings[0].ruleId;
    expect(ruleId).toBe("credential-request");

    const html = render(
      <HighlightedMessage plan={planForAnalysis(own)} selectedRuleId={ruleId} />,
    );

    expect(html).toContain('data-emphasis="selected"');
    expect(html).not.toContain('data-emphasis="shared"');
  });

  it("leaves the message text untouched by the fallback", () => {
    const html = render(
      <HighlightedMessage
        plan={planForAnalysis(analysis)}
        selectedRuleId={selected}
      />,
    );

    // The mark text is still the original substring, character for character.
    const segments = buildHighlightSegments(analysis.message, analysis.findings);
    expect(markTexts(html)).toEqual(
      segments.filter((segment) => segment.severity).map((segment) => segment.text),
    );
    expect(segments.map((segment) => segment.text).join("")).toBe(analysis.message);
  });
});

/* ------------------------------------------------------------------ */
/* The unmarked remainder of a partially overlapping finding           */
/* ------------------------------------------------------------------ */

/** The visible text of every unmarked-evidence run, in document order. */
function remainderTexts(html: string): string[] {
  return [
    ...html.matchAll(/<mark[^>]*lens-evidence-remainder[^>]*>([\s\S]*?)<\/mark>/g),
  ].map((match) =>
    unescapeText(match[1].replace(/<span class="sr-only">[\s\S]*?<\/span>/, "")),
  );
}

/** The opening tags of those runs, for attribute assertions. */
function remainderTags(html: string): string[] {
  return [
    ...html.matchAll(/<mark[^>]*lens-evidence-remainder[^>]*>/g),
  ].map((match) => match[0]);
}

/**
 * The message exactly as the panel renders it.
 *
 * sr-only explanations and comments are removed, then the remaining tags, so
 * what is left is the visible text a reader would see in the same order — which
 * is the only way to prove the split pieces neither drop nor repeat a character.
 */
function renderedMessageText(html: string): string {
  return unescapeText(
    html
      .replace(/<span class="sr-only">[\s\S]*?<\/span>/g, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, ""),
  );
}

describe("unmarked evidence", () => {
  const analysis = analyzeMessage(HIGH_RISK);
  const selected = "credential-request";
  const REMAINDER = " and share the OTP you received";

  it("wraps exactly the evidence no mark reaches", () => {
    const html = render(<HighlightedMessage plan={planForAnalysis(analysis)} />);

    expect(remainderTexts(html)).toEqual([REMAINDER]);
    // Read off the real message at the reported offsets, not assumed.
    expect(HIGH_RISK.slice(90, 121)).toBe(REMAINDER);
    expect(html).toContain('data-evidence-for="credential-request"');
  });

  it("is not a control the reader could activate or navigate to", () => {
    const html = render(<HighlightedMessage plan={planForAnalysis(analysis)} />);
    const tags = remainderTags(html);

    expect(tags).toHaveLength(1);
    for (const tag of tags) {
      expect(tag).not.toContain("button");
      expect(tag).not.toContain("tabindex");
      expect(tag).not.toContain("data-rule-id");
      // Not registered as a focus target for any rule, so navigation can never
      // land on text that has no rule identity of its own.
      expect(tag).not.toContain("data-focus-target-for");
    }
    // The run is a sibling of the mark, never nested inside it.
    expect(html).not.toMatch(/<button[^>]*>[^<]*<mark[^>]*lens-evidence-remainder/);
    expect(focusableTagNames(html)).not.toContain("mark");
  });

  it("keeps the neighbouring mark's owner and target unchanged", () => {
    const html = render(
      <HighlightedMessage
        plan={planForAnalysis(analysis)}
        selectedRuleId={selected}
      />,
    );

    // The mark beside the run still belongs to the link, and is still the place
    // the credential finding navigates to.
    expect(html).toMatch(
      /data-rule-id="suspicious-link"[^>]*data-emphasis="shared"[^>]*data-focus-target-for="credential-request"/,
    );
    expect(html).toContain('data-evidence-emphasis="selected"');
  });

  it("names the finding whose evidence it is, exactly once", () => {
    const html = render(<HighlightedMessage plan={planForAnalysis(analysis)} />);

    expect([...html.matchAll(/also evidence for/g)]).toHaveLength(1);
    expect(html).toContain(
      "also evidence for Request for an OTP, password, PIN or other credential",
    );
  });

  it("emphasises the run when its own finding is selected", () => {
    const html = render(
      <HighlightedMessage
        plan={planForAnalysis(analysis)}
        selectedRuleId={selected}
      />,
    );
    expect(html).toContain('data-evidence-emphasis="selected"');
  });

  it("stays related when a different finding is selected", () => {
    const html = render(
      <HighlightedMessage
        plan={planForAnalysis(analysis)}
        selectedRuleId="urgency-pressure"
      />,
    );
    expect(html).toContain('data-evidence-emphasis="related"');
    expect(html).not.toContain('data-evidence-emphasis="selected"');
  });

  it("joins the Show all matches view", () => {
    const html = render(
      <HighlightedMessage plan={planForAnalysis(analysis)} showAll />,
    );
    expect(html).toContain('data-evidence-emphasis="all"');
  });

  it("is absent when a finding's evidence is fully marked", () => {
    const own = analyzeMessage(
      "Please share the OTP you received to verify your account.",
    );
    const html = render(
      <HighlightedMessage
        plan={planForAnalysis(own)}
        selectedRuleId={own.findings[0].ruleId}
      />,
    );

    expect(remainderTags(html)).toHaveLength(0);
    expect(html).not.toContain("also evidence for");
    expect(html).toContain('data-emphasis="selected"');
  });

  it("is absent for a range that is wholly inside another mark", () => {
    const analysis = analyzeMessage(OVERLAPPING);
    const html = render(<HighlightedMessage plan={planForAnalysis(analysis)} />);

    // An overlap with no remainder must not produce an outline or a sentence.
    expect(remainderTags(html)).toHaveLength(0);
  });

  it("renders an empty message with no runs", () => {
    const html = render(<HighlightedMessage plan={planForAnalysis(analyzeMessage(""))} />);
    expect(remainderTags(html)).toHaveLength(0);
    expect(renderedMessageText(html)).toBe("");
  });

  it("rebuilds the exact message from the rendered pieces", () => {
    const messages = [
      HIGH_RISK,
      SAMPLE_MESSAGE,
      OVERLAPPING,
      REPEATED,
      LINK_MESSAGE,
      ORDINARY,
      "",
      // Entities, angle brackets and a link in one message, to prove the
      // stripping helper is not hiding a difference.
      "URGENT: click http://sbi-kyc-verify.online/update & <script>alert(1)</script> share the OTP you received",
      "  leading and trailing  ",
      "line one\nline two\t\tand a tab",
    ];

    let withRuns = 0;
    for (const message of messages) {
      const html = render(
        <HighlightedMessage plan={planForAnalysis(analyzeMessage(message))} />,
      );
      const rebuilt = renderedMessageText(html);
      expect(rebuilt).toBe(message);
      if (remainderTags(html).length > 0) withRuns += 1;
    }

    // The set has to contain at least one message that actually exercises the
    // split, or the reconstruction proves nothing about it.
    expect(withRuns).toBeGreaterThan(0);
  });

  it("explains a shared region once, naming every finding in it", () => {
    const message = "Hi Mum, I'll be home around 7.";
    const base = analyzeMessage(message);
    const ranges: Array<[string, string, number, number]> = [
      ["outer", "outer rule", 0, 8],
      ["first", "first rule", 2, 12],
      ["second", "second rule", 4, 16],
    ];
    const analysis = withFindings(
      base,
      ranges.map(([ruleId, label, start, end]) => ({
        ruleId,
        label,
        shortLabel: label,
        severity: "high" as const,
        weight: 20,
        matchedText: message.slice(start, end),
        matchedPhrases: [message.slice(start, end)],
        occurrences: [{ start, end }],
        explanation: "",
        safeNextStep: "",
      })),
    );

    const html = render(<HighlightedMessage plan={planForAnalysis(analysis)} />);
    const tags = remainderTags(html);

    // Two runs, one per distinct stretch of uncovered evidence.
    expect(tags).toHaveLength(2);
    expect(remainderTexts(html)).toEqual([message.slice(8, 12), message.slice(12, 16)]);
    // The first stretch is evidence for two findings at once…
    expect(tags[0]).toContain('data-evidence-for="first second"');
    // …and the second only for the one that reaches further.
    expect(tags[1]).toContain('data-evidence-for="second"');

    // The sentence is read once, names both findings, and is not repeated on
    // the run that follows.
    expect([...html.matchAll(/also evidence for/g)]).toHaveLength(1);
    expect(html).toContain("also evidence for first rule and second rule");
    expect(tags[1]).not.toContain("sr-only");
  });

  it("does not carry runs from a previous message into the next analysis", () => {
    const first = render(
      <HighlightedMessage plan={planForAnalysis(analyzeMessage(HIGH_RISK))} />,
    );
    expect(remainderTags(first)).toHaveLength(1);

    const second = render(
      <HighlightedMessage plan={planForAnalysis(analyzeMessage(ORDINARY))} />,
    );
    expect(remainderTags(second)).toHaveLength(0);
    expect(second).not.toContain("also evidence for");
    expect(second).not.toContain("sbi-kyc-verify");
  });
});

/* ------------------------------------------------------------------ */
/* Message inspector controls                                          */
/* ------------------------------------------------------------------ */

describe("message inspector", () => {
  it("always renders the message, matched or not", () => {
    const analysis = analyzeMessage(ORDINARY);
    const html = render(<MessageInspector {...inspectorProps(analysis)} />);

    expect(analysis.findings).toHaveLength(0);
    expect(html).toContain(escapeText("Hi Mum"));
    expect(html).toContain("No matches to mark");
  });

  it("disables both controls when there is nothing to select", () => {
    // No findings means no marks, so there is nothing to show and nothing to clear.
    const html = render(
      <MessageInspector {...inspectorProps(analyzeMessage(ORDINARY))} />,
    );
    expect([...html.matchAll(/disabled=""/g)].length).toBe(2);
    expect(html).toContain('aria-pressed="false"');
  });

  it("keeps Show all matches available while there are matches to show", () => {
    const html = render(
      <MessageInspector {...inspectorProps(analyzeMessage(HIGH_RISK))} />,
    );
    // Only Clear selection is disabled: there is a selection state to reset.
    expect([...html.matchAll(/disabled=""/g)].length).toBe(1);
  });

  it("enables clear selection once something is selected", () => {
    // A message whose credential phrase is not absorbed by a link range, so
    // the selected rule definitely has a mark to emphasise.
    const analysis = analyzeMessage(
      "Please share the OTP you received to verify your account.",
    );
    const ruleId = analysis.findings[0].ruleId;
    expect(ruleId).toBe("credential-request");

    const html = render(
      <MessageInspector {...inspectorProps(analysis)} selectedRuleId={ruleId} />,
    );

    expect([...html.matchAll(/disabled=""/g)].length).toBe(0);
    expect(html).toContain("Showing");
    expect(html).toContain('data-emphasis="selected"');
    expect(html).toContain("currently selected");
  });

  it("falls back to the containing mark when another rule claimed the text", () => {
    // The credential phrase starts inside the earlier-started suspicious-link
    // range, so it lost the overlap contest and has no mark of its own. The
    // link's mark covers its evidence, so that is what gets emphasised — and
    // the selection itself stays with the credential finding.
    const analysis = analyzeMessage(HIGH_RISK);
    const html = render(
      <MessageInspector
        {...inspectorProps(analysis)}
        selectedRuleId="credential-request"
      />,
    );

    expect(html).toContain(
      "Showing Request for an OTP, password, PIN or other credential",
    );
    // No mark pretends to belong to the credential rule.
    expect(html).not.toContain('data-rule-id="credential-request"');
    expect(html).not.toContain('data-emphasis="selected"');
    // The link's mark is emphasised as the shared target, and says whose
    // evidence it also shows.
    expect(html).toMatch(
      /data-rule-id="suspicious-link"[^>]*data-emphasis="shared"/,
    );
    expect(html).toContain("also shows the evidence of the selected finding");
    // The status line reports the overlap instead of silently doing nothing, and
    // no longer claims the overlap is the only part on screen.
    expect(html).toContain("the shared text carries their mark");
    expect(html).toContain("the rest of its evidence is outlined for this finding");
    expect(html).not.toContain("only the overlapping part");
  });

  it("keeps the hidden remainder of evidence out of the overlap message", () => {
    // A range that is wholly inside the other mark has no remainder, so nothing
    // is outlined and the sentence must not promise one.
    const base = analyzeMessage("Hi Mum, I'll be home around 7.");
    const analysis = withFindings(base, [
      {
        ruleId: "outer",
        label: "An earlier warning sign",
        shortLabel: "an earlier warning sign",
        severity: "high",
        weight: 20,
        matchedText: "Mum",
        matchedPhrases: ["Mum"],
        occurrences: [{ start: 3, end: 6 }],
        explanation: "",
        safeNextStep: "",
      },
      {
        ruleId: "inner",
        label: "A contained warning sign",
        shortLabel: "a contained warning sign",
        severity: "high",
        weight: 20,
        matchedText: "u",
        matchedPhrases: ["u"],
        occurrences: [{ start: 4, end: 5 }],
        explanation: "",
        safeNextStep: "",
      },
    ]);

    const html = render(
      <MessageInspector {...inspectorProps(analysis)} selectedRuleId="inner" />,
    );

    expect(html).toContain('data-emphasis="shared"');
    expect(html).toContain("so that mark is highlighted instead of one of its own");
    expect(html).not.toContain("lens-evidence-remainder");
    expect(html).not.toContain("outlined for this finding");
  });

  it("accounts for unmarked evidence even when nothing is selected", () => {
    const analysis = analyzeMessage(HIGH_RISK);
    const html = render(<MessageInspector {...inspectorProps(analysis)} />);

    // One passage of the credential evidence has no mark of its own, so the
    // default sentence says it is outlined rather than leaving the reader to
    // meet unexplained marks in their own message.
    expect(html).toContain("1 passage of partly overlapping evidence is outlined");
    expect(html).toContain('data-evidence-for="credential-request"');
  });

  it("reports a mark it could not reach rather than claiming success", () => {
    const analysis = analyzeMessage(HIGH_RISK);
    const html = render(
      <MessageInspector
        {...inspectorProps(analysis)}
        selectedRuleId="credential-request"
        unreachableRuleId="credential-request"
      />,
    );

    expect(html).toContain("could not be brought into view");
    // Still selected: the failure does not move the reader to another finding.
    expect(html).toContain("Showing Request for an OTP");
  });

  it("says plainly when a finding has no evidence it can point at", () => {
    const base = analyzeMessage("Hi Mum, I'll be home around 7.");
    // A finding the engine could not produce: a rule that matched nothing, so
    // its evidence was never placed in the message.
    const analysis = withFindings(base, [
      {
        ruleId: "phantom",
        label: "A warning sign with no text",
        shortLabel: "a phantom warning sign",
        severity: "high",
        weight: 20,
        matchedText: "",
        matchedPhrases: [],
        occurrences: [],
        explanation: "",
        safeNextStep: "",
      },
    ]);

    const html = render(
      <MessageInspector {...inspectorProps(analysis)} selectedRuleId="phantom" />,
    );

    expect(html).toContain("Showing A warning sign with no text");
    expect(html).toContain("could not be located in the rendered message");
    expect(html).not.toContain("lens-mark-pulse");
    expect(html).not.toContain("No matches to mark");
    expect(html).not.toContain("lens-evidence-remainder");
  });

  it("marks Show all matches as pressed when active", () => {
    const html = render(
      <MessageInspector {...inspectorProps(analyzeMessage(HIGH_RISK))} showAll />,
    );
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("All");
  });

  it("explains an empty result instead of showing an empty box", () => {
    const analysis = analyzeMessage("");
    const html = render(<MessageInspector {...inspectorProps(analysis)} />);

    expect(html).toContain("nothing to display");
    expect(html).toContain('aria-pressed="false"');
  });

  it("never turns a highlighted phrase into a link", () => {
    const analysis = analyzeMessage(LINK_MESSAGE);
    const html = render(<MessageInspector {...inspectorProps(analysis)} />);
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("href=");
  });
});

/* ------------------------------------------------------------------ */
/* 9 and 10. Link inspector                                            */
/* ------------------------------------------------------------------ */

describe("link inspector", () => {
  it("lists exactly the indicators the engine returned", () => {
    const links = extractLinks(LINK_MESSAGE);
    const html = render(<LinkInspector links={links} />);

    const rendered = links.flatMap((link) => link.indicators);
    expect(rendered.length).toBeGreaterThan(0);

    for (const indicator of rendered) {
      expect(html).toContain(escapeText(indicator.label));
    }

    // Every row carries a strength tag, so the count is checkable.
    const strong = rendered.filter((item) => item.strength === "strong").length;
    expect([...html.matchAll(/>Strong</g)].length).toBeGreaterThanOrEqual(strong);
  });

  it("does not invent an indicator for a clean link", () => {
    const links = extractLinks("Notes are at https://docs.example.com/notes");
    const html = render(<LinkInspector links={links} />);

    expect(links[0].indicators).toHaveLength(0);
    expect(html).toContain("No indicator was raised");
    expect(html).not.toContain("May indicate imitation");
  });

  it("keeps the URL inert and non-clickable", () => {
    const links = extractLinks(LINK_MESSAGE);
    const html = render(<LinkInspector links={links} />);

    expect(html).toContain(escapeText(links[0].url));
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("href=");
  });

  it("separates observed properties from inferences", () => {
    const links = extractLinks("Verify at http://sbi-kyc-verify.online/update");
    const html = render(<LinkInspector links={links} />);

    const indicators = links[0].indicators;
    expect(indicators.some((item) => item.basis === "observed")).toBe(true);
    expect(indicators.some((item) => item.basis === "inferred")).toBe(true);
    expect(html).toContain("Observed in the address");
    expect(html).toContain("May indicate imitation");
  });

  it("keeps the link caveat verbatim", () => {
    const html = render(<LinkInspector links={extractLinks(LINK_MESSAGE)} />);
    expect(html).toContain(
      escapeText(
        "These checks inspect URL structure only. They do not verify domain ownership, reputation, or live website behaviour.",
      ),
    );
  });

  it("shows a non-conclusive empty state when no link was found", () => {
    const html = render(<LinkInspector links={[]} />);
    expect(html).toContain("No URL was found");
    expect(html).toContain("not a clean result");
  });
});

/* ------------------------------------------------------------------ */
/* 11 and 12. Rule coverage                                            */
/* ------------------------------------------------------------------ */

describe("rule coverage", () => {
  it("summarises every status in the collapsed header", () => {
    const analysis = analyzeMessage(HIGH_RISK);
    const html = render(<RuleCoverage analysis={analysis} />);

    const matched = analysis.ruleEvaluations.filter(
      (evaluation) => evaluation.status === "matched",
    ).length;
    const notMatched = analysis.evaluatedRuleCount - matched;

    expect(html).toContain(`${matched} matched`);
    expect(html).toContain(`${notMatched} not matched`);
    expect(html).toContain('aria-expanded="false"');

    // The screen-reader summary names all five rules and their status.
    for (const evaluation of analysis.ruleEvaluations) {
      expect(html).toContain(escapeText(evaluation.label));
    }
  });

  it("names the unevaluated rules rather than folding them into not matched", () => {
    const analysis = analyzeMessage("");
    const html = render(<RuleCoverage analysis={analysis} />);

    expect(analysis.evaluatedRuleCount).toBe(0);
    expect(html).toContain(`${RULES.length} not evaluated`);
    expect(html).not.toContain("1 matched");
    for (const evaluation of analysis.ruleEvaluations) {
      expect(evaluation.status).toBe("not-evaluated");
    }
  });

  it("shows the three status meanings when open", () => {
    const html = render(
      <RuleCoverage analysis={analyzeMessage(HIGH_RISK)} defaultOpen />,
    );

    expect(html).toContain("What each status means");
    expect(html).toContain("Matched:");
    expect(html).toContain("Not matched:");
    expect(html).toContain("Not evaluated:");
    expect(html).toContain("Nothing about the message can be concluded");
  });

  it("reports each rule's contribution in the compact row", () => {
    const analysis = analyzeMessage(HIGH_RISK);
    const html = render(<RuleCoverage analysis={analysis} defaultOpen />);

    for (const evaluation of analysis.ruleEvaluations) {
      if (evaluation.status === "matched") {
        expect(html).toContain(`+${evaluation.contributedPoints} pts`);
      }
    }

    // Every configured rule has a row, all of them compact by default.
    expect([...html.matchAll(/aria-expanded="false"/g)].length).toBe(RULES.length);
    const unmatched = analysis.ruleEvaluations.filter(
      (evaluation) => evaluation.status !== "matched",
    );
    expect(unmatched).toHaveLength(0);
  });

  it("shows max and contributed points in the expanded row", () => {
    const analysis = analyzeMessage(HIGH_RISK);
    const credential = analysis.ruleEvaluations.find(
      (evaluation) => evaluation.ruleId === "credential-request",
    );
    const prize = analysis.ruleEvaluations.find(
      (evaluation) => evaluation.ruleId === "prize-bait",
    );
    expect(credential).toBeDefined();
    expect(prize).toBeDefined();
    if (!credential || !prize) throw new Error("expected rule evaluations");

    const openCredential = render(
      <RuleRow evaluation={credential} open onOpenChange={() => {}} />,
    );
    expect(openCredential).toContain(`${credential.weight} pts`);
    expect(openCredential).toContain(`${credential.contributedPoints} pts`);
    expect(openCredential).toContain(`+${credential.contributedPoints} pts`);
    expect(openCredential).toContain(">Matched<");
    expect(openCredential).toContain(escapeText(credential.description));

    const collapsedPrize = render(
      <RuleRow evaluation={prize} open={false} onOpenChange={() => {}} />,
    );
    expect(collapsedPrize).toContain('aria-expanded="false"');
    expect(collapsedPrize).not.toContain("Max possible");
  });

  it("shows the score arithmetic with the cap stated", () => {
    const analysis = analyzeMessage(HIGH_RISK);
    const html = render(<RuleCoverage analysis={analysis} defaultOpen />);

    expect(analysis.scoreWasCapped).toBe(true);
    expect(analysis.rawScore).toBe(120);
    expect(html).toContain("How this score was built");
    expect(html).toContain("Sum of matched rule weights");
    expect(html).toContain("Capped at the maximum of 100");
    expect(html).toContain("100 / 100");
  });

  it("states the cap only when it applied", () => {
    const html = render(
      <RuleCoverage analysis={analyzeMessage(SAMPLE_MESSAGE)} defaultOpen />,
    );
    expect(html).not.toContain("Capped at the maximum");
    expect(html).toContain("100 / 100");
  });

  it("describes an unmatched rule as no indicator, never as clear", () => {
    const analysis = analyzeMessage("Please respond immediately.");
    const untouched = analysis.ruleEvaluations.find(
      (evaluation) => evaluation.ruleId === "account-threat",
    );
    expect(untouched?.status).toBe("not-matched");
    if (!untouched) throw new Error("expected a rule evaluation");

    const html = render(
      <RuleRow evaluation={untouched} open onOpenChange={() => {}} />,
    );
    expect(html).toContain("No matching indicator detected");
    expect(html).toContain("0 pts");
    expect(html).not.toContain("is safe");
  });

  it("never reports an unevaluated rule as a non-match", () => {
    const analysis = analyzeMessage("");
    const unevaluated = analysis.ruleEvaluations[0];
    expect(unevaluated.status).toBe("not-evaluated");

    const html = render(
      <RuleRow evaluation={unevaluated} open onOpenChange={() => {}} />,
    );
    expect(html).toContain("did not run for this result");
    expect(html).not.toContain("No matching indicator detected");
    expect(html).not.toContain(">Not matched<");
  });
});

/* ------------------------------------------------------------------ */
/* Safety actions                                                      */
/* ------------------------------------------------------------------ */

describe("safety actions", () => {
  it("offers the standing actions plus the ones this message provoked", () => {
    const html = render(<SafetyActions analysis={analyzeMessage(HIGH_RISK)} />);

    // Standing advice, true of every message.
    expect(html).toContain("I will not share an OTP");
    expect(html).toContain("I will verify the request through");
    // Actions this message provoked, each tied to a matched rule.
    expect(html).toContain("I will not open a link I was not expecting");
    expect(html).toContain("I will treat any request for a code, PIN or password");
    expect(html).toContain("I will not pay a fee or hand over details");
    expect(html).toContain("Relevant to this message");
  });

  it("omits the actions this message did not provoke", () => {
    const html = render(<SafetyActions analysis={analyzeMessage(ORDINARY)} />);

    expect(html).toContain("I will not share an OTP");
    expect(html).not.toContain("I will not pay a fee or hand over details");
    expect(html).not.toContain("Relevant to this message");
  });

  it("says plainly that ticks do not clear a message", () => {
    const html = render(<SafetyActions analysis={analyzeMessage(HIGH_RISK)} />);
    expect(html).toContain(escapeText(SAFETY_CHECKLIST_NOTE));
    expect(html).toContain("Ticking them changes nothing about the score");
  });

  it("keeps the reporting resources and links only the official portal", () => {
    const html = render(<SafetyActions analysis={analyzeMessage(HIGH_RISK)} />);
    expect(html).toContain("cybercrime.gov.in");
    expect(html).toContain("1930");
    expect(html).toContain('href="https://www.cybercrime.gov.in/"');
    expect(html).toContain('rel="noopener noreferrer"');
    // Exactly one link, and it is not a URL taken from the message.
    expect([...html.matchAll(/<a /g)].length).toBe(1);
    expect(html).not.toContain("sbi-kyc-verify");
  });

  it("reuses the engine summary instead of a second verdict", () => {
    const analysis = analyzeMessage(HIGH_RISK);
    const html = render(<SafetyActions analysis={analysis} />);
    expect(html).toContain(escapeText(analysis.summary));
  });
});

/* ------------------------------------------------------------------ */
/* 13. Empty states through the whole explorer                         */
/* ------------------------------------------------------------------ */

describe("full explorer", () => {
  it("renders the whole investigation for a real analysis", () => {
    const analysis = analyzeMessage(HIGH_RISK);
    const html = render(<ResultsExplorer analysis={analysis} />);

    for (const heading of [
      "Analysis results",
      "Warning signs",
      "Message inspector",
      "Links",
      "Rule coverage",
      "What to do next",
    ]) {
      expect(html).toContain(heading);
    }
    expect(html).toContain("Show all matches");
    expect(html).toContain("Clear selection");
    expect(html).toContain("Warning signs found");

    // Cards start collapsed, so no card reveals its long-form content yet.
    expect(html).not.toContain("Show in message");
    expect(html).not.toContain(escapeText(analysis.findings[0].explanation));
  });

  it("renders a low-risk message without inventing evidence", () => {
    const analysis = analyzeMessage(ORDINARY);
    const html = render(<ResultsExplorer analysis={analysis} />);

    expect(html).toContain("Low risk");
    expect(html).toContain("None of the 5 configured warning signs matched");
    expect(html).not.toContain("Show in message");
    expect(html).toContain("No URL was found");
  });

  it("renders an empty analysis with every rule unevaluated", () => {
    const analysis = analyzeMessage("");
    const html = render(<ResultsExplorer analysis={analysis} />);

    expect(html).toContain("0 of 5");
    expect(html).toContain(`${RULES.length} not evaluated`);
    expect(html).toContain("nothing to display");
  });

  it("starts with nothing selected or expanded", () => {
    const html = render(<ResultsExplorer analysis={analyzeMessage(HIGH_RISK)} />);
    expect(html).toContain('aria-expanded="false"');
    expect(html.match(/aria-pressed="true"/g)).toBeNull();
  });

  it("starts a fresh analysis with no fallback state left over", () => {
    const html = render(<ResultsExplorer analysis={analyzeMessage(HIGH_RISK)} />);

    // Nothing is selected, so neither a direct nor a shared emphasis exists,
    // and no unreachable navigation is being reported.
    expect(html).not.toContain('data-emphasis="selected"');
    expect(html).not.toContain('data-emphasis="shared"');
    expect(html).not.toContain("could not be brought into view");
    // The fallback target wiring is still present and ready.
    expect(html).toContain('data-focus-target-for="credential-request"');
  });

  it("does not carry a previous message's marks into the next analysis", () => {
    render(<ResultsExplorer analysis={analyzeMessage(HIGH_RISK)} />);
    const html = render(<ResultsExplorer analysis={analyzeMessage(ORDINARY)} />);

    expect(html).not.toContain("data-rule-id=");
    expect(html).not.toContain("data-focus-target-for");
    expect(html).not.toContain("sbi-kyc-verify");
    expect(html).not.toContain("Showing");
  });

  it("renders an empty message without any mark or target", () => {
    const html = render(<ResultsExplorer analysis={analyzeMessage("")} />);
    expect(html).not.toContain("data-rule-id=");
    expect(html).not.toContain("data-focus-target-for");
  });
});

/* ------------------------------------------------------------------ */
/* 15. Keyboard-operation structure                                    */
/* ------------------------------------------------------------------ */

describe("keyboard structure", () => {
  const html = render(<ResultsExplorer analysis={analyzeMessage(HIGH_RISK)} />);

  it("makes every control a real button, anchor or input", () => {
    const tags = focusableTagNames(html);
    expect(tags.length).toBeGreaterThan(10);
    for (const tag of tags) {
      expect(["button", "a", "input"]).toContain(tag);
    }
  });

  it("keeps the programmatic scroll target out of the tab order", () => {
    const withTabIndex = [
      ...html.matchAll(/<([a-z0-9]+)([^>]*tabindex="([^"]+)"[^>]*)>/g),
    ];
    expect(withTabIndex.length).toBeGreaterThan(0);

    for (const [, tag, , value] of withTabIndex) {
      if (tag === "button" || tag === "a" || tag === "input") continue;
      // The only non-control focusable is the finding container, focused
      // programmatically and deliberately kept at -1 so it never adds a tab stop.
      expect(tag).toBe("li");
      expect(value).toBe("-1");
    }
  });

  it("gives every disclosure trigger an expanded state", () => {
    const expandedStates = [...html.matchAll(/aria-expanded="(true|false)"/g)];
    // One for the overview chips count? No: one per disclosure trigger.
    expect(expandedStates.length).toBeGreaterThan(0);
    for (const state of expandedStates) {
      expect(["true", "false"]).toContain(state[1]);
    }
    // Every trigger is a real button, so it is reachable and operable by keyboard.
    expect([...html.matchAll(/<button[^>]*aria-expanded=/g)].length).toBe(
      expandedStates.length,
    );
  });

  it("wires every checkbox to a label", () => {
    // Attribute order is not guaranteed, so read the id out of each tag.
    const checkboxTags = [
      ...html.matchAll(/<button[^>]*role="checkbox"[^>]*>/g),
    ].map((match) => match[0]);

    expect(checkboxTags.length).toBeGreaterThan(0);
    for (const tag of checkboxTags) {
      const id = /id="([^"]+)"/.exec(tag)?.[1] ?? "";
      expect(id.length).toBeGreaterThan(0);
      expect(html).toContain(`for="${id}"`);
    }
  });
});
