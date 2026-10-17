import type { FindingSeverity, ScamFinding } from "./types";

/** One piece of the analysed message, marked when a rule matched it. */
export interface HighlightSegment {
  text: string;
  /** Present only when this segment matched a rule. */
  severity?: FindingSeverity;
  /** The readable rule label, for the marked segments. */
  ruleLabel?: string;
}

/**
 * Turns the findings' matched ranges into a flat, non-overlapping list of text
 * segments that reconstruct the message exactly.
 *
 * Overlapping matches are resolved by keeping the range that starts first (and,
 * at the same start, the longer one) and dropping anything that would overlap
 * it — so no phrase is ever marked twice and no character is lost.
 *
 * The result is pure data, which lets the renderer place every piece into React
 * as a text child. The message is never inserted as HTML.
 */
export function buildHighlightSegments(
  message: string,
  findings: ScamFinding[],
): HighlightSegment[] {
  const marks = findings
    .flatMap((finding) =>
      finding.occurrences.map((range) => ({
        start: Math.max(0, Math.min(range.start, message.length)),
        end: Math.max(0, Math.min(range.end, message.length)),
        severity: finding.severity,
        ruleLabel: finding.label,
      })),
    )
    .filter((mark) => mark.end > mark.start)
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (const mark of marks) {
    if (mark.start < cursor) continue;
    if (mark.start > cursor) {
      segments.push({ text: message.slice(cursor, mark.start) });
    }
    segments.push({
      text: message.slice(mark.start, mark.end),
      severity: mark.severity,
      ruleLabel: mark.ruleLabel,
    });
    cursor = mark.end;
  }

  if (cursor < message.length) {
    segments.push({ text: message.slice(cursor) });
  }

  return segments;
}
