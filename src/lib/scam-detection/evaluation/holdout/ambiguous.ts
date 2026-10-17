import type { EvaluationCase } from "../types";

/**
 * 10 synthetic context-dependent messages for the holdout.
 *
 * Each could be a normal process or a social-engineering approach depending on
 * facts the text does not contain. They are labelled `ambiguous` and excluded
 * from the binary metrics.
 */
export const HOLDOUT_AMBIGUOUS_CASES: EvaluationCase[] = [
  {
    id: "TL-H-041",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "This is the society secretary. Maintenance is now collected through a new account. Please transfer Rs 2,400 to the details I'll share.",
    rationale:
      "Societies do change collection accounts, but a payment redirect announced over chat is also a standard fraud.",
    notes:
      "Depends on whether the committee announced the change through a channel the resident already trusts.",
  },
  {
    id: "TL-H-042",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "Before the interview, please email a scan of your passport and degree certificate.",
    rationale:
      "Employers do collect identity documents, but an unsolicited request before any verifiable interview is also a data-harvesting pattern.",
    notes:
      "Depends on whether the recipient applied and can verify the employer independently.",
  },
  {
    id: "TL-H-043",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "I've sent a push notification to your phone for the VPN. Approve it so I can finish the setup.",
    rationale:
      "IT often needs an MFA approval, but approving an unexpected push is also how an attacker completes a login.",
    notes:
      "Depends on whether the recipient opened a ticket and recognises the requester through an internal channel.",
  },
  {
    id: "TL-H-044",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "ordinary-conversation",
    message:
      "I'll hold the cycle for you if you send Rs 500 now. I'll adjust it in the final price.",
    rationale:
      "Small deposits are normal in second-hand sales, and so is advance-fee fraud that asks for a token amount.",
    notes:
      "Depends on whether the listing and the seller can be checked on the marketplace.",
  },
  {
    id: "TL-H-045",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "otp-credential-request",
    message:
      "The technician will ask for the one-time password on your electricity meter to close the job.",
    rationale:
      "Some meter processes do use a code, but an unsolicited instruction to hand a one-time password to a visitor is indistinguishable from a pretext.",
    notes:
      "Depends on whether the visit was booked through the utility's own channel.",
  },
  {
    id: "TL-H-046",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "This is Mrs. Nair, class teacher. Please send your child's Aadhaar number on WhatsApp for the school trip form.",
    rationale:
      "Schools do collect identity numbers, but doing it over WhatsApp from an unverified number is also impersonation.",
    notes:
      "Depends on whether the sender can be confirmed through the school office.",
  },
  {
    id: "TL-H-047",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "account-threat-urgency",
    message:
      "Your salary account is under review. HR will call to confirm your PAN.",
    rationale:
      "Payroll teams do verify tax details, but a review notice with no reference number and a call-back promise gives nothing to check.",
    notes:
      "Depends on whether the employer confirms an open review and the call comes from a known number.",
  },
  {
    id: "TL-H-048",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "otp-credential-request",
    message:
      "A courier is asking for the OTP at the gate. Should I give it to him?",
    rationale:
      "This is a question from one person to another, not an instruction, but the answer still turns on whether a delivery is expected.",
    notes:
      "Depends on whether the recipient ordered anything and whether the courier can be identified.",
  },
  {
    id: "TL-H-049",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "otp-credential-request",
    message:
      "I'm from the bank's loan department. We can offer a pre-approved top-up; reply with your date of birth to check eligibility.",
    rationale:
      "Banks do market pre-approved loans, but asking for date of birth by reply is also a common identity-theft opener.",
    notes:
      "Depends on whether the offer can be seen in the bank's own app or confirmed on a published number.",
  },
  {
    id: "TL-H-050",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "ordinary-conversation",
    message:
      "The plumber says the payment didn't come through and asked me to send it to his personal number instead.",
    rationale:
      "A failed transfer can be real, but redirecting payment to a personal number is also how a payment-diversion scam starts.",
    notes:
      "Depends on whether the original payment can be checked and the number matches the business's published contact.",
  },
];
