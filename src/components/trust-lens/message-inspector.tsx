import { HighlightedMessage } from "@/components/trust-lens/highlighted-message";
import type { ScamAnalysis } from "@/lib/scam-detection";
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
 */
export function MessageInspector({
  analysis,
  selectedRuleId,
  showAll,
  pulsingRuleId,
  onSelectRule,
  onShowAll,
  onClearSelection,
  registerMark,
}: {
  analysis: ScamAnalysis;
  selectedRuleId: string | null;
  showAll: boolean;
  pulsingRuleId: string | null;
  onSelectRule: (ruleId: string) => void;
  onShowAll: () => void;
  onClearSelection: () => void;
  registerMark: (ruleId: string, element: HTMLButtonElement | null) => void;
}) {
  const { message, findings } = analysis;
  const hasText = message.trim().length > 0;

  const markCount = useMemo(
    () =>
      findings.reduce((total, finding) => total + finding.occurrences.length, 0),
    [findings],
  );

  const selectedLabel = useMemo(
    () => findings.find((finding) => finding.ruleId === selectedRuleId)?.label ?? null,
    [findings, selectedRuleId],
  );

  const status = !hasText
    ? "This result has no message text to inspect."
    : markCount === 0
      ? "No matches to mark. The message is shown exactly as it was entered."
      : selectedLabel
        ? `Showing ${selectedLabel}. Its matches are emphasised; the others remain readable.`
        : showAll
          ? `All ${markCount} matches are emphasised.`
          : `${markCount} matches marked across ${findings.length} warning sign${
              findings.length === 1 ? "" : "s"
            }.`;

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
            message={message}
            findings={findings}
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
