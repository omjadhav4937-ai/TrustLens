import { Section, SectionHeading } from "@/components/scam-spotter/section";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SECTION_IDS } from "@/data/scam-spotter";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import type { ReactNode } from "react";

function PlaceholderPanel({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border/70 bg-background/40 p-5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-1">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {hint && <span className="text-[0.6875rem] text-muted-foreground">{hint}</span>}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function DashList({ rows }: { rows: number }) {
  return (
    <ul className="space-y-2" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <li
          key={index}
          className="h-8 rounded-lg border border-dashed border-border/80 bg-secondary/20"
        />
      ))}
    </ul>
  );
}

export function ResultsPlaceholder({ requested }: { requested: boolean }) {
  return (
    <Section id={SECTION_IDS.results} className="pt-0 sm:pt-0">
      <SectionHeading
        eyebrow="Results area"
        title="Your result will appear here"
        description="This area is prepared for the rule-based detection engine. No score, risk level, or warning sign is generated yet."
      />

      <div className="mx-auto mt-12 max-w-4xl rounded-3xl border border-dashed border-border/80 bg-card/40 p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold tracking-tight">
            Analysis results
          </h3>
          <Badge
            variant="outline"
            className="gap-1 border-border/70 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            <span
              className="size-1.5 rounded-full bg-muted-foreground/70"
              aria-hidden="true"
            />
            Awaiting detection engine
          </Badge>
        </div>

        {requested && (
          <div
            role="status"
            className="mt-5 flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4"
          >
            <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-foreground/90">
              <span className="font-semibold">No analysis was performed.</span>{" "}
              The interface received your message, but the detection engine is
              implemented in the next step of the project — so no risk level,
              score, or warning sign is shown.
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <PlaceholderPanel title="Risk level" hint="Placeholder">
            <p className="text-2xl font-semibold text-muted-foreground/70">—</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Low / Moderate / High will be shown here.
            </p>
          </PlaceholderPanel>

          <PlaceholderPanel title="Risk score" hint="Out of 100">
            <p className="text-2xl font-semibold tabular-nums text-muted-foreground/70">
              — <span className="text-sm font-normal">/ 100</span>
            </p>
            <Progress
              value={0}
              aria-label="Risk score placeholder"
              className="mt-3 bg-secondary/60"
            />
          </PlaceholderPanel>

          <PlaceholderPanel
            title="Detected warning signs"
            hint="No rules run yet"
            className="sm:col-span-2"
          >
            <DashList rows={3} />
          </PlaceholderPanel>

          <PlaceholderPanel
            title="Highlighted message"
            hint="Prepared view"
            className="sm:col-span-2"
          >
            <div className="rounded-xl border border-dashed border-border/80 bg-secondary/20 p-4 text-sm leading-relaxed text-muted-foreground">
              Your message will be re-displayed here with the matched suspicious
              phrases highlighted in context.
            </div>
          </PlaceholderPanel>

          <PlaceholderPanel title="Explanation" hint="Two slots prepared">
            <DashList rows={2} />
          </PlaceholderPanel>

          <PlaceholderPanel title="Safe next steps" hint="Checklist slot">
            <DashList rows={2} />
          </PlaceholderPanel>
        </div>
      </div>
    </Section>
  );
}
