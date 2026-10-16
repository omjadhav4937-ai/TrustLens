import { Section, SectionHeading } from "@/components/trust-lens/section";
import { SECTION_IDS, TRUST_POINTS } from "@/data/trust-lens";
import { cn } from "@/lib/utils";

export function TrustIndicators() {
  return (
    <Section id={SECTION_IDS.trust} className="border-y border-border/60 bg-card/40">
      <SectionHeading
        eyebrow="Our approach"
        title="Built to be trusted with your messages"
        description="No accounts, no uploads, and no black box. TrustLens is designed for the moment a message does not feel right — for everyday internet users, students, and professionals alike."
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
