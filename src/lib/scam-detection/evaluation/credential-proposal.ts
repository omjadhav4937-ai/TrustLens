import {
  MAX_SCORE,
  analyzeMessage,
  riskLevelForScore,
} from "../engine";
import { normalizeMessage } from "../normalize";
import type { RiskLevel } from "../types";
import type { EvaluationCase, ExpectedLabel } from "./types";

/**
 * Evaluation-only proposal for extending credential-request detection.
 *
 * This module is not imported by the application or by the engine. It never
 * changes `analyzeMessage()` or the production rules. Its purpose is to measure
 * two candidate matching strategies against the existing datasets.
 *
 * The simulation is an overlay:
 *
 *   simulatedScore = min(100, baseline.score + (candidateMatches && !alreadyCredential ? 40 : 0))
 *
 * The +40 is the *existing* credential rule weight. A case that already produced
 * a credential finding is left untouched, so the rule can never be counted twice.
 * Risk is recomputed with the engine's own `riskLevelForScore`, preserving the
 * 30/60 thresholds and the 100 cap.
 */

export const CREDENTIAL_RULE_ID = "credential-request";
export const CREDENTIAL_WEIGHT = 40;

export type CredentialCandidate = "A" | "B";
/** A2 is the card-image refinement experiment and is simulated separately. */
export type CredentialCandidateLabel = CredentialCandidate | "A2";
export type CredentialSignalFamily = "card-image" | "recovery-code" | "app-code";

/**
 * Clause-level reasons Candidate A2 drops a card-image signal.
 *
 * These are diagnostic labels, never production output. A/B never emit them.
 */
export type CredentialSignalSuppression =
  | "excluded-object"
  | "not-needed"
  | "self-directed"
  | "conditional-official-flow"
  | "official-portal-no-link";

export interface SuppressedCredentialSignal {
  family: CredentialSignalFamily;
  safeguard: CredentialSignalSuppression;
}

export type CredentialSignalReason =
  | "card-image-request"
  | "identity-card-image-request"
  | "recovery-code-request"
  | "app-code-request"
  | "obfuscated-code-request"
  | "code-mixed-code-request";

export interface CredentialEvidence {
  family: CredentialSignalFamily;
  reason: CredentialSignalReason;
}

export interface CredentialSignalResult {
  candidate: CredentialCandidateLabel;
  matched: boolean;
  families: CredentialSignalFamily[];
  evidence: CredentialEvidence[];
  /** Card-image safeguards that fired; always empty for A and B. */
  suppressed: SuppressedCredentialSignal[];
}

/* ------------------------------------------------------------------ */
/* Shared text helpers                                                 */
/* ------------------------------------------------------------------ */

/** Sentence-ish clauses, so a request cannot match across unrelated text. */
export function clausesOf(message: string): string[] {
  return normalizeMessage(message)
    .split(/[.!?;]+\s+|\n+/)
    .map((clause) => clause.trim())
    .filter((clause) => clause.length > 0);
}

/**
 * Clauses that carry a privacy warning are left alone.
 *
 * This is deliberately clause-scoped: a bank alert can warn in one sentence and
 * ask in another, and the second sentence must still be judged on its own. It
 * also keeps "do not send a photo of your card" from matching.
 */
const PROTECTIVE_PATTERNS: RegExp[] = [
  /\b(?:do|does|did)\s+not\s+(?:share|send|upload|forward|provide|give|disclose|reveal|text|email|message|read)\b/i,
  /\bdon'?t\s+(?:share|send|upload|forward|provide|give|disclose|reveal|text|email|message|read)\b/i,
  /\bnever\s+(?:share|send|upload|forward|provide|give|disclose|reveal|text|email|message|read|ask)\b/i,
  /\bnot\s+to\s+be\s+shared\b/i,
  /\bkeep\b[^.!?\n]{0,40}\b(?:private|secret|safe|confidential|to\s+yourself)\b/i,
  /\bwe\s+(?:will\s+)?never\s+ask\b/i,
];

