import { NAV_LINKS } from "@/data/trust-lens";
import { useEffect, useState } from "react";

/**
 * Tracks which navigable section the reader is currently looking at.
 *
 * Uses a single rAF-throttled scroll listener rather than an IntersectionObserver
 * so the "active" section is always the last one whose heading has passed the
 * upper third of the viewport — which matches what a reader perceives as the
 * current section, even when two sections are on screen at once.
 */
export function useActiveSection() {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const ids = NAV_LINKS.map((link) => link.id);
    let frame = 0;

    const update = () => {
      frame = 0;
      const probe = window.innerHeight * 0.3;
      let current: string | null = null;

      for (const id of ids) {
        const element = document.getElementById(id);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= probe) current = id;
      }

      setActiveId(current);
    };

    const handleScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return activeId;
}
