import type { LanguageInfo } from "./language";

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
  /** Short noun phrase for generated sentences, e.g. "a suspicious link". */
  shortLabel: string;
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
  /**
   * Separates what was read off the address from what was concluded about it.
   *
   * - `observed` — a property of the address string, or membership of a list
   *   this project ships. Checkable by eye, no inference involved.
   * - `inferred` — a judgement that the address may be imitating something.
   *   Useful, but an interpretation rather than a measurement.
   *
   * The interface groups indicators by this field so a reader can tell a fact
   * about the address apart from a suspicion about its author.
   */
  basis: "observed" | "inferred";
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

/**
 * Whether a rule actually ran, and what it decided.
 *
 * `not-evaluated` is deliberately distinct from `not-matched`: a rule that never
 * ran says nothing at all about the message, and the interface must not present
 * its silence as a clean result.
 */
export type RuleEvaluationStatus =
  /** The rule ran and counted at least one phrase. */
  | "matched"
  /** The rule ran and found nothing to count. */
  | "not-matched"
  /** The rule never ran, so its outcome is unknown. */
  | "not-evaluated"
  /** The rule ran but failed, so it contributed nothing to the score. */
  | "error";

/**
 * What a rule returns.
 *
 * The ranges are what the rule wants counted; `matches` is merged and clamped by
 * the engine, so a rule may return overlapping or unsorted ranges safely.
 */
export interface RuleDetectionOutcome {
  matches: TextRange[];
  /**
   * Set when the rule recognised its own pattern but deliberately chose not to
   * count it, or when it wants to record how it decided. Rendered in the
   * detection breakdown so a non-match is never mistaken for a clean result.
   */
  note?: string;
}

/** One configured rule, with the decision it reached for one message. */
export interface RuleEvaluation {
  ruleId: string;
  label: string;
  /** Short noun phrase used in generated sentences. */
  shortLabel: string;
  description: string;
  /** Maximum points this rule can contribute. */
  weight: number;
  severity: FindingSeverity;
  status: RuleEvaluationStatus;
  /** Points actually added. Zero unless `status` is "matched". */
  contributedPoints: number;
  /** The exact text that was counted, or null when the rule did not count any. */
  matchedText: string | null;
  /** Every distinct phrase the rule counted. */
  matchedPhrases: string[];
  /** Every location the rule counted, so the panel can report how often. */
  occurrences: TextRange[];
  /** Plain-language note about a near miss or a decision the rule made. */
  note: string | null;
}

/** The complete result of analysing one message. */
export interface ScamAnalysis {
  riskLevel: RiskLevel;
  /** 0–100. Always the capped sum of the matched rule weights. */
  score: number;
  /** The sum of the matched rule weights, *before* the cap was applied. */
  rawScore: number;
  /** True when the raw sum exceeded the cap, so the two totals differ. */
  scoreWasCapped: boolean;
  /** Matched warning signs, strongest first. */
  findings: ScamFinding[];
  /**
   * Every configured rule and what it decided, in configuration order. Always
   * contains all rules, so the interface can show unmatched and unevaluated
   * rules without inferring anything from the findings.
   */
  ruleEvaluations: RuleEvaluation[];
  /** How many rules ran to completion, whether or not they matched. */
  evaluatedRuleCount: number;
  /** One short paragraph explaining the overall result. */
  summary: string;
  /** One or two sentences explaining where the score came from. */
  scoreExplanation: string;
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
  /**
   * Heuristic script/language label for the message. Advisory only: no rule
   * reads it, so a wrong label can neither hide nor create a finding.
   */
  language: LanguageInfo;
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
  /** Short noun phrase used in generated sentences ("a suspicious link"). */
  shortLabel: string;
  /** What the rule looks for, in one line. Kept next to the logic on purpose. */
  description: string;
  /** Points added to the score when this rule matches. Max 100 in total. */
  weight: number;
  severity: FindingSeverity;
  explanation: string;
  safeNextStep: string;
  /** Returns the ranges to count. Never throws, never performs I/O. */
  detect: (context: DetectionContext) => RuleDetectionOutcome;
}
