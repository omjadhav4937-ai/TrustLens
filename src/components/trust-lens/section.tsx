import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Consistent page section: shared max width, spacing, and anchor offset. */
export function Section({
  id,
  children,
  className,
  containerClassName,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 lg:px-8", className)}
    >
      <div className={cn("mx-auto w-full max-w-6xl", containerClassName)}>
        {children}
      </div>
    </section>
  );
}

/** Eyebrow + title + description block used above most sections. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      {eyebrow && (
        <span className="inline-flex items-center rounded-full border border-border/80 bg-secondary/60 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
