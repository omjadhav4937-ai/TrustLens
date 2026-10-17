import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

/**
 * TrustLens wordmark: gradient shield plus the product name.
 *
 * The tagline is rendered separately (hero headline and footer) because it is
 * now a full sentence and would not fit beside the wordmark in the header.
 */
export function Brand({ className }: { className?: string }) {
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
      <span className="text-[0.95rem] font-semibold leading-tight tracking-tight">
        TrustLens
      </span>
    </span>
  );
}
