import { Brand } from "@/components/trust-lens/brand";
import { FOCUS_RING } from "@/components/trust-lens/site-header";
import { NAV_LINKS, TAGLINE } from "@/data/trust-lens";
import { scrollToSection } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/40 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <Brand />
            <p className="mt-4 text-lg font-semibold tracking-tight">{TAGLINE}</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              A privacy-first way to review a message you are unsure about,
              understand the warning signs, and decide on a safer next step.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Sections
              </h2>
              <ul className="mt-4 space-y-2">
                {NAV_LINKS.map((link) => (
                  <li key={link.id}>
                    <a
                      href={`#${link.id}`}
                      onClick={(event) => {
                        event.preventDefault();
                        scrollToSection(link.id);
                      }}
                      className={cn(
                        "text-sm text-muted-foreground transition-colors hover:text-foreground",
                        FOCUS_RING,
                      )}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Project
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>Team Perpetual</li>
                <li>SETU 2026 · PS-01</li>
                <li>
                  Shri Vile Parle Kelavani Mandal's Institute of Technology,
                  Dhule.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-start gap-3 rounded-2xl border border-border/70 bg-background/40 p-4">
          <ShieldAlert
            className="mt-0.5 size-4 shrink-0 text-amber-200"
            aria-hidden="true"
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Disclaimer:</span>{" "}
            TrustLens is a student prototype built for an academic event. It
            highlights possible warning signs in a message and cannot guarantee
            whether a message is safe or fraudulent. Always verify through the
            official app, website, or phone number of the organisation involved,
            and never share an OTP or password.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} TrustLens · Team Perpetual</p>
          <p>Built for SETU 2026, Problem Statement PS-01</p>
        </div>
      </div>
    </footer>
  );
}
