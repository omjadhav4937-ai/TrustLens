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
  "This score reflects the heuristics above and nothing else. A high score does not prove fraud, and a low score does not prove safety.";
