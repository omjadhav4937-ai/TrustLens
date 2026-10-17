import type { FindingSeverity, ScamFinding } from "./types";

/** Evidence from another rule that a mark also shows. */
export interface CoveredEvidence {
  /** The rule whose matched text lies inside this mark. */
  ruleId: string;
  /** The part of that rule's matched text which falls inside this mark. */
  start: number;
  end: number;
}

/** One piece of the analysed message, marked when a rule matched it. */
export interface HighlightSegment {
  text: string;
  /** Present only when this segment matched a rule. */
  severity?: FindingSeverity;
  /** The readable rule label, for the marked segments. */
  ruleLabel?: string;
  /**
   * The rule that produced this mark, so an interactive highlight can select
   * its finding. Present exactly when `severity` is.
   */
  ruleId?: string;
  /**
   * Other rules whose evidence this mark covers because their own range lost the
   * overlap contest and therefore has no mark of its own.
   *
   * Only present on a marked segment, and only ever populated from real range
   * intersections — never from searching the text for a phrase.
   */
  coveredEvidence?: CoveredEvidence[];
}

/**
 * Turns the findings' matched ranges into a flat, non-overlapping list of text
 * segments that reconstruct the message exactly.
 *
 * Overlapping matches are resolved by keeping the range that starts first (and,
 * at the same start, the longer one) and dropping anything that would overlap
 * it — so no phrase is ever marked twice and no character is lost.
 *
 * A dropped range is still evidence for its rule: every mark it overlaps records
 * the exact intersection in `coveredEvidence`. That is what lets the interface
 * still point a dropped finding at the text that shows it, without guessing.
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
        ruleId: finding.ruleId,
      })),
    )
    .filter((mark) => mark.end > mark.start)
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const segments: HighlightSegment[] = [];
  /** Where each accepted mark landed, so a dropped range can be mapped back. */
  const acceptedMarks: Array<{ index: number; start: number; end: number }> = [];
  const dropped: typeof marks = [];
  let cursor = 0;

  for (const mark of marks) {
    if (mark.start < cursor) {
      dropped.push(mark);
      continue;
    }
    if (mark.start > cursor) {
      segments.push({ text: message.slice(cursor, mark.start) });
    }
    segments.push({
      text: message.slice(mark.start, mark.end),
      severity: mark.severity,
      ruleLabel: mark.ruleLabel,
      ruleId: mark.ruleId,
    });
    acceptedMarks.push({
      index: segments.length - 1,
      start: mark.start,
      end: mark.end,
    });
    cursor = mark.end;
  }

  if (cursor < message.length) {
    segments.push({ text: message.slice(cursor) });
  }

  /*
   * A dropped range may be entirely inside one mark, or straddle the end of it.
   * Either way the overlap is a character range, so it is computed from the
   * recorded offsets. The text is never searched for the phrase, which would
   * find the wrong occurrence as soon as a phrase repeats.
   */
  for (const mark of dropped) {
    for (const accepted of acceptedMarks) {
      const start = Math.max(mark.start, accepted.start);
      const end = Math.min(mark.end, accepted.end);
      if (end <= start) continue;

      const segment = segments[accepted.index];
      const list = segment.coveredEvidence ?? [];
      const existing = list.find((entry) => entry.ruleId === mark.ruleId);
      if (existing) {
        existing.start = Math.min(existing.start, start);
        existing.end = Math.max(existing.end, end);
      } else {
        // Ascending segment order and ascending rule order, so the list is
        // deterministic for a given message and set of findings.
        list.push({ ruleId: mark.ruleId, start, end });
      }
      segment.coveredEvidence = list;
    }
  }

  return segments;
}

/**
 * Where a finding's evidence actually appears in the rendered message.
 *
 * - `own`    — the finding has a mark of its own; `segmentIndex` points at it.
 * - `shared` — the finding has no mark because another rule's earlier-starting
 *              range absorbed it; `segmentIndex` points at the mark that shows
 *              the overlapping text, and `ownerRuleId` says whose mark it is.
 * - `absent` — neither exists, so there is nothing honest to point at.
 */
export type HighlightTargetKind = "own" | "shared" | "absent";

/** The resolved place in the message a finding should be shown at. */
export interface HighlightTarget {
  kind: HighlightTargetKind;
  /** Index into the segment list, or -1 when the kind is `absent`. */
  segmentIndex: number;
  /** The rule that owns the target mark. Null when `absent`. */
  ownerRuleId: string | null;
  ownerRuleLabel: string | null;
  /** The owner's noun phrase, for sentences that name it mid-clause. */
  ownerRuleShortLabel: string | null;
  /** How much of this finding's evidence is highlighted anywhere. */
  coveredLength: number;
  /** Total length of this finding's matched ranges. */
  evidenceLength: number;
  /** How much of it sits inside another rule's mark. */
  sharedLength: number;
  /** True when some of the evidence is nowhere highlighted. */
  showsOnlyPart: boolean;
}

