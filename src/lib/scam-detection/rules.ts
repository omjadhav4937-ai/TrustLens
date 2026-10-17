import { collectMatches } from "./normalize";
import type { DetectionRule, TextRange } from "./types";

/**
 * The five configured detection rules.
 *
 * Each rule is a pure function of the message text: it returns the ranges that
 * matched and nothing else. A rule may match many times but contributes its
 * weight at most once, because the engine sums weights per rule, not per match.
 *
 * Patterns are written with `i` (case-insensitive) and explicit `\s+` runs so
 * that capitalisation and irregular spacing do not change the outcome.
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
];

/* ------------------------------------------------------------------ */
/* Shared credential term lists, used by Rule 4 further down           */
/* ------------------------------------------------------------------ */

/** `pin(?!\\s*code)` keeps India's postal "PIN code" out of the credential rule. */
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
];

/* ------------------------------------------------------------------ */
/* Rule 4 — requests for credentials                                   */
/* ------------------------------------------------------------------ */

/**
 * Credentials that should never be requested by message. These fire on their
 * own because mentioning them at all in an inbound message is unusual.
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
  new RegExp(
    String.raw`\b(?:otp|pin|password|passcode|code)\b[^.!?\n]{0,30}?\byou\s+(?:receive|received|will\s+receive|get|got|are\s+sent)\b`,
    "i",
  ),
];

/* ------------------------------------------------------------------ */
/* Rule 5 — prize, reward and gift bait                                */
/* ------------------------------------------------------------------ */

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
  /\breward(?:s)?\b/i,
  /\bgift\s+(card|voucher|hamper|worth)\b/i,
  /\bfree\s+(gift|recharge|data|iphone|mobile|laptop|gadget|voucher|sample|trip)\b/i,
  /\bcash\s?back\b/i,
  /\bclaim\s+(your|the|now|it)\b/i,
  /\bscratch\s+card\b/i,
  /\b(kbc|crorepati)\b/i,
  /\bcash\s+prize\b/i,
  /\bwin\s+(a|an|free|cash|prize|rs\.?|₹)\b/i,
  /\bselected\s+(for|as)\s+(a\s+)?(lucky|gift|prize|reward)\b/i,
];

/* ------------------------------------------------------------------ */
/* The rules                                                           */
/* ------------------------------------------------------------------ */

export const RULES: DetectionRule[] = [
  {
    id: "urgency-pressure",
    label: "Urgency or pressure to act immediately",
    description:
      "Time-limited wording that pushes the reader to act before they can think or check.",
    weight: 20,
    severity: "medium",
    explanation:
      "The message pushes you to act within a deadline. Creating urgency is one of the most common tactics in scam messages, because a rushed reader is far less likely to check who really sent it.",
    safeNextStep:
      "Ignore the deadline. A genuine organisation will not withdraw a service because you took an extra hour to verify the request.",
    detect: ({ message }) => collectMatches(message, URGENCY_PATTERNS),
  },
  {
    id: "account-threat",
    label: "Threat of account blocking or suspension",
    description:
      "Claims that an account, card, SIM or service will be blocked, suspended or closed.",
    weight: 15,
    severity: "medium",
    explanation:
      "The message threatens to block, suspend or close something you rely on. Banks and service providers do not usually announce this by an unsolicited message with a link attached.",
    safeNextStep:
      "Check the account yourself by opening the organisation's official app or website directly, rather than through anything in this message.",
    detect: ({ message }) => collectMatches(message, ACCOUNT_THREAT_PATTERNS),
  },
  {
    id: "suspicious-link",
    label: "Suspicious link or link-based call to action",
    description:
      "A link with deceptive traits, or wording designed to move you onto a link.",
    weight: 25,
    severity: "high",
    explanation:
      "The message either contains an address that raises link red flags or asks you to click through to continue. Links are where most scams try to move you onto a page they control.",
    safeNextStep:
      "Do not open the link. Reach the service by typing its official address yourself or by opening its app.",
    detect: ({ message, links }) => {
      const ranges: TextRange[] = collectMatches(message, LINK_CTA_PATTERNS);
      for (const link of links) {
        // Only links that actually raised an indicator count here. An ordinary
        // URL inside a message is not treated as a warning sign on its own.
        if (link.suspicious) ranges.push({ start: link.start, end: link.end });
      }
      return ranges;
    },
  },
  {
    id: "credential-request",
    label: "Request for an OTP, password, PIN or other credential",
    description:
      "Asks for a one-time password, PIN, password, card detail or identity number.",
    weight: 40,
    severity: "critical",
    explanation:
      "The message asks for something that should never be shared: a one-time password, PIN, password or card detail. No legitimate organisation will ever ask you to send these, and anyone who receives them can take over an account.",
    safeNextStep:
      "Never share the code, PIN or password with anyone. If someone claims to need it, end the conversation and contact the organisation through its official number.",
    detect: ({ message }) => [
      ...collectMatches(message, STANDALONE_CREDENTIAL_PATTERNS),
      ...collectMatches(message, CREDENTIAL_REQUEST_PATTERNS),
    ],
  },
  {
    id: "prize-bait",
    label: "Unexpected prize, reward or gift bait",
    description:
      "Claims of a win, lottery, reward or free gift that you did not enter for.",
    weight: 20,
    severity: "medium",
    explanation:
      "The message offers a prize, reward or gift you never applied for. Unexpected winnings are used to get you to pay a small fee or hand over details before the supposed reward arrives.",
    safeNextStep:
      "Assume you have not won anything you did not enter. Do not pay a fee or share details to release a prize.",
    detect: ({ message }) => collectMatches(message, PRIZE_PATTERNS),
  },
];

/** Lookup helper used by tests and future rule management screens. */
export function getRuleById(ruleId: string): DetectionRule | undefined {
  return RULES.find((rule) => rule.id === ruleId);
}