function isProtective(clause: string): boolean {
  return PROTECTIVE_PATTERNS.some((pattern) => pattern.test(clause));
}

/** App-provided flow that is not a transfer to another person. */
const IN_APP_FLOW =
  /\b(?:in|via|through|inside)\s+(?:the|our|your)\s+app\b|\bon\s+the\s+next\s+screen\b|\bin\s+settings\b|\bin\s+your\s+(?:account|portal|dashboard)\b/i;
const PERSONAL_TRANSFER =
  /\b(?:chat|whatsapp|reply|send\s+me|forward|text\s+me|email\s+me|dm|inbox\s+me)\b/i;

/* ------------------------------------------------------------------ */
/* A. Card-image requests                                             */
/* ------------------------------------------------------------------ */

const CARD_REQUEST =
  String.raw`(?:share|send|forward|upload|provide|reply\s+with|give|email|text|message|dm|whatsapp)`;
const CARD_REQUEST_BROADER =
  String.raw`(?:share|send|forward|upload|provide|reply\s+with|give|email|text|message|dm|whatsapp|need|needs|require|requires|can\s+you\s+(?:send|share|upload|forward))`;
const IMAGE_A =
  String.raw`(?:photo|photos|photograph|picture|pictures|pic|image|images|scan|screenshot)`;
const IMAGE_B =
  String.raw`(?:photo|photos|photograph|picture|pictures|pic|image|images|scan|screenshot|copy|copies)`;
const PAYMENT_CARD =
  String.raw`(?:(?:debit|credit|atm|payment|bank)\s+card|\bcard\b)`;
const CARD_OR_ID_B =
  String.raw`(?:(?:debit|credit|atm|payment|bank)\s+card|\bcard\b|aadhaar(?:\s+card)?|pan\s+card|passport|id\s+card|identity\s+card|driving\s+licen[cs]e|voter\s+id)`;

function cardImagePatterns(
  request: string,
  image: string,
  document: string,
): RegExp[] {
  return [
    new RegExp(
      String.raw`\b(?:${request})\b[^.!?\n]{0,60}?\b(?:${image})\b[^.!?\n]{0,60}?\b(?:${document})\b`,
      "i",
    ),
    new RegExp(
      String.raw`\b(?:${request})\b[^.!?\n]{0,60}?\b(?:${document})\b[^.!?\n]{0,40}?\b(?:${image})\b`,
      "i",
    ),
    new RegExp(
      String.raw`\b(?:${image})\b[^.!?\n]{0,60}?\b(?:${document})\b[^.!?\n]{0,60}?\b(?:${request})\b`,
      "i",
    ),
  ];
}

export const CARD_IMAGE_A = cardImagePatterns(
  CARD_REQUEST,
  IMAGE_A,
  PAYMENT_CARD,
);
const CARD_IMAGE_B = cardImagePatterns(CARD_REQUEST_BROADER, IMAGE_B, CARD_OR_ID_B);

export function cardImageMatch(
  clause: string,
  patterns: RegExp[],
  requestPattern: RegExp,
): CredentialEvidence | null {
  if (isProtective(clause)) return null;
  if (IN_APP_FLOW.test(clause) && !PERSONAL_TRANSFER.test(clause)) return null;

  // A gift card is not a payment credential, so its photo is not this signal.
  const scrubbed = clause.replace(/\bgift[\s-]*cards?\b/gi, "gift");
  if (!patterns.some((pattern) => pattern.test(scrubbed))) return null;
  if (!requestPattern.test(scrubbed)) return null;

  const identity =
    /aadhaar|pan\s+card|passport|id\s+card|identity\s+card|driving\s+licen[cs]e|voter\s+id/i.test(
      scrubbed,
    );
  return {
    family: "card-image",
    reason: identity ? "identity-card-image-request" : "card-image-request",
  };
}

/* ------------------------------------------------------------------ */
/* B. Recovery-code requests                                          */
/* ------------------------------------------------------------------ */

