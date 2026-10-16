import { About } from "@/components/scam-spotter/about";
import { Analyzer } from "@/components/scam-spotter/analyzer";
import { Features } from "@/components/scam-spotter/features";
import { Hero } from "@/components/scam-spotter/hero";
import { HowItWorks } from "@/components/scam-spotter/how-it-works";
import { ResultsPlaceholder } from "@/components/scam-spotter/results-placeholder";
import { SiteFooter } from "@/components/scam-spotter/site-footer";
import { SiteHeader } from "@/components/scam-spotter/site-header";
import { TrustIndicators } from "@/components/scam-spotter/trust-indicators";
import { SECTION_IDS } from "@/data/scam-spotter";
import { motion } from "framer-motion";
import { useCallback, useState } from "react";

export default function Landing() {
  // Tracks whether the visitor has asked for an analysis. Step 1 has no
  // detection engine, so this only drives the "no analysis performed" notice.
  const [analysisRequested, setAnalysisRequested] = useState(false);

  const handleAnalyzeRequest = useCallback(() => {
    setAnalysisRequested(true);
  }, []);

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
        <Features />
        <Analyzer onSubmit={handleAnalyzeRequest} />
        <ResultsPlaceholder requested={analysisRequested} />
        <About />
      </main>

      <SiteFooter />
    </motion.div>
  );
}
