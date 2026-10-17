import type { FindingSeverity, RiskLevel } from "@/lib/scam-detection";

/**
 * One place for the severity and risk vocabulary, so the overview, the finding
 * cards and the coverage rows cannot drift apart.
 *
 * Every one of these values ships with a text label at the point of use, so no
 * meaning here is carried by colour alone.
 */

export const SEVERITY_LABEL: Record<FindingSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

/** Ordering used to sort and to describe "highest severity first". */
export const SEVERITY_RANK: Record<FindingSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export const SEVERITY_CHIP: Record<FindingSeverity, string> = {
  low: "border-sky-400/40 bg-sky-400/10 text-sky-100",
  medium: "border-amber-400/40 bg-amber-400/10 text-amber-100",
  high: "border-orange-400/40 bg-orange-400/10 text-orange-100",
  critical: "border-rose-400/40 bg-rose-400/10 text-rose-100",
};

export const SEVERITY_DOT: Record<FindingSeverity, string> = {
  low: "bg-sky-400/80",
  medium: "bg-amber-400/80",
  high: "bg-orange-400/80",
  critical: "bg-rose-400/80",
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

export const RISK_CHIP: Record<RiskLevel, string> = {
  low: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
  medium: "border-amber-400/40 bg-amber-400/10 text-amber-100",
  high: "border-rose-400/40 bg-rose-400/10 text-rose-100",
};

/** Plain values for the SVG ring, which cannot take a Tailwind class. */
export const RISK_RING_COLOR: Record<RiskLevel, string> = {
  low: "#34d399",
  medium: "#fbbf24",
  high: "#fb7185",
};
