import { Reveal } from "@/components/trust-lens/reveal";
import { Section, SectionHeading } from "@/components/trust-lens/section";
import { Button } from "@/components/ui/button";
import {
  API_BENEFITS,
  API_DISCLOSURE,
  API_LIMITATIONS,
  API_PLANS,
  SECTION_IDS,
} from "@/data/trust-lens";
import { scrollToSection } from "@/lib/scroll";
import {
  ArrowDown,
  Check,
  Info,
  Network,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { useState, type ReactNode } from "react";

/**
 * The API section is a product mock-up, not a working endpoint.
 *
 * The code panel is static markup with no request, key, fetch or form. The call
 * to action only scrolls to the plan grid and reveals a status line saying the
 * API is planned; there is no waitlist and no data collection.
 */

function Line({ children }: { children: ReactNode }) {
  return <span className="block whitespace-pre">{children}</span>;
}

function CodePanel() {
  return (
    <figure className="min-w-0">
      <div className="overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#061018] shadow-[0_30px_80px_-48px_rgba(34,211,238,0.55)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="size-2 rounded-full bg-rose-400/70" />
              <span className="size-2 rounded-full bg-amber-300/70" />
              <span className="size-2 rounded-full bg-emerald-400/70" />
            </span>
            <span className="ml-1 inline-flex items-center gap-1.5 font-mono text-[0.6875rem] text-cyan-200/90">
              <Terminal className="size-3.5" aria-hidden="true" />
              POST /v1/analyze
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-cyan-200">
            <Network className="size-3" aria-hidden="true" />
            Illustrative
          </span>
        </div>

        <p className="border-b border-amber-300/15 bg-amber-300/5 px-4 py-2 text-[0.6875rem] font-medium text-amber-100/90">
          Illustrative example — not a live endpoint.
        </p>

        <div className="max-w-full overflow-x-auto">
          <pre className="min-w-0 p-4 font-mono text-[0.6875rem] leading-relaxed text-slate-300 sm:text-xs">
            <code>
              <Line>
                <span className="text-cyan-300">POST</span>{" "}
                <span className="text-slate-100">/v1/analyze</span>
              </Line>
              <Line>
                <span className="text-slate-500">Content-Type:</span>{" "}
                <span className="text-slate-300">application/json</span>
              </Line>
              <Line>
                <span className="text-slate-500">Authorization:</span>{" "}
                <span className="text-slate-300">Bearer </span>
                <span className="text-amber-200">YOUR_API_KEY</span>
              </Line>
              <Line> </Line>
              <Line>
                <span className="text-slate-500">{"{"}</span>
              </Line>
              <Line>
                {"  "}
                <span className="text-sky-300">&quot;message&quot;</span>
                <span className="text-slate-500">: </span>
                <span className="text-emerald-300">
                  &quot;Your account will be blocked. Share your OTP
                  immediately.&quot;
                </span>
              </Line>
              <Line>
                <span className="text-slate-500">{"}"}</span>
              </Line>
            </code>
          </pre>
        </div>

        <div className="border-t border-white/10 px-4 py-3">
          <p className="mb-2 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-slate-500">
            Illustrative response
          </p>
          <div className="max-w-full overflow-x-auto">
            <pre className="min-w-0 font-mono text-[0.6875rem] leading-relaxed text-slate-300 sm:text-xs">
              <code>
                <Line>
                  <span className="text-slate-500">{"{"}</span>
                </Line>
                <Line>
                  {"  "}
                  <span className="text-sky-300">&quot;riskScore&quot;</span>
                  <span className="text-slate-500">: </span>
                  <span className="text-amber-200">80</span>
                  <span className="text-slate-500">,</span>
                </Line>
                <Line>
                  {"  "}
                  <span className="text-sky-300">&quot;riskLevel&quot;</span>
                  <span className="text-slate-500">: </span>
                  <span className="text-rose-300">&quot;high&quot;</span>
                  <span className="text-slate-500">,</span>
                </Line>
                <Line>
                  {"  "}
                  <span className="text-sky-300">&quot;findings&quot;</span>
                  <span className="text-slate-500">: [</span>
                </Line>
                <Line>
                  {"    "}
                  <span className="text-slate-500">{"{"}</span>
                </Line>
                <Line>
                  {"      "}
                  <span className="text-sky-300">&quot;type&quot;</span>
                  <span className="text-slate-500">: </span>
                  <span className="text-emerald-300">
                    &quot;credential_request&quot;
                  </span>
                  <span className="text-slate-500">,</span>
                </Line>
                <Line>
                  {"      "}
                  <span className="text-sky-300">&quot;description&quot;</span>
                  <span className="text-slate-500">: </span>
                  <span className="text-emerald-300">
                    &quot;The message asks the recipient to share a verification
                    code.&quot;
                  </span>
                </Line>
                <Line>
                  {"    "}
                  <span className="text-slate-500">{"},"}</span>
                </Line>
                <Line>
                  {"    "}
                  <span className="text-slate-500">{"{"}</span>
                </Line>
                <Line>
                  {"      "}
                  <span className="text-sky-300">&quot;type&quot;</span>
                  <span className="text-slate-500">: </span>
                  <span className="text-emerald-300">
                    &quot;urgency_pressure&quot;
                  </span>
                  <span className="text-slate-500">,</span>
                </Line>
                <Line>
                  {"      "}
                  <span className="text-sky-300">&quot;description&quot;</span>
                  <span className="text-slate-500">: </span>
                  <span className="text-emerald-300">
                    &quot;The message pressures the recipient to act
                    quickly.&quot;
                  </span>
                </Line>
                <Line>
                  {"    "}
                  <span className="text-slate-500">{"}"}</span>
                </Line>
                <Line>
                  {"  "}
                  <span className="text-slate-500">],</span>
                </Line>
                <Line>
                  {"  "}
                  <span className="text-sky-300">&quot;recommendation&quot;</span>
                  <span className="text-slate-500">: </span>
                  <span className="text-emerald-300">
                    &quot;Do not share verification codes.&quot;
                  </span>
                </Line>
                <Line>
                  <span className="text-slate-500">{"}"}</span>
                </Line>
              </code>
            </pre>
          </div>
        </div>
      </div>

      <figcaption className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0 text-cyan-300" aria-hidden="true" />
        Static illustration. The schema is not a final contract and will need to
        match the real detector output if an API is built.
      </figcaption>
    </figure>
  );
}

export function ApiSection() {
  const [status, setStatus] = useState<string | null>(null);

  return (
    <Section
      id={SECTION_IDS.api}
      className="relative overflow-hidden border-y border-border/60 bg-card/30"
    >
      <div
        className="lens-grid pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 top-24 size-96 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--accent) 30%, transparent), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="relative">
        <Reveal>
          <SectionHeading
            eyebrow="For developers"
            title="Power Your Product with TrustLens API"
            description="Bring explainable scam-warning capabilities into the digital experiences you build."
          />
        </Reveal>

        <Reveal delay={0.05}>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
            TrustLens plans to offer API access for developers, fintech
            products, online marketplaces, and digital platforms that want to
            integrate message-risk analysis into their own workflows.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <Reveal className="min-w-0">
            <div className="rounded-3xl border border-border/80 lens-panel p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
                What the API is intended to offer
              </h3>

              <ul className="mt-5 space-y-4">
                {API_BENEFITS.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <li key={benefit.title} className="flex gap-3">
                      <span
                        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-200"
                        aria-hidden="true"
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {benefit.title}
                        </span>
                        <span className="mt-1 block text-[0.8125rem] leading-relaxed text-muted-foreground">
                          {benefit.description}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 rounded-2xl border border-amber-300/25 bg-amber-300/5 p-4">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-amber-100/90">
                  Future offering
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {API_DISCLOSURE}
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="min-w-0">
            <CodePanel />
          </Reveal>
        </div>

        <Reveal delay={0.06}>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="border-cyan-400/35 bg-cyan-400/5 text-foreground hover:border-cyan-300/60 hover:bg-cyan-400/10"
              onClick={() => {
                scrollToSection(SECTION_IDS.apiPlans);
                setStatus(
                  "API access is planned, not available. These plans are illustrative hypotheses, and there is no signup, waitlist or key issuance today.",
                );
              }}
            >
              Explore API Plans — Coming Soon
              <ArrowDown className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </Reveal>

        <div id={SECTION_IDS.apiPlans} className="mt-10 scroll-mt-24">
          {status && (
            <p
              role="status"
              className="mb-5 rounded-xl border border-cyan-400/30 bg-cyan-400/5 px-4 py-3 text-center text-xs leading-relaxed text-muted-foreground"
            >
              {status}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            {API_PLANS.map((plan, index) => (
            <Reveal key={plan.id} delay={0.04 * index}>
              <article
                data-api-plan={plan.id}
                className="flex h-full flex-col rounded-2xl border border-border/75 bg-background/50 p-5 transition-colors duration-300 hover:border-cyan-400/35"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold tracking-tight">
                    {plan.name}
                  </h3>
                  <span className="shrink-0 rounded-full border border-amber-300/35 bg-amber-300/10 px-2 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-amber-100">
                    Proposed
                  </span>
                </div>

                <p className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-mono text-lg font-semibold tabular-nums">
                    {plan.price}
                  </span>
                  <span className="text-[0.6875rem] text-muted-foreground">
                    {plan.priceNote}
                  </span>
                </p>

                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {plan.audience}
                </p>

                <ul className="mt-4 space-y-2 border-t border-border/60 pt-4">
                  {plan.benefits.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex gap-2 text-[0.75rem] leading-relaxed text-foreground/85"
                    >
                      <Check
                        className="mt-0.5 size-3.5 shrink-0 text-cyan-300"
                        aria-hidden="true"
                      />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </article>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.08}>
          <div className="mt-8 rounded-2xl border border-border/70 bg-background/40 p-5">
            <h3 className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              What is not available today
            </h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {API_LIMITATIONS.map((limitation) => (
                <li
                  key={limitation}
                  className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                >
                  <span
                    className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-300/80"
                    aria-hidden="true"
                  />
                  {limitation}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-border/60 pt-3 text-xs leading-relaxed text-muted-foreground">
              Plan prices are illustrative hypotheses and subject to validation.
              No API keys can be issued, no usage is metered, and no billing or
              subscription management exists.
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
