import { Reveal } from "@/components/trust-lens/reveal";
import { Section, SectionHeading } from "@/components/trust-lens/section";
import { HOW_IT_WORKS_STEPS, SECTION_IDS } from "@/data/trust-lens";
import { cn } from "@/lib/utils";

/**
 * The four steps stay flat on purpose. They are read in sequence, so turning
 * them over would hide the explanation a reader is working through. The motion
 * here is limited to a gentle lift and a border glow instead.
 *
 * The list is wrapped in a single `<Reveal>` rather than one per step, so the
 * `<li>` elements stay direct children of the `<ol>` and the list keeps its
 * meaning for assistive technology.
 */
export function HowItWorks() {
  return (
    <Section id={SECTION_IDS.howItWorks}>
      <Reveal>
        <SectionHeading
          eyebrow="How it works"
          title="Four steps from suspicion to a safe decision"
          description="The flow is deliberately short. You stay in control of your message at every point along the way."
        />
      </Reveal>

      <Reveal delay={0.08}>
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <li
              key={step.step}
              className={cn(
                "group lens-panel relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 p-6",
                "transition-[transform,border-color,box-shadow] duration-300",
                "hover:-translate-y-1 hover:border-primary/40",
                "hover:shadow-[0_18px_40px_-28px_var(--primary)]",
              )}
            >
              <span
                className="pointer-events-none absolute inset-x-6 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, transparent, color-mix(in oklab, var(--primary) 60%, transparent), transparent)",
                }}
                aria-hidden="true"
              />

              <div className="flex items-center justify-between">
                <span
                  className="flex size-10 items-center justify-center rounded-xl border border-border/70 bg-secondary/70 text-primary transition-colors duration-300 group-hover:border-primary/40 group-hover:text-accent"
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

              <p className="mt-4 border-t border-border/50 pt-3 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
                {step.note}
              </p>
            </li>
          ))}
        </ol>
      </Reveal>
    </Section>
  );
}
