import { MAX_SCORE, type ScamAnalysis, type ScamFinding } from "@/lib/scam-detection";
import { cn } from "@/lib/utils";

/**
 * How the final score was built, shown as arithmetic rather than as a chart.
 *
 * There is deliberately no bar, ring or percentage here. The weights are
 * heuristic, so drawing them to scale would imply a precision the engine does
 * not have. The numbers themselves are the honest presentation.
 */

const SEVERITY_ACCENT: Record<string, string> = {
  low: "bg-sky-400/70",
  medium: "bg-amber-400/70",
  high: "bg-orange-400/70",
  critical: "bg-rose-400/70",
};

function ContributionRow({ finding }: { finding: ScamFinding }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="flex min-w-0 items-baseline gap-2.5">
        <span
          className={cn(
            "mt-1.5 size-1.5 shrink-0 rounded-full",
            SEVERITY_ACCENT[finding.severity],
          )}
          aria-hidden="true"
        />
        <span className="text-[0.8125rem] leading-snug text-foreground/90">
          {finding.label}
        </span>
      </dt>
      <dd className="shrink-0 font-mono text-[0.8125rem] tabular-nums text-foreground">
        +{finding.weight}
      </dd>
    </div>
  );
}

function TotalRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt
        className={cn(
          "text-[0.8125rem]",
          emphasis
            ? "font-semibold text-foreground"
            : "text-muted-foreground",
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "font-mono tabular-nums",
          emphasis
            ? "text-base font-semibold text-foreground"
            : "text-[0.8125rem] text-muted-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function ScoreContributions({ analysis }: { analysis: ScamAnalysis }) {
  const { findings, rawScore, score, scoreWasCapped, links } = analysis;

  const suspiciousLinks = links.filter((link) => link.suspicious);
  const indicatorCount = suspiciousLinks.reduce(
    (total, link) => total + link.indicators.length,
    0,
  );
  const linkRule = analysis.ruleEvaluations.find(
    (evaluation) => evaluation.ruleId === "suspicious-link",
  );

  if (findings.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-background/40 p-5">
        <h4 className="text-sm font-semibold tracking-tight">
          How this score was built
        </h4>
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
          No configured rule contributed any points, so the score is 0. That is a
          count of the rules that matched and nothing more.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-background/40 p-5">
      <h4 className="text-sm font-semibold tracking-tight">
        How this score was built
      </h4>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Each matched rule is added once, whatever its points. The individual
        weights are added up and the total is then capped at {MAX_SCORE}.
      </p>

      <dl className="mt-4 divide-y divide-border/50 border-y border-border/50">
        {findings.map((finding) => (
          <ContributionRow key={finding.ruleId} finding={finding} />
        ))}
      </dl>

      <dl className="mt-4 space-y-2.5">
        <TotalRow label="Sum of matched rule weights" value={`${rawScore}`} />

        {scoreWasCapped && (
          <>
            <TotalRow
              label={`Capped at the maximum of ${MAX_SCORE}`}
              value={`−${rawScore - MAX_SCORE}`}
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              The matched rules add up to more than {MAX_SCORE}, so the score
              stops at {MAX_SCORE}. The points above the cap do not change how
              risky the message is.
            </p>
          </>
        )}

        <div className="border-t border-border/50 pt-2.5">
          <TotalRow label="Final score" value={`${score} / ${MAX_SCORE}`} emphasis />
        </div>
      </dl>

      {linkRule?.status === "matched" && indicatorCount > 0 && (
        <p className="mt-4 border-t border-border/50 pt-4 text-xs leading-relaxed text-muted-foreground">
          {indicatorCount} link indicator{indicatorCount === 1 ? "" : "s"} across{" "}
          {suspiciousLinks.length} link
          {suspiciousLinks.length === 1 ? "" : "s"} produced a single{" "}
          {linkRule.weight}-point contribution. Scoring is per rule, so a link
          that raises several flags is never counted several times.
        </p>
      )}
    </div>
  );
}