function emptyTarget(): HighlightTarget {
  return {
    kind: "absent",
    segmentIndex: -1,
    ownerRuleId: null,
    ownerRuleLabel: null,
    ownerRuleShortLabel: null,
    coveredLength: 0,
    evidenceLength: 0,
    sharedLength: 0,
    showsOnlyPart: false,
  };
}

/**
 * Resolves the mark a finding should be shown at, using only the ranges the
 * engine returned and the ranges the segmenter recorded.
 *
 * A finding's own mark always wins: it is exactly that finding's evidence. Only
 * when no own mark exists does the containing mark get considered, and then the
 * mark covering the largest share of the evidence is chosen — which is the
 * defensible one, rather than whichever mark happens to come first.
 *
 * Returns `absent` whenever there is no target, so a caller can never be handed
 * a plausible-looking index that does not exist.
 */
export function findHighlightTarget(
  segments: HighlightSegment[],
  findings: ScamFinding[],
  ruleId: string,
): HighlightTarget {
  const target = emptyTarget();
  const finding = findings.find((item) => item.ruleId === ruleId);
  if (!finding) return target;

  // Clamped the same way the segmenter clamps, so "how much of the evidence is
  // marked" is measured against what could actually be rendered.
  const messageLength = segments.reduce(
    (total, segment) => total + segment.text.length,
    0,
  );
  target.evidenceLength = finding.occurrences.reduce((total, range) => {
    const start = Math.max(0, Math.min(range.start, messageLength));
    const end = Math.max(0, Math.min(range.end, messageLength));
    return total + Math.max(0, end - start);
  }, 0);

  let ownIndex = -1;
  let ownLength = 0;
  let sharedLength = 0;
  let sharedIndex = -1;
  let sharedCovered = 0;
  let ownerRuleId: string | null = null;
  let ownerRuleLabel: string | null = null;

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (!segment.severity) continue;

    if (segment.ruleId === ruleId) {
      if (ownIndex === -1) ownIndex = index;
      ownLength += segment.text.length;
      continue;
    }

    const entry = segment.coveredEvidence?.find((item) => item.ruleId === ruleId);
    if (!entry) continue;
    const covered = entry.end - entry.start;
    if (covered <= 0) continue;

    sharedLength += covered;

    // The mark showing the largest share wins; because the loop ascends, an
    // equal share leaves the earlier mark in place, so the result is stable.
    if (covered > sharedCovered) {
      sharedIndex = index;
      sharedCovered = covered;
      ownerRuleId = segment.ruleId ?? null;
      ownerRuleLabel = segment.ruleLabel ?? null;
    }
  }

  target.sharedLength = sharedLength;
  target.coveredLength = ownLength + sharedLength;
  target.showsOnlyPart = target.coveredLength < target.evidenceLength;

  if (ownIndex !== -1) {
    target.kind = "own";
    target.segmentIndex = ownIndex;
    target.ownerRuleId = ruleId;
    target.ownerRuleLabel = finding.label;
    target.ownerRuleShortLabel = finding.shortLabel;
    return target;
  }

  if (sharedIndex !== -1) {
    target.kind = "shared";
    target.segmentIndex = sharedIndex;
    target.ownerRuleId = ownerRuleId;
    target.ownerRuleLabel = ownerRuleLabel;
    target.ownerRuleShortLabel =
      findings.find((item) => item.ruleId === ownerRuleId)?.shortLabel ??
      ownerRuleLabel;
    return target;
  }

  return target;
}

/**
 * Groups the findings by the segment their evidence resolves to, in finding
 * order.
 *
 * This is the single mapping the renderer uses both to attach the register
 * callback and to declare which findings a mark serves, which is why it is a
 * plain function over the plan rather than a loop inside the component: the
 * mark a finding can be navigated to, and the mark that answers for it, have to
 * be the same mark.
 *
 * Findings with no target are omitted, so a mark is never registered for a rule
 * that has no evidence there.
 */
export function groupTargetsBySegment(
  targets: ReadonlyMap<string, HighlightTarget>,
): Map<number, string[]> {
  const grouped = new Map<number, string[]>();
  for (const [ruleId, target] of targets) {
    if (target.kind === "absent" || target.segmentIndex < 0) continue;
    const rules = grouped.get(target.segmentIndex);
    if (rules) rules.push(ruleId);
    else grouped.set(target.segmentIndex, [ruleId]);
  }
  return grouped;
}

/** Everything the message views need to render marks and navigate to them. */
export interface HighlightPlan {
  segments: HighlightSegment[];
  /** Every finding's resolved target, including the `absent` ones. */
  targets: Map<string, HighlightTarget>;
}

/**
 * Builds the segments once and resolves every finding against them, so the
 * renderer and the navigation handler cannot disagree about where a finding is.
 */
export function buildHighlightPlan(
  message: string,
  findings: ScamFinding[],
): HighlightPlan {
  const segments = buildHighlightSegments(message, findings);
  const targets = new Map<string, HighlightTarget>();
  for (const finding of findings) {
    targets.set(finding.ruleId, findHighlightTarget(segments, findings, finding.ruleId));
  }
  return { segments, targets };
}
