import { HighlightedMessage } from "@/components/trust-lens/highlighted-message";
import { Reveal } from "@/components/trust-lens/reveal";
import { ScoreRing } from "@/components/trust-lens/score-ring";
import { Section, SectionHeading } from "@/components/trust-lens/section";
import { Badge } from "@/components/ui/badge";
import {
  RULES,
  type AnalyzedLink,
  type FindingSeverity,
  type RiskLevel,
  type ScamAnalysis,
  type ScamFinding,
} from "@/lib/scam-detection";
import { SCORE_CAVEAT, SECTION_IDS } from "@/data/trust-lens";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

const RISK_STYLE: Record<RiskLevel, string> = {
  low: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
  medium: "border-amber-400/40 bg-amber-400/10 text-amber-100",
  high: "border-rose-400/40 bg-rose-400/10 text-rose-100",
};

const RISK_LABEL: Record<RiskLevel, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

const RISK_ICON = {
  low: ShieldCheck,
  medium: AlertTriangle,
  high: ShieldAlert,
} as const;

const SEVERITY_STYLE: Record<FindingSeverity, string> = {
  low: "border-sky-400/40 bg-sky-400/10 text-sky-100",
  medium: "border-amber-400/40 bg-amber-400/10 text-amber-100",
  high: "border-orange-400/40 bg-orange-400/10 text-orange-100",
  critical: "border-rose-400/40 bg-rose-400/10 text-rose-100",
};

const SEVERITY_LABEL: Record<FindingSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

function Chip({ className, children }: { className: string; children: ReactNode }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em]",
        className,
      )}
    >
      {children}
    </Badge>
  );
}

function FindingCard({ finding }: { finding: ScamFinding }) {
  const extraMatches = finding.occurrences.length - 1;

  return (
    <li className="rounded-2xl border border-border/70 bg-background/40 p-5 transition-colors duration-300 hover:border-primary/30">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Chip className={SEVERITY_STYLE[finding.severity]}>
            {SEVERITY_LABEL[finding.severity]}
          </Chip>
          <h5 className="text-sm font-semibold tracking-tight">{finding.label}</h5>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          +{finding.weight} points
        </span>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Matched text:{" "}
        <span className="break-words font-mono text-[0.75rem] text-foreground/90">
          {finding.matchedText}
        </span>
        {extraMatches > 0 && (
          <span className="text-muted-foreground">
            {" "}
            · {extraMatches} more {extraMatches === 1 ? "match" : "matches"} in this
            message
          </span>
        )}
      </p>

      <p className="mt-3 text-[0.8125rem] leading-relaxed text-muted-foreground">
        {finding.explanation}
      </p>

      <p className="mt-3 flex gap-2 border-t border-border/50 pt-3 text-[0.8125rem] leading-relaxed">
        <ShieldCheck
          className="mt-0.5 size-4 shrink-0 text-accent"
          aria-hidden="true"
        />
        <span>
          <span className="font-semibold text-foreground">Safe next step: </span>
          <span className="text-muted-foreground">{finding.safeNextStep}</span>
        </span>
      </p>
    </li>
  );
}

