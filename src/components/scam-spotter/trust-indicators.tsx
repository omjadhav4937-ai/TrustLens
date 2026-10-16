import { Section, SectionHeading } from "@/components/scam-spotter/section";
import { SECTION_IDS, TRUST_POINTS } from "@/data/scam-spotter";
import { cn } from "@/lib/utils";

export function TrustIndicators() {
  return (
    <Section id={SECTION_IDS.trust} className="border-y border-border/60 bg-card/40">
      <SectionHeading
        eyebrow="Why it exists"
        title="Built to explain, not to guess"
        description="Three principles shape the project. None of them require you to hand over your messages."
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TRUST_POINTS.map((point) => (
          <div
            key={point.title}
            className={cn(
              "group rounded-2xl border border-border/70 bg-card/70 p-6",
              "transition-colors hover:border-primary/40",
            )}
          >
            <span
              className="flex size-11 items-center justify-center rounded-xl border border-border/70 bg-secondary/70 text-primary transition-colors group-hover:border-primary/40 group-hover:text-accent"
              aria-hidden="true"
            >
              <point.icon className="size-5" />
            </span>
            <h3 className="mt-5 text-base font-semibold tracking-tight">
              {point.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {point.description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
