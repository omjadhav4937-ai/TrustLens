import { extractLinks } from "../links";
import {
  CARD_IMAGE_A,
  CARD_REQUEST_PATTERN,
  cardImageMatch,
  clausesOf,
  detectCredentialSignal,
  simulateWithDetector,
  type CredentialCandidateSimulation,
  type CredentialEvidence,
  type CredentialSignalResult,
  type CredentialSignalSuppression,
  type SuppressedCredentialSignal,
} from "./credential-proposal";
import type { EvaluationCase } from "./types";

/**
 * Candidate A2 — the card-image refinement experiment.
 *
 * A2 is Candidate A with five *clause-level* safeguards applied to the
 * card-image family only. Recovery-code and app-code matching are delegated to
 * Candidate A untouched, so any metric difference between A and A2 is caused by
 * a card-image suppression and nothing else.
 *
 * This module is evaluation-only. It is not imported by the application, the
 * engine or the shipped rules, and A2 is not a production candidate.
 *
 * The safeguards exist because the stress dataset showed Candidate A flagging
 * legitimate card wording (TL-C-029, TL-C-033, TL-C-034) while Candidate B also
 * flagged TL-C-026 and TL-C-030. Each safeguard is deliberately narrow:
 *
 *   1. excluded-object          - the card is the thing being ruled out
 *                                 ("a photo of your receipt, not your card").
 *   2. not-needed              - an explicit statement that no card image is
 *                                 wanted ("we do not need a photo of your card").
 *   3. self-directed           - the sender is the intended recipient
 *                                 ("send it to yourself").
 *   4. conditional-official-flow - guidance conditioned on the official app
 *                                 asking ("only if the bank's app asks").
 *   5. official-portal-no-link - an upload to a named portal rather than to a
 *                                 person, with no sender-supplied link.
 *
 * Safeguards 4 and 5 are trust-shaped, so they are disabled when the message
 * contains a link detected by the shipped link extractor. Naming a bank, an app
 * or a "secure portal" does not make a message trustworthy: a card request in a
 * linked or person-directed context is still flagged. A third-party recipient
 * also outranks 3, 4 and 5, so "send it to yourself and forward it to me" is
 * still a request.
 */

export const A2_CANDIDATE = "A2" as const;

export const A2_SAFEGUARDS: ReadonlyArray<{
  id: CredentialSignalSuppression;
  summary: string;
}> = [
  {
    id: "excluded-object",
    summary: "the card is explicitly excluded in favour of another object",
  },
  {
    id: "not-needed",
    summary: "the clause states that a card image is not needed",
  },
  {
    id: "self-directed",
    summary: "the image is sent to the recipient themselves",
  },
  {
    id: "conditional-official-flow",
    summary: "an instruction conditioned on the official app asking",
  },
  {
    id: "official-portal-no-link",
    summary: "an upload to a named portal, with no sender-supplied link",
  },
];

/** "Send a photo of your receipt, not your card." */
const EXCLUDED_OBJECT: RegExp[] = [
  /\bnot\s+(?:your|the|a|any)\s+(?:(?:debit|credit|atm|payment|bank)\s+)?card\b/i,
  /\b(?:instead\s+of|rather\s+than)\s+(?:your\s+|the\s+)?(?:(?:debit|credit|atm|payment|bank)\s+)?card\b/i,
  /\bno\s+card\s+(?:photo|photograph|picture|image|scan|screenshot)\b/i,
];

/** "We do not need a photo of your card; a receipt is enough." */
const NOT_NEEDED: RegExp[] = [
  /\b(?:do|does|did)\s+not\s+need\s+(?:a\s+|any\s+|your\s+)?(?:photo|photograph|picture|image|scan|screenshot|copy)\s+of\s+(?:your\s+|the\s+)?(?:(?:debit|credit|atm|payment|bank)\s+)?card\b/i,
  /\b(?:do|does|did)\s+not\s+need\s+(?:your\s+|the\s+)?(?:(?:debit|credit|atm|payment|bank)\s+)?card\s+(?:photo|photograph|picture|image|scan)\b/i,
  /\bno\s+(?:card\s+)?(?:photo|photograph|picture|image|scan|screenshot)\s+(?:is\s+|are\s+)?(?:needed|required|necessary)\b/i,
  /\b(?:card\s+)?(?:photo|photograph|picture|image|scan|screenshot)\s+(?:is|are)\s+not\s+(?:needed|required|necessary)\b/i,
];

/** "Send a photo of your card to yourself before travelling." */
const SELF_DIRECTED: RegExp[] = [
  /\bto\s+(?:yourself|your\s+own\s+(?:phone|mobile|number|email|inbox|device|album|cloud|drive|account))\b/i,
  /\bfor\s+(?:your|your\s+own)\s+records\b/i,
  /\bon\s+your\s+own\s+(?:phone|mobile|device)\b/i,
];