const RECOVERY_A = String.raw`(?:recovery|backup)\s+codes?`;
const RECOVERY_B =
  String.raw`(?:(?:recovery|backup)\s+codes?|recovery\s+keys?|account\s+recovery\s+codes?)`;
const DISCLOSURE_A =
  String.raw`(?:share|send|forward|tell|read|give|provide|reply\s+with|text|email|message)`;
const DISCLOSURE_B =
  String.raw`(?:share|send|forward|tell|read|give|provide|reply\s+with|text|email|message|disclose|divulge|need|needs)`;

function recoveryPatterns(term: string, verb: string): RegExp[] {
  return [
    new RegExp(
      String.raw`\b(?:${verb})\b[^.!?\n]{0,60}?\b(?:${term})\b`,
      "i",
    ),
    new RegExp(
      String.raw`\b(?:${term})\b[^.!?\n]{0,60}?\b(?:${verb})\b`,
      "i",
    ),
  ];
}

const RECOVERY_A_PATTERNS = recoveryPatterns(RECOVERY_A, DISCLOSURE_A);
const RECOVERY_B_PATTERNS = recoveryPatterns(RECOVERY_B, DISCLOSURE_B);

function recoveryMatch(
  clause: string,
  patterns: RegExp[],
): CredentialEvidence | null {
  if (isProtective(clause)) return null;
  return patterns.some((pattern) => pattern.test(clause))
    ? { family: "recovery-code", reason: "recovery-code-request" }
    : null;
}

/* ------------------------------------------------------------------ */
/* C. Codes displayed inside an app                                   */
/* ------------------------------------------------------------------ */

const CODE_TERM =
  String.raw`(?:(?:one[-\s]?time\s+)?(?:verification|security|login|sign[-\s]?in|access)\s+code|(?:six|6|four|4|five|5|eight|8)[-\s]?digit\s+(?:verification\s+)?code|\bcodes?\b|\bpasscode\b)`;
const CODE_CONTEXT_A =
  String.raw`(?:\bapp\b|\bapplication\b|\bscreen\b|\bdisplayed\b|\bshown\b|\bgenerated\b|\bauthenticator\b|\bsms\b|text\s+message|\bmobile\b|\bphone\b|\bdevice\b|notification)`;
const CODE_CONTEXT_B =
  String.raw`(?:\bapp\b|\bapplication\b|\bscreen\b|\bdisplayed\b|\bshown\b|\bgenerated\b|\bauthenticator\b|\bsms\b|text\s+message|\bmobile\b|\bphone\b|\bdevice\b|notification|\bemail\b|\binbox\b|this\s+number|registered\s+(?:mobile|phone|number))`;
const CODE_VERB_A =
  String.raw`(?:share|send|forward|tell|read|reply\s+with|give|provide|text|message)`;
const CODE_VERB_B =
  String.raw`(?:share|send|forward|tell|read|reply\s+with|give|provide|text|message|disclose|divulge|need|needs|require|requires|bhejo|bhejiye|batao|bataye|share\s+karo)`;

function appCodePatterns(verb: string, code: string): RegExp[] {
  const near = String.raw`[^.!?\n]{0,60}?`;
  return [
    new RegExp(
      String.raw`\b(?:${verb})\b${near}\b(?:${code})\b`,
      "i",
    ),
    new RegExp(
      String.raw`\b(?:${code})\b${near}\b(?:${verb})\b`,
      "i",
    ),
  ];
}

const APP_CODE_A = appCodePatterns(CODE_VERB_A, CODE_TERM);
const APP_CODE_B = appCodePatterns(CODE_VERB_B, CODE_TERM);
const CODE_CONTEXT_A_PATTERN = new RegExp(CODE_CONTEXT_A, "i");
const CODE_CONTEXT_B_PATTERN = new RegExp(CODE_CONTEXT_B, "i");

