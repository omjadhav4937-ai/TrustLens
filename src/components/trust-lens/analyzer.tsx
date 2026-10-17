import { Reveal } from "@/components/trust-lens/reveal";
import { Section, SectionHeading } from "@/components/trust-lens/section";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_MESSAGE_LENGTH,
  SAMPLE_MESSAGE,
  SECTION_IDS,
} from "@/data/trust-lens";
import { analyzeMessage, type ScamAnalysis } from "@/lib/scam-detection";
import { scrollToSection } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import { RotateCcw, ScanSearch, Sparkles, TriangleAlert } from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";

export function Analyzer({
  onAnalysisChange,
}: {
  /**
   * Called with the result of a check, or with `null` whenever the existing
   * result stops describing what is in the input.
   */
  onAnalysisChange: (analysis: ScamAnalysis | null) => void;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  /** Whether the lifted result currently belongs to some earlier text. */
  const hasAnalysed = useRef(false);

  const messageId = useId();
  const counterId = useId();
  const noticeId = useId();
  const errorId = useId();

  const isNearLimit = message.length >= MAX_MESSAGE_LENGTH * 0.9;

  /** Drops a result that no longer matches the input, and says so. */
  const discardResult = () => {
    if (!hasAnalysed.current) return;
    hasAnalysed.current = false;
    onAnalysisChange(null);
    setNotice("The previous result was cleared because the message changed.");
  };

  const handleAnalyze = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!message.trim()) {
      setError("Paste or load a message before analyzing.");
      setNotice(null);
      hasAnalysed.current = false;
      onAnalysisChange(null);
      return;
    }

    setError(null);
    setNotice(null);
    hasAnalysed.current = true;
    onAnalysisChange(analyzeMessage(message));
    scrollToSection(SECTION_IDS.results);
  };

  const handleClear = () => {
    setMessage("");
    setError(null);
    setNotice(null);
    hasAnalysed.current = false;
    onAnalysisChange(null);
  };

  const handleLoadSample = () => {
    discardResult();
    setMessage(SAMPLE_MESSAGE);
    setError(null);
  };

  return (
    <Section id={SECTION_IDS.analyzer} className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--primary) 18%, transparent), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="relative">
        <Reveal>
          <SectionHeading
            eyebrow="Message analyzer"
            title="Check a message before you act on it"
            description="Paste anything that looks suspicious — a bank alert, a delivery notice, a job offer, an unexpected payment request. TrustLens handles SMS, email, and chat messages, and keeps all of it in your browser."
          />
        </Reveal>

        <Reveal delay={0.08}>
          <form
            onSubmit={handleAnalyze}
            noValidate
            className={cn(
              "mx-auto mt-12 max-w-3xl rounded-3xl border border-border/80 lens-panel p-5 shadow-xl sm:p-7",
              "transition-[border-color,box-shadow] duration-300",
              "focus-within:border-primary/45",
              "focus-within:shadow-[0_24px_60px_-32px_var(--primary)]",
            )}
          >
            <label
              htmlFor={messageId}
              className="block text-sm font-semibold tracking-tight"
            >
              Your message
            </label>
            <p id={noticeId} className="mt-1 text-xs text-muted-foreground">
              Paste the full text you received. Avoid pasting personal details
              you would not want to read back later.
            </p>

            <Textarea
              id={messageId}
              name="message"
              value={message}
              onChange={(event) => {
                discardResult();
                setMessage(event.target.value);
                if (error) setError(null);
              }}
              maxLength={MAX_MESSAGE_LENGTH}
              rows={8}
              aria-describedby={cn(counterId, error ? errorId : undefined)}
              aria-invalid={error ? true : undefined}
              placeholder="Paste a suspicious SMS, email, or chat message here..."
              className={cn(
                "lens-input-glow mt-3 min-h-[11rem] resize-y bg-background/70 font-mono text-sm leading-relaxed",
                "transition-[border-color,box-shadow] duration-200",
                "focus-visible:border-primary/70 focus-visible:ring-primary/25",
                error && "border-rose-400/60",
              )}
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p
                id={counterId}
                className={cn(
                  "text-xs tabular-nums text-muted-foreground transition-colors",
                  isNearLimit && "font-medium text-amber-200",
                )}
              >
                {message.length.toLocaleString()} /{" "}
                {MAX_MESSAGE_LENGTH.toLocaleString()} characters
              </p>
              <p className="text-xs text-muted-foreground">
                Processed locally · nothing is uploaded
              </p>
            </div>

            {error && (
              <p
                id={errorId}
                role="alert"
                className="mt-3 flex items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm font-medium text-rose-100"
              >
                <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}

            {notice && !error && (
              <p
                role="status"
                className="mt-3 text-xs leading-relaxed text-muted-foreground"
              >
                {notice}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button type="submit" size="lg" className="lens-cta-glow sm:min-w-48">
                <ScanSearch className="size-4" aria-hidden="true" />
                Analyze Message
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={handleLoadSample}
              >
                <Sparkles className="size-4" aria-hidden="true" />
                Load Sample Message
              </Button>
              <Button
                type="button"
                size="lg"
                variant="ghost"
                onClick={handleClear}
                disabled={message.length === 0}
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Clear
              </Button>
            </div>

            <p className="mt-5 border-t border-border/60 pt-4 text-xs leading-relaxed text-muted-foreground">
              Privacy notice: TrustLens never uploads your message. Everything
              stays inside this browser tab — the check runs as plain rules in
              this page, with no account, no server-side storage, no third-party
              service and no logging of the text you paste.
            </p>
          </form>
        </Reveal>
      </div>
    </Section>
  );
}
