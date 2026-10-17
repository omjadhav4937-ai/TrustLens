import type { TextRange } from "./types";

/**
 * Replaces character classes that would otherwise break matching, without
 * changing the length of the string. One character in, one character out, so
 * every offset found in the normalised text is also valid in the original.
 */
export function normalizeMessage(message: string): string {
  return message
    .replace(/[\u00A0\u2007\u2009\u200A\u202F\u3000]/g, " ")
    .replace(/[\u2018\u2019\u02BC\u2032]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/\u2013/g, "-");
}

/**
 * True when two ranges share at least one character.
 *
 * Used to spot a request verb that is really part of a warning, such as the
 * "share" inside "do not share this code".
 */
export function overlaps(a: TextRange, b: TextRange): boolean {
  return a.start < b.end && a.end > b.start;
}

/** Merges overlapping or touching ranges so a phrase is never counted twice. */
export function mergeRanges(ranges: TextRange[]): TextRange[] {
  if (ranges.length === 0) return [];

  const sorted = [...ranges]
    .filter((range) => range.end > range.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const merged: TextRange[] = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ start: range.start, end: range.end });
    }
  }
  return merged;
}

/** Hard ceiling so a pathological input can never hang the browser. */
const MAX_MATCHES_PER_PATTERN = 400;

/**
 * Runs a set of global regexes over the message and returns every match as a
 * range. Overlapping matches are merged, so one phrase can never contribute
 * twice to the same rule.
 */
export function collectMatches(message: string, patterns: RegExp[]): TextRange[] {
  const found: TextRange[] = [];

  for (const pattern of patterns) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    let regex: RegExp;
    try {
      regex = new RegExp(pattern.source, flags);
    } catch {
      // A malformed pattern must never take the whole analysis down.
      continue;
    }

    let match: RegExpExecArray | null;
    let guard = 0;
    while ((match = regex.exec(message)) !== null) {
      if (match[0].length === 0) {
        regex.lastIndex += 1;
        continue;
      }
      found.push({ start: match.index, end: match.index + match[0].length });
      if (++guard >= MAX_MATCHES_PER_PATTERN) break;
    }
  }

  return mergeRanges(found);
}

/** Clamps ranges to the bounds of the analysed text and drops empty ones. */
export function sanitizeRanges(ranges: TextRange[], length: number): TextRange[] {
  return mergeRanges(
    ranges
      .map((range) => ({
        start: Math.max(0, Math.min(range.start, length)),
        end: Math.max(0, Math.min(range.end, length)),
      }))
      .filter((range) => range.end > range.start),
  );
}
