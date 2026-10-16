import { Button } from "@/components/ui/button";
import { DEMO_WARNING_LABELS, SECTION_IDS } from "@/data/trust-lens";
import { scrollToSection } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import { AlertTriangle, Link2, ShieldQuestion, Smartphone } from "lucide-react";

const WARNING_STYLES = [
  "border-amber-400/30 bg-amber-400/10 text-amber-100",
  "border-sky-400/30 bg-sky-400/10 text-sky-100",
  "border-rose-400/30 bg-rose-400/10 text-rose-100",
];

const WARNING_ICONS = [AlertTriangle, Link2, ShieldQuestion];

export function Hero() {
  return (
    <section id={SECTION_IDS.home} className="relative scroll-mt-20 overflow-hidden">
      <div className="lens-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[min(1100px,140%)] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 30%, transparent), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8">
        {/* Copy column */}
        <div className="flex flex-col items-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/60 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
            Privacy-first scam detection
          </span>

          <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Think Before{" "}
            <span
              style={{
                backgroundImage:
                  "linear-gradient(90deg, var(--primary), var(--accent))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              You Tap.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            TrustLens helps you examine a message you are unsure about — the
            warning signs, the risk level, and the safer next step — explained in
            plain language, and without your message ever leaving your browser.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <a
                href={`#${SECTION_IDS.analyzer}`}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection(SECTION_IDS.analyzer);
                }}
              >
                Analyze a Message
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a
                href={`#${SECTION_IDS.howItWorks}`}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection(SECTION_IDS.howItWorks);
                }}
              >
                See How It Works
              </a>
            </Button>
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            No sign-up. Nothing you paste is uploaded or stored.
          </p>
        </div>

        {/* Demo preview card */}
        <div className="relative w-full">
          <div className="relative rounded-3xl border border-border/80 bg-card/70 p-2 shadow-2xl backdrop-blur-sm">
            <div className="rounded-2xl border border-border/60 bg-background/60 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.18em] text-primary">
                  Demo Example
                </span>
                <span className="text-[0.6875rem] text-muted-foreground">
                  Fictional message — not a real analysis
                </span>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <span
                  className="flex size-9 items-center justify-center rounded-full border border-border/70 bg-secondary/70 text-muted-foreground"
                  aria-hidden="true"
                >
                  <Smartphone className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">Unknown sender</p>
                  <p className="text-xs text-muted-foreground">SMS · received today</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl rounded-tl-sm border border-border/70 bg-secondary/50 p-4">
                <p className="text-sm leading-relaxed text-foreground/90">
                  Dear Customer, your SBI YONO account will be{" "}
                  <mark className="rounded bg-amber-400/20 px-1 text-amber-100">
                    BLOCKED today
                  </mark>
                  . Update KYC within{" "}
                  <mark className="rounded bg-amber-400/20 px-1 text-amber-100">
                    24 hours
                  </mark>{" "}
                  at{" "}
                  <mark className="rounded bg-sky-400/20 px-1 text-sky-100">
                    http://sbi-kyc-verify.online
                  </mark>{" "}
                  and{" "}
                  <mark className="rounded bg-rose-400/20 px-1 text-rose-100">
                    share the OTP
                  </mark>{" "}
                  with our executive.
                </p>
              </div>

              <ul className="mt-5 space-y-2">
                {DEMO_WARNING_LABELS.map((warning, index) => {
                  const Icon = WARNING_ICONS[index] ?? AlertTriangle;
                  return (
                    <li
                      key={warning.label}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border px-3 py-2.5",
                        WARNING_STYLES[index] ?? WARNING_STYLES[0],
                      )}
                    >
                      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">
                          {warning.label}
                        </span>
                        <span className="block text-xs opacity-80">
                          {warning.description}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-5 border-t border-border/60 pt-4 text-xs leading-relaxed text-muted-foreground">
                Illustrative warning labels only. TrustLens has not scored this
                message — the detection engine is not part of this step.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
