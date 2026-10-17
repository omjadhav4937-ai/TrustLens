import type { EvaluationCase } from "../types";

/**
 * 20 synthetic scam-like messages, authored for the holdout only.
 *
 * They are new examples rather than variants of the original 100. Everything is
 * fictional: hosts use `.invalid` / `.example`, phone numbers are placeholders,
 * and nothing should be opened or resolved.
 */
export const HOLDOUT_SCAM_CASES: EvaluationCase[] = [
  {
    id: "TL-H-001",
    bucket: "scam",
    label: "scam",
    challenge: "bank-kyc-impersonation",
    message:
      "Cedar Bank: net-banking access is frozen. Re-activate within 48 hours at https://secure.cedarbank.login-check.invalid/kyc or call 0000000010.",
    rationale:
      "A bank-styled freeze notice with a deadline, a sender-supplied link and an unverified callback number.",
    difficulty:
      "The frozen 'access' is not a listed account noun, so only the link structure and deadline can fire.",
  },
  {
    id: "TL-H-002",
    bucket: "scam",
    label: "scam",
    challenge: "bank-kyc-impersonation",
    message:
      "KYC alert: our officer will verify you on a video call. Keep your Aadhaar and PAN ready and read the OTP aloud when asked.",
    rationale:
      "A genuine video KYC never asks the customer to speak a one-time password aloud; the code is the objective.",
    difficulty:
      "The KYC framing is plausible and the message contains no link, threat or deadline.",
  },
  {
    id: "TL-H-003",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "For the credit-limit review, send a picture of the card resting beside your ID in this chat.",
    rationale:
      "A card image exposes the number, expiry and CVV, and a limit increase never requires one by chat.",
    difficulty:
      "It asks for the card itself rather than a listed field such as CVV or card number.",
  },
  {
    id: "TL-H-004",
    bucket: "scam",
    label: "scam",
    challenge: "parcel-delivery",
    message:
      "We can redeliver between 6 and 8 pm. To confirm the slot, tell the driver the 4-digit code that just arrived by SMS.",
    rationale:
      "A delivery slot does not depend on a code sent to the customer's phone, and 'telling the driver' hands over an authentication factor.",
    difficulty:
      "The wording avoids 'OTP' and uses 'just arrived' instead of the 'you received' phrasing the rule expects.",
  },
  {
    id: "TL-H-005",
    bucket: "scam",
    label: "scam",
    challenge: "suspicious-link",
    message:
      "Important: suspicious activity was detected on your Cedar Bank account. Sign in here to secure it: http://cedarbank.example.com@198.51.100.62/secure before the account is suspended.",
    rationale:
      "The visible brand sits before an '@' while the real destination is a bare address; the account threat supplies the reason to click.",
    difficulty:
      "The userinfo trick is visible only if the address is parsed, and the wording also matches the account-threat pattern.",
  },
  {
    id: "TL-H-006",
    bucket: "scam",
    label: "scam",
    challenge: "prize-cashback-reward",
    message:
      "You have been chosen as this month's lucky shopper. A Rs 2,000 gift card is reserved under your name for 24 hours. Claim your gift card before the offer expires.",
    rationale:
      "An unexpected prize tied to a claim action and a countdown. Nothing identifies the shop or the promotion.",
    difficulty:
      "There is no payment or data request, so only the combination of prize and deadline lifts it out of Low.",
  },
  {
    id: "TL-H-007",
    bucket: "scam",
    label: "scam",
    challenge: "account-threat-urgency",
    message:
      "Your broadband service is scheduled for disconnection this evening. Call 0000000001 now to keep it connected.",
    rationale:
      "A service threat plus a call-back number controlled by the sender; a provider would not handle this through an unknown number.",
    difficulty:
      "'Disconnection' is not one of the blocking verbs the account rule recognises.",
  },
  {
    id: "TL-H-008",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "Refund of Rs 3,150 approved. Enter your card number and CVV on this page to receive it: http://refund.cedarbank.invalid/claim",
    rationale:
      "A refund to the original payment method never needs the card number and CVV re-entered on a link.",
    difficulty:
      "The host is plain and short, so the link heuristics add nothing; the credential request must carry the case.",
  },
  {
    id: "TL-H-009",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "I'm locked out of the family streaming profile. Forward me the recovery code the app just sent you.",
    rationale:
      "The recovery code resets access to the account, so forwarding it hands the account to the sender.",
    difficulty:
      "'Recovery code' is not in the credential vocabulary, and the message is framed as a family favour.",
  },
  {
    id: "TL-H-010",
    bucket: "scam",
    label: "scam",
    challenge: "parcel-delivery",
    message:
      "Your shipment is awaiting a redelivery payment of Rs 35. Complete payment within 12 hours at http://198.51.100.91/redeliver",
    rationale:
      "A small fee behind a bare-address payment page, with a deadline to discourage checking the carrier.",
  },
  {
    id: "TL-H-011",
    bucket: "scam",
    label: "scam",
    challenge: "prize-cashback-reward",
    message:
      "Your cashback of Rs 1,500 is about to expire. Claim it now at http://cashback-redeem.invalid",
    rationale:
      "Unexpected cashback with a countdown and a claim link that does not belong to any named provider.",
  },
  {
    id: "TL-H-012",
    bucket: "scam",
    label: "scam",
    challenge: "account-threat-urgency",
    message:
      "Your cloud storage account will be deleted unless you verify ownership within 30 days.",
    rationale:
      "Deletion pressure with a 30-day deadline and no route to verify that is independent of the sender.",
    difficulty:
      "'Deleted' is not a blocking verb in the rule's list, so only the deadline matches.",
  },
  {
    id: "TL-H-013",
    bucket: "scam",
    label: "scam",
    challenge: "account-threat-urgency",
    message:
      "FINAL NOTICE: your loan EMI is overdue. Download the notice at http://198.51.100.115/notice.pdf and pay within 24 hours to avoid legal action.",
    rationale:
      "A final-notice frame, a document hosted on a bare address, and a payment deadline to prevent verification.",
  },
  {
    id: "TL-H-014",
    bucket: "scam",
    label: "scam",
    challenge: "obfuscation-evasion",
    message:
      "Aapka Cedar Bank account band ho jayega. Turant code bhejiye jo abhi SMS aaya hai.",
    rationale:
      "The message says the account will be closed and asks the reader to send the code that just arrived by SMS.",
    difficulty:
      "Code-mixed Hindi/English wording is outside every English pattern, so no configured rule can match it.",
  },
  {
    id: "TL-H-015",
    bucket: "scam",
    label: "scam",
    challenge: "suspicious-link",
    message:
      "Guaranteed 18% monthly returns. Transfer funds today at http://198.51.100.77/invest — slots close at midnight.",
    rationale:
      "An impossible guaranteed return, a bare-address payment page, and a closing window.",
    difficulty:
      "No urgency keyword matches ('today' and 'midnight' are not in the pattern list), leaving only the link weight.",
  },
  {
    id: "TL-H-016",
    bucket: "scam",
    label: "scam",
    challenge: "prize-cashback-reward",
    message:
      "You are one of 12 winners in the national mobile draw. Pay the processing fee of Rs 650 to release your Rs 50,000 prize.",
    rationale:
      "A prize that cannot be released without an upfront fee is the classic advance-fee structure.",
    difficulty:
      "The only matching term is 'prize'; 'winners' does not match the singular pattern, and there is no deadline.",
  },
  {
    id: "TL-H-017",
    bucket: "scam",
    label: "scam",
    challenge: "bank-kyc-impersonation",
    message:
      "KYC incomplete: your account will be closed in 24 hours. Click here to update: https://cedarbank-kyc.invalid/form",
    rationale:
      "A closure threat, a click prompt and a KYC form on a lookalike-bank address.",
  },
  {
    id: "TL-H-018",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "For cash-on-delivery orders, share the OTP sent to your phone with the delivery partner at the door.",
    rationale:
      "Handing the one-time password to a courier authorises something other than the delivery; the code must stay with the customer.",
  },
  {
    id: "TL-H-019",
    bucket: "scam",
    label: "scam",
    challenge: "mixed-signals",
    message:
      "Hi, I'm in a meeting and can't talk. Buy four Rs 1,000 gift cards and send me the codes urgently. I'll reimburse you today.",
    rationale:
      "An authority figure who cannot talk, an unusual purchase, and a request for the redemption codes. Reimbursement is promised, not documented.",
    difficulty:
      "The message contains no threat, link or credential term; only 'urgently' matches, and the gift-card wording is treated as an ordinary reward mention.",
  },
  {
    id: "TL-H-020",
    bucket: "scam",
    label: "scam",
    challenge: "obfuscation-evasion",
    message:
      "Hello, this is the client records team at Cedar Bank. As part of our annual account review we are confirming that the contact details on file are still accurate. Most customers complete this in under a minute. To keep your profile active, reply with your date of birth and the last four digits of your card. No payment or password is needed for this step, and the review closes on 31 October.",
    rationale:
      "A calm, procedural review that ends with a request for identity data by reply. The assurance that no password is needed makes the request feel safer than it is.",
    difficulty:
      "The request sits at the end of a long message with no urgency words and no link, so length and tone hide it.",
  },
];
