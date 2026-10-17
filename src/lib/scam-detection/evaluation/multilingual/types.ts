import type { EvaluationCase } from "../types";

/**
 * The language varieties the multilingual foundation is scoped to.
 *
 * Hindi and Marathi share Devanagari, so these are variety labels rather than
 * established language identifications. A `hi` or `mr` label is the author's
 * intent for the case; the detector's own identification is reported
 * separately and is explicitly heuristic.
 */
export const MULTILINGUAL_LANGUAGES = ["en", "hi", "mr", "hinglish"] as const;

export type MultilingualLanguage = (typeof MULTILINGUAL_LANGUAGES)[number];

export const MULTILINGUAL_LANGUAGE_LABELS: Record<MultilingualLanguage, string> = {
  en: "English",
  hi: "Hindi (Devanagari)",
  mr: "Marathi (Devanagari)",
  hinglish: "Hinglish (Latin script)",
};

/** An evaluation case that also records the language variety it was written in. */
export interface MultilingualCase extends EvaluationCase {
  language: MultilingualLanguage;
}
