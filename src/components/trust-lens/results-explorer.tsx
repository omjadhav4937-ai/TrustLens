import { FindingCard } from "@/components/trust-lens/finding-card";
import { LinkInspector } from "@/components/trust-lens/link-inspector";
import { MessageInspector } from "@/components/trust-lens/message-inspector";
import { RiskOverview } from "@/components/trust-lens/risk-overview";
import { RuleCoverage } from "@/components/trust-lens/rule-coverage";
import { SafetyActions } from "@/components/trust-lens/safety-actions";
import {
  RULES,
  buildHighlightPlan,
  navigationFailure,
  type ScamAnalysis,
} from "@/lib/scam-detection";
import { useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** How long the "Show in message" outline stays on the focused mark. */
const PULSE_MS = 1400;

/**
 * Owns the investigation state for one analysis.
 *
 * Selection is lifted to a single place because three views share it: the
 * overview chips, the finding cards and the message highlights. Each view is
 * presentational and receives the current selection, which is also what makes
 * every state statically testable without a DOM.
 *
 * All scroll and focus work happens here. Motion is reduced when the visitor
 * asks for it, and focus is only ever moved in response to a deliberate action —
 * nothing steals focus on render.
 */
export function ResultsExplorer({ analysis }: { analysis: ScamAnalysis }) {
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [openRuleIds, setOpenRuleIds] = useState<string[]>([]);
  const [pulsingRuleId, setPulsingRuleId] = useState<string | null>(null);
  //
  // A finding can have evidence in the message and still be unreachable: the
  // resolved mark may not be mounted yet, or its node may have gone. That is a
  // distinct outcome from "no target exists", and the reader is told which.
  const [unreachableRuleId, setUnreachableRuleId] = useState<string | null>(null);

  const cardRefs = useRef(new Map<string, HTMLLIElement>());
  const markRefs = useRef(new Map<string, HTMLButtonElement>());
  const pulseTimer = useRef<number | null>(null);

  const reduceMotion = useReducedMotion() ?? false;
  const scrollBehavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";

  /*
   * Built once per analysis. The renderer and the navigation handler both read
   * this, so neither can resolve a finding to a different mark than the other.
   */
  const plan = useMemo(
    () => buildHighlightPlan(analysis.message, analysis.findings),
    [analysis],
  );

  useEffect(() => {
    return () => {
      if (pulseTimer.current !== null) window.clearTimeout(pulseTimer.current);
    };
  }, []);

  const setCardRef = useCallback(
    (ruleId: string, element: HTMLLIElement | null) => {
      if (element) cardRefs.current.set(ruleId, element);
      else cardRefs.current.delete(ruleId);
    },
    [],
  );

  const setMarkRef = useCallback(
    (ruleId: string, element: HTMLButtonElement | null) => {
      if (element) markRefs.current.set(ruleId, element);
      else markRefs.current.delete(ruleId);
    },
    [],
  );

  const openCard = useCallback((ruleId: string) => {
    setOpenRuleIds((current) =>
      current.includes(ruleId) ? current : [...current, ruleId],
    );
  }, []);

  /** Opens and focuses the card for a rule. Used by the chips and the marks. */
  const focusCard = useCallback(
    (ruleId: string, block: ScrollLogicalPosition) => {
      const card = cardRefs.current.get(ruleId);
      if (!card) return;
      card.scrollIntoView({ block, behavior: scrollBehavior });
      // `preventScroll` keeps a smooth scroll from being cancelled by the jump
      // focus would otherwise perform.
      card.focus({ preventScroll: true });
    },
    [scrollBehavior],
  );

  const handleSelectFromChip = useCallback(
    (ruleId: string) => {
      setSelectedRuleId(ruleId);
      setShowAll(false);
      setUnreachableRuleId(null);
      openCard(ruleId);
      focusCard(ruleId, "center");
    },
    [focusCard, openCard],
  );

  const handleSelectFromMark = useCallback(
    (ruleId: string) => {
      setSelectedRuleId(ruleId);
      setShowAll(false);
      setUnreachableRuleId(null);
      openCard(ruleId);
      // The mark sits next to its card on a wide screen, so scroll only if the
      // card is genuinely out of view.
      focusCard(ruleId, "nearest");
    },
    [focusCard, openCard],
  );

  /**
   * Brings the reader from a finding to the evidence, and marks it briefly.
   *
   * The target comes from the plan, not from the rule id: when another rule's
   * earlier-starting range absorbed this finding's text, the finding has no mark
   * of its own and the mark covering its evidence is used instead. The selection
   * is never reassigned to that other rule — the reader chose this finding and
   * keeps it; only the place in the message changes.
   */
  const handleShowInMessage = useCallback(
    (ruleId: string) => {
      setSelectedRuleId(ruleId);
      setShowAll(false);
      openCard(ruleId);

      const mark = markRefs.current.get(ruleId);
      const failure = navigationFailure(plan.targets.get(ruleId), mark);

      if (failure !== null) {
        /*
         * A finding with no target is already explained by the inspector from
         * the plan itself, so recording it here would replace the accurate
         * "not in this message" sentence with a misleading one. Only a node
         * that should have been present is reported as unreachable — and a
         * detached node must never be scrolled to or focused.
         */
        setUnreachableRuleId(failure === "no-target" ? null : ruleId);
        return;
      }

      // `navigationFailure` returns null only for a usable element. This keeps
      // that guarantee in the type system as well as at runtime.
      if (!mark) return;

      setUnreachableRuleId(null);
      mark.scrollIntoView({ block: "center", behavior: scrollBehavior });
      mark.focus({ preventScroll: true });

      if (pulseTimer.current !== null) window.clearTimeout(pulseTimer.current);
      setPulsingRuleId(ruleId);
      pulseTimer.current = window.setTimeout(() => {
        setPulsingRuleId((current) => (current === ruleId ? null : current));
        pulseTimer.current = null;
      }, PULSE_MS);
    },
    [openCard, plan, scrollBehavior],
  );

  const handleShowAll = useCallback(() => {
    setSelectedRuleId(null);
    setShowAll(true);
    setUnreachableRuleId(null);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedRuleId(null);
    setShowAll(false);
    setUnreachableRuleId(null);
  }, []);

  const checkedAt = new Date(analysis.analyzedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold tracking-tight">Analysis results</h3>
        <p className="text-xs tabular-nums text-muted-foreground">
          Checked at {checkedAt}
        </p>
      </div>

      <RiskOverview
        analysis={analysis}
        selectedRuleId={selectedRuleId}
        onSelectFinding={handleSelectFromChip}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-background/40 p-5">
            <h3 className="text-sm font-semibold tracking-tight">Warning signs</h3>

            {analysis.findings.length === 0 ? (
              <p className="mt-3 flex gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-xs leading-relaxed text-emerald-50">
                <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <span>
                  None of the {RULES.length} configured warning signs matched this
                  message. That is a good sign, but not a clean bill of health:
                  TrustLens only recognises the patterns it knows about.
                </span>
              </p>
            ) : (
              <>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Ranked strongest first. Select one to read why it matters and
                  where it appears.
                </p>
                <ul className="mt-3 space-y-2">
                  {analysis.findings.map((finding) => (
                    <FindingCard
                      key={finding.ruleId}
                      finding={finding}
                      selected={selectedRuleId === finding.ruleId}
                      open={openRuleIds.includes(finding.ruleId)}
                      onOpenChange={(next) =>
                        setOpenRuleIds((current) =>
                          next
                            ? [...current, finding.ruleId]
                            : current.filter((id) => id !== finding.ruleId),
                        )
                      }
                      onShowInMessage={handleShowInMessage}
                      registerCard={setCardRef}
                    />
                  ))}
                </ul>
              </>
            )}
          </div>

          <LinkInspector links={analysis.links} />
        </div>

        <div className="space-y-4">
          <MessageInspector
            analysis={analysis}
            plan={plan}
            selectedRuleId={selectedRuleId}
            showAll={showAll}
            pulsingRuleId={pulsingRuleId}
            unreachableRuleId={unreachableRuleId}
            onSelectRule={handleSelectFromMark}
            onShowAll={handleShowAll}
            onClearSelection={handleClearSelection}
            registerMark={setMarkRef}
          />

          <RuleCoverage analysis={analysis} />
        </div>
      </div>

      <SafetyActions analysis={analysis} />
    </div>
  );
}
