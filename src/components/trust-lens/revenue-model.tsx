import { Reveal } from "@/components/trust-lens/reveal";
import { Section, SectionHeading } from "@/components/trust-lens/section";
import {
  REVENUE_CHANNELS,
  REVENUE_PRIVACY_NOTE,
  SECTION_IDS,
} from "@/data/trust-lens";
import { Lock } from "lucide-react";

/**
 * How the product could earn revenue, kept deliberately short.
 *
 * No figure, customer count or conversion rate is claimed anywhere here: the
 * model is an intention, not a forecast.
 */
export function RevenueModel() {
  return (
    <Section id={SECTION_IDS.businessModel}>
      <Reveal>
        <SectionHeading
          eyebrow="Business model"
          title="How TrustLens could earn revenue"
          description="A model built on additional convenience and organisational capability — not on selling the messages people check."
        />
      </Reveal>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {REVENUE_CHANNELS.map((channel, index) => {
          const Icon = channel.icon;
          return (
            <Reveal key={channel.audience} delay={0.05 * index} className="h-full">
              <article className="flex h-full flex-col rounded-2xl border border-border/75 lens-panel p-5 transition-colors duration-300 hover:border-primary/35">
                <span
                  className="flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary"
                  aria-hidden="true"
                >
                  <Icon className="size-4" />
                </span>
                <p className="mt-4 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {channel.audience}
                </p>
                <h3 className="mt-1.5 text-sm font-semibold tracking-tight">
                  {channel.title}
                </h3>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
                  {channel.description}
                </p>
              </article>
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={0.08}>
        <div className="mx-auto mt-6 flex max-w-4xl items-start gap-3 rounded-2xl border border-border/70 bg-background/40 p-4">
          <Lock className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {REVENUE_PRIVACY_NOTE}
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
