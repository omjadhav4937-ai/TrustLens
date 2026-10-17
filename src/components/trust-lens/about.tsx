import { Reveal } from "@/components/trust-lens/reveal";
import { Section, SectionHeading } from "@/components/trust-lens/section";
import { SECTION_IDS } from "@/data/trust-lens";
import { GraduationCap, Target, Users } from "lucide-react";

const FACTS = [
  {
    icon: Users,
    label: "Team",
    value: "One Piece",
  },
  {
    icon: Target,
    label: "Event",
    value: "SETU 2026 · Problem Statement PS-01",
  },
  {
    icon: GraduationCap,
    label: "Institution",
    value: "Shri Vile Parle Kelavani Mandal's Institute of Technology, Dhule.",
  },
];

export function About() {
  return (
    <Section id={SECTION_IDS.about}>
      <Reveal>
        <SectionHeading
          eyebrow="About TrustLens"
          title="A student-built tool with a serious purpose"
          description="TrustLens was created for SETU 2026, problem statement PS-01, by Team One Piece. It is a college project rather than a commercial product, and it exists to make the warning signs of a fraudulent message easier to see."
        />
      </Reveal>

      <Reveal delay={0.08}>
        <div className="mx-auto mt-12 max-w-4xl rounded-3xl border border-border/80 lens-panel p-6 sm:p-8">
          <p className="text-pretty text-base leading-relaxed text-foreground/90">
            TrustLens is for everyday internet users, students, and professionals
            who want to recognise scam messages and protect themselves from
            online fraud. Fraudulent messages work by creating pressure and
            hiding where a tap will really take you — a blocked account, a missed
            delivery, an offer that expires in an hour. TrustLens is designed to
            slow that moment down and show you what is actually in front of you.
          </p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            {FACTS.map((fact) => (
              <div
                key={fact.label}
                className="rounded-2xl border border-border/70 bg-background/40 p-4 transition-colors duration-300 hover:border-primary/30"
              >
                <dt className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <fact.icon className="size-3.5" aria-hidden="true" />
                  {fact.label}
                </dt>
                <dd className="mt-2 text-sm font-medium leading-relaxed">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 border-t border-border/60 pt-6 text-sm leading-relaxed text-muted-foreground">
            Scope note: the engine is deliberately narrow and entirely
            rule-based. It checks a fixed set of warning-sign rules plus offline
            link heuristics, all inside your browser. It will always present its
            findings as possible warning signs rather than a guarantee about any
            message.
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
