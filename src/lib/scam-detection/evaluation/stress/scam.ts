import type { EvaluationCase } from "../types";

/**
 * 20 credential-focused scam cases for the Candidate A stress test.
 *
 * Labels and rationales were written before the cases were scored. The set
 * deliberately includes constructions the candidate may miss; a miss is
 * recorded as a miss rather than removed. All content is synthetic and every
 * host is reserved.
 */
export const STRESS_SCAM_CASES: EvaluationCase[] = [
  {
    id: "TL-C-001",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "Cedar Bank alert: send a photo of your debit card so we can verify the refund destination.",
    rationale:
      "A refund does not need a card photograph. The image carries the number, expiry and CVV.",
  },
  {
    id: "TL-C-002",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "Please share a picture of your credit card and your Aadhaar card for the upgrade.",
    rationale:
      "An upgrade request that collects both a payment card image and an identity document.",
  },
  {
    id: "TL-C-003",
    bucket: "scam",
    label: "scam",
    challenge: "suspicious-link",
    message:
      "Upload a scan of the front and back of your card at http://198.51.100.23/card to finish verification.",
    rationale:
      "A card scan requested through a bare-address page is a credential-collection flow, not a verification.",
  },
  {
    id: "TL-C-004",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "We need a photo of your card before we can release the refund.",
    rationale:
      "A refund claim used to obtain a card image; no legitimate refund process requires one.",
    difficulty:
      "The request is phrased with 'need', not one of Candidate A's transfer verbs.",
  },
  {
    id: "TL-C-005",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "Send a picture of the card you used, plus your ID, to this chat.",
    rationale:
      "A chat participant asks for the card and identity document together, which enables card fraud and impersonation.",
  },
  {
    id: "TL-C-006",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "Send over your backup code so I can restore the account.",
    rationale:
      "A backup code is a recovery credential; sharing it transfers account access.",
  },
  {
    id: "TL-C-007",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "Read the recovery code to me when it appears.",
    rationale:
      "Reading a recovery code aloud discloses it to the caller, who can then reset the account.",
  },
  {
    id: "TL-C-008",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "Tell me the account's backup codes before the old phone is wiped.",
    rationale:
      "The old-phone pretext is used to collect all backup codes at once.",
  },
  {
    id: "TL-C-009",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "I need the recovery key tied to your account.",
    rationale:
      "A recovery key is equivalent to account access and is not something a support agent needs.",
    difficulty:
      "Candidate A recognises recovery codes but not a recovery key.",
  },
  {
    id: "TL-C-010",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "Send the six-digit code from your app to unlock the transfer.",
    rationale:
      "The app-generated code is the second factor for the transfer; sending it authorises the sender's action.",
  },
  {
    id: "TL-C-011",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "Share the code displayed on your screen with our agent.",
    rationale:
      "A support agent does not need the code displayed on the customer's own screen.",
  },
  {
    id: "TL-C-012",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "Forward me the 4-digit code that just arrived by SMS.",
    rationale:
      "A code delivered to the recipient's phone is being redirected to the sender.",
  },
  {
    id: "TL-C-013",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "The verification code in your authenticator — send it to this number.",
    rationale:
      "Authenticator codes are login credentials; sending one to a supplied number hands over access.",
  },
  {
    id: "TL-C-014",
    bucket: "scam",
    label: "scam",
    challenge: "obfuscation-evasion",
    message:
      "Don't keep the six-digit code from the app to yourself; forward it.",
    rationale:
      "The 'don't keep it to yourself' phrasing is a request to disclose a code, despite sounding like advice.",
    difficulty:
      "The clause contains the protective phrase 'keep … to yourself', which suppresses both candidates.",
  },
  {
    id: "TL-C-015",
    bucket: "scam",
    label: "scam",
    challenge: "obfuscation-evasion",
    message:
      "You were told never to share codes, but I need the one on your screen.",
    rationale:
      "A security warning is quoted and then contradicted by a request for the code.",
    difficulty:
      "The warning wording suppresses screening, while the actual request uses 'need' rather than a transfer verb.",
  },
  {
    id: "TL-C-016",
    bucket: "scam",
    label: "scam",
    challenge: "obfuscation-evasion",
    message:
      "Hello, this is the disbursement desk at Northline Finance. Your loan has been approved and the funds are held pending one confirmation. The account details on file match our records, so no documents are required today. To release the transfer before the cut-off, reply with the six-digit code shown in your app.",
    rationale:
      "A calm, procedural loan message whose only action is to disclose the app code that releases the transfer.",
    difficulty:
      "The request is at the end of a long message with no urgency keyword or link.",
  },
  {
    id: "TL-C-017",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "WhatsApp me the code your app generates.",
    rationale:
      "The message asks for an app-generated login code through a chat channel.",
    difficulty:
      "The channel name is used as the verb, which neither candidate recognises.",
  },
  {
    id: "TL-C-018",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "Relay the verification code from your app to this number.",
    rationale:
      "Relaying the code is disclosure, regardless of the verb chosen.",
    difficulty:
      "'Relay' is not in either candidate's disclosure-verb list.",
  },
  {
    id: "TL-C-019",
    bucket: "scam",
    label: "scam",
    challenge: "obfuscation-evasion",
    message:
      "App me jo code dikh raha hai use bhej do.",
    rationale:
      "The Hindi/English message says to send the code that is visible in the app.",
    difficulty:
      "The transliterated verb 'bhej do' is not in Candidate B's small Hinglish token list.",
  },
  {
    id: "TL-C-020",
    bucket: "scam",
    label: "scam",
    challenge: "obfuscation-evasion",
    message:
      "Send me the numbers your authenticator shows.",
    rationale:
      "The numbers displayed by an authenticator are the one-time code; sending them defeats the second factor.",
    difficulty:
      "The message says 'numbers', not 'code', so neither candidate's code term matches.",
  },
];