function appCodeMatch(
  clause: string,
  patterns: RegExp[],
  contextPattern: RegExp,
): CredentialEvidence | null {
  if (isProtective(clause)) return null;
  if (!contextPattern.test(clause)) return null;

  const matched = patterns.some((pattern) => pattern.test(clause));
  if (!matched) return null;

  const codeMixed = /\b(?:bhejo|bhejiye|batao|bataye|share\s+karo)\b/i.test(clause);
  return {
    family: "app-code",
    reason: codeMixed ? "code-mixed-code-request" : "app-code-request",
  };
}

/** Narrow second pass for the character-substituted "0TP" in Candidate B. */
function obfuscatedCodeMatch(message: string): CredentialEvidence | null {
  if (!/\b0tp\b/i.test(message)) return null;
  if (
    !/\b(?:send|share|forward|reply\s+with|bhejo|bhejiye)\b/i.test(message)
  ) {
    return null;
  }
  if (!/\b(?:number|phone|mobile|sms|account)\b/i.test(message)) return null;
  return { family: "app-code", reason: "obfuscated-code-request" };
}

/* ------------------------------------------------------------------ */
/* Public candidate matcher                                           */
/* ------------------------------------------------------------------ */

export const CARD_REQUEST_PATTERN = new RegExp(
  `\\b(?:${CARD_REQUEST})\\b`,
  "i",
);
const CARD_REQUEST_BROADER_PATTERN = new RegExp(
  `\\b(?:${CARD_REQUEST_BROADER})\\b`,
  "i",
);

export function detectCredentialSignal(
  rawMessage: string,
  candidate: CredentialCandidate,
): CredentialSignalResult {
  const message = typeof rawMessage === "string" ? rawMessage : "";
  const evidence: CredentialEvidence[] = [];

  for (const clause of clausesOf(message)) {
    const card =
      candidate === "A"
        ? cardImageMatch(clause, CARD_IMAGE_A, CARD_REQUEST_PATTERN)
        : cardImageMatch(clause, CARD_IMAGE_B, CARD_REQUEST_BROADER_PATTERN);
    if (card) evidence.push(card);

    const recovery =
      candidate === "A"
        ? recoveryMatch(clause, RECOVERY_A_PATTERNS)
        : recoveryMatch(clause, RECOVERY_B_PATTERNS);
    if (recovery) {
      // A recovery code is the more specific family; do not also count it as a
      // generic app code in the same clause.
      evidence.push(recovery);
      continue;
    }

    const appCode =
      candidate === "A"
        ? appCodeMatch(clause, APP_CODE_A, CODE_CONTEXT_A_PATTERN)
        : appCodeMatch(clause, APP_CODE_B, CODE_CONTEXT_B_PATTERN);
    if (appCode) evidence.push(appCode);
  }

  if (candidate === "B") {
    const obfuscated = obfuscatedCodeMatch(normalizeMessage(message));
    if (obfuscated) evidence.push(obfuscated);
  }

  const deduped: CredentialEvidence[] = [];
  for (const item of evidence) {
    if (
      !deduped.some(
        (existing) =>
          existing.family === item.family && existing.reason === item.reason,
      )
    ) {
      deduped.push(item);
    }
  }

  return {
    candidate,
    matched: deduped.length > 0,
    families: [...new Set(deduped.map((item) => item.family))],
    evidence: deduped,
    suppressed: [],
  };
}

/* ------------------------------------------------------------------ */
/* Simulation overlay                                                 */
/* ------------------------------------------------------------------ */

export interface BinaryScore {
  total: number;
  predictedPositive: number;
  predictedNegative: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  precision: number | null;
  recall: number | null;
  f1: number | null;
}

export interface SimulatedCase {
  id: string;
  label: ExpectedLabel;
  baselineScore: number;
  baselineRisk: RiskLevel;
  baselinePositive: boolean;
  candidateMatched: boolean;
  families: CredentialSignalFamily[];
  evidenceReasons: CredentialSignalReason[];
  /** Card-image safeguards recorded for this case (A2 only). */
  suppressedSafeguards: CredentialSignalSuppression[];
  /** True when the shipped credential rule already produced a finding. */
  existingCredentialFinding: boolean;
  simulatedScore: number;
  simulatedRisk: RiskLevel;
  simulatedPositive: boolean;
  scoreChanged: boolean;
  bandChanged: boolean;
  recovered: boolean;
  newFalsePositive: boolean;
}

