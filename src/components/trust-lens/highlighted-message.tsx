import {
  groupTargetsBySegment,
  type FindingSeverity,
  type HighlightPlan,
  type HighlightTarget,
} from "@/lib/scam-detection";
import { cn } from "@/lib/utils";

/**
 * Renders the analysed message with its matched phrases marked.
 *
 * Every piece of the message is placed into React as a text child, so the
 * message can never be injected as HTML. Only ranges the engine actually
 * returned are highlighted — nothing is guessed from a substring search.
 *
 * A marked range is a real `<button>`, never an anchor: clicking it selects the
 * finding it owns, it never navigates. Plain message text is never linkified,
 * so no URL found in a message can be opened from this panel.
 *
 * A mark can be the resolved target of more than one finding: when a rule's
 * range was absorbed by an earlier-starting range it has no mark of its own, and
 * the mark covering its text stands in for it. That mark is then registered under
 * both rules, so navigation lands on the text that is actually on screen.
 */

const SEVERITY_MARK: Record<FindingSeverity, string> = {
  low: "bg-sky-400/15 text-sky-100",
  medium: "bg-amber-400/20 text-amber-100",
  high: "bg-orange-400/20 text-orange-100",
  critical: "bg-rose-400/20 text-rose-100",
};

type Emphasis = "selected" | "shared" | "all" | "none";

export function HighlightedMessage({
  plan,
  selectedRuleId = null,
  showAll = false,
  pulsingRuleId = null,
  onSelectRule,
  registerMark,
}: {
  /** Segments plus the resolved target of every finding. */
  plan: HighlightPlan;
  /** The finding whose evidence is made prominent. */
  selectedRuleId?: string | null;
  /** Emphasise every mark at once, used by "Show all matches". */
  showAll?: boolean;
  /** The finding whose target mark should carry the temporary outline. */
  pulsingRuleId?: string | null;
  onSelectRule?: (ruleId: string) => void;
  /**
   * Lets the owner focus the resolved target of a rule after "Show in message".
   * Called with `null` on unmount, so a stale node is never retained.
   */
  registerMark?: (ruleId: string, element: HTMLButtonElement | null) => void;
}) {
  const { segments, targets } = plan;

  /*
   * Which rules resolve to each segment. Built from the plan rather than from
   * the segments themselves, so a mark that stands in for another rule is
   * reported by the same resolver the navigation handler uses.
   */
  const rulesBySegment = groupTargetsBySegment(targets);

  const selectedTarget: HighlightTarget | undefined = selectedRuleId
    ? targets.get(selectedRuleId)
    : undefined;
  const pulsingTarget: HighlightTarget | undefined = pulsingRuleId
    ? targets.get(pulsingRuleId)
    : undefined;

  return (
    <div className="whitespace-pre-wrap break-words font-mono text-[0.8125rem] leading-relaxed text-foreground/90">
      {segments.map((segment, index) => {
        if (!segment.severity) return <span key={index}>{segment.text}</span>;

        const ruleId = segment.ruleId ?? null;
        const registeredRules = rulesBySegment.get(index) ?? [];

        const isOwnSelection = ruleId !== null && ruleId === selectedRuleId;
        const isSelectedTarget =
          selectedTarget !== undefined &&
          selectedTarget.kind !== "absent" &&
          selectedTarget.segmentIndex === index;

        const emphasis: Emphasis = isOwnSelection
          ? "selected"
          : isSelectedTarget
            ? "shared"
            : selectedRuleId === null && showAll
              ? "all"
              : "none";

        const pulses =
          pulsingTarget !== undefined &&
          pulsingTarget.kind !== "absent" &&
          pulsingTarget.segmentIndex === index;

        return (
          <button
            key={index}
            type="button"
            data-rule-id={ruleId ?? undefined}
            data-emphasis={emphasis}
            data-focus-target-for={
              registeredRules.length > 0 ? registeredRules.join(" ") : undefined
            }
            ref={
              registeredRules.length > 0
                ? (element) => {
                    for (const id of registeredRules) registerMark?.(id, element);
                  }
                : undefined
            }
            onClick={ruleId && onSelectRule ? () => onSelectRule(ruleId) : undefined}
            className={cn(
              "lens-mark",
              "outline-none focus-visible:ring-[3px] focus-visible:ring-primary/50",
              SEVERITY_MARK[segment.severity],
              pulses && "lens-mark-pulse",
            )}
          >
            {segment.text}
            <span className="sr-only">
              {" — matched by "}
              {segment.ruleLabel}
              {emphasis === "selected" ? ", currently selected" : ""}
              {emphasis === "shared"
                ? ", also shows the evidence of the selected finding"
                : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
