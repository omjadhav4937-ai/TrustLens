import { Disclosure } from "@/components/trust-lens/disclosure";
import { ScoreContributions } from "@/components/trust-lens/score-contributions";
import { Badge } from "@/components/ui/badge";
import { COVERAGE_STATUS_HELP, DETECTION_LIMITATIONS } from "@/data/trust-lens";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { RULES, type RuleEvaluation, type RuleEvaluationStatus, type ScamAnalysis } from "@/lib/scam-detection";
import { cn } from "@/lib/utils";
import { ChevronDown, Info } from "lucide-react";
import { useState } from "react";

/**
 * Every configured rule and what it decided.
 *
 * `not-evaluated` and `error` are reported as their own states, never folded
 * into "not matched". A rule the engine did not run has not cleared the
 * message, and the coverage summary must not imply that it has.
 */

const STATUS_CHIP: Record<RuleEvaluationStatus, string> = {
  matched: "border-amber-400/40 bg-amber-400/10 text-amber-100",
  "not-matched": "border-border/70 bg-secondary/50 text-muted-foreground",
  "not-evaluated": "border-border/60 text-muted-foreground",
  error: "border-rose-400/40 bg-rose-400/10 text-rose-100",
};

const STATUS_LABEL: Record<RuleEvaluationStatus, string> = {
  matched: "Matched",
  "not-matched": "Not matched",
  "not-evaluated": "Not evaluated",
  error: "Could not run",
};

/** Compact visual coverage: fill for matched, hairline for not matched, dashed for unknown. */
const STATUS_PIP: Record<RuleEvaluationStatus, string> = {
  matched: "bg-amber-300",
  "not-matched": "bg-border",
  "not-evaluated": "border border-dashed border-muted-foreground/50 bg-transparent",
  error: "bg-rose-400/70",
};

function StatusChip({ status }: { status: RuleEvaluationStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 text-[0.5625rem] font-semibold uppercase tracking-[0.1em]",
        STATUS_CHIP[status],
      )}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}

/** One rule's compact summary, with its detail revealed on demand. */
export function RuleRow({
  evaluation,
  open,
  onOpenChange,
}: {
  evaluation: RuleEvaluation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const matched = evaluation.status === "matched";
  const occurrences = evaluation.occurrences.length;

  return (
    <li className="rounded-xl border border-border/60 bg-background/50">
      <Disclosure
        open={open}
        onOpenChange={onOpenChange}
        className="rounded-xl"
        triggerClassName="min-h-11 rounded-xl px-3 py-2.5 hover:bg-secondary/30"
        contentClassName="px-3 pb-3"
        trigger={
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "h-3 w-1.5 shrink-0 rounded-full",
                  STATUS_PIP[evaluation.status],
                )}
                aria-hidden="true"
              />
              <span className="text-xs font-medium text-foreground">
                {evaluation.label}
              </span>
              <StatusChip status={evaluation.status} />
              <span
                className={cn(
                  "font-mono text-[0.6875rem] tabular-nums",
                  matched ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {matched ? `+${evaluation.contributedPoints}` : "0"} pts
              </span>
            </span>
          </span>
        }
      >
        <div className="space-y-2 border-t border-border/50 pt-3">
          <dl className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <div className="flex items-baseline gap-1.5">
              <dt className="text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground">
                Max possible
              </dt>
              <dd className="font-mono text-xs tabular-nums text-muted-foreground">
                {evaluation.weight} pts
              </dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt className="text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground">
                Contributed
              </dt>
              <dd
                className={cn(
                  "font-mono text-xs tabular-nums",
                  matched ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {evaluation.contributedPoints} pts
              </dd>
            </div>
          </dl>

          <p className="text-xs leading-relaxed text-muted-foreground">
            {evaluation.description}
          </p>

          {matched && evaluation.matchedText !== null && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Counted text:{" "}
              <span className="break-words font-mono text-[0.75rem] text-foreground/90">
                {evaluation.matchedText}
              </span>
              {occurrences > 1 && <> · found in {occurrences} places, counted once</>}
            </p>
          )}

          {evaluation.status === "not-matched" && !evaluation.note && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              No matching indicator detected.
            </p>
          )}

          {evaluation.status === "not-evaluated" && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              This rule did not run for this result, so it says nothing at all
              about the message.
            </p>
          )}

          {evaluation.note && (
            <p className="flex gap-2 rounded-lg border border-border/60 bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
              <span>{evaluation.note}</span>
            </p>
          )}
        </div>
      </Disclosure>
    </li>
  );
}

