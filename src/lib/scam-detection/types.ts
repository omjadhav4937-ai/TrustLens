/**
 * Shared types for the TrustLens rule-based detection engine.
 *
 * Everything here is intentionally presentation-free: the engine can be unit
 * tested and reasoned about without React.
 */

/** Overall verdict band for a message. */
export type RiskLevel = "low" | "medium" | "high";

/** How alarming an individual warning sign is, independent of its weight. */
export type FindingSeverity = "low" | "medium" | "high" | "critical";

/** A half-open character range `[start, end)` inside the analysed message. */
export interface TextRange {
  start: number;
  end: number;
}

/** One matched warning sign. */
export interface ScamFinding {
  /** Stable identifier of the rule that produced this finding. */
  ruleId: string;
  /** Readable title, e.g. "Request for a one-time password". */
  label: string;
  severity: FindingSeverity;
  /** Points this rule contributes. A rule contributes at most once. */
  weight: number;
  /** The exact text from the message that triggered the rule. */
  matchedText: string;
  /** Every distinct phrase that matched, in the order they appear. */
  matchedPhrases: string[];
  /** Every location the rule matched, so the message can be highlighted. */
  occurrences: TextRange[];
  /** Why this wording may be suspicious. */
  explanation: string;
  /** What the reader should do about it. */
  safeNextStep: string;
}

/** A single heuristic raised by a URL. */
export interface LinkIndicator {
  id: string;
  label: string;
  explanation: string;
  /**
   * `strong` indicators are meaningful on their own; `weak` ones only count
   * when at least two of them stack up. This keeps ordinary links from being
   * flagged while still catching deliberately deceptive ones.
   */
  strength: "strong" | "weak";
}

/** A URL found in the message, with the heuristics it raised. */
export interface AnalyzedLink {
  /** The URL exactly as it appeared in the message. */
  url: string;
  /** Parsed hostname, or null when the URL could not be parsed. */
  host: string | null;
  start: number;
  end: number;
  indicators: LinkIndicator[];
  /** True when the indicators are enough to treat the link as suspicious. */
  suspicious: boolean;
}

/** The complete result of analysing one message. */
export interface ScamAnalysis {
  riskLevel: RiskLevel;
  /** 0–100. Always the capped sum of the matched rule weights. */
  score: number;
  /** Matched warning signs, strongest first. */
  findings: ScamFinding[];
  /** One short paragraph explaining the overall result. */
  summary: string;
  /**
   * The exact text that was analysed, so a report can show the matches in
   * context without reaching back into the input component.
   */
  message: string;
  /** Epoch milliseconds. */
  analyzedAt: number;
  /** Every URL found, whether or not it was suspicious. */
  links: AnalyzedLink[];
  /** Ids of the rules that matched, for quick assertions. */
  matchedRuleIds: string[];
}

/** Everything a rule may look at. */
export interface DetectionContext {
  /** Whitespace/case-normalised message. Offsets match the original text. */
  message: string;
  /** URLs already extracted from the message. */
  links: AnalyzedLink[];
}

/**
 * A rule is a small, self-describing unit: an id, the weight it contributes
 * once, plain-language copy, and a pure matching function.
 */
export interface DetectionRule {
  id: string;
  label: string;
  /** What the rule looks for, in one line. Kept next to the logic on purpose. */
  description: string;
  /** Points added to the score when this rule matches. Max 100 in total. */
  weight: number;
  severity: FindingSeverity;
  explanation: string;
  safeNextStep: string;
  /** Returns every matched range. Never throws, never performs I/O. */
  detect: (context: DetectionContext) => TextRange[];
}
