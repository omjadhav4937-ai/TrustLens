import { ScoreRing } from "@/components/trust-lens/score-ring";
import {
  RISK_CHIP,
  RISK_LABEL,
  SEVERITY_CHIP,
  SEVERITY_DOT,
  SEVERITY_LABEL,
} from "@/components/trust-lens/severity";
import { Badge } from "@/components/ui/badge";
import { SCORE_CAVEAT } from "@/data/trust-lens";
import { MAX_SCORE, RULES, type ScamAnalysis } from "@/lib/scam-detection";
import { cn } from "@/lib/utils";
import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";

/**
 * The verdict, kept deliberately short.
 *
 * Everything here is the engine's own output: the score, the band the published
 * thresholds put it in, and the counts the evaluation pass produced. Nothing is
 * recomputed for display.
 */

const RISK_ICON = {
  low: ShieldCheck,
  medium: AlertTriangle,
  high: ShieldAlert,
} as const;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-sm tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

export function RiskOverview({
  analysis,
  selectedRuleId,
  onSelectFinding,
}: {
  analysis: ScamAnalysis;
  selectedRuleId: string | null;
  onSelectFinding: (ruleId: string) => void;
}) {
  const { riskLevel, score, findings, evaluatedRuleCount, analyzedAt } = analysis;
  const RiskIcon = RISK_ICON[riskLevel];

  return (
    <div className="rounded-3xl border border-border/80 lens-panel p-5 shadow-xl sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-8">
        <div className="flex flex-col items-center gap-2">
          {/*
            Keyed on the analysis timestamp so the ring replays its fill from
            zero for every new result, including two messages that score the
            same. Reduced motion draws it at its final value.
          */}
          <ScoreRing key={analyzedAt} score={score} riskLevel={riskLevel} />
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Risk score
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em]",
                RISK_CHIP[riskLevel],
              )}
            >
              <RiskIcon className="size-3.5" aria-hidden="true" />
              {RISK_LABEL[riskLevel]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {score} out of {MAX_SCORE}
            </span>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-foreground/90">
            {analysis.scoreExplanation}
          </p>

          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
            <Stat label="Warning signs matched" value={String(findings.length)} />
            <Stat
              label="Rules evaluated"
              value={`${evaluatedRuleCount} of ${RULES.length}`}
            />
          </dl>

          <p className="mt-4 border-t border-border/60 pt-3 text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground/80">A caveat: </span>
            {SCORE_CAVEAT}
          </p>
        </div>
      </div>

      {findings.length > 0 ? (
        <div className="mt-6 border-t border-border/60 pt-5">
          <h4 className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Warning signs found — select one to open its evidence
          </h4>
          <ul className="mt-3 flex flex-wrap gap-2">
            {findings.map((finding) => {
              const selected = selectedRuleId === finding.ruleId;
              return (
                <li key={finding.ruleId}>
                  <button
                    type="button"
                    data-rule-id={finding.ruleId}
                    aria-pressed={selected}
                    onClick={() => onSelectFinding(finding.ruleId)}
                    className={cn(
                      "flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs",
                      "outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-primary/45",
                      selected
                        ? "border-primary/70 bg-primary/15 text-foreground"
                        : "border-border/70 bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        SEVERITY_DOT[finding.severity],
                      )}
                      aria-hidden="true"
                    />
                    <span className="font-medium text-foreground">
                      {finding.label}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 text-[0.5625rem] font-semibold uppercase tracking-[0.1em]",
                        SEVERITY_CHIP[finding.severity],
                      )}
                    >
                      {SEVERITY_LABEL[finding.severity]}
                    </Badge>
                    <span className="shrink-0 font-mono tabular-nums">
                      +{finding.weight}
                    </span>
                    {selected && (
                      <span className="shrink-0 text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-accent">
                        Selected
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="mt-6 border-t border-border/60 pt-5 text-xs leading-relaxed text-muted-foreground">
          No configured warning sign matched this message, so there is nothing to
          open. That is a count of the rules that ran — not a clean bill of
          health.
        </p>
      )}
    </div>
  );
}
