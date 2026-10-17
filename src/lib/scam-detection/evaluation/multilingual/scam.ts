import type { MultilingualCase } from "./types";

/**
 * 24 suspicious multilingual examples, six per supported variety.
 *
 * Every message is synthetic. Hosts use `.invalid` / `.example`, phone numbers
 * are only ever "this number", and nothing here should be opened or resolved.
 *
 * Labels were written from the message content before the multilingual rules
 * were implemented, and were not changed afterwards.
 */
export const MULTILINGUAL_SCAM_CASES: MultilingualCase[] = [
  {
    id: "TL-M-001",
    language: "en",
    bucket: "scam",
    label: "scam",
    challenge: "account-threat-urgency",
    message:
      "Your account will be blocked today. Share your OTP immediately.",
    rationale:
      "An unsolicited blocking threat, a same-day deadline and a direct request for a one-time password.",
  },
  {
    id: "TL-M-002",
    language: "en",
    bucket: "scam",
    label: "scam",
    challenge: "bank-kyc-impersonation",
    message:
      "Dear customer, your debit card is suspended. Confirm your CVV and card number at https://verify-secure.example/pay within 2 hours.",
    rationale:
      "A card suspension claim, a short deadline and a request for card secrets through a sender-supplied link.",
  },
  {
    id: "TL-M-003",
    language: "en",
    bucket: "scam",
    label: "scam",
    challenge: "prize-cashback-reward",
    message:
      "Congratulations! You have won a Rs 25,000 shopping voucher. Claim your reward now at https://gift-claim.invalid/win.",
    rationale:
      "An unexpected prize with a claim link and a deadline-style \"now\", in the classic advance-fee shape.",
  },
  {
    id: "TL-M-004",
    language: "en",
    bucket: "scam",
    label: "scam",
    challenge: "suspicious-link",
    message:
      "Final warning: your KYC is incomplete. Click here to update or your account will be closed permanently.",
    rationale:
      "A final-warning deadline, a click-through instruction and a permanent closure threat.",
  },
  {
    id: "TL-M-005",
    language: "en",
    bucket: "scam",
    label: "scam",
    challenge: "parcel-delivery",
    message:
      "We could not deliver your parcel. Pay the Rs 49 redelivery fee at https://parcel-pay.invalid/track today.",
    rationale:
      "A delivery failure used to extract a small payment through a lookalike tracking address.",
  },
  {
    id: "TL-M-006",
    language: "en",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "Your UPI PIN is required to reverse a failed transaction. Tell our support agent the PIN immediately.",
    rationale:
      "A reversal story is used to ask for a transaction PIN, which no support agent needs.",
  },

  {
    id: "TL-M-007",
    language: "hi",
    bucket: "scam",
    label: "scam",
    challenge: "account-threat-urgency",
    message: "आपका खाता आज बंद कर दिया जाएगा। अपना OTP तुरंत बताएं।",
    rationale:
      "Devanagari message combining an account-closure threat with an immediate request for the OTP.",
  },
  {
    id: "TL-M-008",
    language: "hi",
    bucket: "scam",
    label: "scam",
    challenge: "bank-kyc-impersonation",
    message:
      "प्रिय ग्राहक, आपका KYC अपूर्ण है। 24 घंटे के भीतर लिंक पर क्लिक करें और अपना पासवर्ड दर्ज करें।",
    rationale:
      "A KYC deadline, a click instruction and a request to enter the account password.",
  },
  {
    id: "TL-M-009",
    language: "hi",
    bucket: "scam",
    label: "scam",
    challenge: "prize-cashback-reward",
    message:
      "बधाई हो! आपने 50,000 रुपये का इनाम जीता है। अपना पुरस्कार पाने के लिए यहाँ क्लिक करें।",
    rationale:
      "An unexpected Hindi prize announcement that routes the reader to a link to collect it.",
  },
  {
    id: "TL-M-010",
    language: "hi",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "आपका डेबिट कार्ड निलंबित कर दिया गया है। कार्ड नंबर और CVV तुरंत साझा करें।",
    rationale:
      "A suspension claim followed by a direct request for the card number and CVV.",
  },
  {
    id: "TL-M-011",
    language: "hi",
    bucket: "scam",
    label: "scam",
    challenge: "account-threat-urgency",
    message:
      "अंतिम चेतावनी: आपका बिजली कनेक्शन आज काट दिया जाएगा। तुरंत इस नंबर पर भुगतान करें।",
    rationale:
      "A utility disconnection threat, a same-day deadline and a payment demand to an unknown number.",
  },
  {
    id: "TL-M-012",
    language: "hi",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "आपके खाते में संदिग्ध गतिविधि मिली है। सत्यापन के लिए अपना पिन और ओटीपी भेजें।",
    rationale:
      "A suspicious-activity story used to ask for both the PIN and the OTP in Devanagari.",
  },

  {
    id: "TL-M-013",
    language: "mr",
    bucket: "scam",
    label: "scam",
    challenge: "account-threat-urgency",
    message: "तुमचे खाते आज बंद केले जाईल. तुमचा OTP लगेच सांगा.",
    rationale:
      "Marathi account-closure threat with an immediate request to disclose the OTP.",
  },
  {
    id: "TL-M-014",
    language: "mr",
    bucket: "scam",
    label: "scam",
    challenge: "bank-kyc-impersonation",
    message:
      "प्रिय ग्राहक, तुमचे KYC अपूर्ण आहे. 24 तासांत लिंकवर क्लिक करा आणि तुमचा पासवर्ड टाका.",
    rationale:
      "A KYC deadline, a link click and a request to enter the password, written in Marathi.",
  },
  {
    id: "TL-M-015",
    language: "mr",
    bucket: "scam",
    label: "scam",
    challenge: "prize-cashback-reward",
    message:
      "अभिनंदन! तुम्ही 50,000 रुपयांचे बक्षीस जिंकले आहे. बक्षीस मिळवण्यासाठी येथे क्लिक करा.",
    rationale:
      "An unexpected Marathi prize claim that asks the reader to click to collect it.",
  },
  {
    id: "TL-M-016",
    language: "mr",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "तुमचे डेबिट कार्ड निलंबित केले आहे. कार्ड क्रमांक आणि CVV लगेच शेअर करा.",
    rationale:
      "A card suspension claim and a direct Marathi request for the card number and CVV.",
  },
  {
    id: "TL-M-017",
    language: "mr",
    bucket: "scam",
    label: "scam",
    challenge: "account-threat-urgency",
    message:
      "शेवटची चेतावनी: तुमचे वीज कनेक्शन आज तोडले जाईल. लगेच पैसे भरा.",
    rationale:
      "A final-warning disconnection threat with an immediate demand for payment.",
  },
  {
    id: "TL-M-018",
    language: "mr",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "तुमच्या खात्यात संशयास्पद व्यवहार आढळला. पडताळणीसाठी तुमचा पिन आणि ओटीपी पाठवा.",
    rationale:
      "A suspicious-transaction story used to request the PIN and OTP in Marathi.",
  },

  {
    id: "TL-M-019",
    language: "hinglish",
    bucket: "scam",
    label: "scam",
    challenge: "account-threat-urgency",
    message: "Aaj tumhara account block ho jayega. Apna OTP turant share karo.",
    rationale:
      "Hinglish account-blocking threat with an immediate OTP request.",
  },
  {
    id: "TL-M-020",
    language: "hinglish",
    bucket: "scam",
    label: "scam",
    challenge: "bank-kyc-impersonation",
    message:
      "Dear customer, aapka KYC pending hai. 24 ghante mein link par click karo aur password daal do.",
    rationale:
      "A KYC deadline, a link click and a password request in mixed Hindi-English.",
  },
  {
    id: "TL-M-021",
    language: "hinglish",
    bucket: "scam",
    label: "scam",
    challenge: "prize-cashback-reward",
    message:
      "Badhai ho! Aapne Rs 50,000 ka inaam jeeta hai. Claim karne ke liye yahan click karo.",
    rationale:
      "An unexpected Hinglish prize announcement with a claim link.",
  },
  {
    id: "TL-M-022",
    language: "hinglish",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "Aapka debit card suspend ho gaya hai. Card number aur CVV turant bhejo.",
    rationale:
      "A card suspension claim and an immediate request for card details in Hinglish.",
  },
  {
    id: "TL-M-023",
    language: "hinglish",
    bucket: "scam",
    label: "scam",
    challenge: "account-threat-urgency",
    message:
      "Last warning: aapka electricity connection aaj kat jayega. Turant is number par payment karo.",
    rationale:
      "A utility disconnection threat with a same-day deadline and a payment demand.",
  },
  {
    id: "TL-M-024",
    language: "hinglish",
    bucket: "scam",
    label: "scam",
    challenge: "otp-credential-request",
    message:
      "Aapke account mein suspicious activity mili hai. Verification ke liye apna PIN aur OTP bhej do.",
    rationale:
      "A suspicious-activity story used to request a PIN and OTP in Hinglish.",
  },
];
