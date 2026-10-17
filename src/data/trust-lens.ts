import {
  ArrowRightCircle,
  EyeOff,
  FileSearch,
  Highlighter,
  Link2,
  ListChecks,
  MessagesSquare,
  MessageSquareText,
  RotateCcw,
  ScanSearch,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const PRODUCT_NAME = "TrustLens";
export const TAGLINE = "See the Risk Behind Every Message.";
/** The hero headline, split so the tail can carry the accent gradient. */
export const HEADLINE_LEAD = "See the Risk";
export const HEADLINE_ACCENT = "Behind Every Message.";

export interface NavLink {
  label: string;
  /** DOM id of the section the link scrolls to. */
  id: string;
}

export const NAV_LINKS: NavLink[] = [
  { label: "Home", id: "home" },
  { label: "Analyze Message", id: "analyzer" },
  { label: "How It Works", id: "how-it-works" },
  { label: "About", id: "about" },
];

export const SECTION_IDS = {
  home: "home",
  trust: "trust",
  howItWorks: "how-it-works",
  capabilities: "capabilities",
  analyzer: "analyzer",
  results: "results",
  safety: "safety",
  about: "about",
} as const;

export interface TrustPoint {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const TRUST_POINTS: TrustPoint[] = [
  {
    icon: ScanSearch,
    title: "Transparent, rule-based detection",
    description:
      "TrustLens is built on written rules instead of an opaque model, so every warning sign can be explained in words you can check for yourself.",
  },
  {
    icon: EyeOff,
    title: "Privacy-first processing",
    description:
      "Your message stays in your browser. There is no account to create, no upload, and no copy kept on a server.",
  },
  {
    icon: ListChecks,
    title: "Guidance you can act on",
    description:
      "Every finding comes with a plain-language explanation and one concrete next step, so you are never left guessing what to do.",
  },
];

export interface HowItWorksStep {
  step: string;
  icon: LucideIcon;
  title: string;
  description: string;
  /** Short remark shown as the card's hover emphasis. */
  note: string;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: "01",
    icon: MessageSquareText,
    title: "Paste a suspicious message",
    description:
      "Bring in the full text of an SMS, email, or chat message that does not feel right. Nothing is sent anywhere.",
    note: "Takes a few seconds",
  },
  {
    step: "02",
    icon: FileSearch,
    title: "Spot the warning signs",
    description:
      "TrustLens checks for pressure tactics, spoofed links, OTP requests, and unexpected payment asks.",
    note: "Every check is a written rule",
  },
  {
    step: "03",
    icon: SlidersHorizontal,
    title: "Understand the risk level",
    description:
      "Each matched rule explains itself and adds to a clear Low, Medium, or High risk level you can reason about.",
    note: "The reasoning is always shown",
  },
  {
    step: "04",
    icon: ArrowRightCircle,
    title: "Take the safe next step",
    description:
      "Leave with a short checklist: what not to tap, who to verify with, and how to report the message.",
    note: "No jargon, one action at a time",
  },
];

export type CapabilityStatus = "available" | "planned";

export interface Capability {
  icon: LucideIcon;
  title: string;
  /** Front face: what the capability is. */
  description: string;
  status: CapabilityStatus;
  /** Back face: why it matters. */
  detail: string;
  /** Back face: three short benefits. */
  points: string[];
}

/** What people can do with TrustLens, and how far each one has shipped. */
export const CAPABILITIES: Capability[] = [
  {
    icon: MessageSquareText,
    title: "Paste a message to check",
    description:
      "Bring the full text of anything you are unsure about into one calm, uncluttered workspace.",
    status: "available",
    detail:
      "Scam messages usually hide the trap in a single line, so a summary is not enough. Pasting the whole message keeps the context intact and lets every warning sign be judged in the place it actually appeared.",
    points: [
      "Accepts up to 1,500 characters of any message",
      "Nothing leaves your browser tab",
      "You keep control of the text at all times",
    ],
  },
  {
    icon: MessagesSquare,
    title: "SMS, email, and chat in one place",
    description:
      "One analyzer for every channel, so you do not need a separate tool for each app you use.",
    status: "available",
    detail:
      "Fraud arrives through whichever channel you trust most. TrustLens does not mind where a message came from, because the warning signs look the same whether it was delivered by text, email, or a messaging app.",
    points: [
      "One workflow instead of several tools",
      "No retyping or shortening the message",
      "Consistent treatment across every channel",
    ],
  },
  {
    icon: Sparkles,
    title: "Try a sample scam message",
    description:
      "Load a fictional bank KYC scam and see how a suspicious message is written to rush you.",
    status: "available",
    detail:
      "The sample is a fictional bank KYC scam written in the style of the messages people really receive. Loading it lets you get comfortable with the analyzer before you bring it a message that matters.",
    points: [
      "Entirely fictional, so nothing personal is involved",
      "Demonstrates urgency, a lookalike link, and an OTP request",
      "Replaced in one click once you add your own message",
    ],
  },
  {
    icon: RotateCcw,
    title: "Clear and check another",
    description:
      "Reset the analyzer in a single click and move straight on to the next message.",
    status: "available",
    detail:
      "Suspicious messages rarely arrive one at a time. Clear resets the text and any validation message, so the next check starts from a clean slate rather than an edited version of the last one.",
    points: [
      "Empties the input and clears any warning",
      "Disabled while the input is already empty",
      "Reachable by keyboard like every other control",
    ],
  },
  {
    icon: EyeOff,
    title: "Privacy-first analysis",
    description:
      "Your message is handled inside the browser and is never uploaded, logged, or stored.",
    status: "available",
    detail:
      "The messages worth checking are exactly the ones that tend to contain your name, account details, and links. TrustLens is built so that text stays on the page you are reading it on, and disappears when you close the tab.",
    points: [
      "No account, sign-up, or profile",
      "No upload and no server-side storage",
      "Close the tab and the message is gone",
    ],
  },
  {
    icon: SlidersHorizontal,
    title: "A clear risk level",
    description:
      "Every check ends in Low, Medium, or High, with the reasons behind it shown alongside.",
    status: "available",
    detail:
      "One word is easier to act on than a wall of detail. Each finding contributes to a single overall level, and the findings that produced it sit right beside it, so the level is never a mystery you have to take on faith.",
    points: [
      "Low, Medium, or High — never a vague warning",
      "The findings behind the level are always visible",
      "Presented as possible warning signs, not a verdict",
    ],
  },
  {
    icon: Highlighter,
    title: "Highlighted warning signs",
    description:
      "Suspicious phrases are marked inside your own message and explained one at a time.",
    status: "available",
    detail:
      "Seeing the suspicious phrase inside your own message is what makes a warning stick. TrustLens marks the exact text it reacted to, then explains in one sentence why that phrase is worth a second look.",
    points: [
      "Matches stay highlighted in their original context",
      "A plain-language explanation for each match",
      "Enough detail for you to judge the finding yourself",
    ],
  },
  {
    icon: Link2,
    title: "Link and lookalike-domain checks",
    description:
      "Shortened, misspelled, and imitation domains are called out before you tap them.",
    status: "available",
    detail:
      "Most scams end with a single tap. TrustLens looks at the destination before you do: shortened links, brand names with a letter swapped, and domains that imitate a bank or a courier closely enough to pass a glance.",
    points: [
      "Shortened and mismatched links flagged",
      "Lookalike domains compared with the genuine name",
      "The real destination is shown before you decide",
    ],
  },
  {
    icon: ListChecks,
    title: "Safe next steps",
    description:
      "Findings turn into specific actions: verify through official channels, never share an OTP, and report the message.",
    status: "available",
    detail:
      "Knowing a message is risky is only half of the job. Every finding ends with the specific action to take, so you finish a check knowing exactly what to do next rather than simply feeling uneasy.",
    points: [
      "One concrete action for each finding",
      "Reminders to verify through official channels",
      "Guidance on reporting the message afterwards",
    ],
  },
];

/**
 * A fictional SBI KYC scam message modelled on the SETU PS-01 example.
 * It is written for demonstration only and is not a real message from any bank.
 */
export const SAMPLE_MESSAGE = `Dear Customer, your SBI YONO account will be BLOCKED today because your KYC is not updated. Update immediately within 24 hours by clicking http://sbi-kyc-verify.online/update and confirm your details. Share the OTP you receive on this number with our verification executive to restore your services. - SBI Customer Care`;

export const MAX_MESSAGE_LENGTH = 1500;

export interface DemoWarningLabel {
  label: string;
  description: string;
}

/** Labels used on the hero preview card to point out the classic warning signs. */
export const DEMO_WARNING_LABELS: DemoWarningLabel[] = [
  {
    label: "Urgency",
    description: "“within 24 hours”, “BLOCKED today”",
  },
  {
    label: "Suspicious Link",
    description: "an unfamiliar domain ending in .online",
  },
  {
    label: "OTP Request",
    description: "asks you to share a one-time password",
  },
];

/**
 * Safety copy. Kept here so the limitations the engine actually has can be
 * reviewed in one place instead of being scattered across components.
 */
export const SCORE_LIMITATIONS: string[] = [
  "The score is built only from the written heuristics listed on this page. It is not a scan by a security vendor, and it does not check reputation, ownership, registration or whether a website is reachable.",
  "A high score is a warning, not a verdict. It means the wording matches patterns commonly used in scams — not that the sender intended fraud.",
  "A low score does not guarantee that a message is safe. TrustLens cannot tell who really sent a message, and it cannot see what a link would do.",
  "TrustLens never opens, visits or requests any link found in your message, and never sends your message anywhere.",
  "Never send an OTP, password, PIN or bank detail to anyone, whatever a message claims about why it is needed.",
];

export const SAFE_BEHAVIOUR: string[] = [
  "Do not tap a link you were not expecting, even when the message names a service you really use.",
  "Do not share an OTP, password, PIN or card detail with anyone, including someone claiming to be from your bank.",
  "Verify by opening the organisation's official app, or by typing its address yourself instead of following a link in the message.",
  "If money has already left your account, report it straight away — a fast report gives the best chance of freezing the transfer.",
];

export const REPORTING = {
  body: "In India, suspected cybercrime can be reported through the National Cyber Crime Reporting Portal, and financial cyber fraud can also be reported on the 1930 helpline run by the Ministry of Home Affairs.",
  portalLabel: "cybercrime.gov.in",
  portalUrl: "https://www.cybercrime.gov.in/",
  helpline: "1930",
};

/** Shown under every score so the limitation travels with the number. */
export const SCORE_CAVEAT =
  "The score reflects the rules implemented in TrustLens. A high score does not prove fraud, and a low score does not prove safety.";

/** Travels with every link the engine reports, suspicious or not. */
export const LINK_CAVEAT =
  "These checks inspect URL structure only. They do not verify domain ownership, reputation, or live website behaviour.";

/**
 * What the rule set still cannot tell apart, stated inside the detection
 * breakdown. Each line is a real gap in the current logic, not a disclaimer.
 */
export const DETECTION_LIMITATIONS: string[] = [
  "A credential is counted only when the message asks for it. A bank-style alert that names a code and tells you never to share it is recorded as a note instead of a match.",
  "Reward, cashback and voucher wording is counted only next to a claim, a win or a free-gift offer. An ordinary balance or cashback notification is not counted.",
  "India's six-digit postal PIN code is not treated as a banking PIN, so a delivery message that mentions one is not flagged. A scam hiding behind that same wording would not be caught by this rule either.",
  "A message that names a code but neither asks for it nor warns you about it is still counted. That is the cautious choice, and the note on the rule says so.",
  "The weights are editorial, not measured. No labelled dataset has been evaluated, so TrustLens publishes no accuracy percentage and claims none.",
  "These rules read wording and link shape only. They cannot see who really sent a message, what a link would do, or whether a sender is genuine.",
];

/**
 * What each rule-coverage status means.
 *
 * Three states on purpose: a rule the engine never ran has not cleared the
 * message, and it must not be labelled as though it had.
 */
export interface CoverageStatusHelp {
  status: "matched" | "not-matched" | "not-evaluated" | "error";
  title: string;
  meaning: string;
}

export const COVERAGE_STATUS_HELP: CoverageStatusHelp[] = [
  {
    status: "matched",
    title: "Matched",
    meaning: "The rule was evaluated and evidence for it was found in this message.",
  },
  {
    status: "not-matched",
    title: "Not matched",
    meaning:
      "The rule was evaluated and no matching evidence was found. This is not a statement that the message is safe.",
  },
  {
    status: "not-evaluated",
    title: "Not evaluated",
    meaning:
      "The rule did not run, or its status is unavailable. Nothing about the message can be concluded from this rule.",
  },
  {
    status: "error",
    title: "Could not run",
    meaning:
      "The rule was evaluated but failed, so it contributed nothing. Its warning signs are not covered by this result.",
  },
];

/**
 * The actions offered after a check.
 *
 * `triggeredBy` lists the rule ids whose presence makes an action especially
 * relevant. An empty list means the action always applies, because there is no
 * message for which "do not share an OTP" is bad advice.
 */
export interface SafetyAction {
  id: string;
  text: string;
  triggeredBy: string[];
}

export const SAFETY_ACTIONS: SafetyAction[] = [
  {
    id: "never-share",
    text: "I will not share an OTP, password, PIN or card detail with anyone, whoever the message claims to be from.",
    triggeredBy: [],
  },
  {
    id: "no-unexpected-links",
    text: "I will not open a link I was not expecting, even when it names a service I really use.",
    triggeredBy: ["suspicious-link"],
  },
  {
    id: "end-credential-conversations",
    text: "I will treat any request for a code, PIN or password as a scam attempt and end the conversation there.",
    triggeredBy: ["credential-request"],
  },
  {
    id: "check-account-myself",
    text: "I will not act on a threat to block an account from inside the message. I will open the organisation's own app and check for myself.",
    triggeredBy: ["account-threat"],
  },
  {
    id: "no-prize-fee",
    text: "I will not pay a fee or hand over details to release a prize or reward I never entered for.",
    triggeredBy: ["prize-bait"],
  },
  {
    id: "ignore-the-deadline",
    text: "I will ignore the deadline in the message and take as long as I need to verify it.",
    triggeredBy: ["urgency-pressure"],
  },
  {
    id: "verify-officially",
    text: "I will verify the request through the organisation's official app, or a contact I looked up myself — never through a link or number in the message.",
    triggeredBy: [],
  },
  {
    id: "report-if-money-moved",
    text: "If money has already left my account, I will report it straight away — a fast report gives the best chance of freezing the transfer.",
    triggeredBy: [],
  },
];

/** Shown with the checklist so ticking boxes is never read as clearing a message. */
export const SAFETY_CHECKLIST_NOTE =
  "These are reminders you can work through, not a verdict. Ticking them changes nothing about the score, and a completed list does not make a message safe.";

/** Shown when nothing was detected, so the panel still refuses to reassure. */
export const SAFETY_NO_MATCH_NOTE =
  "No configured warning sign matched this message. Keep treating unexpected messages with care, and verify before you act on anything that asks for money or details.";
