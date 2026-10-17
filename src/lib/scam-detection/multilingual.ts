/**
 * Contextual indicators for Hindi, Marathi and Hinglish.
 *
 * These patterns are merged into the five existing rules. No rule, weight or
 * threshold is added or changed: a Hindi account-closure threat contributes the
 * same 15 points an English one does, and a rule still contributes at most once.
 *
 * ## Design notes
 *
 * - **No bare keyword translation.** Each pattern is a request, threat, bait or
 *   warning shape. A message that merely says "bank", "OTP", "account" or
 *   "link" is not counted. The credential rule keeps its existing split between
 *   a standalone secret (OTP, CVV, PIN) and a weaker term that only counts next
 *   to a request verb.
 * - **Unicode-safe boundaries.** JavaScript's `\b` is ASCII-only, so a
 *   Devanagari word has no word boundary at all. Every pattern below uses
 *   letter/mark lookarounds instead, which also stops a match from starting in
 *   the middle of a longer word.
 * - **Offsets stay intact.** Patterns run against the same normalised string as
 *   the English rules, so every range points into the original message and can
 *   be highlighted without translation or remapping.
 * - **No translation.** Nothing here calls a translation API, a model or the
 *   network. These are short, hand-written lists covering the varieties named
 *   in the product documentation, and they do not claim full coverage.
 */

const LEFT = String.raw`(?<![\p{L}\p{M}])`;
const RIGHT = String.raw`(?![\p{L}\p{M}])`;

/** Wraps an alternation in Unicode-aware letter boundaries. */
function phrase(source: string): RegExp {
  return new RegExp(`${LEFT}(?:${source})${RIGHT}`, "iu");
}

/* ------------------------------------------------------------------ */
/* Urgency and pressure                                                */
/* ------------------------------------------------------------------ */

export const MULTILINGUAL_URGENCY_PATTERNS: RegExp[] = [
  // Hindi: immediately, quickly, before it is too late, final warning.
  phrase(
    String.raw`तुरंत|तुरन्त|तत्काल|जल्दी|जल्द|फौरन|अभी|बिना\s+देर|देर\s+न\s+करें|जल्दी\s+करें|अंतिम\s+चेतावनी|अंतिम\s+मौका|सीमित\s+समय|समय\s+समाप्त`,
  ),
  // Marathi: immediately, now, final warning, do not delay.
  phrase(
    String.raw`तातडीने|लगेच|आत्ता|शेवटची\s+चेतावनी|शेवटची\s+संधी|मर्यादित\s+वेळ|उशीर\s+करू\s+नका|लवकर\s+करा|मुदत\s+संपली`,
  ),
  // Hinglish urgency words that are not ordinary English tokens.
  phrase(
    String.raw`turant|jaldi|foran|abhi|der\s+mat\s+karo|jaldi\s+karo|seemit\s+samay|samay\s+khatam|aaj\s+hi`,
  ),
  // Time limits written with Devanagari digits, e.g. "२४ तासांत".
  /(?:^|[^\u0900-\u097F])[0-9०-९]+\s*(?:तासांत|तासात|घंटे|घंटों|घंट्यात|दिवसांत|दिनों)(?=$|[^\u0900-\u097F])/u,
  // Hinglish time limits, e.g. "24 ghante mein".
  /\b[0-9]+\s*(?:ghante|ghanta|din)\s+(?:mein|me)\b/i,
];

/* ------------------------------------------------------------------ */
/* Account blocking or suspension                                      */
/* ------------------------------------------------------------------ */

const DEVANAGARI_ACCOUNT =
  String.raw`खाता|खाते|खात्यात|खात्याचे|अकाउंट|कार्ड|सिम|सेवा|कनेक्शन|पॉलिसी|वॉलेट`;
const DEVANAGARI_BLOCK =
  String.raw`बंद|ब्लॉक|निलंबित|सस्पेंड|फ्रीज|समाप्त|काट\s+दिया(?:\s+जाएगा)?|तोडले(?:\s+जाईल)?|काट\s+दें`;

