import { FlipCard } from "@/components/trust-lens/flip-card";
import { Reveal } from "@/components/trust-lens/reveal";
import { Section, SectionHeading } from "@/components/trust-lens/section";
import { Badge } from "@/components/ui/badge";
import { CAPABILITIES, SECTION_IDS, type Capability } from "@/data/trust-lens";
import { cn } from "@/lib/utils";
import { Check, CircleCheck, CircleDashed, RotateCw } from "lucide-react";

function StatusBadge({ status }: { status: Capability["status"] }) {
  const isAvailable = status === "available";
  return (
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
  );
}

function CapabilityCard({ capability }: { capability: Capability }) {
  const isAvailable = capability.status === "available";
  const Icon = capability.icon;

  return (
    <FlipCard
      title={capability.title}
      front={
        <div className="flex h-full flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl border",
                isAvailable
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                  : "border-border/70 bg-secondary/70 text-primary",
              )}
              aria-hidden="true"
            >
              <Icon className="size-5" />
            </span>
            <StatusBadge status={capability.status} />
          </div>

          <h3 className="mt-5 text-base font-semibold tracking-tight">
            {capability.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {capability.description}
          </p>

          <span
            className="mt-5 flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted-foreground/80"
            aria-hidden="true"
          >
            <RotateCw className="size-3" />
            Details
          </span>
        </div>
      }
      back={
        <div className="flex h-full flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-primary">
              Why it matters
            </span>
            <StatusBadge status={capability.status} />
          </div>

          <h3 className="mt-4 text-base font-semibold tracking-tight">
            {capability.title}
          </h3>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
            {capability.detail}
          </p>

          <ul className="mt-4 space-y-2">
            {capability.points.map((point) => (
              <li key={point} className="flex gap-2.5">
                <span
                  className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
                  aria-hidden="true"
                >
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
                <span className="text-[0.8125rem] leading-snug text-foreground/90">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>
      }
    />
  );
}

export function Capabilities() {
  return (
    <Section
      id={SECTION_IDS.capabilities}
      className="border-y border-border/60 bg-card/40"
    >
      <Reveal>
        <SectionHeading
          eyebrow="What you can do"
          title="Everything TrustLens checks for you"
          description="Every capability below is working today. Turn any card over for the detail behind it."
        />
      </Reveal>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map((capability, index) => (
          <Reveal
            key={capability.title}
            className="h-full"
            delay={Math.min(index, 5) * 0.05}
          >
            <CapabilityCard capability={capability} />
          </Reveal>
        ))}
      </div>

      <Reveal>
        <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-muted-foreground">
          The engine behind these cards is entirely rule-based and runs in your
          browser: a fixed set of written warning-sign rules plus offline link
          heuristics. Nothing is uploaded, and no third-party service is
          involved, so the message you check stays on your device.
        </p>
      </Reveal>
    </Section>
  );
}
