import { Section, SectionHeading } from "@/components/scam-spotter/section";
import { SECTION_IDS } from "@/data/scam-spotter";
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
    value:
      "Shri Vile Parle Kelavani Mandal's Institute of Technology, Dhule.",
  },
];

export function About() {
  return (
    <Section id={SECTION_IDS.about}>
      <SectionHeading
        eyebrow="About"
        title="A student prototype, built in the open"
        description="Scam Spotter is a college project, not a commercial product. It exists to make the warning signs of a fraudulent message easier to see."
      />

      <div className="mx-auto mt-12 max-w-4xl rounded-3xl border border-border/80 bg-card/70 p-6 sm:p-8">
        <p className="text-pretty text-base leading-relaxed text-foreground/90">
          Scam Spotter is a student prototype created for{" "}
          <span className="font-semibold">SETU 2026, PS-01</span> by{" "}
          <span className="font-semibold">Team One Piece</span>. The project
          focuses on one everyday problem: people receive messages that pressure
          them into clicking a link or sharing a code, and the warning signs are
          easy to miss when you are in a hurry.
        </p>

        <dl className="mt-8 grid gap-4 sm:grid-cols-3">
          {FACTS.map((fact) => (
            <div
              key={fact.label}
              className="rounded-2xl border border-border/70 bg-background/40 p-4"
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
          Scope note: this build covers the interface only. Warning-sign
          detection, scoring, and explanations are planned for the next step of
          the project, and the prototype will always present findings as
          possible warning signs rather than a guarantee.
        </p>
      </div>
    </Section>
  );
}
