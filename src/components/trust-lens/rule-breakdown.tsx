import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DETECTION_LIMITATIONS } from "@/data/trust-lens";
import type {
  RuleEvaluation,
  RuleEvaluationStatus,
  ScamAnalysis,
} from "@/lib/scam-detection";
import { cn } from "@/lib/utils";
import { ChevronDown, Info } from "lucide-react";

/**
 * Every configured rule, whether it matched, did not match, or never ran.
 *
 * `not-evaluated` is shown as its own state on purpose. A rule the engine never
 * ran is not evidence about the message, and presenting it as "no warning sign"
 * would be a claim the engine has not earned.
 */

const STATUS_STYLE: Record<RuleEvaluationStatus, string> = {
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

function StatusChip({ status }: { status: RuleEvaluationStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em]",
        STATUS_STYLE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}

function RuleRow({ evaluation }: { evaluation: RuleEvaluation }) {
  const matched = evaluation.status === "matched";
  const occurrences = evaluation.occurrences.length;

  return (
    <li className="rounded-xl border border-border/60 bg-background/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h5 className="text-[0.8125rem] font-semibold tracking-tight text-balance">
          {evaluation.label}
        </h5>
        <StatusChip status={evaluation.status} />
      </div>

      <dl className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <div className="flex items-baseline gap-1.5">
          <dt className="text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground">
            Max
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

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {evaluation.description}
      </p>

      {matched && evaluation.matchedText !== null && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Counted text:{" "}
          <span className="break-words font-mono text-[0.75rem] text-foreground/90">
            {evaluation.matchedText}
          </span>
          {occurrences > 1 && (
            <>
              {" "}
              · found in {occurrences} places, still counted once
            </>
          )}
        </p>
      )}

      {evaluation.status === "not-matched" && !evaluation.note && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          No matching indicator detected.
        </p>
      )}

      {evaluation.status === "not-evaluated" && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          This rule did not run for this result, so it says nothing at all about
          the message.
        </p>
      )}

      {evaluation.note && (
        <p className="mt-3 flex gap-2 rounded-lg border border-border/60 bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
          <span>{evaluation.note}</span>
        </p>
      )}
    </li>
  );
}

export function RuleBreakdown({ analysis }: { analysis: ScamAnalysis }) {
  const { ruleEvaluations, evaluatedRuleCount } = analysis;
  const matchedCount = ruleEvaluations.filter(
    (evaluation) => evaluation.status === "matched",
  ).length;

  return (
    <Collapsible
      defaultOpen
      className="rounded-2xl border border-border/70 bg-background/40"
    >
      <CollapsibleTrigger
        className={cn(
          "lens-panel-trigger flex w-full items-start justify-between gap-4 rounded-2xl p-5 text-left",
          "outline-none focus-visible:ring-primary/40 focus-visible:ring-[3px]",
          "hover:bg-secondary/30",
        )}
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold tracking-tight">
            Detection breakdown
          </span>
          <span className="mt-1 block text-xs tabular-nums text-muted-foreground">
            All {ruleEvaluations.length} configured rules · {evaluatedRuleCount}{" "}
            evaluated · {matchedCount} matched
          </span>
        </span>
        <ChevronDown
          className="lens-panel-chevron mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="lens-panel-content">
        <div className="px-5 pb-5">
          <p className="text-xs leading-relaxed text-muted-foreground">
            A rule that did not match means no indicator for that rule was found
            in this message. It is not a statement that the message is safe.
          </p>

          <ul className="mt-4 space-y-3">
            {ruleEvaluations.map((evaluation) => (
              <RuleRow key={evaluation.ruleId} evaluation={evaluation} />
            ))}
          </ul>

          <div className="mt-5 border-t border-border/60 pt-4">
            <h5 className="text-xs font-semibold tracking-tight">
              What these rules still cannot tell apart
            </h5>
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
