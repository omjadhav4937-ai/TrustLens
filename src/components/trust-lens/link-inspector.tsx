import { Disclosure } from "@/components/trust-lens/disclosure";
import { Badge } from "@/components/ui/badge";
import { LINK_CAVEAT } from "@/data/trust-lens";
import type { AnalyzedLink, LinkIndicator } from "@/lib/scam-detection";
import { cn } from "@/lib/utils";
import { Info, Link2Off } from "lucide-react";
import { useState } from "react";

/**
 * What the link heuristics found, and nothing more.
 *
 * The URLs are rendered as inert text inside a `<code>` element. They are not
 * anchors and carry no `href`, so a URL in a message can never be opened from
 * this panel. Only indicators the engine actually returned are listed.
 *
 * Indicators are split by `basis` so a reader can tell a property of the
 * address apart from a suspicion about who wrote it.
 */

const BASIS_SECTIONS = [
  {
    basis: "observed" as const,
    title: "Observed in the address",
    meaning: "Properties of the address string itself. You can check each one by eye.",
  },
  {
    basis: "inferred" as const,
    title: "May indicate imitation",
    meaning:
      "Judgements about what the address appears to be doing. Reasoned, not measured.",
  },
];

function IndicatorRow({
  indicator,
  open,
  onOpenChange,
}: {
  indicator: LinkIndicator;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <li className="rounded-xl border border-border/60 bg-background/50">
      <Disclosure
        open={open}
        onOpenChange={onOpenChange}
        className="rounded-xl"
        triggerClassName="min-h-11 rounded-xl px-3 py-2.5 hover:bg-secondary/30"
        contentClassName="px-3 pb-3"
        trigger={
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  indicator.strength === "strong"
                    ? "bg-amber-300"
                    : "bg-muted-foreground/50",
                )}
                aria-hidden="true"
              />
              <span className="text-xs font-medium text-foreground">
                {indicator.label}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[0.5625rem] font-semibold uppercase tracking-[0.1em]",
                  indicator.strength === "strong"
                    ? "border-amber-400/40 bg-amber-400/10 text-amber-100"
                    : "border-border/70 text-muted-foreground",
                )}
              >
                {indicator.strength === "strong" ? "Strong" : "Weak"}
              </Badge>
            </span>
          </span>
        }
      >
        <p className="text-xs leading-relaxed text-muted-foreground">
          {indicator.explanation}
        </p>
      </Disclosure>
    </li>
  );
}

function LinkCard({ link }: { link: AnalyzedLink }) {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const strong = link.indicators.filter((item) => item.strength === "strong").length;
  const weak = link.indicators.length - strong;

  return (
    <li className="rounded-2xl border border-border/70 bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Inert text on purpose: TrustLens never opens a link. */}
        <code className="min-w-0 break-all font-mono text-xs text-foreground/90">
          {link.url}
        </code>
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 text-[0.5625rem] font-semibold uppercase tracking-[0.1em]",
            link.suspicious
              ? "border-amber-400/40 bg-amber-400/10 text-amber-100"
              : "border-border/70 text-muted-foreground",
          )}
        >
          {link.suspicious
            ? strong > 0
              ? `${strong} strong`
              : `${weak} weak`
            : "No indicators"}
        </Badge>
      </div>

      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
        <div className="flex items-baseline gap-1.5">
          <dt className="text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground">
            Domain
          </dt>
          <dd className="break-all font-mono text-xs text-foreground/80">
            {link.host ?? "not parsed"}
          </dd>
        </div>
      </dl>

      {link.indicators.length === 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          No indicator was raised for this address. Its structure looks ordinary
          to these checks, which is not a statement about the site behind it.
        </p>
      ) : (
        BASIS_SECTIONS.map((section) => {
          const indicators = link.indicators.filter(
            (indicator) => indicator.basis === section.basis,
          );
          if (indicators.length === 0) return null;

          return (
            <div key={section.basis} className="mt-3">
              <h5 className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {section.title}
              </h5>
              <p className="mt-1 text-[0.6875rem] leading-relaxed text-muted-foreground/80">
                {section.meaning}
              </p>
              <ul className="mt-2 space-y-2">
                {indicators.map((indicator) => {
                  const open = expandedIds.includes(indicator.id);
                  return (
                    <IndicatorRow
                      key={indicator.id}
                      indicator={indicator}
                      open={open}
                      onOpenChange={(next) =>
                        setExpandedIds((current) =>
                          next
                            ? [...current, indicator.id]
                            : current.filter((id) => id !== indicator.id),
                        )
                      }
                    />
                  );
                })}
              </ul>
            </div>
          );
        })
      )}
    </li>
  );
}

export function LinkInspector({ links }: { links: AnalyzedLink[] }) {
  const suspicious = links.filter((link) => link.suspicious).length;

  if (links.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-background/40 p-5">
        <h3 className="text-sm font-semibold tracking-tight">Links</h3>
        <p className="mt-2 flex gap-2 text-xs leading-relaxed text-muted-foreground">
          <Link2Off className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            No URL was found in this message, so no link check ran. That is not a
            clean result: a link can be hidden behind wording, an image, or a
            shortened form this pattern did not recognise.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-background/40 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight">Links</h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          {links.length} found · {suspicious} with indicators
        </span>
      </div>

      <ul className="mt-3 space-y-3">
        {links.map((link) => (
          <LinkCard key={`${link.start}-${link.url}`} link={link} />
        ))}
      </ul>

      <p className="mt-4 flex gap-2 border-t border-border/60 pt-4 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
        <span>{LINK_CAVEAT}</span>
      </p>
    </div>
  );
}
