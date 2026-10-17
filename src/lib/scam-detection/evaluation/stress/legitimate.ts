import type { EvaluationCase } from "../types";

/**
 * 30 legitimate messages for the Candidate A stress test.
 *
 * These are deliberately close to the candidate's vocabulary: password setup,
 * in-app code entry, recovery-code storage, card photos mentioned without a
 * disclosure request, and card wording that includes a negation. Some are
 * expected to expose false positives; they are kept as labelled.
 */
export const STRESS_LEGITIMATE_CASES: EvaluationCase[] = [
  {
    id: "TL-C-021",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "Welcome to Cedar Bank. Create a password and confirm it on the next screen.",
    rationale:
      "The customer is choosing their own password inside the bank's setup flow, not disclosing one.",
    difficulty:
      "The shipped credential rule already flags 'confirm … password'; this case records that baseline false positive.",
  },
  {
    id: "TL-C-022",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "Enter the six-digit code shown in the app to finish signing in.",
    rationale:
      "An instruction to type an app code into the service itself, with no request to disclose it.",
  },
  {
    id: "TL-C-023",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "Type the verification code from your authenticator into the field.",
    rationale:
      "The code stays inside the login flow; 'type' is not a disclosure request.",
  },
  {
    id: "TL-C-024",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "Store your backup codes in the password manager, and never share them with anyone.",
    rationale:
      "Storage advice plus an explicit warning. Nothing is asked of the reader.",
  },
  {
    id: "TL-C-025",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "Keep your recovery codes offline and private.",
    rationale:
      "A protective instruction about where to keep recovery codes.",
  },
  {
    id: "TL-C-026",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "Upload a photo of your passport in the secure portal to complete KYC.",
    rationale:
      "A known provider's in-app document upload. The file goes to the service, not to a person in the chat.",
    difficulty:
      "Candidate B treats a passport image as a credential; the portal wording is not the exact in-app guard phrase.",
  },
  {
    id: "TL-C-027",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "Take a photo of your card for your records, but never send it to anyone.",
    rationale:
      "The card image is for the customer's own records, and sending it is explicitly forbidden.",
  },
  {
    id: "TL-C-028",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "Keep a photo of your insurance card in your wallet for emergencies.",
    rationale:
      "A storage suggestion with no request to send the image anywhere.",
  },
  {
    id: "TL-C-029",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "Send a photo of your receipt, not your card.",
    rationale:
      "Support asks for the receipt and explicitly excludes the card. The request is for the receipt.",
    difficulty:
      "The clause contains 'send', 'photo' and 'card', but the card is the object being excluded.",
  },
  {
    id: "TL-C-030",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "We do not need a photo of your card; a receipt is enough.",
    rationale:
      "A negated request clarifies that no card image is wanted.",
    difficulty:
      "Candidate B treats 'need' as a request even when it is negated.",
  },
  {
    id: "TL-C-031",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "Never send a photo of your card or ID to anyone, even someone who says they are from the bank.",
    rationale:
      "A direct privacy warning with no request to disclose anything.",
  },
  {
    id: "TL-C-032",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "Our staff will never ask for a card photo or a recovery code. If you receive such a request, report it in the app.",
    rationale:
      "A long security notice that names the exact credential shapes in order to warn against them.",
  },
  {
    id: "TL-C-033",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "Upload a card photo only if the bank's app asks for it during verification.",
    rationale:
      "Conditional guidance tied to the official app, not a request from the sender.",
    difficulty:
      "The in-app guard matches only 'in the app'; this wording says 'the bank's app asks'.",
  },
  {
    id: "TL-C-034",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "Send a photo of your card to yourself before travelling, so you can block it if it is lost.",
    rationale:
      "Travel advice to keep a copy for the cardholder; the recipient is the sender themselves.",
    difficulty:
      "The wording has a disclosure verb, an image noun and a card term, but no third party.",
  },
  {
    id: "TL-C-035",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "Card photos are not accepted by email; use the secure upload in the app.",
    rationale:
      "A policy notice steering customers to an official upload path.",
  },
  {
    id: "TL-C-036",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "The app will display a six-digit code; enter it to confirm the payment.",
    rationale:
      "The generated code is entered into the app that produced it.",
  },
  {
    id: "TL-C-037",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "Your one-time password is 550128. Do not share it with anyone.",
    rationale:
      "A genuine code delivery carrying the standard warning and making no request.",
  },
  {
    id: "TL-C-038",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "Read the code aloud once to check you have copied it correctly.",
    rationale:
      "A self-check instruction; the code is not being given to another person.",
  },
  {
    id: "TL-C-039",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "Forward this email to your accountant; the verification code is in the attached PDF.",
    rationale:
      "An internal hand-off of a document, with no code disclosure to a stranger.",
  },
  {
    id: "TL-C-040",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "Send us a message if the code does not arrive within a few minutes.",
    rationale:
      "Support contact instructions for a delivery problem, not a request for the code.",
  },
  {
    id: "TL-C-041",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "Reply with your order number so we can track the parcel.",
    rationale:
      "An order reference is not a credential, and the reply is optional support contact.",
  },
  {
    id: "TL-C-042",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "Please confirm your password by typing it again in the settings screen.",
    rationale:
      "A password confirmation inside the official settings screen; the password is not disclosed to a person.",
    difficulty:
      "The shipped rule flags 'confirm … password'; this is the baseline false positive, not a candidate match.",
  },
  {
    id: "TL-C-043",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "Your backup codes can be regenerated in settings if you lose them.",
    rationale:
      "A recovery-code management notice with no request to share anything.",
  },
  {
    id: "TL-C-044",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "You can share this document with your colleague after the review.",
    rationale:
      "A document-sharing permission, unrelated to authentication codes.",
  },
  {
    id: "TL-C-045",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "Read the privacy notice before uploading your documents.",
    rationale:
      "An instruction to review a policy, with no credential or image request.",
  },
  {
    id: "TL-C-046",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "Support may text you a code; enter it only in our app.",
    rationale:
      "A delivery explanation plus a safe-entry rule. The code is not to be shared.",
  },
  {
    id: "TL-C-047",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "The code shown in the app is for reference only. Do not share it.",
    rationale:
      "An explicit warning attached to a code mention, with no request.",
  },
  {
    id: "TL-C-048",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "We have mailed your replacement card; no photo is needed.",
    rationale:
      "A dispatch notice that explicitly says no image is required.",
  },
  {
    id: "TL-C-049",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "A photo of your passport is required for the visa interview; bring it in person.",
    rationale:
      "A document requirement handled in person, with no image sent by message.",
  },
  {
    id: "TL-C-050",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "Please read the code on the back of your card to verify the last four digits during the call.",
    rationale:
      "A telephone verification instruction that uses printed card data, not a card image or a one-time code.",
  },
];