export const MULTILINGUAL_ACCOUNT_THREAT_PATTERNS: RegExp[] = [
  new RegExp(
    String.raw`${LEFT}(?:${DEVANAGARI_ACCOUNT})${RIGHT}[^.!?।\n]{0,40}?${LEFT}(?:${DEVANAGARI_BLOCK})${RIGHT}`,
    "iu",
  ),
  new RegExp(
    String.raw`${LEFT}(?:${DEVANAGARI_BLOCK})${RIGHT}[^.!?।\n]{0,40}?${LEFT}(?:${DEVANAGARI_ACCOUNT})${RIGHT}`,
    "iu",
  ),
  // Hinglish account nouns and blocking outcomes.
  /\b(?:account|khata|khaata|card|sim|connection|service|policy|wallet)\b[^.!?।\n]{0,40}?\b(?:band|block(?:ed)?|suspend(?:ed)?|frozen|kat|cut|closed?)\b/i,
  /\b(?:band|block(?:ed)?|suspend(?:ed)?|frozen|kat|cut|closed?)\b[^.!?।\n]{0,40}?\b(?:account|khata|khaata|card|sim|connection|service|policy|wallet)\b/i,
  /\b(?:band|block)\s+ho\s+(?:jaye?ga|gaya|gayi|raha)\b/i,
  /\b(?:band|block)\s+kar\s+(?:diya|dijiye|denge)\s+(?:jaye?ga|jaayega)?\b/i,
];

/* ------------------------------------------------------------------ */
/* Suspicious-link calls to action                                     */
/* ------------------------------------------------------------------ */

export const MULTILINGUAL_LINK_CTA_PATTERNS: RegExp[] = [
  phrase(
    String.raw`लिंक\s+पर\s+क्लिक\s+करें|यहाँ\s+क्लिक\s+करें|यहां\s+क्लिक\s+करें|लिंक\s+पर\s+जाएं|लिंक\s+खोलें|नीचे\s+दिए\s+गए\s+लिंक|वेबसाइट\s+पर\s+जाएं|ऐप\s+डाउनलोड\s+करें|पोर्टल\s+पर\s+जाएं`,
  ),
  phrase(
    String.raw`लिंकवर\s+क्लिक\s+करा|येथे\s+क्लिक\s+करा|लिंक\s+उघडा|खालील\s+लिंक|वेबसाइटला\s+भेट\s+द्या|ॲप\s+डाउनलोड\s+करा`,
  ),
  /\b(?:link|website|app)\s+(?:par|pe)\s+(?:click|kholo|jao|jaayein|download)\s+(?:karo|karein|kijiye|kar)\b/i,
  /\b(?:yahan|yaha|neeche|niche)\s+(?:click|diya\s+gaya\s+link)\b[^.!?।\n]{0,20}?\b(?:karo|karein|kijiye)?\b/i,
  /\b(?:link\s+kholo|app\s+download\s+karo|website\s+par\s+jao)\b/i,
];

/* ------------------------------------------------------------------ */
/* Credential requests                                                 */
/* ------------------------------------------------------------------ */

/**
 * Secrets that should never be requested by message, in Devanagari. These are
 * checked on their own, because naming them at all is unusual.
 *
 * `पिन` / `पिन` with a following कोड is left out: a postal PIN code in a
 * delivery message is not a banking PIN. The same exemption exists in English.
 */
export const MULTILINGUAL_STANDALONE_CREDENTIAL_PATTERNS: RegExp[] = [
  phrase(String.raw`ओटीपी|ओ\.टी\.पी\.?|सीवीव्ही|सीव्हीव्ही|सीवीवी|एम-?पिन|यूपीआई\s+पिन`),
  new RegExp(`${LEFT}पिन(?!\\s*कोड)${RIGHT}`, "iu"),
];

/** Credential nouns, weak on their own, in both scripts and Hinglish. */
const CREDENTIAL_NOUNS = String.raw`ओटीपी|वन[- ]?टाइम\s+पासवर्ड|सीवीव्ही|सीव्हीव्ही|सीवीवी|पिन|पासवर्ड|पासकोड|सत्यापन\s+कोड|सुरक्षा\s+कोड|रिकव्हरी\s+कोड|बैकअप\s+कोड|बॅकअप\s+कोड|कोड|कार्ड\s+नंबर|कार्ड\s+क्रमांक|कार्ड\s+विवरण|कार्ड\s+तपशील|आधार\s+नंबर|आधार\s+क्रमांक|जन्म\s+तिथि|जन्मतारीख|otp|one[\\s-]?time\\s+password|cvv|cvc|pin|password|passcode|code|card\\s+number|card\\s+details|verification\\s+code|recovery\\s+code|backup\\s+code|card\\s+cvv`;

