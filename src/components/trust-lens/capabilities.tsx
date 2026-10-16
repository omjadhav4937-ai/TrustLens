import { Section, SectionHeading } from "@/components/trust-lens/section";
import { Badge } from "@/components/ui/badge";
import { CAPABILITIES, SECTION_IDS } from "@/data/trust-lens";
import { cn } from "@/lib/utils";
import { CircleCheck, CircleDashed } from "lucide-react";

const AVAILABLE_COUNT = CAPABILITIES.filter(
  (capability) => capability.status === "available",
).length;
const PLANNED_COUNT = CAPABILITIES.length - AVAILABLE_COUNT;

export function Capabilities() {
  return (
    <Section
      id={SECTION_IDS.capabilities}
      className="border-y border-border/60 bg-card/40"
    >
      <SectionHeading
        eyebrow="What you can do"
        title="Everything TrustLens is being built to handle"
        description={`${AVAILABLE_COUNT} capabilities work today and ${PLANNED_COUNT} are on the way. Every card tells you exactly where it stands, so nothing is promised that is not there yet.`}
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map((capability) => {
          const isAvailable = capability.status === "available";
          return (
            <article
              key={capability.title}
              className={cn(
                "flex flex-col rounded-2xl border bg-card/70 p-6 transition-colors",
                isAvailable
                  ? "border-emerald-400/30 hover:border-emerald-400/50"
                  : "border-border/70 hover:border-primary/40",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl border",
                    isAvailable
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                      : "border-border/70 bg-secondary/70 text-primary",
                  )}
                  aria-hidden="true"
                >
                  <capability.icon className="size-5" />
                </span>

                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1 border-border/70 text-[0.625rem] font-semibold uppercase tracking-[0.12em]",
                    isAvailable
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                      : "text-muted-foreground",
                  )}
                >
                  {isAvailable ? (
                    <CircleCheck className="size-3" aria-hidden="true" />
                  ) : (
                    <CircleDashed className="size-3" aria-hidden="true" />
                  )}
                  {isAvailable ? "Available now" : "Planned"}
                </Badge>
              </div>

              <h3 className="mt-5 text-base font-semibold tracking-tight">
                {capability.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {capability.description}
              </p>
            </article>
          );
        })}
      </div>

      <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Available today:</span>{" "}
        the analyzer itself, the sample message, clearing the input, and
        browser-only processing.{" "}
        <span className="font-semibold text-foreground">Coming next:</span> the
        detection engine that produces the risk level, the highlighted warning
        signs, the link and lookalike-domain checks, and the safe next steps.
      </p>
    </Section>
  );
}
