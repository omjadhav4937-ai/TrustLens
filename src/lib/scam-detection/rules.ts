import {
  MULTILINGUAL_ACCOUNT_THREAT_PATTERNS,
  MULTILINGUAL_CREDENTIAL_REQUEST_PATTERNS,
  MULTILINGUAL_LINK_CTA_PATTERNS,
  MULTILINGUAL_PRIZE_PATTERNS,
  MULTILINGUAL_PROTECTIVE_WARNING_PATTERNS,
  MULTILINGUAL_STANDALONE_CREDENTIAL_PATTERNS,
  MULTILINGUAL_URGENCY_PATTERNS,
} from "./multilingual";
import { collectMatches, overlaps } from "./normalize";
import type { DetectionRule, TextRange } from "./types";

/**
 * The five configured detection rules.
 *
 * Each rule is a pure function of the message text: it returns the ranges it
 * wants counted plus an optional note. A rule may match many times but
 * contributes its weight at most once, because the engine sums weights per
 * rule, not per match.
 *
 * Patterns are written with `i` (case-insensitive) and explicit `\s+` runs so
 * that capitalisation and irregular spacing do not change the outcome.
 *
 * Two rules deliberately separate a *pattern hit* from a *counted hit*, because
 * the pattern alone is a known source of false alarms on ordinary mail:
 *
 *  - Rule 4 only counts a credential when the message asks for it. A bank-style
 *    security notice that mentions a code and tells you not to share it is
 *    recorded as a note instead.
 *  - Rule 5 only counts everyday reward wording when it carries a claim, win or
 *    free-gift context.
 *
 * Neither shortcut suppresses a request. Where both a warning and a request are
 * present, the request wins and the rule matches.
 */

/* ------------------------------------------------------------------ */
/* Rule 1 — urgency and pressure                                       */
/* ------------------------------------------------------------------ */

const URGENCY_PATTERNS: RegExp[] = [
  /\bimmediate(ly)?\b/i,
  /\burgent(ly)?\b/i,
  /\basap\b/i,
  /\bas\s+soon\s+as\s+possible\b/i,
  /\bright\s+(now|away)\b/i,
  /\bwithout\s+(any\s+)?delay\b/i,
  /\bdo\s+not\s+delay\b/i,
  /\bdon'?t\s+delay\b/i,
  /\bhurry\b/i,
  /\blast\s+(chance|warning|notice|reminder)\b/i,
  /\bfinal\s+(warning|notice|reminder)\b/i,
  /\bact\s+(now|fast|quickly|immediately)\b/i,
  /\brespond\s+(now|immediately|today|at\s+once)\b/i,
  /\bwithin\s+\d+\s*(minutes?|mins?|hours?|hrs?|days?)\b/i,
  /\bwithin\s+(the\s+)?next\s+\d+\s*(minutes?|hours?|days?)\b/i,
  /\bexpir(e|es|ed|ing|y)\b/i,
  /\b(limited|short)\s+(time|period|window)\b/i,
  /\bvalid\s+(till|until|upto|up\s+to)\b/i,
  /\bonly\s+\d+\s*(minutes?|hours?|days?)\s+(left|remaining)\b/i,
  /\bimmediate\s+(action|attention)\b/i,
  /\btime\s+is\s+running\s+out\b/i,
  /\btoday\s+itself\b/i,
  /\bbefore\s+it'?s\s+too\s+late\b/i,
  // Hindi, Marathi and Hinglish urgency shapes. See `multilingual.ts`.
  ...MULTILINGUAL_URGENCY_PATTERNS,
];

/* ------------------------------------------------------------------ */
/* Rule 2 — account blocking or suspension                             */
/* ------------------------------------------------------------------ */

const ACCOUNT_TERMS =
  "account|card|sim|number|profile|service|subscription|policy|connection|facility|kyc|wallet";

const BLOCK_TERMS =
  "block(?:ed|ing)?|suspend(?:ed|ing|sion)?|de-?activat(?:e|ed|ing|ion)|disabl(?:e|ed|ing)|frozen|freeze|clos(?:e|ed|ing)|terminat(?:e|ed|ing)|restrict(?:ed|ion)?|lapsed|cancell?ed";