const REQUEST_VERBS_DEVANAGARI = String.raw`साझा\s+करें|साझा\s+करो|भेजें|भेजो|भेजिए|बताएं|बताओ|बताइए|प्रदान\s+करें|दर्ज\s+करें|पुष्टि\s+करें|प्रविष्ट\s+करें|शेअर\s+करा|पाठवा|सांगा|द्या|टाका|भरा|काढा`;

const REQUEST_VERBS_HINGLISH = String.raw`bhejo|bhejiye|batao|bataye|share\s+karo|de\s+do|bhej\s+do|daal\s+do|verify\s+karo|enter\s+karo`;

export const MULTILINGUAL_CREDENTIAL_REQUEST_PATTERNS: RegExp[] = [
  new RegExp(
    String.raw`${LEFT}(?:${REQUEST_VERBS_DEVANAGARI}|${REQUEST_VERBS_HINGLISH})${RIGHT}[^.!?।\n]{0,40}?${LEFT}(?:${CREDENTIAL_NOUNS})${RIGHT}`,
    "iu",
  ),
  new RegExp(
    String.raw`${LEFT}(?:${CREDENTIAL_NOUNS})${RIGHT}[^.!?।\n]{0,40}?${LEFT}(?:${REQUEST_VERBS_DEVANAGARI}|${REQUEST_VERBS_HINGLISH})${RIGHT}`,
    "iu",
  ),
];

/**
 * Wording a genuine Hindi, Marathi or Hinglish security notice uses to tell you
 * not to share a credential. These are the multilingual counterpart of the
 * English protective-warning list.
 */
export const MULTILINGUAL_PROTECTIVE_WARNING_PATTERNS: RegExp[] = [
  phrase(
    String.raw`साझा\s+न\s+करें|साझा\s+न\s+करो|शेअर\s+न\s+करें|कोणालाही\s+(?:सांगू|देऊ)\s+नका|गोपनीय\s+रखें|सुरक्षित\s+रखें|कभी\s+(?:साझा|भेजें|बताएं)\s+न|कधीही\s+(?:शेअर|सांगू|देऊ)\s+नका|नहीं\s+मांगता|मांगता\s+नहीं|मागत\s+नाही|नाही\s+मागत`,
  ),
  // "किसी को भी अपना OTP न बताएं": the secret can sit between the recipient
  // and the prohibition, so this one cannot be a single contiguous phrase.
  new RegExp(
    String.raw`${LEFT}(?:किसी\s+(?:को|के\s+साथ)\s+(?:भी\s+)?|कोणालाही\s+)[^.!?।\n]{0,30}?न\s+(?:बताएं|बताओ|बताइए|दें|दो|सांगा|द्या)${RIGHT}`,
    "iu",
  ),
  /\b(?:share\s+mat\s+karo|mat\s+batao|mat\s+bataye|kisi\s+ko\s+na\s+do|kisi\s+ko\s+na\s+batao|kabhi\s+share\s+na|safe\s+rakho|paas\s+safe|nahi\s+maangta|nahin\s+maangta|bank\s+kabhi\s+otp\s+nahi)\b/i,
];

/* ------------------------------------------------------------------ */
/* Prize and reward bait                                               */
/* ------------------------------------------------------------------ */

export const MULTILINGUAL_PRIZE_PATTERNS: RegExp[] = [
  phrase(
    String.raw`बधाई\s+हो|बधाई|आपने\s+जीता|जीत\s+लिया|लकी\s+ड्रॉ|इनाम|पुरस्कार|लॉटरी|मुफ्त\s+उपहार|जैकपॉट|दावा\s+करें|स्क्रैच\s+कार्ड`,
  ),
  phrase(
    String.raw`अभिनंदन|तुम्ही\s+जिंकले|बक्षीस|लॉटरी|मोफत\s+भेट|जॅकपॉट|दावा\s+करा|स्क्रॅच\s+कार्ड`,
  ),
  /\b(?:badhai\s+ho|aapne\s+jeeta|aapne\s+inaam\s+jeeta|lucky\s+draw|inaam|muft\s+gift|claim\s+karo|scratch\s+card|jeeta\s+hai)\b/i,
];
