import type { EvaluationCase } from "../types";

/**
 * 25 synthetic scam-like messages.
 *
 * Every message is fiction: names are invented, phone numbers are placeholders,
 * and every host uses a reserved domain (`.invalid`, `.example`) or a
 * documentation IP address. Nothing here should be opened or resolved.
 */
export const SCAM_CASES: EvaluationCase[] = [
  {
    id: "TL-S-001",
    bucket: "scam",
    label: "scam",
    challenge: "bank-kyc-impersonation",
    message:
      "Dear customer, your SBI account will be blocked within 24 hours because your KYC is incomplete. Update it immediately by clicking here: http://sbi-kyc-verify.invalid/update",
    rationale:
      "Impersonates a bank, threatens that the account will be blocked, sets a 24-hour deadline, and pushes a lookalike-bank address with a click prompt.",
  },
  {
    id: "TL-S-002",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "We detected an unauthorised transaction of Rs 8,499 on your card ending 4417. To reverse it, share the OTP you received with our fraud team immediately.",
    rationale:
      "A real fraud team never needs the one-time password. The invented transaction supplies a plausible reason for the request.",
  },
  {
    id: "TL-S-003",
    bucket: "scam",
    label: "scam",
    challenge: "parcel-delivery",
    message:
      "Your parcel TRK-88213 is held at the customs office. Pay the clearance fee of Rs 149 today at http://198.51.100.24/pay to avoid return.",
    rationale:
      "A parcel that cannot be checked against any order, a small fee to pay quickly, and a payment link on a bare address.",
  },
  {
    id: "TL-S-004",
    bucket: "scam",
    label: "scam",
    challenge: "prize-cashback-reward",
    message:
      "Congratulations! You are today's lucky winner of Rs 25,00,000 in the Meridian Mega Draw. Claim your prize now at http://meridian-mega-draw.invalid/claim before the offer expires.",
    rationale:
      "An enormous prize in a draw the recipient never entered, a claim link, and a deadline.",
  },
  {
    id: "TL-S-005",
    bucket: "scam",
    label: "scam",
    challenge: "account-threat-urgency",
    message:
      "Your account has been temporarily suspended due to unusual activity. Call our helpline 0000000000 immediately to restore access.",
    rationale:
      "Suspension claim plus a call-back number supplied by the message itself. The number is a placeholder, not a real helpline.",
  },
  {
    id: "TL-S-006",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "Our delivery agent needs the OTP sent to your phone to confirm your address. Reply with it now.",
    rationale:
      "A delivery cannot require the recipient to hand over a login code; the request is the whole purpose of the message.",
  },
  {
    id: "TL-S-007",
    bucket: "scam",
    label: "scam",
    challenge: "account-threat-urgency",
    message:
      "Verify your wallet within 2 hours or it will be permanently closed. Log in here: http://wallet-secure-login.invalid/verify",
    rationale:
      "Deadline, threat of permanent closure, and a sign-in link supplied by the message.",
  },
  {
    id: "TL-S-008",
    bucket: "scam",
    label: "scam",
    challenge: "account-threat-urgency",
    message:
      "Your electricity connection will be disconnected tonight unless you clear the outstanding bill. Pay now at http://198.51.100.31/bill",
    rationale:
      "Utility disconnection pressure with an unverifiable payment address. A power provider would not collect through a bare IP link.",
  },
  {
    id: "TL-S-009",
    bucket: "scam",
    label: "scam",
    challenge: "prize-cashback-reward",
    message:
      "Congratulations, your mobile number has been selected for a free gift worth Rs 5,000. Send your address and a photo of your Aadhaar card to claim it.",
    rationale:
      "Free-gift bait followed by a request for an identity document, which is useful for identity theft rather than for delivering a gift.",
  },
  {
    id: "TL-S-010",
    bucket: "scam",
    label: "scam",
    challenge: "suspicious-link",
    message:
      "Your Netflix payment failed. Update your card details at http://netflix-billing.invalid/payment within 24 hours to avoid losing access.",
    rationale:
      "Borrows a well-known brand in the hostname, asks for card details, and adds a deadline.",
  },
  {
    id: "TL-S-011",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "Dear user, your ATM card is blocked. To reactivate, reply with your 16-digit card number, CVV and expiry date.",
    rationale:
      "Card number, CVV and expiry together are exactly the details needed to charge the card. Reactivation never happens by reply.",
  },
  {
    id: "TL-S-012",
    bucket: "scam",
    label: "scam",
    challenge: "account-threat-urgency",
    message:
      "Final warning: your insurance policy lapses today. Pay Rs 1,999 immediately at http://198.51.100.66/renew or the policy will be cancelled.",
    rationale:
      "Final-warning framing, immediate payment, and a renewal link that does not belong to any named insurer.",
  },
  {
    id: "TL-S-013",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "Hello, I am calling from the bank's security desk. Please confirm the one-time password you just received so I can cancel the fraudulent transfer.",
    rationale:
      "Self-declared authority plus a request for the one-time password. The claim of a fraudulent transfer is the pretext.",
  },
  {
    id: "TL-S-014",
    bucket: "scam",
    label: "scam",
    challenge: "bank-kyc-impersonation",
    message:
      "Your KYC verification is pending. Complete it using the link below before 30 September or your account will be frozen: http://kyc-meridian.example.invalid/verify",
    rationale:
      "KYC deadline, account-freeze threat, and a verification link in the message instead of a branch or app instruction.",
  },
  {
    id: "TL-S-015",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "You have a pending refund of Rs 4,200 from the tax department. Submit your net banking password and PAN number to receive it.",
    rationale:
      "A refund pretext used to ask for the credentials that protect the account. No refund requires a banking password.",
  },
  {
    id: "TL-S-016",
    bucket: "scam",
    label: "scam",
    challenge: "suspicious-link",
    message:
      "Your Instagram account is scheduled for deletion within 24 hours. Confirm ownership by entering your password here: http://instagram-verify.invalid/login",
    rationale:
      "Deletion deadline plus a lookalike hostname and a password prompt. Real platforms do not ask for a password from a link.",
  },
  {
    id: "TL-S-017",
    bucket: "scam",
    label: "scam",
    challenge: "bank-kyc-impersonation",
    message:
      "Your UPI ID has been temporarily disabled. Re-verify at http://upi-verify.invalid/kyc within 6 hours to restore payments.",
    rationale:
      "Disabling claim and a short deadline. The re-verification address is supplied by the message and cannot be checked against an app.",
  },
  {
    id: "TL-S-018",
    bucket: "scam",
    label: "scam",
    challenge: "prize-cashback-reward",
    message:
      "Congratulations! Your number won a scratch card prize of Rs 10,000. WhatsApp us your OTP to redeem it.",
    rationale:
      "Prize bait whose redemption requires the one-time password, which is the actual objective.",
  },
  {
    id: "TL-S-019",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "Dear customer, we are updating our systems. Kindly send your CVV and card PIN to the number below to keep your card active.",
    rationale:
      "System-update pretext for collecting the two card secrets that should never be sent anywhere.",
  },
  {
    id: "TL-S-020",
    bucket: "scam",
    label: "scam",
    challenge: "parcel-delivery",
    message:
      "Your delivery could not be completed because the address was incomplete. Update it here: http://delivery-update.invalid/address and pay a reattempt fee of Rs 25.",
    rationale:
      "A small reattempt fee behind an address form is a common way to harvest a full address and card details.",
  },
  {
    id: "TL-S-021",
    bucket: "scam",
    label: "scam",
    challenge: "suspicious-link",
    message:
      "ALERT: A new device signed in to your account. If this was not you, immediately verify your identity at http://198.51.100.88/secure",
    rationale:
      "A security alert is plausible, but the remedy is a bare-IP link plus a deadline rather than the app or a known address.",
  },
  {
    id: "TL-S-022",
    bucket: "scam",
    label: "scam",
    challenge: "prize-cashback-reward",
    message:
      "You are the lucky customer selected for our anniversary cashback of Rs 3,000. Claim your cashback before midnight.",
    rationale:
      "Unexpected cashback tied to a claim action. There is no order, account or programme the recipient can check it against.",
  },
  {
    id: "TL-S-023",
    bucket: "scam",
    label: "scam",
    challenge: "mixed-signals",
    message:
      "Your son has been in an accident. We need Rs 40,000 for surgery immediately. Send it to this account: 0000 1111 2222. Do not tell anyone.",
    rationale:
      "Family-emergency story, urgent payment, and an instruction not to verify with anyone. The account is a placeholder.",
  },
  {
    id: "TL-S-024",
    bucket: "scam",
    label: "scam",
    challenge: "suspicious-link",
    message:
      "Your subscription payment failed. To keep your benefits, update your payment method through the link below: http://198.51.100.140/billing within 48 hours.",
    rationale:
      "Failed-payment pretext, deadline, and a payment form behind an address with no relation to the service.",
  },
  {
    id: "TL-S-025",
    bucket: "scam",
    label: "scam",
    challenge: "bank-kyc-impersonation",
    message:
      "Dear customer, your pension account is under review. To avoid suspension, confirm your date of birth and account number by replying to this message.",
    rationale:
      "Review-and-suspension pressure used to collect identity data by reply, which no pension office does.",
  },
];
