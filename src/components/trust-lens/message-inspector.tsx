import { HighlightedMessage } from "@/components/trust-lens/highlighted-message";
import type { HighlightPlan, ScamAnalysis } from "@/lib/scam-detection";
import { cn } from "@/lib/utils";
import { Layers, X } from "lucide-react";
import { useMemo } from "react";

/**
 * The message, with every matched range marked and selectable.
 *
 * This panel is the evidence view: selecting a highlight selects its finding,
 * and "Show in message" on a finding brings the reader back here. The message
 * text itself is never altered to make the highlighting work — the engine's
 * ranges are cut into segments that still join back into the original string.
 *
 * The status line is the panel's voice. It reports what actually happened: which
 * finding is shown, whether the mark belongs to it or merely covers its
 * evidence, and — when there is nothing to point at — that plainly, rather than
 * leaving the reader to wonder why nothing moved.
 */
export function MessageInspector({
  analysis,
  plan,
  selectedRuleId,
  showAll,
  pulsingRuleId,
  unreachableRuleId,
  onSelectRule,
  onShowAll,
  onClearSelection,
  registerMark,
}: {
  analysis: ScamAnalysis;
  plan: HighlightPlan;
  selectedRuleId: string | null;
  showAll: boolean;
  pulsingRuleId: string | null;
  /** Set when a target existed but its element was not available to focus. */
  unreachableRuleId: string | null;
  onSelectRule: (ruleId: string) => void;
  onShowAll: () => void;
  onClearSelection: () => void;
  registerMark: (ruleId: string, element: HTMLButtonElement | null) => void;
}) {
  const { message, findings } = analysis;
  const { segments, targets } = plan;
  const hasText = message.trim().length > 0;

  // Counted from the segments, not from the engine's ranges: a range absorbed by
  // an overlapping one is not a mark on screen, and the panel must not claim a
  // mark the reader cannot see or select.
  const markCount = useMemo(
    () => segments.filter((segment) => segment.severity !== undefined).length,
    [segments],
  );

  const markedRuleCount = useMemo(
    () =>
      findings.filter((finding) => {
        const target = targets.get(finding.ruleId);
        return target !== undefined && target.kind !== "absent";
      }).length,
    [findings, targets],
  );

  const selectedFinding = useMemo(
    () => findings.find((finding) => finding.ruleId === selectedRuleId) ?? null,
    [findings, selectedRuleId],
  );

  const selectedTarget = selectedRuleId ? targets.get(selectedRuleId) : undefined;

  function describeStatus(): string {
    if (!hasText) return "This result has no message text to inspect.";

    // A selection is answered before the counts: if the reader asked to be
    // shown one finding, the panel owes them an answer about *that* finding,
    // never a general "nothing to mark" that hides why nothing moved.
    if (!selectedFinding) {
      if (markCount === 0) {
        return "No matches to mark. The message is shown exactly as it was entered.";
      }
      return showAll
        ? `All ${markCount} matches are emphasised.`
        : `${markCount} matches marked across ${markedRuleCount} warning sign${
            markedRuleCount === 1 ? "" : "s"
          }.`;
    }

    const label = selectedFinding.label;

    // The target was resolved, so its evidence is in the message — but the
    // element could not be reached. Saying nothing here would imply success.
    if (unreachableRuleId === selectedFinding.ruleId) {
      return `Showing ${label}. Its evidence could not be brought into view, so nothing was highlighted.`;
    }

    if (!selectedTarget || selectedTarget.kind === "absent") {
      return `Showing ${label}. Its exact evidence could not be located in the rendered message, so there is no mark to highlight.`;
    }

    if (selectedTarget.kind === "own") {
      return selectedTarget.showsOnlyPart
        ? `Showing ${label}. Its matches are emphasised; part of its evidence is shared with another warning sign's mark.`
        : `Showing ${label}. Its matches are emphasised; the others remain readable.`;
    }

    const owner = selectedTarget.ownerRuleShortLabel ?? "another warning sign";
    // An overlap is only ever announced when real ranges intersect, and a partial
    // one says so rather than implying the whole finding is on screen.
    return selectedTarget.showsOnlyPart
      ? `Showing ${label}. It overlaps evidence for ${owner}, so only the overlapping part of its text is highlighted.`
      : `Showing ${label}. Its evidence is shared with ${owner}, so that mark is highlighted instead of one of its own.`;
  }

  const status = describeStatus();

  return (
    <div className="rounded-2xl border border-border/70 bg-background/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight">Message inspector</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Select a marked phrase to open the warning sign behind it.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={showAll}
          disabled={markCount === 0}
          onClick={onShowAll}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium",
            "outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-primary/45",
            "disabled:cursor-not-allowed disabled:opacity-45",
            showAll
              ? "border-primary/70 bg-primary/15 text-foreground"
              : "border-border/70 bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          <Layers className="size-3.5 shrink-0" aria-hidden="true" />
          Show all matches
        </button>

        <button
          type="button"
          disabled={selectedRuleId === null && !showAll}
          onClick={onClearSelection}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-xl border border-border/70 bg-background/50 px-3 py-2",
            "text-xs font-medium text-muted-foreground outline-none transition-colors",
            "hover:border-primary/40 hover:text-foreground",
            "focus-visible:ring-[3px] focus-visible:ring-primary/45",
            "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-border/70 disabled:hover:text-muted-foreground",
          )}
        >
          <X className="size-3.5 shrink-0" aria-hidden="true" />
          Clear selection
        </button>
      </div>

      <p
        role="status"
        className="mt-3 text-xs leading-relaxed tabular-nums text-muted-foreground"
      >
        {status}
      </p>

      <div className="mt-3 max-h-[28rem] overflow-y-auto rounded-xl border border-border/60 bg-secondary/25 p-4">
        {hasText ? (
          <HighlightedMessage
            plan={plan}
            selectedRuleId={selectedRuleId}
            showAll={showAll}
            pulsingRuleId={pulsingRuleId}
            onSelectRule={onSelectRule}
            registerMark={registerMark}
          />
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground">
            There is nothing to display. Analyse a message to inspect its text
            here.
          </p>
        )}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        The text above is shown exactly as it was entered, punctuation included.
        Marked phrases are buttons, not links — TrustLens never opens anything
        found in a message.
      </p>
    </div>
  );
}
