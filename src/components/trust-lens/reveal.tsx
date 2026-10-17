import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Fades and lifts content into place.
 *
 * Purely decorative: when the visitor asks for reduced motion the children are
 * rendered in a plain div, so nothing moves and no content is ever hidden
 * behind an animation that might not run.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  distance = 16,
  mode = "inView",
}: {
  children: ReactNode;
  className?: string;
  /** Stagger offset in seconds. */
  delay?: number;
  /** How far the content travels, in pixels. */
  distance?: number;
  /** `mount` plays immediately; `inView` waits until scrolled into view. */
  mode?: "inView" | "mount";
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  if (mode === "mount") {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0, y: distance }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay, ease: EASE }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      // "some" rather than a fraction: `amount` is measured against the
      // element, so a panel taller than five viewports could never reach a
      // 0.2 threshold and would stay invisible for good on a phone.
      viewport={{ once: true, amount: "some" }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
