import type { EvaluationCase } from "../types";

/**
 * 25 synthetic legitimate messages.
 *
 * These are ordinary transactional, workplace and security notices. Several
 * deliberately use words the rules watch for ("urgent", "expires", "OTP",
 * "account") without asking the reader to do anything unsafe.
 */
export const LEGITIMATE_CASES: EvaluationCase[] = [
  {
    id: "TL-L-001",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "482913 is your OTP for a transaction of Rs 450 at Sunrise Cafe. Do not share it with anyone, not even bank staff.",
    rationale:
      "A delivery notice for a code the recipient requested, carrying the standard warning not to share it and asking for nothing.",
  },
  {
    id: "TL-L-002",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "Your OTP for the payment you started is 771204. Never share this code with anyone. It expires in 10 minutes.",
    rationale:
      "Same shape as a genuine transaction alert: the code is delivered, not requested, and the warning is explicit.",
  },
  {
    id: "TL-L-003",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "Your Amazon order has been delivered to the reception desk. Thanks for shopping with us.",
    rationale: "Routine delivery confirmation with no request or link.",
  },
  {
    id: "TL-L-004",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "Your cashback of Rs 40 has been credited to your September statement.",
    rationale:
      "A completed cashback credit. Nothing is offered or claimed, so there is no bait.",
  },
  {
    id: "TL-L-005",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "We noticed a sign-in to your account from a new device in Pune. If this was not you, call the number on the back of your card. Never share your password with anyone.",
    rationale:
      "A genuine security notice points the reader at a channel they already hold (the number on the card) rather than a link.",
  },
  {
    id: "TL-L-006",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "Reminder: the design review is moved to Thursday at 3 pm. Please update the calendar invite if you can.",
    rationale:
      "Internal scheduling note. The word 'update' refers to a calendar entry.",
  },
  {
    id: "TL-L-007",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "Your invoice INV-2041 for Rs 12,400 has been paid. Receipt: https://payments.example.com/receipt/inv-2041",
    rationale:
      "A receipt for an already-completed payment on an ordinary host, with nothing to click through to act.",
  },
  {
    id: "TL-L-008",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "You requested a password reset. If this was you, open https://accounts.example.com/reset?token=abc123. The link expires in 30 minutes.",
    rationale:
      "A reset the recipient initiated, sent to the address on file, with an ordinary host and a standard expiry.",
  },
  {
    id: "TL-L-009",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "parcel-delivery",
    message:
      "Your parcel was delivered to the security desk at 4:12 pm. Tracking ID: TRK-77120.",
    rationale:
      "Delivery confirmation with no fee, no link and no request.",
  },
  {
    id: "TL-L-010",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "Your monthly plan renews on 3 November for Rs 499. You can manage it in Settings > Billing.",
    rationale:
      "A renewal notice that names an in-product path rather than an external link.",
  },
  {
    id: "TL-L-011",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "September account statement is now available in the app. Log in through the app to view it.",
    rationale:
      "The instruction names the official app the recipient already has.",
  },
  {
    id: "TL-L-012",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "Team, the client call is urgent and starts in 10 minutes. Join using the usual meeting room.",
    rationale:
      "Genuine workplace urgency with no money, credential or link involved.",
  },
  {
    id: "TL-L-013",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message: "Your KYC has been verified successfully. No further action is needed.",
    rationale: "Completion notice; the message asks for nothing.",
  },
  {
    id: "TL-L-014",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message: "Last chance to register for the internal security training on Friday.",
    rationale:
      "Internal deadline wording with no external pressure or request for data.",
  },
  {
    id: "TL-L-015",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "Your donation of Rs 1,000 to the Greenway Trust has been received. Thank you.",
    rationale: "A receipt for a donation the recipient made.",
  },
  {
    id: "TL-L-016",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "Appointment confirmed for 12 October at 10:30 am with Dr. Rao. Reply to reschedule.",
    rationale:
      "Standard appointment confirmation. Replying is optional and carries no data request.",
  },
  {
    id: "TL-L-017",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "The library will be closed on Monday for maintenance. Books can be returned on Tuesday.",
    rationale: "A public notice with no request at all.",
  },
  {
    id: "TL-L-018",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "Hi Rahul, attaching the minutes from today's meeting. Let me know if anything is missing.",
    rationale: "An ordinary colleague message with no financial or credential content.",
  },
  {
    id: "TL-L-019",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "Your card ending 4417 was used for Rs 2,340 at Bluewave Store. If you do not recognise this, call the number on the back of your card.",
    rationale:
      "A transaction alert that directs the reader to the number printed on the card, not to a supplied link.",
  },
  {
    id: "TL-L-020",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "We have received your application for the Data Analyst role. The hiring team will respond within 5 working days.",
    rationale:
      "A hiring acknowledgement the recipient applied for, with no request for documents.",
  },
  {
    id: "TL-L-021",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "Your booking for 2 seats on the 6:40 pm show is confirmed. Please arrive 15 minutes early.",
    rationale: "A booking confirmation with a practical instruction only.",
  },
  {
    id: "TL-L-022",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "Never share your OTP or password with anyone. Our staff will never ask for it.",
    rationale:
      "A pure security education message. It names credentials but makes no request.",
  },
  {
    id: "TL-L-023",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "Your broadband bill of Rs 899 is due on 28 October. Pay through the operator's app or at a branch.",
    rationale:
      "A bill reminder that names channels the recipient can reach independently.",
  },
  {
    id: "TL-L-024",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "Please review the attached policy draft before Friday and add comments in the shared document.",
    rationale: "A normal work request with no link, data or payment.",
  },
  {
    id: "TL-L-025",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "Your gym membership expires on 30 November. Renew at the front desk if you wish to continue.",
    rationale:
      "A factual renewal reminder that points at an in-person desk rather than a link.",
  },
];
