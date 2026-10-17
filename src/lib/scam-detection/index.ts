/** Public surface of the TrustLens rule-based detection engine. */

export * from "./types";
export {
  MAX_SCORE,
  RISK_THRESHOLD_HIGH,
  RISK_THRESHOLD_MEDIUM,
  analyzeMessage,
  buildScoreExplanation,
  buildSummary,
  riskLevelForScore,
} from "./engine";
export { RULES, getRuleById } from "./rules";
export * from "./highlight";
export { extractLinks } from "./links";
export { detectLanguage } from "./language";
export type {
  LanguageCode,
  LanguageInfo,
  ScriptKind,
} from "./language";
