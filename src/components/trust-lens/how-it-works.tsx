import { Section, SectionHeading } from "@/components/trust-lens/section";
import { HOW_IT_WORKS_STEPS, SECTION_IDS } from "@/data/trust-lens";

export function HowItWorks() {
  return (
    <Section id={SECTION_IDS.howItWorks}>
      <SectionHeading
        eyebrow="How it works"
        title="Four steps from suspicion to a safe decision"
        description="The flow is deliberately short. You stay in control of your message at every point along the way."
      />

      <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {HOW_IT_WORKS_STEPS.map((step) => (
          <li
            key={step.step}
            className="relative flex flex-col rounded-2xl border border-border/70 bg-card/70 p-6 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center justify-between">
              <span
                className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-secondary/70 text-primary"
                aria-hidden="true"
              >
                <step.icon className="size-5" />
              </span>
              <span className="text-sm font-semibold tabular-nums text-muted-foreground/70">
                {step.step}
              </span>
            </div>
            <h3 className="mt-5 text-base font-semibold tracking-tight">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
