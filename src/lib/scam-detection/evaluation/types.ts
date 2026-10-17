/**
 * Types and fixed vocabularies for the TrustLens evaluation dataset.
 *
 * The dataset is a testing artefact only. Nothing here is imported by the app,
 * and nothing here changes how `analyzeMessage` behaves.
 */

/** Ground-truth label for a case. */
export type ExpectedLabel = "scam" | "legitimate" | "ambiguous";

/** Which 25-case collection a case belongs to. */
export type CaseBucket = "scam" | "legitimate" | "ambiguous" | "edge-case";

/**
 * The (non-exhaustive) challenge a case is designed to probe.
 *
 * Kept as a closed list so a typo cannot silently create a new category and
 * skew the per-category results.
 */
export const CHALLENGE_CATEGORIES = [
  "bank-kyc-impersonation",
  "otp-credential-request",
  "suspicious-link",
  "parcel-delivery",
  "prize-cashback-reward",
  "account-threat-urgency",
  "ordinary-conversation",
  "legitimate-security-warning",
  "no-suspicious-indicators",
  "mixed-signals",
  "false-positive-challenge",
  "obfuscation-evasion",
] as const;

export type ChallengeCategory = (typeof CHALLENGE_CATEGORIES)[number];

export const EXPECTED_LABELS: readonly ExpectedLabel[] = [
  "scam",
  "legitimate",
  "ambiguous",
];

export const CASE_BUCKETS: readonly CaseBucket[] = [
  "scam",
  "legitimate",
  "ambiguous",
  "edge-case",
];

/** One synthetic message with its ground-truth label and documentation. */
export interface EvaluationCase {
  /** Stable, unique ID; the prefix records which bucket the case came from. */
  id: string;
  bucket: CaseBucket;
  label: ExpectedLabel;
  challenge: ChallengeCategory;
  /** Synthetic message text. Never contains real personal data or live URLs. */
  message: string;
  /** Why this message carries the label it has, written without seeing the score. */
  rationale: string;
  /**
   * Present for `edge-case` entries: what makes the case hard, and why it is
   * not automatically filed as a scam or as legitimate.
   */
  difficulty?: string;
  /** Present when the label is `ambiguous`: what context is missing. */
  notes?: string;
}
