import { extractLinks } from "./links";
import { normalizeMessage, sanitizeRanges } from "./normalize";
import { RULES } from "./rules";
import type { RiskLevel, ScamAnalysis, ScamFinding } from "./types";

/** Score at which a message moves from low to medium risk. */
export const RISK_THRESHOLD_MEDIUM = 30;
/** Score at which a message moves from medium to high risk. */
export const RISK_THRESHOLD_HIGH = 60;
/** The score is always capped here, however many rules match. */
export const MAX_SCORE = 100;

/** Hard limit on how many phrases are echoed back per finding. */
const MAX_ECHOED_PHRASES = 5;

const NO_MATCH_SUMMARY =
  "No configured warning signs were detected in this message. TrustLens only checks for the specific patterns it knows about, so this is not proof that the message is safe. If anything about it still feels wrong, verify it through a channel you found yourself.";

const EMPTY_SUMMARY =
  "No message was submitted, so no configured warning signs could be detected. Paste or load a message to have it checked.";

/** Maps a 0–100 score onto the published risk bands. */
export function riskLevelForScore(score: number): RiskLevel {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(MAX_SCORE, score)) : 0;
  if (safeScore >= RISK_THRESHOLD_HIGH) return "high";
  if (safeScore >= RISK_THRESHOLD_MEDIUM) return "medium";
  return "low";
}

const RISK_WORD: Record<RiskLevel, string> = {
  low: "low",
  medium: "medium",
  high: "high",
};

function lowerFirst(value: string): string {
  return value.length > 0 ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}

/**
 * Builds the short plain-language summary shown above the findings.
 *
 * Every branch is careful never to imply that a low score means the message is
 * safe, because the engine can only speak to the rules it knows about.
 */
export function buildSummary(
  findings: ScamFinding[],
  riskLevel: RiskLevel,
  score: number,
): string {
  if (findings.length === 0) return NO_MATCH_SUMMARY;

  const labels = findings.slice(0, 2).map((finding) => lowerFirst(finding.label));
  const labelText =
    labels.length === 1 ? labels[0] : `${labels[0]} and ${labels[1]}`;

  const opening =
    findings.length === 1
      ? `One warning sign matched (${labelText}), giving a ${RISK_WORD[riskLevel]} risk score of ${score} out of 100.`
      : `${findings.length} warning signs matched, giving a ${RISK_WORD[riskLevel]} risk score of ${score} out of 100. The strongest indicators were ${labelText}.`;

  const closing =
    riskLevel === "high"
      ? " Treat this message as high risk and do not act on it until you have verified it through a channel you found yourself."
      : riskLevel === "medium"
        ? " Treat this message with caution and verify it through an official channel before acting on it."
        : " Only limited indicators were found, which does not make the message trustworthy. Stay cautious and verify before acting.";

  return `${opening}${closing}`;
}

/**
 * Runs the configured rules over one message.
 *
 * The function is pure: the same input always produces the same findings and
 * score. It performs no network access, no storage and no logging, so the
 * message never leaves the browser.
 *
 * Scoring is per rule, not per match. A rule that matches five times still
 * contributes its weight once, and the total is capped at 100.
 */
export function analyzeMessage(rawMessage: string): ScamAnalysis {
  const message = typeof rawMessage === "string" ? rawMessage : "";
  const analyzedAt = Date.now();

  if (message.trim().length === 0) {
    return {
      riskLevel: "low",
      score: 0,
      findings: [],
      summary: EMPTY_SUMMARY,
      message,
      analyzedAt,
      links: [],
      matchedRuleIds: [],
    };
  }

  // Normalising keeps offsets identical to the original text, so matched
  // snippets can be read straight back out of what the user actually typed.
  const normalized = normalizeMessage(message);
  const links = extractLinks(message);
  const context = { message: normalized, links };

  const findings: ScamFinding[] = [];

  for (const rule of RULES) {
    let ranges;
    try {
      ranges = sanitizeRanges(rule.detect(context), normalized.length);
    } catch {
      // A single misbehaving rule must never break the whole analysis.
      continue;
    }
    if (ranges.length === 0) continue;

    const phrases = Array.from(
      new Set(ranges.map((range) => message.slice(range.start, range.end))),
    )
      .filter((phrase) => phrase.trim().length > 0)
      .slice(0, MAX_ECHOED_PHRASES);

    findings.push({
      ruleId: rule.id,
      label: rule.label,
      severity: rule.severity,
      weight: rule.weight,
      matchedText: message.slice(ranges[0].start, ranges[0].end),
      matchedPhrases: phrases,
      occurrences: ranges,
      explanation: rule.explanation,
      safeNextStep: rule.safeNextStep,
    });
  }

  findings.sort(
    (a, b) => b.weight - a.weight || a.occurrences[0].start - b.occurrences[0].start,
  );

  const score = Math.min(
    MAX_SCORE,
    findings.reduce((total, finding) => total + finding.weight, 0),
  );
  const riskLevel = riskLevelForScore(score);

  return {
    riskLevel,
    score,
    findings,
    summary: buildSummary(findings, riskLevel, score),
    message,
    analyzedAt,
    links,
    matchedRuleIds: findings.map((finding) => finding.ruleId),
  };
}
