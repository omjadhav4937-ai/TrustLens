import type { EvaluationCase } from "../types";

/**
 * 25 synthetic edge cases.
 *
 * These are the hardest messages in the collection. Each one carries a definite
 * label where the text supports one, and a `difficulty` note explaining what
 * makes it hard. Being difficult is not itself a label: a message is never filed
 * as legitimate merely because the detector struggles with it.
 */
export const EDGE_CASE_CASES: EvaluationCase[] = [
  {
    id: "TL-E-001",
    bucket: "edge-case",
    label: "scam",
    challenge: "obfuscation-evasion",
    message:
      "Hi, this is the reconciliation desk. Kindly send the six-digit code shown in your app so we can release the transfer.",
    rationale:
      "An unverifiable internal desk asks for the code that authorises a transfer. Nothing about a legitimate reconciliation requires the customer's code.",
    difficulty:
      "The request never says 'OTP' or 'one-time password', so the credential rule has no listed term to match, and there is no deadline or link.",
  },
  {
    id: "TL-E-002",
    bucket: "edge-case",
    label: "scam",
    challenge: "obfuscation-evasion",
    message:
      "Your 0TP expires in 10 minutes. Send it to this number to keep your account active.",
    rationale:
      "A disguised request for the login code, with a deadline to stop the recipient checking.",
    difficulty:
      "The character-substituted '0TP' does not match the word-boundary pattern, so only the deadline is visible to the engine.",
  },
  {
    id: "TL-E-003",
    bucket: "edge-case",
    label: "scam",
    challenge: "obfuscation-evasion",
    message:
      "Courier here. Share the PIN code you received on your phone so I can mark the parcel delivered.",
    rationale:
      "A courier has no reason to receive a code sent to the customer's phone; the wording is engineered to sound postal.",
    difficulty:
      "The rule deliberately exempts 'PIN code' to avoid flagging postal codes, and this message borrows that exact phrase.",
  },
  {
    id: "TL-E-004",
    bucket: "edge-case",
    label: "scam",
    challenge: "obfuscation-evasion",
    message:
      "For your safety, never share your OTP with anyone. To verify this delivery, reply with the OTP you received.",
    rationale:
      "The safety line is contradicted by the request in the next sentence. The request is what matters.",
    difficulty:
      "A protective warning is present, so the rule has to notice that a request elsewhere overrides it.",
  },
  {
    id: "TL-E-005",
    bucket: "edge-case",
    label: "scam",
    challenge: "obfuscation-evasion",
    message:
      "Hello, this is Meridian Logistics. Your consignment was scanned at the Bengaluru hub on 12 October and is awaiting address confirmation. The delivery window was 9 am to 1 pm and the agent could not complete the handover because the building gate was locked. To avoid the consignment returning to the origin facility, our dispatch team needs the six-digit verification code that was sent to the registered mobile number so the record can be updated and a new slot assigned.",
    rationale:
      "A long, plausible logistics narrative whose only actionable request is for the verification code, which no delivery process needs.",
    difficulty:
      "The request sits at the end of a long message with no urgency keyword, no link and no payment demand, so length and a calm tone hide the single warning sign.",
  },
  {
    id: "TL-E-006",
    bucket: "edge-case",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message: "Your one-time password is 331122. It is valid for the next 10 minutes.",
    rationale:
      "A plain delivery of a code the recipient requested. There is no request, link or threat.",
    difficulty:
      "Many real OTP messages omit the 'do not share' line that the credential rule treats as the mark of a genuine notice.",
  },
  {
    id: "TL-E-007",
    bucket: "edge-case",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "We blocked your card after three failed PIN attempts. Call the number on the back of your card to unblock it.",
    rationale:
      "A genuine protective action by a card issuer, pointing the customer at a number they already hold.",
    difficulty:
      "It uses both 'blocked' and 'PIN' without asking for either, which is the reverse of what the patterns expect.",
  },
  {
    id: "TL-E-008",
    bucket: "edge-case",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "Urgent: the OTP for the shared test account expired. I've regenerated it — check the team vault.",
    rationale:
      "A development team discussing a test credential in an internal channel. Nothing is asked of the reader.",
    difficulty:
      "It combines an urgency keyword with a credential term, the two strongest signals, while being entirely benign.",
  },
  {
    id: "TL-E-009",
    bucket: "edge-case",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "Please confirm the PIN code 560001 and the flat number before the courier is dispatched.",
    rationale:
      "Confirms a postal code, which is ordinary address data and not a banking secret.",
    difficulty:
      "The word 'PIN' appears next to a request verb; only the postal-code exemption keeps it out of the credential rule.",
  },
  {
    id: "TL-E-010",
    bucket: "edge-case",
    label: "scam",
    challenge: "mixed-signals",
    message:
      "Your consignment needs address confirmation. PIN code 400001 is on file. Share the OTP sent to your phone to reschedule.",
    rationale:
      "Postal detail lends credibility, but the OTP request is the real purpose and is never part of a reschedule.",
    difficulty:
      "A genuine-looking postal code and an unrelated credential request appear in the same message.",
  },
  {
    id: "TL-E-011",
    bucket: "edge-case",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "Congratulations to our team on winning the quarterly service award!",
    rationale:
      "An internal congratulation with no offer, no claim and no prize for the reader.",
    difficulty:
      "The prize rule keys on congratulation wording without requiring an offer to the recipient.",
  },
  {
    id: "TL-E-012",
    bucket: "edge-case",
    label: "ambiguous",
    challenge: "prize-cashback-reward",
    message:
      "You've won the community raffle! Your prize is a hamper. Collect it from the community hall on Saturday.",
    rationale:
      "If the recipient entered the raffle this is an ordinary notice, and collection in person asks for nothing. Without knowing about the raffle, the same words are prize bait.",
    difficulty:
      "The message contains a claim of a win and no request, so the text alone cannot separate a real raffle from bait.",
    notes:
      "The missing fact is whether the recipient entered a community raffle. It stays ambiguous rather than being assumed safe.",
  },
  {
    id: "TL-E-013",
    bucket: "edge-case",
    label: "scam",
    challenge: "suspicious-link",
    message:
      "Your invoice is ready: https://meridian.billing.secure-pay.invalid/inv/9921",
    rationale:
      "A payment address built from a stack of reassuring words, with no relationship to any named supplier.",
    difficulty:
      "The address raises only weak structural signals, so the link rule's single weight may not reach the Medium band.",
  },
  {
    id: "TL-E-014",
    bucket: "edge-case",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "Slides from the workshop: https://events.eu.docs.example.com/workshop/slides",
    rationale:
      "An ordinary documentation host with a deep subdomain, shared after an event.",
    difficulty:
      "A legitimate URL can look structurally similar to a tracking link, because both use several subdomains and a long host.",
  },
  {
    id: "TL-E-015",
    bucket: "edge-case",
    label: "scam",
    challenge: "suspicious-link",
    message: "Payment link: http://203.0.113.55/9f2a",
    rationale:
      "A payment page on a bare numeric address, with no merchant, invoice or amount named.",
    difficulty:
      "The only signal is the raw address, so the message cannot pass the Medium band even though the address is a strong indicator.",
  },
  {
    id: "TL-E-016",
    bucket: "edge-case",
    label: "scam",
    challenge: "suspicious-link",
    message:
      "Install the app to complete verification: http://198.51.100.77/app.apk within 2 hours or your account will be blocked.",
    rationale:
      "A side-loaded application plus a deadline and a blocking threat. Installing an APK from a message bypasses store checks.",
    difficulty:
      "The download instruction and the address are two different signals inside one rule, and the threat uses a phrasing that may not match the account pattern.",
  },
  {
    id: "TL-E-017",
    bucket: "edge-case",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "Urgent — Mum's discharge is at 2 pm today, can you bring the insurance papers?",
    rationale:
      "A real family errand with time pressure, no money transfer and no link.",
    difficulty:
      "The word 'urgent' is enough to trigger the urgency rule, which cannot tell personal urgency from manufactured pressure.",
  },
  {
    id: "TL-E-018",
    bucket: "edge-case",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "Your account will be suspended if re-KYC is not completed by 15 December. Visit your branch with ID proof.",
    rationale:
      "A genuine regulatory notice that asks the customer to attend a branch in person.",
    difficulty:
      "The suspension threat is real, so the account-threat pattern is right about the wording and wrong about the intent.",
  },
  {
    id: "TL-E-019",
    bucket: "edge-case",
    label: "scam",
    challenge: "obfuscation-evasion",
    message:
      "Kindly send a photo of the front and back of your card to verify your identity.",
    rationale:
      "A card image carries the number, expiry and CVV. No identity check needs a photograph of the card.",
    difficulty:
      "It asks for the card itself rather than any term in the credential list, so nothing matches.",
  },
  {
    id: "TL-E-020",
    bucket: "edge-case",
    label: "scam",
    challenge: "obfuscation-evasion",
    message: "Act now! Your wallet is about to be locked. Call us today.",
    rationale:
      "Manufactured urgency plus a threat to the wallet, with a callback number controlled by the sender.",
    difficulty:
      "The threat uses 'locked', which is not among the blocking verbs the account rule recognises.",
  },
  {
    id: "TL-E-021",
    bucket: "edge-case",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "Your password reset link expires in 15 minutes. If you did not request it, ignore this email.",
    rationale:
      "A reset the recipient initiated, with an expiry and a do-nothing path for anyone else.",
    difficulty:
      "It contains 'password' and 'expires', but no request verb, so only the urgency rule can fire.",
  },
  {
    id: "TL-E-022",
    bucket: "edge-case",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "Thanks for your order. To dispatch it, confirm your card number and CVV in this chat.",
    rationale:
      "A routine commerce opener used to ask for the full card details in a chat, which no checkout needs after an order.",
    difficulty:
      "The order context makes the request feel procedural, and the deadline and link are absent.",
  },
  {
    id: "TL-E-023",
    bucket: "edge-case",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "The client's demo OTP is 448210 — I've put it in the shared doc.",
    rationale:
      "An internal note about a demo credential for a test environment, not a live account secret.",
    difficulty:
      "A bare OTP mention is counted by design, and the message has no warning line to suppress it.",
  },
  {
    id: "TL-E-024",
    bucket: "edge-case",
    label: "scam",
    challenge: "suspicious-link",
    message:
      "Your PayPal account is limited. Verify at http://paypal-resolution.invalid/verify",
    rationale:
      "A brand name used on a host that is not the brand's published domain, with a verification prompt.",
    difficulty:
      "The lookalike check is the only matching signal; a limited single indicator may stay below Medium.",
  },
  {
    id: "TL-E-025",
    bucket: "edge-case",
    label: "legitimate",
    challenge: "false-positive-challenge",
    message:
      "Your subscription was cancelled as requested. You will retain access until 30 November.",
    rationale:
      "A cancellation confirmation for an action the recipient took.",
    difficulty:
      "A cancellation sentence matches the account-threat pattern even though nothing is being threatened.",
  },
];
