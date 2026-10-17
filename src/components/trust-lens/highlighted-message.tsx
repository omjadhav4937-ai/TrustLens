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
 */

const SEVERITY_MARK: Record<FindingSeverity, string> = {
  low: "bg-sky-400/15 text-sky-100 decoration-sky-400/40",
  medium: "bg-amber-400/20 text-amber-100 decoration-amber-400/50",
  high: "bg-orange-400/20 text-orange-100 decoration-orange-400/50",
  critical: "bg-rose-400/20 text-rose-100 decoration-rose-400/50",
};

export function HighlightedMessage({
  message,
  findings,
}: {
  message: string;
  findings: ScamFinding[];
}) {
  const segments = buildHighlightSegments(message, findings);

  return (
    <p className="whitespace-pre-wrap break-words font-mono text-[0.8125rem] leading-relaxed text-foreground/90">
      {segments.map((segment, index) =>
        segment.severity ? (
          <mark
            key={index}
            className={cn(
              "rounded px-0.5 underline decoration-dotted underline-offset-2",
              SEVERITY_MARK[segment.severity],
            )}
          >
            {segment.text}
            {segment.ruleLabel && (
              <span className="sr-only"> — matched: {segment.ruleLabel}</span>
            )}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </p>
  );
}
