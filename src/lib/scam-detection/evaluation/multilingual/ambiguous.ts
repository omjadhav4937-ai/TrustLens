import type { MultilingualCase } from "./types";

/**
 * Eight context-dependent multilingual examples, two per variety.
 *
 * Each one asks for something that is normal inside one relationship and a
 * scam outside it. They are reported separately and never enter the binary
 * metrics.
 */
export const MULTILINGUAL_AMBIGUOUS_CASES: MultilingualCase[] = [
  {
    id: "TL-M-053",
    language: "en",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "Please send me the code you just received so I can finish setting up the account.",
    rationale:
      "Could be a colleague helping with a setup, or an account takeover; the relationship is missing.",
    notes: "Whether the sender is known and authorised to complete the setup.",
  },
  {
    id: "TL-M-054",
    language: "en",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "Your account is under review. Reply to this message with your registered mobile number.",
    rationale:
      "A plausible bank process and a plausible pretext for collecting a number; the sender is unknown.",
    notes: "Whether the message came from the bank's own verified channel.",
  },
  {
    id: "TL-M-055",
    language: "hi",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message: "मुझे लॉगिन पूरा करने के लिए आपको मिला कोड भेज दें।",
    rationale:
      "A Hindi request for a received code that is normal between colleagues and hostile from a stranger.",
    notes: "Who is asking, and whether they are entitled to complete the login.",
  },
  {
    id: "TL-M-056",
    language: "hi",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "आपका खाता समीक्षा में है। अपना पंजीकृत मोबाइल नंबर इस संदेश में भेजें।",
    rationale:
      "An account-review message asking for a registered number; the legitimacy depends on the sender.",
    notes: "Whether the sender is the bank and the review is real.",
  },
  {
    id: "TL-M-057",
    language: "mr",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message: "लॉगिन पूर्ण करण्यासाठी तुम्हाला आलेला कोड मला पाठवा.",
    rationale:
      "A Marathi request for a received code, ambiguous without knowing the relationship.",
    notes: "Whether the sender is the colleague they claim to be.",
  },
  {
    id: "TL-M-058",
    language: "mr",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "तुमचे खाते तपासणीत आहे. तुमचा नोंदणीकृत मोबाइल क्रमांक या संदेशात पाठवा.",
    rationale:
      "An account-review message asking for a registered number in Marathi; sender unknown.",
    notes: "Whether the request came through an official bank channel.",
  },
  {
    id: "TL-M-059",
    language: "hinglish",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "Login complete karne ke liye jo code aaya hai woh mujhe bhej do.",
    rationale:
      "A Hinglish request for a received code that is either teamwork or an OTP theft attempt.",
    notes: "Whether the requester is known and authorised.",
  },
  {
    id: "TL-M-060",
    language: "hinglish",
    bucket: "ambiguous",
    label: "ambiguous",
    challenge: "mixed-signals",
    message:
      "Aapka account review mein hai. Apna registered mobile number is message mein bhej do.",
    rationale:
      "A Hinglish account-review message asking for a registered number; the sender is unverified.",
    notes: "Whether the message is from the bank's official channel.",
  },
];
