import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

/**
 * A card that turns over to reveal a second face.
 *
 * How the three input methods work together:
 * - Pointer: hovering previews the back face (desktop only, guarded by
 *   `@media (hover: hover) and (pointer: fine)` in index.css).
 * - Touch: a tap pins the card, because a hover state is never reliable there.
 * - Keyboard: the whole card is a single button carrying an `aria-expanded`
 *   state and a label that names the card, so it is discoverable by tabbing
 *   and activated with Enter or Space.
 *
 * Both faces stay in the accessibility tree on purpose. Sighted users see one
 * face at a time, but a screen reader reads the front description and then the
 * extra detail, so no content is ever unreachable.
 */
export function FlipCard({
  title,
  front,
  back,
  className,
}: {
  /** Used to build the toggle's accessible name. */
  title: string;
  front: ReactNode;
  back: ReactNode;
  className?: string;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={cn("flip-card", className)}
      data-flipped={flipped ? "true" : undefined}
    >
      <div className="flip-card-stage">
        <div className="flip-card-inner">
          <div className="flip-card-face flip-card-front">{front}</div>
          {/* `aria-hidden` is deliberately absent: the detail stays readable. */}
          <div className="flip-card-face flip-card-back">{back}</div>
        </div>
      </div>

      <button
        type="button"
        className="flip-card-trigger"
        aria-expanded={flipped}
        onClick={() => setFlipped((value) => !value)}
      >
        <span className="sr-only">
          {flipped ? `Hide details for ${title}` : `Show details for ${title}`}
        </span>
      </button>
    </div>
  );
}