const ACCOUNT_THREAT_PATTERNS: RegExp[] = [
  new RegExp(
    String.raw`\b(?:${ACCOUNT_TERMS})\b[^.!?\n]{0,40}?\b(?:${BLOCK_TERMS})\b`,
    "i",
  ),
  new RegExp(
    String.raw`\b(?:${BLOCK_TERMS})\b[^.!?\n]{0,40}?\b(?:${ACCOUNT_TERMS})\b`,
    "i",
  ),
  /\bwill\s+be\s+(blocked|suspended|deactivated|disabled|closed|terminated|frozen)\b/i,
  /\b(permanently|temporarily)\s+(blocked|suspended|deactivated|disabled|closed|terminated)\b/i,
  /\bkyc\b[^.!?\n]{0,40}?\b(not\s+updated|pending|incomplete|expired|not\s+complete|required|due)\b/i,
  new RegExp(
    String.raw`\b(?:${ACCOUNT_TERMS})\b[^.!?\n]{0,40}?\b(at\s+risk|under\s+review|flagged|on\s+hold)\b`,
    "i",
  ),
  // Hindi, Marathi and Hinglish blocking/suspension shapes.
  ...MULTILINGUAL_ACCOUNT_THREAT_PATTERNS,
];

/* ------------------------------------------------------------------ */
/* Shared credential term lists, used by Rule 4 further down           */
/* ------------------------------------------------------------------ */

/**
 * `pin(?!\s*code)` keeps India's postal "PIN code" out of the credential rule.
 * A six-digit postal PIN has nothing to do with a banking PIN, and delivery
 * messages mention it constantly.
 */
const CREDENTIAL_TERMS =
  String.raw`otp|one[\s-]?time\s+(?:password|passcode|code|pin)|cvv|cvc|mpin|m-?pin|upi\s*pin|atm\s*pin|card\s*pin|pin(?!\s*code)|password|passcode|security\s*code|verification\s*code|card\s*(?:number|details)|aadhaar(?:\s*number)?|pan\s*(?:number|card)|date\s*of\s*birth|(?:internet|net)\s*banking\s*(?:password|credentials|login)`;

const REQUEST_VERBS =
  String.raw`share|send|provide|give|tell|forward|confirm|enter|type|submit|reply\s+with|verify|update|disclose|reveal|mention|click`;

/* ------------------------------------------------------------------ */
/* Rule 3 — suspicious links and link-based calls to action            */
/* ------------------------------------------------------------------ */

const LINK_CTA_PATTERNS: RegExp[] = [
  /\bclick(?:ing|s)?\b[^.!?\n]{0,25}?\b(here|link|below|now|https?:\/\/|www\.)/i,
  /\b(?:tap|press)\s+(?:here|the\s+link|on\s+the\s+link|this\s+link|below)\b/i,
  /\bvisit\s+(?:the\s+)?(?:link|website|url|page)\b/i,
  /\b(?:open|follow|use)\s+(?:the\s+|this\s+)?(?:link|url|attachment)\b/i,
  /\blink\s+(?:below|given\s+below|mentioned\s+below)\b/i,
  /\b(?:log\s?in|sign\s?in|register|sign\s?up)\s+(?:here|now|at|using|via|through)\b/i,
  /\b(?:verify|update|complete|confirm)\b[^.!?\n]{0,20}?\b(?:using|via|through|at)\s+the\s+link\b/i,
  /\b(?:download|install)\s+(?:the\s+)?(?:app|application|file)\b/i,
  // Hindi, Marathi and Hinglish click-through instructions.
  ...MULTILINGUAL_LINK_CTA_PATTERNS,
];

/* ------------------------------------------------------------------ */
/* Rule 4 — requests for credentials                                   */
/* ------------------------------------------------------------------ */

/**
 * Credentials that should never be requested by message. These are checked on
 * their own, because naming them at all in an inbound message is unusual.
 */
