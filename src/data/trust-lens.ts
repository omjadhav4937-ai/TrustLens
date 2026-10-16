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
export const TAGLINE = "Think Before You Tap.";

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
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: "01",
    icon: MessageSquareText,
    title: "Paste a suspicious message",
    description:
      "Bring in the full text of an SMS, email, or chat message that does not feel right. Nothing is sent anywhere.",
  },
  {
    step: "02",
    icon: FileSearch,
    title: "Spot the warning signs",
    description:
      "TrustLens checks for pressure tactics, spoofed links, OTP requests, and unexpected payment asks.",
  },
  {
    step: "03",
    icon: SlidersHorizontal,
    title: "Understand the risk level",
    description:
      "Each matched rule explains itself and adds to a clear Low, Medium, or High risk level you can reason about.",
  },
  {
    step: "04",
    icon: ArrowRightCircle,
    title: "Take the safe next step",
    description:
      "Leave with a short checklist: what not to tap, who to verify with, and how to report the message.",
  },
];

export type CapabilityStatus = "available" | "planned";

export interface Capability {
  icon: LucideIcon;
  title: string;
  description: string;
  status: CapabilityStatus;
}

/** What people can do with TrustLens, and how far each one has shipped. */
export const CAPABILITIES: Capability[] = [
  {
    icon: MessageSquareText,
    title: "Paste a message to check",
    description:
      "Bring the full text of anything you are unsure about into one calm, uncluttered workspace.",
    status: "available",
  },
  {
    icon: MessagesSquare,
    title: "SMS, email, and chat in one place",
    description:
      "One analyzer for every channel, so you do not need a separate tool for each app you use.",
    status: "available",
  },
  {
    icon: Sparkles,
    title: "Try a sample scam message",
    description:
      "Load a fictional bank KYC scam and see how a suspicious message is written to rush you.",
    status: "available",
  },
  {
    icon: RotateCcw,
    title: "Clear and check another",
    description:
      "Reset the analyzer in a single click and move straight on to the next message.",
    status: "available",
  },
  {
    icon: EyeOff,
    title: "Privacy-first analysis",
    description:
      "Your message is handled inside the browser and is never uploaded, logged, or stored.",
    status: "available",
  },
  {
    icon: SlidersHorizontal,
    title: "A clear risk level",
    description:
      "Every check ends in Low, Medium, or High, with the reasons behind it shown alongside.",
    status: "planned",
  },
  {
    icon: Highlighter,
    title: "Highlighted warning signs",
    description:
      "Suspicious phrases are marked inside your own message and explained one at a time.",
    status: "planned",
  },
  {
    icon: Link2,
    title: "Link and lookalike-domain checks",
    description:
      "Shortened, misspelled, and imitation domains are called out before you tap them.",
    status: "planned",
  },
  {
    icon: ListChecks,
    title: "Safe next steps",
    description:
      "Findings turn into specific actions: verify through official channels, never share an OTP, and report the message.",
    status: "planned",
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
