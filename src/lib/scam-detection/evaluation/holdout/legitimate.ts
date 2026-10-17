import type { EvaluationCase } from "../types";

/**
 * 20 synthetic legitimate messages, authored for the holdout only.
 *
 * Ordinary notices and conversations, several of which use words the rules
 * watch for without asking the reader to do anything unsafe.
 */
export const HOLDOUT_LEGITIMATE_CASES: EvaluationCase[] = [
  {
    id: "TL-H-021",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "229104 is the code for your Cedar Bank transfer of Rs 3,200. Never share this code. It is valid for 5 minutes.",
    rationale:
      "A code the customer requested, delivered with a warning not to share it and with nothing requested in return.",
  },
  {
    id: "TL-H-022",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "Your Cedar Bank statement for August is ready in the app. Open the app to download it.",
    rationale: "A statement notice that names the official app.",
  },
  {
    id: "TL-H-023",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "Your parcel was left with the neighbour at flat 4B. A photo of the handover is in the delivery app.",
    rationale: "A delivery confirmation with no link, fee or request.",
  },
  {
    id: "TL-H-024",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "parcel-delivery",
    message:
      "Your parcel is delayed by one day because of heavy rain. No action is needed.",
    rationale: "A delay notice that explicitly asks for nothing.",
  },
  {
    id: "TL-H-025",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message: "Rs 120 cashback from your Cedar card was credited on 8 October.",
    rationale:
      "A completed cashback credit. There is no offer and no claim action.",
  },
  {
    id: "TL-H-026",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message: "The sprint demo moved to 4 pm. Please update the board when you can.",
    rationale: "An internal scheduling note; 'update' refers to a task board.",
  },
  {
    id: "TL-H-027",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "Payment received: Rs 2,750 to Northline Studio. Receipt: https://billing.example.com/r/8842",
    rationale:
      "A receipt for a payment that has already completed, on an ordinary documentation host.",
  },
  {
    id: "TL-H-028",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "We received a request to reset your password. If it was you, continue at https://accounts.example.com/reset/7c2. Otherwise ignore this email.",
    rationale:
      "A reset the recipient initiated, with a do-nothing path for anyone else and an ordinary host.",
  },
  {
    id: "TL-H-029",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "A card payment of Rs 640 at Fern Cafe was approved. If this wasn't you, call the number printed on your card.",
    rationale:
      "A transaction alert that sends the reader to a number they already hold.",
  },
  {
    id: "TL-H-030",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "bank-kyc-impersonation",
    message: "Your re-KYC is complete. Thank you for visiting the branch.",
    rationale:
      "A completion notice for an in-person process, with no link or request.",
  },
  {
    id: "TL-H-031",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "Your fibre bill of Rs 749 is due on 21 October. Pay in the Cedar app.",
    rationale: "A bill reminder that names the provider's own app.",
  },
  {
    id: "TL-H-032",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "We're reading two short stories this week. Shall we meet on Sunday at the park?",
    rationale: "A social plan with no money, link or credential involved.",
  },
  {
    id: "TL-H-033",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "Welcome aboard. Please bring your ID proof to the office on your first day; HR will make copies.",
    rationale:
      "An onboarding instruction handled in person, with no document sent by message.",
  },
  {
    id: "TL-H-034",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "Our staff will never ask for your OTP, PIN or password. If someone does, end the call.",
    rationale:
      "A pure security education message. It names credentials but requests none.",
  },
  {
    id: "TL-H-035",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "parcel-delivery",
    message:
      "Your delivery is booked for tomorrow between 10 am and 1 pm. Reply RESCHEDULE if you need another slot.",
    rationale:
      "A booking confirmation with an optional reply keyword and no data request.",
  },
  {
    id: "TL-H-036",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "Your replacement card has been dispatched and should arrive in 5 working days.",
    rationale: "A dispatch notice with no link or action.",
  },
  {
    id: "TL-H-037",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "Urgent: the venue changed for tonight's parent meeting. It's now in the library.",
    rationale:
      "Genuine time-sensitive information from a known group, with no money or credentials involved.",
  },
  {
    id: "TL-H-038",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "Your refund of Rs 1,180 has been processed to the original payment method.",
    rationale:
      "A refund that already happened, sent back to the original method rather than to new details.",
  },
  {
    id: "TL-H-039",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "The office raffle raised Rs 12,000 for the shelter. Thanks to everyone who bought a ticket.",
    rationale:
      "A fundraising update about a completed event. Nothing is offered to the reader.",
  },
  {
    id: "TL-H-040",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "Welcome to Cedar Bank. To finish setting up your online account, create a password and confirm it on the next screen.",
    rationale:
      "An onboarding step the new customer is already inside, asking them to choose their own password rather than disclose one.",
    difficulty:
      "'Confirm' sits next to 'password', which is the shape of a disclosure request even here.",
  },
];
