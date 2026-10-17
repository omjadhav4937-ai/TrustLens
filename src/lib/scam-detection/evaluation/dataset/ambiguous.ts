import type { EvaluationCase } from "../types";

/**
 * 25 synthetic context-dependent messages.
 *
 * Each of these could be ordinary or hostile depending on who really sent it and
 * what relationship the recipient has with them. They are labelled `ambiguous`
 * and deliberately left out of the binary precision/recall calculation.
 */
export const AMBIGUOUS_CASES: EvaluationCase[] = [
  {
    id: "TL-A-001",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "Hi, I'm Priya from TalentBridge. Before we schedule your interview, please send a copy of your Aadhaar and PAN for verification.",
    rationale:
      "Recruiters do collect identity documents, but only after a process the candidate can verify. The message alone cannot establish that the sender is a recruiter.",
    notes:
      "Legitimate if the recipient applied and can confirm the agency; identity theft if the approach is unsolicited.",
  },
  {
    id: "TL-A-002",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "This is the IT helpdesk. I'm resetting your VPN. I'll trigger a code to your phone — read it back to me when it arrives.",
    rationale:
      "Internal helpdesks do reset access, but reading a code back to a caller is indistinguishable from a social-engineering script.",
    notes:
      "Depends on whether the recipient opened the request with IT and can identify the person through an internal channel.",
  },
  {
    id: "TL-A-003",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "Hi, this is Mr. Iyer. I've changed banks, so please send this month's rent to the new UPI ID: rent-iyer@example.invalid from now on.",
    rationale:
      "A landlord can genuinely change accounts, but payment-redirection fraud uses exactly this message.",
    notes:
      "The recipient must confirm the change through a channel they already had, such as a phone number from the lease.",
  },
  {
    id: "TL-A-004",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "Hey it's Ananya, I've lost my phone. This is my new number. Can you send Rs 2,000 urgently? I'll return it tomorrow.",
    rationale:
      "A friend may really need help, but 'new number, send money, do not call' is also a standard impersonation pattern.",
    notes:
      "Resolvable only by contacting the friend through a previously known number or in person.",
  },
  {
    id: "TL-A-005",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "bank-kyc-impersonation",
    message:
      "Your periodic KYC review is due by 30 November. Please visit your home branch with an identity document.",
    rationale:
      "Periodic KYC review is a real banking process, and the message asks for an in-person visit rather than data. Its wording could equally be copied by an impersonator who then changes the instruction.",
    notes:
      "Looks legitimate, but the message alone cannot prove the sender is the bank; a low score must not be read as endorsement.",
  },
  {
    id: "TL-A-006",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "parcel-delivery",
    message:
      "Your parcel is at the gate. The delivery agent is asking for a Rs 25 handling fee in cash. Should I pay it?",
    rationale:
      "Informal courier fees do happen, but paying an unknown agent at the door is also a common small-fee scam.",
    notes:
      "Depends on the sender's identity and whether a delivery was expected. The message is a question from one person to another, not an instruction from a company.",
  },
  {
    id: "TL-A-007",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "ordinary-conversation",
    message:
      "Hi, I'm interested in the sofa you listed. Can we continue on WhatsApp? My number is 0000000000.",
    rationale:
      "Buyers often prefer chat apps, but moving a marketplace conversation off-platform is a known pretext for advance-fee fraud.",
    notes: "Depends on whether the listing and the buyer can be checked in the marketplace.",
  },
  {
    id: "TL-A-008",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "prize-cashback-reward",
    message:
      "Thanks for completing our survey. You've won a Rs 500 voucher in the monthly draw. Claim it by Friday using the code SURVEY500.",
    rationale:
      "A small voucher from a survey the recipient actually completed is plausible, and the claim needs no payment or data. A prize from a survey they do not remember taking is bait.",
    notes: "The missing fact is whether the recipient entered the draw.",
  },
  {
    id: "TL-A-009",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "ordinary-conversation",
    message:
      "Your flight 6E-214 has been rescheduled to 9:15 pm. Please confirm you have seen this message.",
    rationale:
      "This is a normal airline notice shape, but the sender, booking reference and passenger name are absent, so it could be sent to anyone.",
    notes:
      "Checkable against a booking the recipient holds; the message itself carries no link or request for data.",
  },
  {
    id: "TL-A-010",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "account-threat-urgency",
    message:
      "Your account will be closed if you don't confirm your address by 20 October. Reply YES to confirm.",
    rationale:
      "Dormant-account closure notices exist, but a reply-to-confirm instruction gives no way to check who is asking.",
    notes:
      "The recipient would need to log in through the service's own app to see whether the notice is real.",
  },
  {
    id: "TL-A-011",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "parcel-delivery",
    message:
      "We tried to deliver your parcel but nobody was home. Call this number to arrange redelivery: 0000000000.",
    rationale:
      "Card-left notices are normal, but a number supplied only by the message is exactly how delivery scams collect card details on the call.",
    notes: "The recipient must compare the number with the carrier's published one.",
  },
  {
    id: "TL-A-012",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "This is the security team. We've locked your account after suspicious activity. To unlock it, confirm your employee ID and date of birth.",
    rationale:
      "An internal security team may ask for identity confirmation, but a message that asks for date of birth to restore access is also a classic phish.",
    notes: "Depends on whether the recipient has an open ticket with the security team.",
  },
  {
    id: "TL-A-013",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "Your refund is approved. Our agent will call you and ask for the last four digits of your card to process it.",
    rationale:
      "Some support desks do verify the last four digits, but asking for card data on an inbound call is a known fraud pattern.",
    notes: "The safe route is to call the organisation back on a number the recipient finds independently.",
  },
  {
    id: "TL-A-014",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "bank-kyc-impersonation",
    message:
      "Hi, this is your bank. We're updating our records. Please confirm your address and email over the phone when we call today.",
    rationale:
      "Banks do refresh contact records, but a bank that calls the customer should already know the address on file.",
    notes: "Context needed: has the recipient been expecting the call, and which number will be used?",
  },
  {
    id: "TL-A-015",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "suspicious-link",
    message:
      "We couldn't process your payment. Update your card details using the link we sent by SMS.",
    rationale:
      "Payment failures are real, and some providers do send a recovery link. A link that arrives separately and asks for full card details is also the standard card-phishing flow.",
    notes: "Depends on whether the recipient can match the SMS to a known provider and an expected charge.",
  },
  {
    id: "TL-A-016",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "parcel-delivery",
    message:
      "A package addressed to you is waiting at the post office. A storage fee of Rs 20 per day applies. Pay at the counter.",
    rationale:
      "Postal storage fees exist and this one is paid in person, but an unexpected package is also used to start a conversation.",
    notes: "Depends on a delivery the recipient is expecting and on the message's actual origin.",
  },
  {
    id: "TL-A-017",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "otp-credential-request",
    message:
      "Can you share the OTP you just received? I'm trying to log in to the shared demo account and it's asking for verification.",
    rationale:
      "A colleague may genuinely be locked out of a shared test account, but a one-time password sent to one person's phone is not a shared secret.",
    notes: "Depends on the sender's identity and whether the account is really shared.",
  },
  {
    id: "TL-A-018",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "ordinary-conversation",
    message:
      "Your son's school fees are overdue. Please pay by Friday to avoid late charges.",
    rationale:
      "Schools do chase fees, but the message names no school, student or payment channel.",
    notes: "Depends on whether the recipient has a child at the school and can pay through its published channel.",
  },
  {
    id: "TL-A-019",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "I'm from the fraud team. Did you authorise a transaction of Rs 9,999? If not, I can help you reverse it.",
    rationale:
      "Fraud teams do make verification calls, but scammers open with the same question to establish authority.",
    notes: "The recipient should hang up and call the published number, which makes the message neither safe nor provably hostile.",
  },
  {
    id: "TL-A-020",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "Your UPI request of Rs 5,000 is pending. Approve it in the app if it was you.",
    rationale:
      "A pending collect request can be genuine, but approving an unexpected request is how money is pulled from an account.",
    notes: "Depends on whether the recipient initiated a payment of that size.",
  },
  {
    id: "TL-A-021",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "account-threat-urgency",
    message:
      "Dear customer, your account has been flagged for review. Our officer will contact you within 2 working days.",
    rationale:
      "Reviews are a normal compliance step, but the message gives no reference number and no way to verify the sender.",
    notes: "Depends on whether the recipient's bank confirms an open review.",
  },
  {
    id: "TL-A-022",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "Your ticket refund is ready. Send us your bank account number and IFSC to receive Rs 1,250.",
    rationale:
      "A refund can require bank details, but a refund to the original payment method never needs them.",
    notes: "Depends on the original payment method and whether the sender is the merchant involved.",
  },
  {
    id: "TL-A-023",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "Please find attached the offer letter. Sign and return it, and share your PAN for payroll setup.",
    rationale:
      "Onboarding genuinely needs tax details, but the same request sent before any verifiable employment relationship is a data-harvesting pattern.",
    notes: "Depends on whether the offer is real and the recipient applied for the role.",
  },
  {
    id: "TL-A-024",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "otp-credential-request",
    message:
      "Our delivery partner will call you to confirm the OTP for handover.",
    rationale:
      "Some couriers do use an OTP handover, but the code is entered by the customer, not spoken to the driver.",
    notes: "Depends on the courier's actual process; the message alone cannot settle it.",
  },
  {
    id: "TL-A-025",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "ordinary-conversation",
    message:
      "Your mutual fund SIP mandate is due for renewal. Approve the mandate in your broker's app.",
    rationale:
      "Mandate renewals are routine, and the instruction names the broker's app rather than a link, but the message has no sender branding or reference.",
    notes: "Checkable in the broker's app; the message itself does not prove who sent it.",
  },
];
