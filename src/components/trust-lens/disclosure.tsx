import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

/**
 * One expandable region, used by the finding cards, the link indicators and the
 * rule-coverage rows so all three behave and sound the same.
 *
 * The controller owns `open` rather than the primitive, because the finding list
 * has to be able to open a specific card from the overview chips and from the
 * message inspector.
 *
 * Accessibility comes from the Radix primitive: the trigger is a real button
 * carrying `aria-expanded` and `aria-controls`, and the content is labelled by
 * it. The content is mounted on open and unmounted on close.
 */
export function Disclosure({
  open,
  onOpenChange,
  trigger,
  children,
  className,
  triggerClassName,
  contentClassName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Everything inside the toggle. Must not contain another interactive control. */
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
}) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className={className}
    >
      <CollapsibleTrigger
        className={cn(
          "lens-panel-trigger group/trigger flex w-full items-start gap-3 text-left",
          "outline-none focus-visible:ring-[3px] focus-visible:ring-primary/45",
          triggerClassName,
        )}
      >
        <span className="flex min-w-0 flex-1 items-start gap-3">{trigger}</span>
        <ChevronDown
          className="lens-panel-chevron mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </CollapsibleTrigger>

      <CollapsibleContent className={cn("lens-panel-content", contentClassName)}>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