/** "Upload a card photo only if the bank's app asks for it." */
const CONDITIONAL_OFFICIAL_FLOW: RegExp[] = [
  /\b(?:only\s+)?if\s+(?:the\s+|your\s+)?(?:(?:bank|issuer|provider)'?s?\s+|official\s+|banking\s+|payment\s+)?(?:app|application)\s+(?:asks?|requests?|prompts?|requires?)\b/i,
  /\bwhen\s+(?:the\s+|your\s+)?(?:(?:bank|issuer|provider)'?s?\s+|official\s+|banking\s+|payment\s+)?(?:app|application)\s+(?:asks?|requests?|prompts?|requires?)\b/i,
];

/**
 * "Upload a card photo in the secure portal to complete verification."
 *
 * Only a named portal counts. "In the app" is already handled by Candidate A's
 * in-app guard, and a bare mention of a bank or an app is not enough on its own.
 */
const OFFICIAL_PORTAL_UPLOAD: RegExp[] = [
  /\b(?:upload|submit)\b[^.!?\n]{0,60}\b(?:in|via|through|to|into)\s+(?:the\s+|our\s+|your\s+)?(?:(?:bank|issuer|employer|provider)'?s?\s+|official\s+|secure\s+|onboarding\s+|payment\s+)?(?:secure\s+)?portal\b/i,
];

/**
 * A person is the intended recipient, so workflow-shaped safeguards must not
 * apply. Checked before 3, 4 and 5 but after the two object-shaped safeguards.
 */
const THIRD_PARTY =
  /\b(?:to|with|via)\s+(?:us|me|our\s+(?:team|agent|support|officer|executive|desk|office)|this\s+(?:chat|number|email|inbox)|the\s+(?:agent|team|officer|executive|support\s+desk))\b|\b(?:chat|whatsapp|dm|send\s+me|text\s+me|email\s+me|reply)\b/i;

function firstMatch(patterns: RegExp[], clause: string): boolean {
  return patterns.some((pattern) => pattern.test(clause));
}

/**
 * Returns the safeguard that removes this clause's card-image evidence, or null
 * when the evidence should stay.
 */
export function cardSafeguardFor(
  clause: string,
  hasSenderLink: boolean,
): CredentialSignalSuppression | null {
  if (firstMatch(EXCLUDED_OBJECT, clause)) return "excluded-object";
  if (firstMatch(NOT_NEEDED, clause)) return "not-needed";
  if (THIRD_PARTY.test(clause)) return null;
  if (firstMatch(SELF_DIRECTED, clause)) return "self-directed";
  if (!hasSenderLink && firstMatch(CONDITIONAL_OFFICIAL_FLOW, clause)) {
    return "conditional-official-flow";
  }
  if (!hasSenderLink && firstMatch(OFFICIAL_PORTAL_UPLOAD, clause)) {
    return "official-portal-no-link";
  }
  return null;
}

/**
 * Candidate A2's credential signal.
 *
 * The non-card families come straight from Candidate A. Card-image evidence is
 * recomputed with Candidate A's own patterns and guards, then filtered by the
 * five safeguards above, so no new card vocabulary is introduced.
 */
export function detectCredentialSignalA2(rawMessage: string): CredentialSignalResult {
  const message = typeof rawMessage === "string" ? rawMessage : "";
  const hasSenderLink = extractLinks(message).length > 0;
  const base = detectCredentialSignal(message, "A");

  const evidence: CredentialEvidence[] = base.evidence.filter(
    (item) => item.family !== "card-image",
  );
  const suppressed: SuppressedCredentialSignal[] = [];

  for (const clause of clausesOf(message)) {
    const card = cardImageMatch(clause, CARD_IMAGE_A, CARD_REQUEST_PATTERN);
    if (!card) continue;

    const safeguard = cardSafeguardFor(clause, hasSenderLink);
    if (safeguard) {
      suppressed.push({ family: "card-image", safeguard });
      continue;
    }
    evidence.push(card);
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

  const dedupedSuppressed: SuppressedCredentialSignal[] = [];
  for (const item of suppressed) {
    if (
      !dedupedSuppressed.some(
        (existing) =>
          existing.family === item.family && existing.safeguard === item.safeguard,
      )
    ) {
      dedupedSuppressed.push(item);
    }
  }

  return {
    candidate: A2_CANDIDATE,
    matched: deduped.length > 0,
    families: [...new Set(deduped.map((item) => item.family))],
    evidence: deduped,
    suppressed: dedupedSuppressed,
  };
}

/** Runs the identical overlay arithmetic with A2's matcher. */
export function simulateCandidateA2(
  cases: readonly EvaluationCase[],
  dataset: string,
): CredentialCandidateSimulation {
  return simulateWithDetector(cases, A2_CANDIDATE, dataset, detectCredentialSignalA2);
}
