/**
 * Local, heuristic language and script identification.
 *
 * This module never changes a score. It exists so the interface can tell the
 * reader which variety the detector *thinks* it is looking at, and — just as
 * importantly — when that guess is not reliable.
 *
 * ## What it can and cannot do
 *
 * - Devanagari is shared by Hindi and Marathi (and others). Script alone is
 *   never language identification. The Hindi/Marathi guess below is a small
 *   function-word heuristic, and it is reported as uncertain whenever the
 *   evidence is thin or conflicting.
 * - Hinglish is detected from a list of common Hindi function words and verb
 *   forms written in Latin script. It is a variety label, not a language ID.
 * - English is the fallback for Latin-script text that does not carry those
 *   markers. A short Latin-script message is reported with low confidence.
 *
 * No network access, storage or model call is involved. The same text always
 * produces the same result.
 */

export type LanguageCode =
  | "en"
  | "hi"
  | "mr"
  | "hinglish"
  | "mixed"
  | "uncertain";

export type ScriptKind = "latin" | "devanagari" | "mixed" | "none";

export interface LanguageInfo {
  code: LanguageCode;
  /** Human-readable label, safe to show in the interface. */
  label: string;
  script: ScriptKind;
  /** `low` means the label is a guess that should not be relied on. */
  confidence: "high" | "low";
  /** One sentence explaining the limit of this label. */
  note: string;
}

const DEVANAGARI_CHAR = /[\u0900-\u097F]/g;
const LATIN_CHAR = /[A-Za-z]/g;

/**
 * Hindi function words and verb forms in Devanagari.
 *
 * Tokens shared by Hindi and Marathi (आज, कृपया, रुपये, नंबर) are deliberately
 * left out of both lists: they carry no discriminating signal.
 */
const LEFT = String.raw`(?<![\p{L}\p{M}])`;
const RIGHT = String.raw`(?![\p{L}\p{M}])`;

/**
 * Word-bounded Devanagari token.
 *
 * The boundary is a letter/mark lookaround, not `\b` and not the Devanagari
 * block: the danda (।) lives inside that block, so a block-based boundary would
 * reject the most common sentence-final position.
 */
function devanagariWord(source: string): RegExp {
  return new RegExp(`${LEFT}(?:${source})${RIGHT}`, "u");
}

const HINDI_MARKERS: RegExp[] = [
  devanagariWord("है|हैं|हूं|था|थी|थे"),
  devanagariWord("आपका|आपके|आपकी|आपने|आपको|अपना|अपनी|अपने"),
  devanagariWord("मैं|मैंने|मेरा|मेरे|मेरी|हमारा|हमारे|हमारी"),
  devanagariWord("करें|करना|किया|करके|करता|करती|करते"),
  devanagariWord("जाएगा|जाएगी|जाएंगे|होगा|होगी|होंगे|गया|गई"),
  devanagariWord("नहीं|नही|मत"),
  devanagariWord("बताएं|बताओ|बताए|भेजें|भेजो|भेजिए|दें|दो|सकते|सकता|लिए"),
  devanagariWord("तुरंत|तुरन्त|जल्दी|जल्द|फौरन|अभी|पहले|बाद|समीक्षा"),
  devanagariWord("उपलब्ध|जानकारी|डिलीवरी|स्वचालित"),
];

/**
 * Marathi function words, verb forms and inflections in Devanagari.
 *
 * The `ळ` letter and the `-चे` / `-चा` inflections are strong hints, but they
 * are not proof: names and loanwords cross language boundaries constantly.
 */
const MARATHI_MARKERS: RegExp[] = [
  devanagariWord("आहे|आहेत|होते|होता|होती"),
  devanagariWord("तुमचा|तुमचे|तुमची|तुम्ही|तुम्हाला|माझा|माझे|माझी|मी|आमचा|आमचे|आमची"),
  devanagariWord("करा|करू|केले|करून|करण्यासाठी|टाका|पाठवा|सांगा|पाहा|भरा|काटा|घ्या|द्या"),
  devanagariWord("जाईल|जाते|झाले|झाला|झाली|नाही|नका|लगेच|तासांत|आत्ता|शेवटची"),
  devanagariWord("मिळवण्यासाठी|बक्षीस|माहिती|तपासणी|पडताळणी|संशयास्पद|तोडले|महाविद्यालय|वेळापत्रक|लिंकवर"),
];

/**
 * Common Hinglish markers written in Latin script.
 *
 * Each pattern is a phrase or a word that is not an ordinary English token, so
 * an English sentence cannot accumulate two of them by accident. Bare `do`,
 * `me`, `ka` and `par` are excluded for exactly that reason.
 */
