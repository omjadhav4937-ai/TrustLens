import { Reveal } from "@/components/trust-lens/reveal";
import { ResultsExplorer } from "@/components/trust-lens/results-explorer";
import { Section, SectionHeading } from "@/components/trust-lens/section";
import { RULES, type ScamAnalysis } from "@/lib/scam-detection";
import { SECTION_IDS } from "@/data/trust-lens";
import { ScanSearch } from "lucide-react";

/**
 * The report shell.
 *
 * It decides only between "nothing has been checked" and the interactive
 * explorer; the investigation state itself lives in `ResultsExplorer`, so a new
 * analysis replaces the whole subtree and no selection can survive into a
 * different message.
 */
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
        Your report appears here: a risk score, the warning signs behind it, the
        exact text that matched, and a link check.
      </p>
      <p className="mx-auto mt-4 max-w-lg text-xs leading-relaxed text-muted-foreground">
        {RULES.length} warning-sign rules and a set of link heuristics run
        entirely inside your browser. Nothing is uploaded, stored or sent
        anywhere.
      </p>
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
            analysis ? "Here is what TrustLens found" : "Your result will appear here"
          }
          description={
            analysis
              ? "Every point comes from a written rule. Work through the warning signs, check the evidence in your own message, then read what to do next."
              : "Paste a message in the analyzer above and select Analyze Message. Nothing is stored and nothing is sent anywhere."
          }
        />
      </Reveal>

      <Reveal delay={0.08}>
        <div className="mx-auto mt-12 max-w-6xl">
          {analysis ? (
            // Keyed on the analysis timestamp so a new result starts from a clean
            // slate: no stale selection, no card left open from the last message.
            <ResultsExplorer key={analysis.analyzedAt} analysis={analysis} />
          ) : (
            <EmptyReport />
          )}
        </div>
      </Reveal>
    </Section>
  );
}