const STANDALONE_CREDENTIAL_PATTERNS: RegExp[] = [
  /\botp\b/i,
  /\bone[\s-]?time\s+(password|passcode|code|pin)\b/i,
  /\bcvv\b/i,
  /\bcvc\b/i,
  /\bm-?pin\b/i,
  /\bupi\s*pin\b/i,
  /\batm\s*pin\b/i,
  /\bcard\s*pin\b/i,
  // Devanagari secrets that are unusual enough to count on their own.
  ...MULTILINGUAL_STANDALONE_CREDENTIAL_PATTERNS,
];

/** Weaker terms only count when a request verb sits next to them. */
const CREDENTIAL_REQUEST_PATTERNS: RegExp[] = [
  new RegExp(
    String.raw`\b(?:${REQUEST_VERBS})\b[^.!?\n]{0,40}?\b(?:${CREDENTIAL_TERMS})\b`,
    "i",
  ),
  new RegExp(
    String.raw`\b(?:${CREDENTIAL_TERMS})\b[^.!?\n]{0,40}?\b(?:${REQUEST_VERBS})\b`,
    "i",
  ),
  /*
   * "share the code you received" — a request verb, then a credential, then the
   * wording that ties it to a code delivered to the reader. The verb is
   * required: an informational line such as "the code you received is valid for
   * 10 minutes" is not a request and must not count as one.
   */
  new RegExp(
    String.raw`\b(?:${REQUEST_VERBS})\b[^.!?\n]{0,40}?\b(?:otp|pin|password|passcode|code)\b[^.!?\n]{0,30}?\byou\s+(?:receive|received|will\s+receive|get|got|are\s+sent)\b`,
    "i",
  ),
  // Hindi, Marathi and Hinglish request-verb shapes.
  ...MULTILINGUAL_CREDENTIAL_REQUEST_PATTERNS,
];

/**
 * Wording a genuine security notice uses to tell you *not* to share a credential.
 *
 * A bank's own OTP alert almost always carries one of these lines. A message
 * that is trying to talk a code out of you almost never does, because it would
 * contradict the request.
 */
const PROTECTIVE_WARNING_PATTERNS: RegExp[] = [
  /\b(?:do|does|did)\s+not\s+(?:share|disclose|reveal|divulge|give|provide|forward|send)\b/i,
  /\bdon'?t\s+(?:share|disclose|reveal|divulge|give|provide|forward|send)\b/i,
  /\bnever\s+(?:share|disclose|reveal|divulge|give|provide|forward|send)\b/i,
  /\bnot\s+to\s+be\s+shared\b/i,
  /\bkeep\s+(?:it|this|the\s+(?:otp|code|pin|password))\s+(?:safe|secret|confidential|private|to\s+yourself)\b/i,
  /\bnever\s+ask(?:s)?\s+(?:for|you\s+for)\b/i,
  /\b(?:bank|we|staff|officials?)\b[^.!?\n]{0,20}?\bnever\s+ask/i,
  // Hindi, Marathi and Hinglish "do not share" warnings.
  ...MULTILINGUAL_PROTECTIVE_WARNING_PATTERNS,
];

const CREDENTIAL_SAFE_NOTE_WARNING =
  "A credential is named here, but the message also tells you not to share it and never asks for it — the shape of a genuine security notice. This rule did not count it.";

const CREDENTIAL_SAFE_NOTE_AMBIGUOUS =
  "A credential is named here with no request to share it, but also no warning not to share it. TrustLens counted it, because a genuine security notice normally carries that warning.";

const CREDENTIAL_SAFE_NOTE_OVERRIDDEN =
  "The message warns you not to share the credential, yet still asks for it somewhere else. The request is what counts.";

/* ------------------------------------------------------------------ */
/* Rule 5 — prize, reward and gift bait                                */
/* ------------------------------------------------------------------ */

/**
 * Bait wording that is unusual enough to count on its own. A message that
 * congratulates you for a win you never entered is a warning sign by itself.
 */
