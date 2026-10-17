import type { RiskLevel } from "@/lib/scam-detection";
import { useEffect, useState } from "react";

/** Ring colour per risk band, kept as plain values so they cannot drift. */
const RING_COLOR: Record<RiskLevel, string> = {
  low: "#34d399",
  medium: "#fbbf24",
  high: "#fb7185",
};

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The numeric score is real text, so the ring itself is decorative and hidden
 * from assistive technology.
 *
 * The fill animates by updating one frame after the value arrives, which lets
 * CSS transition from the previous score instead of snapping to it. Reduced
 * motion is handled entirely by the `motion-safe:` variants below, so the ring
 * is simply drawn at its final value when motion is not wanted.
 */
export function ScoreRing({
  score,
  riskLevel,
}: {
  score: number;
  riskLevel: RiskLevel;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const [drawn, setDrawn] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(clamped));
    return () => cancelAnimationFrame(frame);
  }, [clamped]);

  const offset = CIRCUMFERENCE * (1 - drawn / 100);

  return (
    <div className="relative flex size-36 shrink-0 items-center justify-center">
      <svg
        viewBox="0 0 128 128"
        className="size-36 -rotate-90"
        aria-hidden="true"
        focusable="false"
      >
        <circle
          cx="64"
          cy="64"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-secondary"
        />
        <circle
          cx="64"
          cy="64"
          r={RADIUS}
          fill="none"
          stroke={RING_COLOR[riskLevel]}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700 motion-safe:ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tabular-nums leading-none">
          {clamped}
        </span>
        <span className="mt-1 text-[0.6875rem] uppercase tracking-[0.14em] text-muted-foreground">
          out of 100
        </span>
      </div>
    </div>
  );
}