const HINGLISH_MARKERS: RegExp[] = [
  /\b(?:aapka|aapke|aapki|aapne|aapko|tumhara|tumhare|tumhari|hamara|hamare|hamari|mera|mere|meri|apna|apni)\b/i,
  /\b(?:hai|hain|nahi|nahin|yeh|woh|kya|kaise|kyun|karne|karna|karein|kijiye)\b/i,
  /\b(?:turant|jaldi|foran|aaj|abhi|baad|pehle|ghante)\b/i,
  /\b(?:jayega|jayegi|hoga|hogi|hua|hui|gaya|gayi|pahunch)\b/i,
  /\b(?:karo|bhejo|bhejiye|batao|bataye|daalo|dekho|suno|maangta|maangte)\b/i,
  /\b(?:share\s+mat\s+karo|mat\s+karo|na\s+do|na\s+batao|bhej\s+do|bhej\s+diya|kar\s+do|daal\s+do|ho\s+jayega|ho\s+gaya|kat\s+jayega)\b/i,
  /\b(?:khata|khaata|paisa|paise|inaam|badhai|baksis|muft|yaar|bhai)\b/i,
  /\b(?:link\s+par|phone\s+par|app\s+mein|message\s+mein|number\s+par|ke\s+liye|ke\s+saath|ki\s+jaankari|ka\s+timetable|ka\s+inaam|kisi\s+ko)\b/i,
];

const SCRIPT_NOTE =
  "Devanagari is shared by Hindi and Marathi, so this label is a heuristic, not a reliable language identification.";
const HINGLISH_NOTE =
  "Hinglish is identified from common Hindi words written in Latin script. Mixed and informal spellings are often missed.";
const LATIN_NOTE =
  "English is the fallback for Latin-script text with no Hinglish markers. Short or mixed messages may be mislabelled.";
const UNCERTAIN_NOTE =
  "The language could not be identified confidently. Analysis still runs; only this label is uncertain.";

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce(
    (total, pattern) => (pattern.test(text) ? total + 1 : total),
    0,
  );
}

function countCharacters(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

/**
 * Exposes the marker counts behind the guess.
 *
 * Used by tests and by the evaluation report. It is deliberately not part of
 * the user-facing label: a count is not a confidence score.
 */
export function languageEvidence(message: string): {
  hindi: number;
  marathi: number;
  hinglish: number;
} {
  return {
    hindi: countMatches(message, HINDI_MARKERS),
    marathi: countMatches(message, MARATHI_MARKERS),
    hinglish: countMatches(message, HINGLISH_MARKERS),
  };
}

function info(
  code: LanguageCode,
  label: string,
  script: ScriptKind,
  confidence: "high" | "low",
  note: string,
): LanguageInfo {
  return { code, label, script, confidence, note };
}

/**
 * Labels the message's script and language variety.
 *
 * The result is advisory. Detection rules do not consult it, so a wrong label
 * cannot suppress or create a finding.
 */
export function detectLanguage(rawMessage: string): LanguageInfo {
  const message = typeof rawMessage === "string" ? rawMessage : "";
  if (message.trim().length === 0) {
    return info(
      "uncertain",
      "No message",
      "none",
      "low",
      "There is no message to identify a language from.",
    );
  }

  const devanagariCount = countCharacters(message, DEVANAGARI_CHAR);
  const latinCount = countCharacters(message, LATIN_CHAR);

  if (devanagariCount === 0) {
    if (latinCount === 0) {
      return info("uncertain", "Unrecognised script", "none", "low", UNCERTAIN_NOTE);
    }

    const hinglishMarkers = countMatches(message, HINGLISH_MARKERS);
    if (hinglishMarkers >= 2) {
      return info(
        "hinglish",
        "Hinglish (Latin script)",
        "latin",
        hinglishMarkers >= 3 && latinCount >= 20 ? "high" : "low",
        HINGLISH_NOTE,
      );
    }

    const short = latinCount < 20;
    return info(
      "en",
      short ? "Likely English" : "English",
      "latin",
      short ? "low" : "high",
      LATIN_NOTE,
    );
  }

  const hindiScore = countMatches(message, HINDI_MARKERS);
  const marathiScore = countMatches(message, MARATHI_MARKERS);
  const mixedScript = latinCount > 0 && latinCount >= devanagariCount * 0.15;
  const script: ScriptKind = mixedScript ? "mixed" : "devanagari";

  if (hindiScore === 0 && marathiScore === 0) {
    return info("uncertain", "Uncertain (Devanagari)", script, "low", UNCERTAIN_NOTE);
  }

  if (Math.abs(hindiScore - marathiScore) < 2) {
    return info(
      "mixed",
      mixedScript ? "Mixed or uncertain (Devanagari)" : "Uncertain (Devanagari)",
      script,
      "low",
      SCRIPT_NOTE,
    );
  }

  const isHindi = hindiScore > marathiScore;
  const margin = Math.abs(hindiScore - marathiScore);
  const confidence = margin >= 2 && Math.max(hindiScore, marathiScore) >= 2
    ? "high"
    : "low";

  return info(
    isHindi ? "hi" : "mr",
    mixedScript
      ? isHindi
        ? "Hindi + English (mixed script)"
        : "Marathi + English (mixed script)"
      : isHindi
        ? "Hindi (Devanagari)"
        : "Marathi (Devanagari)",
    script,
    confidence,
    SCRIPT_NOTE,
  );
}