export interface CredentialCandidateSimulation {
  dataset: string;
  candidate: CredentialCandidateLabel;
  totalCases: number;
  binaryTotal: number;
  baseline: BinaryScore;
  simulated: BinaryScore;
  riskBandChanges: number;
  scoreChanges: number;
  recoveredIds: string[];
  newFalsePositiveIds: string[];
  scoreChangedIds: string[];
  bandChangedIds: string[];
  matchCounts: Record<CredentialSignalFamily, number>;
  matchedCaseIds: string[];
  /** Cases where a candidate safeguard dropped evidence on at least one clause. */
  suppressedCaseIds: string[];
  suppressionCounts: Record<CredentialSignalSuppression, number>;
  ambiguous: {
    total: number;
    baselineFlaggedIds: string[];
    simulatedFlaggedIds: string[];
    newlyFlaggedIds: string[];
  };
  outcomes: SimulatedCase[];
}

function divide(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

function scoreFor(
  outcomes: readonly SimulatedCase[],
  pick: (outcome: SimulatedCase) => boolean,
): BinaryScore {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  for (const outcome of outcomes) {
    if (outcome.label === "ambiguous") continue;
    if (outcome.label === "scam") {
      if (pick(outcome)) tp += 1;
      else fn += 1;
    } else if (pick(outcome)) {
      fp += 1;
    } else {
      tn += 1;
    }
  }

  const precision = divide(tp, tp + fp);
  const recall = divide(tp, tp + fn);
  return {
    total: tp + fp + tn + fn,
    predictedPositive: tp + fp,
    predictedNegative: tn + fn,
    truePositives: tp,
    falsePositives: fp,
    trueNegatives: tn,
    falseNegatives: fn,
    precision,
    recall,
    f1:
      precision === null || recall === null || precision + recall === 0
        ? null
        : (2 * precision * recall) / (precision + recall),
  };
}

function sortedIds(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

/**
 * Runs the overlay for one dataset and one candidate matcher.
 *
 * The shipped engine is called exactly once per case. The candidate only adds
 * the existing credential weight when the message is matched *and* the shipped
 * rule did not already match. No other rule, field or threshold is recomputed.
 *
 * Exported so the A2 experiment can reuse the identical overlay arithmetic with
 * its own matcher. A and B keep going through `simulateCandidate`.
 */
export function simulateWithDetector(
  cases: readonly EvaluationCase[],
  candidate: CredentialCandidateLabel,
  dataset: string,
  detect: (message: string) => CredentialSignalResult,
): CredentialCandidateSimulation {
  const outcomes: SimulatedCase[] = cases.map((entry) => {
    const analysis = analyzeMessage(entry.message);
    const signal = detect(entry.message);
    const existingCredentialFinding =
      analysis.matchedRuleIds.includes(CREDENTIAL_RULE_ID);
    const addsCredential = signal.matched && !existingCredentialFinding;
    const simulatedScore = Math.min(
      MAX_SCORE,
      analysis.score + (addsCredential ? CREDENTIAL_WEIGHT : 0),
    );
    const simulatedRisk = riskLevelForScore(simulatedScore);
    const baselinePositive = analysis.riskLevel !== "low";
    const simulatedPositive = simulatedRisk !== "low";

    return {
      id: entry.id,
      label: entry.label,
      baselineScore: analysis.score,
      baselineRisk: analysis.riskLevel,
      baselinePositive,
      candidateMatched: signal.matched,
      families: signal.families,
      evidenceReasons: signal.evidence.map((item) => item.reason),
      suppressedSafeguards: [
        ...new Set(signal.suppressed.map((item) => item.safeguard)),
      ],
      existingCredentialFinding,
      simulatedScore,
      simulatedRisk,
      simulatedPositive,
      scoreChanged: simulatedScore !== analysis.score,
      bandChanged: simulatedRisk !== analysis.riskLevel,
      recovered: entry.label === "scam" && !baselinePositive && simulatedPositive,
      newFalsePositive:
        entry.label === "legitimate" && !baselinePositive && simulatedPositive,
    };
  });

  const matchCounts: Record<CredentialSignalFamily, number> = {
    "card-image": 0,
    "recovery-code": 0,
    "app-code": 0,
  };
  for (const outcome of outcomes) {
    for (const family of outcome.families) matchCounts[family] += 1;
  }

  const suppressionCounts: Record<CredentialSignalSuppression, number> = {
    "excluded-object": 0,
    "not-needed": 0,
    "self-directed": 0,
    "conditional-official-flow": 0,
    "official-portal-no-link": 0,
  };
  for (const outcome of outcomes) {
    for (const safeguard of outcome.suppressedSafeguards) {
      suppressionCounts[safeguard] += 1;
    }
  }

  const ambiguous = outcomes.filter((outcome) => outcome.label === "ambiguous");

  return {
    dataset,
    candidate,
    totalCases: outcomes.length,
    binaryTotal: outcomes.filter((outcome) => outcome.label !== "ambiguous").length,
    baseline: scoreFor(outcomes, (outcome) => outcome.baselinePositive),
    simulated: scoreFor(outcomes, (outcome) => outcome.simulatedPositive),
    riskBandChanges: outcomes.filter((outcome) => outcome.bandChanged).length,
    scoreChanges: outcomes.filter((outcome) => outcome.scoreChanged).length,
    recoveredIds: sortedIds(
      outcomes.filter((outcome) => outcome.recovered).map((outcome) => outcome.id),
    ),
    newFalsePositiveIds: sortedIds(
      outcomes
        .filter((outcome) => outcome.newFalsePositive)
        .map((outcome) => outcome.id),
    ),
    scoreChangedIds: sortedIds(
      outcomes
        .filter((outcome) => outcome.scoreChanged)
        .map((outcome) => outcome.id),
    ),
    bandChangedIds: sortedIds(
      outcomes
        .filter((outcome) => outcome.bandChanged)
        .map((outcome) => outcome.id),
    ),
    matchCounts,
    matchedCaseIds: sortedIds(
      outcomes
        .filter((outcome) => outcome.candidateMatched)
        .map((outcome) => outcome.id),
    ),
    suppressedCaseIds: sortedIds(
      outcomes
        .filter((outcome) => outcome.suppressedSafeguards.length > 0)
        .map((outcome) => outcome.id),
    ),
    suppressionCounts,
    ambiguous: {
      total: ambiguous.length,
      baselineFlaggedIds: sortedIds(
        ambiguous
          .filter((outcome) => outcome.baselinePositive)
          .map((outcome) => outcome.id),
      ),
      simulatedFlaggedIds: sortedIds(
        ambiguous
          .filter((outcome) => outcome.simulatedPositive)
          .map((outcome) => outcome.id),
      ),
      newlyFlaggedIds: sortedIds(
        ambiguous
          .filter((outcome) => !outcome.baselinePositive && outcome.simulatedPositive)
          .map((outcome) => outcome.id),
      ),
    },
    outcomes,
  };
}

/**
 * Runs the A or B overlay.
 *
 * Kept as the only entry point for A/B so the A2 experiment cannot accidentally
 * change their matching or their reported numbers.
 */
export function simulateCandidate(
  cases: readonly EvaluationCase[],
  candidate: CredentialCandidate,
  dataset: string,
): CredentialCandidateSimulation {
  return simulateWithDetector(cases, candidate, dataset, (message) =>
    detectCredentialSignal(message, candidate),
  );
}

/** A metric printed as `undefined` when its denominator was zero. */
function metric(value: number | null): string {
  return value === null ? "undefined" : value.toFixed(3);
}

function idList(ids: readonly string[]): string {
  return ids.length === 0 ? "  (none)" : ids.map((id) => `  ${id}`).join("\n");
}

/**
 * Renders one simulation as plain text.
 *
 * Case IDs and aggregate counts only: no message text, URLs or rationales, so
 * the dry run cannot spill dataset content into a terminal or CI log.
 */
const CANDIDATE_LABELS: Record<CredentialCandidateLabel, string> = {
  A: "conservative",
  B: "broader",
  A2: "conservative + card-image safeguards",
};

const SAFEGUARD_LABELS: Record<CredentialSignalSuppression, string> = {
  "excluded-object": "excluded-object",
  "not-needed": "not-needed",
  "self-directed": "self-directed",
  "conditional-official-flow": "conditional-official-flow",
  "official-portal-no-link": "official-portal-no-link",
};

export function formatCandidateSimulation(
  result: CredentialCandidateSimulation,
): string {
  const label = CANDIDATE_LABELS[result.candidate];
  const { baseline, simulated } = result;
  const safeguardLines = result.suppressedCaseIds.length
    ? [
        "",
        `Clause-level safeguards applied to evidence: ${result.suppressedCaseIds.length} cases`,
        `  ${(Object.keys(SAFEGUARD_LABELS) as CredentialSignalSuppression[])
          .map(
            (key) =>
              `${SAFEGUARD_LABELS[key]} ${result.suppressionCounts[key]}`,
          )
          .join(" | ")}`,
        "Cases with suppressed clause evidence:",
        idList(result.suppressedCaseIds),
      ]
    : [];

  return [
    "TrustLens credential proposal — simulated overlay (NOT production output)",
    "=======================================================================",
    `Dataset: ${result.dataset} (${result.totalCases} cases; ${result.binaryTotal} binary; ${result.ambiguous.total} ambiguous)`,
    `Candidate: ${result.candidate} (${label})`,
    "",
    "Baseline (shipped engine)",
    `  TP ${baseline.truePositives} | FP ${baseline.falsePositives} | TN ${baseline.trueNegatives} | FN ${baseline.falseNegatives}`,
    `  Precision ${metric(baseline.precision)} | Recall ${metric(baseline.recall)} | F1 ${metric(baseline.f1)}`,
    "Simulated with candidate (existing +40 weight, no double count)",
    `  TP ${simulated.truePositives} | FP ${simulated.falsePositives} | TN ${simulated.trueNegatives} | FN ${simulated.falseNegatives}`,
    `  Precision ${metric(simulated.precision)} | Recall ${metric(simulated.recall)} | F1 ${metric(simulated.f1)}`,
    `  Predicted positive ${simulated.predictedPositive} | predicted negative ${simulated.predictedNegative}`,
    "",
    `Scam cases recovered from baseline false negatives: ${result.recoveredIds.length}`,
    idList(result.recoveredIds),
    `New false positives: ${result.newFalsePositiveIds.length}`,
    idList(result.newFalsePositiveIds),
    `Score changes: ${result.scoreChanges} | Risk-band changes: ${result.riskBandChanges}`,
    `Cases with a score change:`,
    idList(result.scoreChangedIds),
    "",
    "Candidate matches by family (a case can match more than one)",
    `  card-image ${result.matchCounts["card-image"]} | recovery-code ${result.matchCounts["recovery-code"]} | app-code ${result.matchCounts["app-code"]}`,
    `  Cases matched: ${result.matchedCaseIds.length}`,
    ...safeguardLines,
    "",
    `Ambiguous cases: ${result.ambiguous.total}`,
    `  flagged by baseline: ${result.ambiguous.baselineFlaggedIds.length}`,
    `  flagged by candidate: ${result.ambiguous.simulatedFlaggedIds.length}`,
    `  newly flagged: ${result.ambiguous.newlyFlaggedIds.length}`,
    idList(result.ambiguous.newlyFlaggedIds),
    "",
    "No message text, URLs or rationales are printed by this report.",
  ].join("\n");
}
