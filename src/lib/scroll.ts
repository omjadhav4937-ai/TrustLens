/**
 * Scrolls to a section on the Scam Spotter landing page.
 *
 * Anchor links keep a real `href` so they stay accessible and shareable; this
 * helper only upgrades the jump into a smooth scroll and respects the user's
 * reduced-motion preference.
 */
export function scrollToSection(id: string) {
  if (typeof document === "undefined") return;

  const target = document.getElementById(id);
  if (!target) return;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  target.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
}