function LinkChecks({ links }: { links: AnalyzedLink[] }) {
  return (
    <div className="mt-8">
      <h4 className="text-sm font-semibold tracking-tight">
        Links found in this message
      </h4>

      <ul className="mt-3 space-y-3">
        {links.map((link) => {
          const strong = link.indicators.filter(
            (indicator) => indicator.strength === "strong",
          ).length;
          const weak = link.indicators.length - strong;

          return (
            <li
              key={`${link.start}-${link.url}`}
              className="rounded-2xl border border-border/70 bg-background/40 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                {/* Rendered as inert text on purpose: TrustLens never opens a link. */}
                <code className="break-all font-mono text-xs text-foreground/90">
                  {link.url}
                </code>
                <Chip
                  className={
                    link.suspicious
                      ? "border-amber-400/40 bg-amber-400/10 text-amber-100"
                      : "border-border/70 text-muted-foreground"
                  }
                >
                  {link.suspicious
                    ? strong > 0
                      ? `${strong} strong indicator${strong === 1 ? "" : "s"}`
                      : `${weak} weak indicators`
                    : "No indicators"}
                </Chip>
              </div>

              {link.host && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Domain:{" "}
                  <span className="font-mono text-foreground/80">{link.host}</span>
                </p>
              )}

              {link.indicators.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {link.indicators.map((indicator) => (
                    <li key={indicator.id} className="flex gap-2.5">
                      <span
                        className={cn(
                          "mt-1.5 size-1.5 shrink-0 rounded-full",
                          indicator.strength === "strong"
                            ? "bg-amber-300"
                            : "bg-muted-foreground/60",
                        )}
                        aria-hidden="true"
                      />
                      <span className="text-xs leading-relaxed">
                        <span className="font-semibold text-foreground/90">
                          {indicator.label}:{" "}
                        </span>
                        <span className="text-muted-foreground">
                          {indicator.explanation}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        These checks read the shape of an address only — the host, the ending,
        the hyphenation. They do not verify who owns a domain, how it is
        regarded, or whether a website is reachable, and TrustLens never opens a
        link. Treat every indicator as a reason for care, not as proof.
      </p>
    </div>
  );
}

function EmptyReport() {
  return (
    <div className="rounded-3xl border border-dashed border-border/80 lens-panel p-8 text-center sm:p-12">
      <span
        className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-secondary/60 text-primary"
        aria-hidden="true"
      >
        <ScanSearch className="size-6" />
      </span>
      <h3 className="mt-5 text-base font-semibold tracking-tight">
        Nothing has been checked yet
      </h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
        Paste a message in the analyzer above — or load the sample scam message —
        then select <span className="font-medium text-foreground">Analyze Message</span>.
        Your full report appears here.
      </p>
      <p className="mx-auto mt-4 max-w-lg text-xs leading-relaxed text-muted-foreground">
        {RULES.length} warning-sign rules and a set of link heuristics run
        entirely inside your browser. Nothing is uploaded, stored or sent
        anywhere.
      </p>
    </div>
  );
}

function AnalysisReport({ analysis }: { analysis: ScamAnalysis }) {
  const { riskLevel, score, findings, summary, links, matchedRuleIds, analyzedAt } =
    analysis;

  const RiskIcon = RISK_ICON[riskLevel];
  const checkedAt = new Date(analyzedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-3xl border border-border/80 lens-panel p-5 shadow-xl sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">
            Analysis results
          </h3>
          <p className="mt-1 text-xs tabular-nums text-muted-foreground">
            Checked at {checkedAt} · {matchedRuleIds.length} of {RULES.length}{" "}
            rules matched
          </p>
        </div>
        <Chip className={RISK_STYLE[riskLevel]}>
          <RiskIcon className="size-3" aria-hidden="true" />
          {RISK_LABEL[riskLevel]}
        </Chip>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex flex-col items-center gap-2">
          <ScoreRing score={score} riskLevel={riskLevel} />
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Risk score
          </span>
        </div>

        <div>
          <h4 className="text-sm font-semibold tracking-tight">What this means</h4>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            {summary}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {SCORE_CAVEAT}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h4 className="text-sm font-semibold tracking-tight">
          Warning signs detected
        </h4>

        {findings.length === 0 ? (
          <p className="mt-3 flex gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-[0.8125rem] leading-relaxed text-emerald-50">
            <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              None of the {RULES.length} configured warning signs matched this
              message. That is a good sign, but it is not a clean bill of health:
              TrustLens only recognises the patterns it knows about.
            </span>
          </p>
        ) : (
          <ul className="mt-3 space-y-4">
            {findings.map((finding) => (
              <FindingCard key={finding.ruleId} finding={finding} />
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8">
        <h4 className="text-sm font-semibold tracking-tight">
          Your message, with matches marked
        </h4>
        <div className="mt-3 rounded-2xl border border-border/70 bg-background/40 p-4">
          <HighlightedMessage message={analysis.message} findings={findings} />
        </div>
      </div>

      {links.length > 0 && <LinkChecks links={links} />}
    </div>
  );
}

export function ResultsPanel({ analysis }: { analysis: ScamAnalysis | null }) {
  return (
    <Section id={SECTION_IDS.results} className="pt-0 sm:pt-0">
      <Reveal>
        <SectionHeading
          eyebrow="Your risk report"
          title={
            analysis
              ? "Here is what TrustLens found"
              : "Your result will appear here"
          }
          description={
            analysis
              ? "Every point below comes from a written rule. Read the summary first, then the warning signs and the exact text that matched."
              : "Paste a message in the analyzer above and select Analyze Message. Nothing is stored and nothing is sent anywhere."
          }
        />
      </Reveal>

      <Reveal delay={0.08}>
        <div className="mx-auto mt-12 max-w-4xl">
          {analysis ? <AnalysisReport analysis={analysis} /> : <EmptyReport />}
        </div>
      </Reveal>
    </Section>
  );
}