export function RuleCoverage({
  analysis,
  defaultOpen = false,
}: {
  analysis: ScamAnalysis;
  /** The panel starts collapsed so the report stays compact; a caller may open it. */
  defaultOpen?: boolean;
}) {
  const { ruleEvaluations, evaluatedRuleCount } = analysis;
  const [open, setOpen] = useState(defaultOpen);
  const [openRuleIds, setOpenRuleIds] = useState<string[]>([]);

  const matchedCount = ruleEvaluations.filter(
    (evaluation) => evaluation.status === "matched",
  ).length;
  const statusSummary = ruleEvaluations
    .map((evaluation) => `${evaluation.label}: ${STATUS_LABEL[evaluation.status]}`)
    .join(". ");

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-2xl border border-border/70 bg-background/40"
    >
      <CollapsibleTrigger
        className={cn(
          "lens-panel-trigger flex min-h-11 w-full items-start justify-between gap-4 rounded-2xl p-5 text-left",
          "outline-none focus-visible:ring-[3px] focus-visible:ring-primary/45",
          "hover:bg-secondary/25",
        )}
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold tracking-tight">
            Rule coverage
          </span>
          <span className="mt-1 block text-xs tabular-nums text-muted-foreground">
            {matchedCount} matched · {evaluatedRuleCount - matchedCount} not matched
            {evaluatedRuleCount < RULES.length
              ? ` · ${RULES.length - evaluatedRuleCount} not evaluated`
              : ""}
          </span>
          {/* Compact coverage readout. Shape as well as colour, and the counts
              above carry the same information in words. */}
          <span className="mt-2 flex items-center gap-1" aria-hidden="true">
            {ruleEvaluations.map((evaluation) => (
              <span
                key={evaluation.ruleId}
                className={cn(
                  "h-3 w-1.5 rounded-full",
                  STATUS_PIP[evaluation.status],
                )}
              />
            ))}
          </span>
          <span className="sr-only">{statusSummary}</span>
        </span>
        <ChevronDown
          className="lens-panel-chevron mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="lens-panel-content">
        <div className="space-y-4 px-5 pb-5">
          <ScoreContributions analysis={analysis} />

          <ul className="space-y-2">
            {ruleEvaluations.map((evaluation) => {
              const rowOpen = openRuleIds.includes(evaluation.ruleId);
              return (
                <RuleRow
                  key={evaluation.ruleId}
                  evaluation={evaluation}
                  open={rowOpen}
                  onOpenChange={(next) =>
                    setOpenRuleIds((current) =>
                      next
                        ? [...current, evaluation.ruleId]
                        : current.filter((id) => id !== evaluation.ruleId),
                    )
                  }
                />
              );
            })}
          </ul>

          <div className="border-t border-border/60 pt-4">
            <h4 className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              What each status means
            </h4>
            <dl className="mt-2 space-y-1.5">
              {COVERAGE_STATUS_HELP.map((help) => (
                <div key={help.status} className="flex gap-2 text-xs leading-relaxed">
                  <dt className="shrink-0 font-medium text-foreground/90">
                    {help.title}:
                  </dt>
                  <dd className="text-muted-foreground">{help.meaning}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="border-t border-border/60 pt-4">
            <h4 className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              What these rules still cannot tell apart
            </h4>
            <ul className="mt-2 space-y-1.5">
              {DETECTION_LIMITATIONS.map((limitation) => (
                <li
                  key={limitation}
                  className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                >
                  <span
                    className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/60"
                    aria-hidden="true"
                  />
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
