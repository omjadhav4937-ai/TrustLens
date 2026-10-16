import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

/**
 * Scam Spotter wordmark: shield icon plus name and tagline.
 * Used in the header, the footer, and the about panel.
 */
export function Brand({
  className,
  showTagline = true,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-xl text-primary-foreground shadow-sm"
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--primary), var(--accent))",
        }}
        aria-hidden="true"
      >
        <ShieldCheck className="size-5" strokeWidth={2.2} />
      </span>
      <span className="flex flex-col">
        <span className="text-[0.95rem] font-semibold leading-tight tracking-tight">
          Scam Spotter
        </span>
        {showTagline && (
          <span className="text-[0.625rem] font-medium uppercase leading-tight tracking-[0.16em] text-muted-foreground">
            Think Before You Tap
          </span>
        )}
      </span>
    </span>
  );
}
