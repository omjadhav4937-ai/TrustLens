import { Section, SectionHeading } from "@/components/scam-spotter/section";
import { Badge } from "@/components/ui/badge";
import { FEATURES, SECTION_IDS } from "@/data/scam-spotter";
import { cn } from "@/lib/utils";
import { CircleDashed, CircleCheck } from "lucide-react";

export function Features() {
  return (
    <Section
      id={SECTION_IDS.features}
      className="border-y border-border/60 bg-card/40"
    >
      <SectionHeading
        eyebrow="Planned capabilities"
        title="What the full analyzer is being built to do"
        description="This project ships in steps. Everything below is labelled honestly so you always know what is live today and what is still ahead."
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const isImplemented = feature.status === "implemented";
          return (
            <article
              key={feature.title}
              className={cn(
                "flex flex-col rounded-2xl border bg-card/70 p-6 transition-colors",
                isImplemented
                  ? "border-emerald-400/30 hover:border-emerald-400/50"
                  : "border-border/70 hover:border-primary/40",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl border",
                    isImplemented
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                      : "border-border/70 bg-secondary/70 text-primary",
                  )}
                  aria-hidden="true"
                >
                  <feature.icon className="size-5" />
                </span>

                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1 border-border/70 text-[0.625rem] font-semibold uppercase tracking-[0.12em]",
                    isImplemented
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                      : "text-muted-foreground",
                  )}
                >
                  {isImplemented ? (
                    <CircleCheck className="size-3" aria-hidden="true" />
                  ) : (
                    <CircleDashed className="size-3" aria-hidden="true" />
                  )}
                  {isImplemented ? "Implemented" : "Planned"}
                </Badge>
              </div>

              <h3 className="mt-5 text-base font-semibold tracking-tight">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </article>
          );
        })}
      </div>

      <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Implemented today:</span>{" "}
        the analyzer interface, sample-message loading, clearing the input, and
        fully local (browser-only) processing.{" "}
        <span className="font-semibold text-foreground">Planned next:</span> the
        rule-based detection engine that produces the risk score, the
        highlighted phrases, the explanations, and the safe next steps.
      </p>
    </Section>
  );
}
