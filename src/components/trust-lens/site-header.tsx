import { Brand } from "@/components/trust-lens/brand";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/data/trust-lens";
import { useActiveSection } from "@/hooks/use-active-section";
import { scrollToSection } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export const FOCUS_RING =
  "rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const INDICATOR_GRADIENT =
  "linear-gradient(90deg, var(--primary), var(--accent))";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [elevated, setElevated] = useState(false);
  const activeId = useActiveSection();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => setElevated(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const goTo = (id: string) => {
    setMenuOpen(false);
    scrollToSection(id);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-colors duration-300",
        elevated || menuOpen ? "border-border/70 lens-glass" : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <a
          href="#home"
          onClick={(event) => {
            event.preventDefault();
            goTo("home");
          }}
          className={cn("shrink-0", FOCUS_RING)}
          aria-label="TrustLens — back to top"
        >
          <Brand />
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const isActive = activeId === link.id;
            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  goTo(link.id);
                }}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                  FOCUS_RING,
                )}
              >
                {link.label}
                {isActive &&
                  (shouldReduceMotion ? (
                    <span
                      className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                      style={{ backgroundImage: INDICATOR_GRADIENT }}
                      aria-hidden="true"
                    />
                  ) : (
                    <motion.span
                      layoutId="nav-active-indicator"
                      className="absolute inset-x-2 -bottom-px h-0.5 rounded-full"
                      style={{ backgroundImage: INDICATOR_GRADIENT }}
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      aria-hidden="true"
                    />
                  ))}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="lg" className="lens-cta-glow hidden sm:inline-flex">
            <a
              href="#analyzer"
              onClick={(event) => {
                event.preventDefault();
                goTo("analyzer");
              }}
            >
              Check a Message
            </a>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            key="mobile-nav"
            id="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }
            }
            className="lens-glass overflow-hidden border-t border-border/70 lg:hidden"
          >
            <nav
              aria-label="Mobile"
              className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6"
            >
              {NAV_LINKS.map((link) => {
                const isActive = activeId === link.id;
                return (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      goTo(link.id);
                    }}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-secondary/60 text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                      FOCUS_RING,
                    )}
                  >
                    {link.label}
                  </a>
                );
              })}
              <Button asChild size="lg" className="lens-cta-glow mt-2 w-full sm:hidden">
                <a
                  href="#analyzer"
                  onClick={(event) => {
                    event.preventDefault();
                    goTo("analyzer");
                  }}
                >
                  Check a Message
                </a>
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
