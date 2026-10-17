import { Reveal } from "@/components/trust-lens/reveal";
import { Section, SectionHeading } from "@/components/trust-lens/section";
import {
  REPORTING,
  SAFE_BEHAVIOUR,
  SCORE_LIMITATIONS,
  SECTION_IDS,
} from "@/data/trust-lens";
import { ExternalLink, Info, Phone, ShieldCheck } from "lucide-react";

/**
 * The safety notice is not tied to any single result, so it stays on the page
 * whether or not a message has been analysed. It carries the reporting details
 * for India and the limits of what the engine can actually claim.
 */
export function SafetyNotice() {
  return (
    <Section id={SECTION_IDS.safety}>
      <Reveal>
        <SectionHeading
          eyebrow="Safety and privacy"
          title="What a TrustLens score does and does not mean"
          description="TrustLens is a checking aid, not a guarantee. These limits apply to every result it produces."
        />
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-4xl gap-5 lg:grid-cols-2">
        <Reveal className="h-full">
          <div className="lens-panel flex h-full flex-col rounded-3xl border border-border/80 p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <Info className="size-4 text-primary" aria-hidden="true" />
              How to read your result
            </h3>
            <ul className="mt-4 space-y-3">
              {SCORE_LIMITATIONS.map((point) => (
                <li key={point} className="flex gap-3">
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/70"
                    aria-hidden="true"
                  />
                  <span className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.08} className="h-full">
          <div className="lens-panel flex h-full flex-col rounded-3xl border border-border/80 p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
              If a message looks suspicious
            </h3>
            <ul className="mt-4 space-y-3">
              {SAFE_BEHAVIOUR.map((point) => (
                <li key={point} className="flex gap-3">
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent/70"
                    aria-hidden="true"
                  />
                  <span className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                    {point}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-2xl border border-border/70 bg-background/40 p-4">
              <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                {REPORTING.body}
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.8125rem]">
                <a
                  href={REPORTING.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md font-medium text-primary underline-offset-4 transition-colors hover:text-accent hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
                >
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  {REPORTING.portalLabel}
                </a>
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground/90">
                  <Phone className="size-3.5" aria-hidden="true" />
                  Helpline {REPORTING.helpline}
                </span>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
