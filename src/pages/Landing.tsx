import { About } from "@/components/trust-lens/about";
import { Analyzer } from "@/components/trust-lens/analyzer";
import { Capabilities } from "@/components/trust-lens/capabilities";
import { Hero } from "@/components/trust-lens/hero";
import { HowItWorks } from "@/components/trust-lens/how-it-works";
import { ResultsPanel } from "@/components/trust-lens/results-panel";
import { SafetyNotice } from "@/components/trust-lens/safety-notice";
import { SiteFooter } from "@/components/trust-lens/site-footer";
import { SiteHeader } from "@/components/trust-lens/site-header";
import { TrustIndicators } from "@/components/trust-lens/trust-indicators";
import { SECTION_IDS } from "@/data/trust-lens";
import type { ScamAnalysis } from "@/lib/scam-detection";
import { motion } from "framer-motion";
import { useCallback, useState } from "react";

export default function Landing() {
  /**
   * The single source of truth for the report. `null` means there is no result
   * that matches what is currently in the analyzer, so no stale analysis can be
   * shown against a message the user has since edited.
   */
  const [analysis, setAnalysis] = useState<ScamAnalysis | null>(null);

  const handleAnalysisChange = useCallback(
    (next: ScamAnalysis | null) => setAnalysis(next),
    [],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex min-h-screen flex-col bg-background"
    >
      <a
        href={`#${SECTION_IDS.analyzer}`}
        className="sr-only rounded-md focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:ring-2 focus:ring-ring"
      >
        Skip to the message analyzer
      </a>

      <SiteHeader />

      <main className="flex-1">
        <Hero />
        <TrustIndicators />
        <HowItWorks />
        <Capabilities />
        <Analyzer onAnalysisChange={handleAnalysisChange} />
        <ResultsPanel analysis={analysis} />
        <SafetyNotice />
        <About />
      </main>

      <SiteFooter />
    </motion.div>
  );
}
