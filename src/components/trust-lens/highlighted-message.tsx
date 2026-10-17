import {
  buildHighlightSegments,
  type FindingSeverity,
  type ScamFinding,
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
 * finding it belongs to, it never navigates. Plain message text is never
 * linkified, so no URL found in a message can be opened from this panel.
 */

const SEVERITY_MARK: Record<FindingSeverity, string> = {
  low: "bg-sky-400/15 text-sky-100",
  medium: "bg-amber-400/20 text-amber-100",
  high: "bg-orange-400/20 text-orange-100",
  critical: "bg-rose-400/20 text-rose-100",
};

export function HighlightedMessage({
  message,
  findings,
  selectedRuleId = null,
  showAll = false,
  pulsingRuleId = null,
  onSelectRule,
  registerMark,
}: {
  message: string;
  findings: ScamFinding[];
  /** The finding whose marks are made prominent. */
  selectedRuleId?: string | null;
  /** Emphasise every mark at once, used by "Show all matches". */
  showAll?: boolean;
  /** The single mark to draw with a temporary outline. */
  pulsingRuleId?: string | null;
  onSelectRule?: (ruleId: string) => void;
  /** Lets the owner focus the first mark of a rule after "Show in message". */
  registerMark?: (ruleId: string, element: HTMLButtonElement | null) => void;
}) {
  const segments = buildHighlightSegments(message, findings);

  // The first mark of each rule is the one focus lands on, so the owner does
  // not need to know how many times a rule matched.
  const firstMarkIndex = new Map<string, number>();
  segments.forEach((segment, index) => {
    if (segment.ruleId && !firstMarkIndex.has(segment.ruleId)) {
      firstMarkIndex.set(segment.ruleId, index);
    }
  });

  return (
    <div className="whitespace-pre-wrap break-words font-mono text-[0.8125rem] leading-relaxed text-foreground/90">
      {segments.map((segment, index) => {
        if (!segment.severity) return <span key={index}>{segment.text}</span>;

        const ruleId = segment.ruleId ?? null;
        const isFirst = ruleId !== null && firstMarkIndex.get(ruleId) === index;
        const emphasis =
          ruleId !== null && ruleId === selectedRuleId
            ? "selected"
            : ruleId !== null && selectedRuleId === null && showAll
              ? "all"
              : "none";

        return (
          <button
            key={index}
            type="button"
            data-rule-id={ruleId ?? undefined}
            data-emphasis={emphasis}
            ref={
              ruleId && isFirst
                ? (element) => registerMark?.(ruleId, element)
                : undefined
            }
            onClick={ruleId && onSelectRule ? () => onSelectRule(ruleId) : undefined}
            className={cn(
              "lens-mark",
              "outline-none focus-visible:ring-[3px] focus-visible:ring-primary/50",
              SEVERITY_MARK[segment.severity],
              ruleId && isFirst && pulsingRuleId === ruleId && "lens-mark-pulse",
            )}
          >
            {segment.text}
            <span className="sr-only">
              {" — matched by "}
              {segment.ruleLabel}
              {emphasis === "selected" ? ", currently selected" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
