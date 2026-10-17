import { Checkbox } from "@/components/ui/checkbox";
import {
  REPORTING,
  SAFETY_ACTIONS,
  SAFETY_CHECKLIST_NOTE,
  SAFETY_NO_MATCH_NOTE,
} from "@/data/trust-lens";
import type { ScamAnalysis } from "@/lib/scam-detection";
import { cn } from "@/lib/utils";
import { ExternalLink, Phone } from "lucide-react";
import { useId, useState } from "react";

/**
 * What to do next, grouped by the findings that prompted it.
 *
 * The checklist is a memory aid, not a control. Its state is local to this
 * component, nothing is written anywhere, and the score cannot see it — the
 * note above the list says so in as many words so a ticked box is never read as
 * a cleared message.
 */

function ActionItem({
  id,
  text,
  checked,
  onCheckedChange,
  relevant,
}: {
  id: string;
  text: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  relevant: boolean;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/50 p-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5"
      />
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer text-xs leading-relaxed">
        <span
          className={cn(
            "transition-colors",
            checked ? "text-muted-foreground line-through" : "text-foreground/90",
          )}
        >
          {text}
        </span>
        {relevant && (
          <span className="mt-1 block text-[0.6875rem] text-accent">
            Relevant to this message
          </span>
        )}
      </label>
    </li>
  );
}

export function SafetyActions({ analysis }: { analysis: ScamAnalysis }) {
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const groupId = useId();

  const matched = new Set(analysis.matchedRuleIds);

  // Always-on actions first, then the ones this particular message provoked.
  const standing = SAFETY_ACTIONS.filter((action) => action.triggeredBy.length === 0);
  const triggered = SAFETY_ACTIONS.filter(
    (action) =>
      action.triggeredBy.length > 0 &&
      action.triggeredBy.some((ruleId) => matched.has(ruleId)),
  );
  const ordered = [...standing, ...triggered];

  return (
    <div className="rounded-2xl border border-border/70 bg-background/40 p-5">
      <h3 className="text-sm font-semibold tracking-tight">What to do next</h3>

      <p className="mt-2 text-[0.8125rem] leading-relaxed text-foreground/90">
        {analysis.summary}
      </p>
      {analysis.findings.length === 0 && (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {SAFETY_NO_MATCH_NOTE}
        </p>
      )}

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {SAFETY_CHECKLIST_NOTE}
      </p>

      <ul className="mt-4 space-y-2">
        {ordered.map((action) => (
          <ActionItem
            key={action.id}
            id={`${groupId}-${action.id}`}
            text={action.text}
            relevant={action.triggeredBy.length > 0}
            checked={checkedIds.includes(action.id)}
            onCheckedChange={(next) =>
              setCheckedIds((current) =>
                next
                  ? [...current, action.id]
                  : current.filter((id) => id !== action.id),
              )
            }
          />
        ))}
      </ul>

      <div className="mt-4 border-t border-border/60 pt-4">
        <h4 className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Reporting in India
        </h4>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {REPORTING.body}
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          <li>
            <a
              href={REPORTING.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-xl border border-border/70 bg-background/50 px-3 py-2",
                "text-xs font-medium text-foreground outline-none transition-colors",
                "hover:border-primary/50 hover:bg-secondary/40",
                "focus-visible:ring-[3px] focus-visible:ring-primary/45",
              )}
            >
              <ExternalLink className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
              {REPORTING.portalLabel}
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
          <li className="flex min-h-11 items-center gap-2 rounded-xl border border-border/70 bg-background/50 px-3 py-2 text-xs font-medium text-foreground">
            <Phone className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
            Helpline
            <span className="font-mono tabular-nums">{REPORTING.helpline}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
