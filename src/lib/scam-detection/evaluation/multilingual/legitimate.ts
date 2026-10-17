import type { MultilingualCase } from "./types";

/**
 * 28 legitimate multilingual examples, seven per supported variety.
 *
 * Each one deliberately uses words the rules watch for — OTP, password, link,
 * account, verification code — without asking the reader to do anything unsafe.
 * They are the false-positive challenge for the multilingual patterns.
 */
export const MULTILINGUAL_LEGITIMATE_CASES: MultilingualCase[] = [
  {
    id: "TL-M-025",
    language: "en",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "Your bank sent a one-time password to your registered number. Never share this code with anyone.",
    rationale:
      "A genuine code delivery that names the credential and explicitly warns the reader not to share it.",
  },
  {
    id: "TL-M-026",
    language: "en",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "Hi Priya, I reset my account password yesterday. The new one is already in the password manager we share.",
    rationale:
      "A workplace note about a password reset that neither asks for the secret nor supplies a link.",
  },
  {
    id: "TL-M-027",
    language: "en",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "The verification code I requested has expired. I will generate a new one when I am back at my desk.",
    rationale:
      "A colleague describing an expired code they requested themselves; nothing is asked of the reader.",
  },
  {
    id: "TL-M-028",
    language: "en",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "Here is the link to the college timetable: https://college.example/timetable. Let me know if it does not open.",
    rationale:
      "An ordinary shared link on a reserved domain, with no pressure and no request for details.",
  },
  {
    id: "TL-M-029",
    language: "en",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "Our security workshop explains how scammers pressure people into sharing OTPs. Register through the official college portal.",
    rationale:
      "A scam-awareness notice that discusses OTP theft in order to prevent it.",
  },
  {
    id: "TL-M-030",
    language: "en",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "Your order has been delivered. The delivery photo is available in the app.",
    rationale: "A routine delivery confirmation with no link, fee or request.",
  },
  {
    id: "TL-M-031",
    language: "en",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "Your card ending 4821 was used for Rs 1,299 at a bookstore. If this was not you, call the number on the back of your card.",
    rationale:
      "A real transaction alert that routes the reader to a number they already hold, not one supplied in the message.",
  },

  {
    id: "TL-M-032",
    language: "hi",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "आपका OTP भेज दिया गया है। यह कोड किसी के साथ साझा न करें।",
    rationale:
      "A Hindi code delivery that names the OTP and warns against sharing it, without asking for anything.",
  },
  {
    id: "TL-M-033",
    language: "hi",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "मैंने कल अपना पासवर्ड बदल दिया है। नया पासवर्ड मेरे पास सुरक्षित है।",
    rationale:
      "A personal update about a password change with no request and no link.",
  },
  {
    id: "TL-M-034",
    language: "hi",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "मेरा सत्यापन कोड समाप्त हो गया है। मैं दफ्तर लौटकर नया कोड बनाऊंगा।",
    rationale:
      "A colleague describing their own expired verification code; the reader is asked for nothing.",
  },
  {
    id: "TL-M-035",
    language: "hi",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "कॉलेज का टाइम टेबल इस लिंक पर उपलब्ध है: https://college.example/timetable",
    rationale: "A plain Hindi message sharing an ordinary college link.",
  },
  {
    id: "TL-M-036",
    language: "hi",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "हमारी कार्यशाला में बताया जाएगा कि ठग OTP कैसे मांगते हैं। किसी को भी अपना OTP न बताएं।",
    rationale:
      "An awareness workshop notice that discusses OTP fraud and advises never sharing a code.",
  },
  {
    id: "TL-M-037",
    language: "hi",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "आपका पार्सल आज शाम तक पहुंच जाएगा। डिलीवरी की जानकारी ऐप में देखें।",
    rationale:
      "A routine delivery update that points at the official app and asks for nothing.",
  },
  {
    id: "TL-M-038",
    language: "hi",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "बैंक कभी फोन पर OTP नहीं मांगता। ऐसा कोई कॉल करे तो तुरंत काट दें।",
    rationale:
      "A bank security reminder that names the OTP only to say it is never requested by phone.",
  },

  {
    id: "TL-M-039",
    language: "mr",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "तुमचा OTP पाठवला आहे. हा कोड कोणालाही सांगू नका.",
    rationale:
      "A Marathi code delivery with an explicit instruction not to disclose it.",
  },
  {
    id: "TL-M-040",
    language: "mr",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "मी काल माझा पासवर्ड बदलला. नवीन पासवर्ड माझ्याकडे सुरक्षित आहे.",
    rationale:
      "A personal password-change note with no request and no link.",
  },
  {
    id: "TL-M-041",
    language: "mr",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "माझा पडताळणी कोड संपला आहे. कार्यालयात परतल्यावर नवीन कोड घेईन.",
    rationale:
      "A colleague describing an expired code they will replace themselves.",
  },
  {
    id: "TL-M-042",
    language: "mr",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "महाविद्यालयाचे वेळापत्रक या लिंकवर आहे: https://college.example/timetable",
    rationale: "An ordinary Marathi message sharing a college timetable link.",
  },
  {
    id: "TL-M-043",
    language: "mr",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "आमच्या कार्यशाळेत ठग OTP कसे मागतात हे सांगितले जाईल. तुमचा OTP कोणालाही देऊ नका.",
    rationale:
      "A Marathi awareness notice that discusses OTP fraud and warns against sharing.",
  },
  {
    id: "TL-M-044",
    language: "mr",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "तुमची पार्सल आज संध्याकाळपर्यंत पोहोचेल. माहिती ॲपमध्ये पाहा.",
    rationale: "A routine Marathi delivery update that points at the app.",
  },
  {
    id: "TL-M-045",
    language: "mr",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "बँक कधीही फोनवर OTP मागत नाही. असा कॉल आला तर लगेच काटा.",
    rationale:
      "A bank reminder that names the OTP only to say it is never requested by phone.",
  },

  {
    id: "TL-M-046",
    language: "hinglish",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "Aapka OTP bhej diya gaya hai. Yeh code kisi ke saath share mat karo.",
    rationale:
      "A Hinglish code delivery that explicitly says not to share the code and asks for nothing.",
  },
  {
    id: "TL-M-047",
    language: "hinglish",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "Maine kal apna password badal diya. Naya password mere paas safe hai.",
    rationale:
      "A personal Hinglish password-change note with no request and no link.",
  },
  {
    id: "TL-M-048",
    language: "hinglish",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "ordinary-conversation",
    message:
      "Mera verification code expire ho gaya hai. Office wapas jaakar naya code banaunga.",
    rationale:
      "A colleague describing their own expired verification code.",
  },
  {
    id: "TL-M-049",
    language: "hinglish",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "College ka timetable is link par hai: https://college.example/timetable",
    rationale: "A plain Hinglish message sharing an ordinary college link.",
  },
  {
    id: "TL-M-050",
    language: "hinglish",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "Hamari workshop mein batayenge ki scammers OTP kaise maangte hain. Apna OTP kisi ko na do.",
    rationale:
      "An awareness workshop notice that discusses OTP theft and warns against sharing.",
  },
  {
    id: "TL-M-051",
    language: "hinglish",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "no-suspicious-indicators",
    message:
      "Aapka parcel aaj shaam tak pahunch jayega. Delivery ki jaankari app mein dekho.",
    rationale: "A routine Hinglish delivery update that points at the app.",
  },
  {
    id: "TL-M-052",
    language: "hinglish",
    bucket: "legitimate",
    label: "legitimate",
    challenge: "legitimate-security-warning",
    message:
      "Bank kabhi phone par OTP nahi maangta. Aisa call aaye to turant cut kar do.",
    rationale:
      "A bank reminder that names the OTP only to say it is never requested by phone.",
  },
];
