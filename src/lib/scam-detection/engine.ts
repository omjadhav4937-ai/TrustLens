import { extractLinks } from "./links";
import { normalizeMessage, sanitizeRanges } from "./normalize";
import { RULES } from "./rules";
import type {
  DetectionRule,
  RiskLevel,
  RuleEvaluation,
  RuleEvaluationStatus,
  ScamAnalysis,
  ScamFinding,
} from "./types";

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

const NO_MATCH_EXPLANATION =
  "No configured warning signs matched. This does not guarantee that the message is safe.";

const NOT_ANALYSED_EXPLANATION =
  "No message has been checked, so no rule has been evaluated and there is no score to explain.";

const SCREENING_CAVEAT = "This score is a screening signal, not proof of fraud.";

/** Maps a 0–100 score onto the published risk bands. */
export function riskLevelForScore(score: number): RiskLevel {
  const safeScore = Number.isFinite(score)
    ? Math.max(0, Math.min(MAX_SCORE, score))
    : 0;
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
 * Builds the one-or-two sentence reason for the score.
 *
 * The wording is assembled from the findings that were actually produced and the
 * totals that were actually computed, so it can never contradict the report it
 * sits above. When the rule weights overflow the cap, the difference between the
 * raw sum and the final score is stated explicitly rather than hidden.
 */
export function buildScoreExplanation(
  findings: ScamFinding[],
  rawScore: number,
  score: number,
  wasAnalysed: boolean,
): string {
  if (!wasAnalysed) return NOT_ANALYSED_EXPLANATION;
  if (findings.length === 0) return NO_MATCH_EXPLANATION;

  const strongest = findings[0].shortLabel;

  const lead =
    findings.length === 1
      ? `One configured warning sign matched — ${strongest}. ${SCREENING_CAVEAT}`
      : findings.length <= 3
        ? `Several warning signs matched, including ${strongest}. ${SCREENING_CAVEAT}`
        : `${findings.length} of the ${RULES.length} configured warning signs matched, including ${strongest}. ${SCREENING_CAVEAT}`;

  const cap =
    rawScore > score
      ? ` The matched rule weights add up to ${rawScore} points, which is capped at the maximum of ${MAX_SCORE}.`
      : "";

  return `${lead}${cap}`;
}

/** An evaluation record for a rule, with sensible defaults for the unused fields. */
function evaluationFor(
  rule: DetectionRule,
  fields: Partial<RuleEvaluation> & { status: RuleEvaluationStatus },
): RuleEvaluation {
  return {
    ruleId: rule.id,
    label: rule.label,
    shortLabel: rule.shortLabel,
    description: rule.description,
    weight: rule.weight,
    severity: rule.severity,
    contributedPoints: 0,
    matchedText: null,
    matchedPhrases: [],
    occurrences: [],
    note: null,
    ...fields,
  };
}

const RULE_FAILED_NOTE =
  "This rule could not complete on this message, so it contributed nothing to the score. Its warning signs are not covered by this result.";

/**
 * Runs the configured rules over one message.
 *
 * The function is pure: the same input always produces the same findings and
 * score. It performs no network access, no storage and no logging, so the
 * message never leaves the browser.
 *
 * Scoring is per rule, not per match. A rule that matches five times still
 * contributes its weight once, and the total is capped at 100. `rawScore`
 * records the uncapped sum so the interface can show the cap being applied
 * instead of silently losing the overflow.
 *
 * Every configured rule is reported in `ruleEvaluations`, whether it matched,
 * did not match, or never ran. A rule that never ran is reported as
 * `not-evaluated` rather than `not-matched`, because its silence says nothing
 * about the message.
 */
export function analyzeMessage(rawMessage: string): ScamAnalysis {
  const message = typeof rawMessage === "string" ? rawMessage : "";
  const analyzedAt = Date.now();

  if (message.trim().length === 0) {
    // No rule runs at all here, so none of them may be presented as a clean
    // non-match. They are reported as unevaluated instead.
    return {
      riskLevel: "low",
      score: 0,
      rawScore: 0,
      scoreWasCapped: false,
      findings: [],
      ruleEvaluations: RULES.map((rule) =>
        evaluationFor(rule, { status: "not-evaluated" }),
      ),
      evaluatedRuleCount: 0,
      summary: EMPTY_SUMMARY,
      scoreExplanation: buildScoreExplanation([], 0, 0, false),
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

  const ruleEvaluations: RuleEvaluation[] = [];
  const findings: ScamFinding[] = [];

  for (const rule of RULES) {
    let outcome;
    try {
      outcome = rule.detect(context);
    } catch {
      // A single misbehaving rule must never break the whole analysis, and it
      // must never be reported as a non-match either.
      ruleEvaluations.push(
        evaluationFor(rule, { status: "error", note: RULE_FAILED_NOTE }),
      );
      continue;
    }

    const ranges = sanitizeRanges(outcome.matches, normalized.length);
    const note = outcome.note ?? null;

    if (ranges.length === 0) {
      ruleEvaluations.push(evaluationFor(rule, { status: "not-matched", note }));
      continue;
    }

    const phrases = Array.from(
      new Set(ranges.map((range) => message.slice(range.start, range.end))),
    )
      .filter((phrase) => phrase.trim().length > 0)
      .slice(0, MAX_ECHOED_PHRASES);

    const matchedText = message.slice(ranges[0].start, ranges[0].end);

    findings.push({
      ruleId: rule.id,
      label: rule.label,
      shortLabel: rule.shortLabel,
      severity: rule.severity,
      weight: rule.weight,
      matchedText,
      matchedPhrases: phrases,
      occurrences: ranges,
      explanation: rule.explanation,
      safeNextStep: rule.safeNextStep,
    });

    ruleEvaluations.push(
      evaluationFor(rule, {
        status: "matched",
        contributedPoints: rule.weight,
        matchedText,
        matchedPhrases: phrases,
        occurrences: ranges,
        note,
      }),
    );
  }

  findings.sort(
    (a, b) => b.weight - a.weight || a.occurrences[0].start - b.occurrences[0].start,
  );

  // The uncapped sum is kept so the report can show the cap being applied.
  const rawScore = findings.reduce((total, finding) => total + finding.weight, 0);
  const score = Math.min(MAX_SCORE, rawScore);

  return {
    riskLevel: riskLevelForScore(score),
    score,
    rawScore,
    scoreWasCapped: rawScore > MAX_SCORE,
    findings,
    ruleEvaluations,
    evaluatedRuleCount: ruleEvaluations.filter(
      (evaluation) => evaluation.status === "matched" || evaluation.status === "not-matched",
    ).length,
    summary: buildSummary(findings, riskLevelForScore(score), score),
    scoreExplanation: buildScoreExplanation(findings, rawScore, score, true),
    message,
    analyzedAt,
    links,
    matchedRuleIds: findings.map((finding) => finding.ruleId),
  };
}
