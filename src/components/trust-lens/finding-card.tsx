import { Disclosure } from "@/components/trust-lens/disclosure";
import {
  SEVERITY_CHIP,
  SEVERITY_DOT,
  SEVERITY_LABEL,
} from "@/components/trust-lens/severity";
import { Badge } from "@/components/ui/badge";
import type { ScamFinding } from "@/lib/scam-detection";
import { cn } from "@/lib/utils";
import { Crosshair, ShieldCheck } from "lucide-react";

/**
 * One matched warning sign.
 *
 * Collapsed, the card carries the severity, the title, the points, a short
 * slice of the matched text and the expand affordance. The explanation and the
 * safe next step are revealed on demand, which keeps the list scannable and
 * stops the same long paragraph repeating down the page.
 *
 * The whole toggle is a single button, so a collapsed card is exactly one tab
 * stop. "Show in message" lives in the revealed content, which is why it cannot
 * be nested inside the toggle.
 */

const SNIPPET_LIMIT = 96;

/** Collapses runs of whitespace so a snippet never renders as a ragged block. */
function snippetOf(text: string): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= SNIPPET_LIMIT) return collapsed;
  return `${collapsed.slice(0, SNIPPET_LIMIT - 1).trimEnd()}…`;
}

export function FindingCard({
  finding,
  open,
  selected,
  onOpenChange,
  onShowInMessage,
  registerCard,
}: {
  finding: ScamFinding;
  open: boolean;
  selected: boolean;
  onOpenChange: (open: boolean) => void;
  onShowInMessage: (ruleId: string) => void;
  /** Lets the owner scroll to and focus this card from the overview. */
  registerCard?: (ruleId: string, element: HTMLLIElement | null) => void;
}) {
  const extraMatches = finding.occurrences.length - 1;

  return (
    <li
      ref={(element) => registerCard?.(finding.ruleId, element)}
      data-rule-id={finding.ruleId}
      data-selected={selected ? "true" : "false"}
      // Focus lands here when the card is opened from the overview or from a
      // highlight. A container is the right target: it is announced with its
      // contents, and it does not add a second tab stop next to the toggle.
      tabIndex={-1}
      className={cn(
        "lens-scroll-target rounded-2xl border bg-background/40 outline-none transition-colors",
        "focus-visible:ring-[3px] focus-visible:ring-primary/45",
        selected ? "border-primary/60" : "border-border/70",
      )}
    >
      <Disclosure
        open={open}
        onOpenChange={onOpenChange}
        className="rounded-2xl"
        triggerClassName="rounded-2xl p-4 hover:bg-secondary/25"
        contentClassName="px-4 pb-4"
        trigger={
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  SEVERITY_DOT[finding.severity],
                )}
                aria-hidden="true"
              />
              <Badge
                variant="outline"
                className={cn(
                  "text-[0.5625rem] font-semibold uppercase tracking-[0.12em]",
                  SEVERITY_CHIP[finding.severity],
                )}
              >
                {SEVERITY_LABEL[finding.severity]}
              </Badge>
              <span className="text-sm font-semibold tracking-tight text-balance">
                {finding.label}
              </span>
              {selected && (
                <span className="text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-accent">
                  Selected
                </span>
              )}
            </span>

            <span className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-mono text-xs tabular-nums text-foreground">
                +{finding.weight} points
              </span>
              {extraMatches > 0 && (
                <span className="text-[0.6875rem] tabular-nums text-muted-foreground">
                  found in {finding.occurrences.length} places, counted once
                </span>
              )}
            </span>

            <span className="mt-2 block break-words font-mono text-[0.75rem] leading-relaxed text-muted-foreground">
              {snippetOf(finding.matchedText)}
            </span>
          </span>
        }
      >
        <div className="space-y-3 border-t border-border/50 pt-4">
          <div>
            <h5 className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Matched evidence
            </h5>
            <p className="mt-1.5 break-words font-mono text-[0.8125rem] leading-relaxed text-foreground/90">
              {finding.matchedText}
            </p>
            {finding.matchedPhrases.length > 1 && (
              <ul className="mt-2 space-y-1">
                {finding.matchedPhrases.map((phrase) => (
                  <li
                    key={phrase}
                    className="break-words font-mono text-[0.75rem] text-muted-foreground"
                  >
                    · {phrase}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h5 className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Why this matters
            </h5>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
              {finding.explanation}
            </p>
          </div>

          <div className="flex gap-2 rounded-xl border border-border/60 bg-secondary/35 p-3">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0 text-accent"
              aria-hidden="true"
            />
            <p className="text-[0.8125rem] leading-relaxed">
              <span className="font-semibold text-foreground">Safe next step: </span>
              <span className="text-muted-foreground">{finding.safeNextStep}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => onShowInMessage(finding.ruleId)}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-xl border border-border/70 bg-background/50 px-3 py-2",
              "text-xs font-medium text-foreground outline-none transition-colors",
              "hover:border-primary/50 hover:bg-secondary/40",
              "focus-visible:ring-[3px] focus-visible:ring-primary/45",
            )}
          >
            <Crosshair className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
            Show in message
          </button>
        </div>
      </Disclosure>
    </li>
  );
}
