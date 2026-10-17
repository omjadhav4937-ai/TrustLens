import type { EvaluationCase } from "../types";

/**
 * 10 context-dependent messages for the stress test.
 *
 * Each could be a normal process or a social-engineering approach depending on
 * facts the text does not contain. They stay outside the binary metrics.
 */
export const STRESS_AMBIGUOUS_CASES: EvaluationCase[] = [
  {
    id: "TL-C-051",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "I'm from card services. Send a photo of your card and I'll reverse the charge.",
    rationale:
      "Card services can reverse a charge, but they never need a card image to do it. The sender is unverified.",
    notes:
      "Depends on whether the recipient has an open dispute and can call the bank back on a published number.",
  },
  {
    id: "TL-C-052",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "Email a scan of your passport before your first day so payroll can set you up.",
    rationale:
      "Onboarding does collect identity documents, but an email request before day one is also a data-harvesting pattern.",
    notes:
      "Depends on whether the offer is verified and the request matches the employer's normal onboarding process.",
  },
  {
    id: "TL-C-053",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "Forward the recovery code so I can get into the shared admin account.",
    rationale:
      "A shared admin account may genuinely need recovery, but forwarding a recovery code is also how an outsider takes it over.",
    notes:
      "Depends on whether the sender is a known colleague and the account is really shared.",
  },
  {
    id: "TL-C-054",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "otp-credential-request",
    message:
      "The engineer on site will ask you to read the code from your meter app.",
    rationale:
      "Some meter processes use a code, but an unsolicited instruction to read a code to a visitor is a common pretext.",
    notes:
      "Depends on whether a visit was booked through the utility's own channel.",
  },
  {
    id: "TL-C-055",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "otp-credential-request",
    message:
      "Send the six-digit code from your app to confirm the courier handover.",
    rationale:
      "A handover code can be genuine, but an app-generated login code should not be sent to the courier.",
    notes:
      "Depends on whether a delivery is expected and what the app says the code is for.",
  },
  {
    id: "TL-C-056",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "Our support agent will call and ask for a photo of your card.",
    rationale:
      "A support process and a card-photo request are both plausible individually, but no legitimate support flow needs the image.",
    notes:
      "Depends on whether the call was initiated by the customer and whether the number is the bank's published one.",
  },
  {
    id: "TL-C-057",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "Text me the backup code for the team account; I'll reset it afterwards.",
    rationale:
      "A team account may need recovery, but a backup code sent by text is a durable credential.",
    notes:
      "Depends on whether the sender is verified and whether the team account is genuinely shared.",
  },
  {
    id: "TL-C-058",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "The recruiter wants a photo of your ID card before the interview.",
    rationale:
      "Recruiters do verify identity, but before an interview and by photo is also a common collection pattern.",
    notes:
      "Depends on whether the recruiter and the role can be verified independently.",
  },
  {
    id: "TL-C-059",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "otp-credential-request",
    message:
      "Read the code on your screen to the person on the phone.",
    rationale:
      "A support call may need a code read back, but reading a login code to a caller hands over access.",
    notes:
      "Depends on who initiated the call and whether the recipient recognises the caller.",
  },
  {
    id: "TL-C-060",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "Upload your card photo to the onboarding portal when HR asks.",
    rationale:
      "An onboarding portal can be genuine, but a card image is not normally required for HR onboarding.",
    notes:
      "Depends on whether the portal is the employer's official system and why a card image is needed.",
  },
];