const PRIZE_PATTERNS: RegExp[] = [
  /\bcongratulations?\b/i,
  /\bcongrats\b/i,
  /\byou\s+(have\s+|'ve\s+)?won\b/i,
  /\byou\s+are\s+(the\s+)?(lucky|selected|chosen|winner)\b/i,
  /\bwinner\b/i,
  /\blottery\b/i,
  /\blucky\s+(draw|customer|winner|number|person|user)\b/i,
  /\bprize\b/i,
  /\bjackpot\b/i,
  /\bbumper\b/i,
  /\bfree\s+(gift|recharge|data|iphone|mobile|laptop|gadget|voucher|sample|trip)\b/i,
  /\bgift\s+worth\b/i,
  /\bclaim\s+(your|the|now|it)\b/i,
  /\bscratch\s+card\b/i,
  /\b(kbc|crorepati)\b/i,
  /\bcash\s+prize\b/i,
  /\bwin\s+(a|an|free|cash|prize|rs\.?|₹)\b/i,
  /\bselected\s+(for|as)\s+(a\s+)?(lucky|gift|prize|reward)\b/i,
  // Hindi, Marathi and Hinglish prize/bait wording.
  ...MULTILINGUAL_PRIZE_PATTERNS,
];

/**
 * Everyday reward wording. Loyalty points, cashback and gift-card balances
 * appear constantly in ordinary account and billing mail, so these count only
 * in one of two situations:
 *
 *  1. the same message also contains bait wording from `PRIZE_PATTERNS`, or
 *  2. a claim, collect, redeem or similar verb sits next to them.
 *
 * "Your cashback of Rs 40 has been credited" does not count.
 * "Claim your cashback of Rs 5000" does.
 */
const REWARD_MENTION_PATTERNS: RegExp[] = [
  /\breward(?:s)?\b/i,
  /\bcash\s?back\b/i,
  /\bgift\s+(?:card|voucher|hamper)\b/i,
  /\bvoucher\b/i,
];

const REWARD_CLAIM_VERBS = String.raw`claim|collect|redeem|avail|unlock|withdraw|waiting`;

const REWARD_CLAIM_PATTERNS: RegExp[] = [
  new RegExp(
    String.raw`\b(?:${REWARD_CLAIM_VERBS})\b[^.!?\n]{0,40}?\b(?:reward|rewards|cash\s?back|gift|voucher|points?)\b`,
    "i",
  ),
  new RegExp(
    String.raw`\b(?:reward|rewards|cash\s?back|gift|voucher|points?)\b[^.!?\n]{0,40}?\b(?:${REWARD_CLAIM_VERBS})\b`,
    "i",
  ),
];

const REWARD_BALANCE_NOTE =
  "Reward, cashback or voucher wording appears without any claim, win or free-gift context, which is how an ordinary balance or cashback notification reads. This rule did not count it.";

/* ------------------------------------------------------------------ */
/* The rules                                                           */
/* ------------------------------------------------------------------ */

export const RULES: DetectionRule[] = [
  {
    id: "urgency-pressure",
    label: "Urgency or pressure to act immediately",
    shortLabel: "urgency pressure",
    description:
      "Time-limited wording that pushes the reader to act before they can think or check.",
    weight: 20,
    severity: "medium",
    explanation:
      "The message pushes you to act within a deadline. Creating urgency is one of the most common tactics in scam messages, because a rushed reader is far less likely to check who really sent it.",
    safeNextStep:
      "Ignore the deadline. A genuine organisation will not withdraw a service because you took an extra hour to verify the request.",
    detect: ({ message }) => ({ matches: collectMatches(message, URGENCY_PATTERNS) }),
  },
  {
    id: "account-threat",
    label: "Threat of account blocking or suspension",
    shortLabel: "a threat to block an account",
    description:
      "Claims that an account, card, SIM or service will be blocked, suspended or closed.",
    weight: 15,
    severity: "medium",
    explanation:
      "The message threatens to block, suspend or close something you rely on. Banks and service providers do not usually announce this by an unsolicited message with a link attached.",
    safeNextStep:
      "Check the account yourself by opening the organisation's official app or website directly, rather than through anything in this message.",
    detect: ({ message }) => ({
      matches: collectMatches(message, ACCOUNT_THREAT_PATTERNS),
    }),
  },
  {
    id: "suspicious-link",
    label: "Suspicious link or link-based call to action",
    shortLabel: "a suspicious link",
    description:
      "A link with deceptive traits, or wording designed to move you onto a link.",
    weight: 25,
    severity: "high",
    explanation:
      "The message either contains an address that raises link red flags or asks you to click through to continue. Links are where most scams try to move you onto a page they control.",
    safeNextStep:
      "Do not open the link. Reach the service by typing its official address yourself or by opening its app.",
    detect: ({ message, links }) => {
      const matches: TextRange[] = collectMatches(message, LINK_CTA_PATTERNS);
      // Only links that actually raised an indicator count here. An ordinary
      // URL inside a message is not treated as a warning sign on its own.
      //
      // However many links or click prompts are found, this rule still
      // contributes its single weight: the engine sums weights per rule.
      for (const link of links) {
        if (link.suspicious) matches.push({ start: link.start, end: link.end });
      }
      return { matches };
    },
  },
  {
    id: "credential-request",
    label: "Request for an OTP, password, PIN or other credential",
    shortLabel: "a request for sensitive credentials",
    description:
      "Asks for a one-time password, PIN, password, card detail or identity number.",
    weight: 40,
    severity: "critical",
    explanation:
      "The message asks for something that should never be shared: a one-time password, PIN, password or card detail. No legitimate organisation will ever ask you to send these, and anyone who receives them can take over an account.",
    safeNextStep:
      "Never share the code, PIN or password with anyone. If someone claims to need it, end the conversation and contact the organisation through its official number.",
    detect: ({ message }) => {
      const mentions = collectMatches(message, STANDALONE_CREDENTIAL_PATTERNS);
      const warnings = collectMatches(message, PROTECTIVE_WARNING_PATTERNS);

      /*
       * A request verb sitting inside a warning is not a request. The verb list
       * contains "share", so "do not share this code" would otherwise read as an
       * instruction to share it. Any request that overlaps a warning is dropped.
       */
      const requests = collectMatches(message, CREDENTIAL_REQUEST_PATTERNS).filter(
        (range) => !warnings.some((warning) => overlaps(range, warning)),
      );

      if (requests.length > 0) {
        // The credential itself is highlighted too, so the marked text shows
        // which secret the request was about.
        return {
          matches: [...requests, ...mentions],
          ...(warnings.length > 0 ? { note: CREDENTIAL_SAFE_NOTE_OVERRIDDEN } : {}),
        };
      }

      if (mentions.length === 0) return { matches: [] };

      if (warnings.length > 0) {
        // A protected mention: the message names a credential but never asks for
        // one and carries its own "do not share" warning.
        return { matches: [], note: CREDENTIAL_SAFE_NOTE_WARNING };
      }

      return { matches: mentions, note: CREDENTIAL_SAFE_NOTE_AMBIGUOUS };
    },
  },
  {
    id: "prize-bait",
    label: "Unexpected prize, reward or gift bait",
    shortLabel: "a prize or reward offer",
    description:
      "Claims of a win, lottery, reward or free gift that you did not enter for.",
    weight: 20,
    severity: "medium",
    explanation:
      "The message offers a prize, reward or gift you never applied for. Unexpected winnings are used to get you to pay a small fee or hand over details before the supposed reward arrives.",
    safeNextStep:
      "Assume you have not won anything you did not enter. Do not pay a fee or share details to release a prize.",
    detect: ({ message }) => {
      const bait = collectMatches(message, PRIZE_PATTERNS);
      const rewardMentions = collectMatches(message, REWARD_MENTION_PATTERNS);

      // Explicit bait wording is enough on its own.
      if (bait.length > 0) {
        return { matches: [...bait, ...rewardMentions] };
      }

      if (rewardMentions.length === 0) return { matches: [] };

      const claimed = collectMatches(message, REWARD_CLAIM_PATTERNS);
      if (claimed.length > 0) return { matches: claimed };

      return { matches: [], note: REWARD_BALANCE_NOTE };
    },
  },
];

/** Lookup helper used by tests and future rule management screens. */
export function getRuleById(ruleId: string): DetectionRule | undefined {
  return RULES.find((rule) => rule.id === ruleId);
}
