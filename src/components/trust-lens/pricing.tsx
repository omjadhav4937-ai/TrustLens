import { Reveal } from "@/components/trust-lens/reveal";
import { Section, SectionHeading } from "@/components/trust-lens/section";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PRICING_DISCLOSURE,
  PRICING_PLANS,
  SECTION_IDS,
  type PricingPlan,
} from "@/data/trust-lens";
import { scrollToSection } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import { Check, Info, Lock, Sparkles } from "lucide-react";

/**
 * Proposed consumer plans.
 *
 * Only the Free card describes something that exists. The two paid cards open a
 * short explanation instead of a checkout, and the disclosure under the grid
 * repeats that no subscription or payment flow is active.
 */

function PlanCard({ plan }: { plan: PricingPlan }) {
  const Icon = plan.icon;
  const featured = plan.featured === true;

  return (
    <article
      data-plan={plan.id}
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-3xl border p-6 sm:p-7",
        "transition-[border-color,box-shadow,transform] duration-300 motion-safe:hover:-translate-y-1",
        featured
          ? "border-primary/55 bg-card/80 shadow-[0_28px_70px_-42px_var(--primary)] hover:border-primary/80"
          : "border-border/80 lens-panel hover:border-primary/40",
      )}
    >
      {featured && (
        <>
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              backgroundImage:
                "linear-gradient(90deg, transparent, color-mix(in oklab, var(--accent) 80%, transparent), transparent)",
            }}
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 55%, transparent), transparent)",
            }}
            aria-hidden="true"
          />
        </>
      )}

      <div className="relative flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-2xl border",
            featured
              ? "border-primary/45 bg-primary/15 text-primary"
              : "border-border/70 bg-secondary/60 text-secondary-foreground",
          )}
          aria-hidden="true"
        >
          <Icon className="size-5" />
        </span>

        {featured && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/45 bg-accent/10 px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-accent">
            <Sparkles className="size-3" aria-hidden="true" />
            Most Popular
          </span>
        )}
      </div>

      <h3 className="relative mt-5 text-lg font-semibold tracking-tight">
        {plan.name}
      </h3>
      <p className="relative mt-1 min-h-[2.75rem] text-[0.8125rem] leading-relaxed text-muted-foreground">
        {plan.audience}
      </p>

      <p className="relative mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-4xl font-semibold tracking-tight tabular-nums">
          {plan.price}
        </span>
        <span className="text-sm text-muted-foreground">{plan.priceNote}</span>
      </p>

      <p className="relative mt-2 flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        <span
          className={cn(
            "size-1.5 rounded-full",
            plan.status === "available" ? "bg-emerald-400" : "bg-amber-300",
          )}
          aria-hidden="true"
        />
        {plan.availability}
      </p>

      <ul className="relative mt-6 space-y-3 border-t border-border/60 pt-6">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2.5 text-[0.8125rem] leading-relaxed">
            <Check
              className={cn(
                "mt-0.5 size-4 shrink-0",
                featured ? "text-accent" : "text-primary",
              )}
              aria-hidden="true"
            />
            <span className="text-foreground/90">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="relative mt-7 pt-1">
        {plan.status === "available" ? (
          <Button asChild size="lg" className="lens-cta-glow w-full">
            <a
              href={`#${SECTION_IDS.analyzer}`}
              onClick={(event) => {
                event.preventDefault();
                scrollToSection(SECTION_IDS.analyzer);
              }}
            >
              {plan.cta}
            </a>
          </Button>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                size="lg"
                variant={featured ? "default" : "outline"}
                className={cn("w-full", featured && "lens-cta-glow")}
              >
                {plan.cta}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{plan.name} plan</DialogTitle>
                <DialogDescription>{plan.availability}</DialogDescription>
              </DialogHeader>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {plan.dialogBody}
              </p>
              <p className="rounded-xl border border-border/70 bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground">
                {PRICING_DISCLOSURE}
              </p>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </article>
  );
}

export function Pricing() {
  return (
    <Section id={SECTION_IDS.pricing} className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-10 h-72 opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 14%, transparent), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="relative">
        <Reveal>
          <SectionHeading
            eyebrow="Plans"
            title="Protection for Every Level"
            description="Start with essential scam awareness. Unlock more ways to stay informed as your needs grow."
          />
        </Reveal>

        <Reveal delay={0.06}>
          <div className="mt-12 grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PRICING_PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-2xl border border-border/70 bg-background/40 p-4">
            <Info
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              {PRICING_DISCLOSURE}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mx-auto mt-4 flex max-w-3xl items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Lock className="size-3.5" aria-hidden="true" />
            No payment details are collected anywhere on this page.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
