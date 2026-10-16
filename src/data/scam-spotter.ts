import {
  ArrowRightCircle,
  Braces,
  ClipboardList,
  EyeOff,
  FileSearch,
  Link2,
  ListChecks,
  MessageSquareText,
  ScanSearch,
  ShieldCheck,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

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
  features: "features",
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
    title: "Transparent Rule-Based Detection",
    description:
      "Every warning sign comes from a written, readable rule — nothing is hidden behind a black box you have to trust blindly.",
  },
  {
    icon: EyeOff,
    title: "Privacy-First Processing",
    description:
      "The message you paste stays in your browser. There is no account, no upload, and no storage of what you check.",
  },
  {
    icon: ListChecks,
    title: "Clear, Actionable Guidance",
    description:
      "Instead of a bare verdict, you get plain-language explanations and the concrete next step to take.",
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
      "Drop in the full text of an SMS, email, or chat message that feels off. Nothing is sent anywhere.",
  },
  {
    step: "02",
    icon: FileSearch,
    title: "Detect potential warning signs",
    description:
      "The planned rule engine checks for urgency pressure, spoofed links, OTP requests, and payment asks.",
  },
  {
    step: "03",
    icon: SlidersHorizontal,
    title: "Understand the risk score",
    description:
      "Each matched rule contributes to an explainable score, so you can see exactly what pushed the risk up.",
  },
  {
    step: "04",
    icon: ArrowRightCircle,
    title: "Follow safe next steps",
    description:
      "Leave with a short, specific checklist: what not to tap, who to verify with, and how to report it.",
  },
];

export type FeatureStatus = "implemented" | "planned";

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  status: FeatureStatus;
}

export const FEATURES: Feature[] = [
  {
    icon: SlidersHorizontal,
    title: "Transparent Risk Scoring",
    description:
      "A 0–100 score built from visible weighted rules, never an unexplained number.",
    status: "planned",
  },
  {
    icon: Braces,
    title: "Suspicious Phrase Highlighting",
    description:
      "Matched pressure phrases are highlighted inside your own message so context stays intact.",
    status: "planned",
  },
  {
    icon: Link2,
    title: "Link Warning Detection",
    description:
      "Flags shortened, look-alike, and raw-IP links that hide where a tap would really take you.",
    status: "planned",
  },
  {
    icon: ClipboardList,
    title: "Plain-Language Explanations",
    description:
      "Each finding is paired with a one-sentence explanation written for non-technical readers.",
    status: "planned",
  },
  {
    icon: ShieldCheck,
    title: "Safe Next Steps",
    description:
      "Targeted guidance per finding — verify through the official app, never share an OTP, report and move on.",
    status: "planned",
  },
  {
    icon: EyeOff,
    title: "Privacy-First Processing",
    description:
      "The analyzer runs entirely in your browser session. Your message text is never transmitted or stored.",
    status: "implemented",
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
    description: "unfamiliar domain ending in .online",
  },
  {
    label: "OTP Request",
    description: "asks you to share a one-time password",
  },
];
