import { Section, SectionHeading } from "@/components/scam-spotter/section";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_MESSAGE_LENGTH,
  SAMPLE_MESSAGE,
  SECTION_IDS,
} from "@/data/scam-spotter";
import { cn } from "@/lib/utils";
import { RotateCcw, ScanSearch, Sparkles, TriangleAlert } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

export function Analyzer({
  onSubmit,
}: {
  /** Receives the trimmed message text when the user asks for an analysis. */
  onSubmit: (message: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messageId = useId();
  const counterId = useId();
  const noticeId = useId();
  const errorId = useId();

  const isTooLong = message.length >= MAX_MESSAGE_LENGTH;

  const handleAnalyze = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) {
      setError("Paste or load a message before analyzing.");
      return;
    }
    setError(null);
    onSubmit(message);
  };

  const handleClear = () => {
    setMessage("");
    setError(null);
  };

  const handleLoadSample = () => {
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
        <SectionHeading
          eyebrow="Message analyzer"
          title="Check a message before you act on it"
          description="Paste the full text you received. The analyzer runs entirely in your browser and shows a placeholder until the detection engine arrives."
        />

        <form
          onSubmit={handleAnalyze}
          noValidate
          className="mx-auto mt-12 max-w-3xl rounded-3xl border border-border/80 bg-card/70 p-5 shadow-xl backdrop-blur-sm sm:p-7"
        >
          <label
            htmlFor={messageId}
            className="block text-sm font-semibold tracking-tight"
          >
            Message to analyze
          </label>
          <p id={noticeId} className="mt-1 text-xs text-muted-foreground">
            SMS, WhatsApp, email, or any chat message. Do not include personal
            details you would not want to re-read.
          </p>

          <Textarea
            id={messageId}
            name="message"
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              if (error) setError(null);
            }}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={8}
            aria-describedby={cn(counterId, error ? errorId : undefined)}
            aria-invalid={error ? true : undefined}
            placeholder="Paste a suspicious SMS, email, or chat message here..."
            className="mt-3 min-h-[11rem] resize-y bg-background/60 font-mono text-sm leading-relaxed"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p
              id={counterId}
              className={cn(
                "text-xs tabular-nums text-muted-foreground",
                isTooLong && "text-amber-200",
              )}
            >
              {message.length.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()}{" "}
              characters
            </p>
            <p className="text-xs text-muted-foreground">
              Processed locally · nothing is uploaded
            </p>
          </div>

          {error && (
            <p
              id={errorId}
              role="alert"
              className="mt-3 flex items-center gap-2 text-sm font-medium text-rose-200"
            >
              <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button type="submit" size="lg" className="sm:min-w-44">
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
            Privacy notice: Scam Spotter keeps your message inside this browser
            tab. There is no account, no upload, and no server-side storage of
            the text you paste.
          </p>
        </form>
      </div>
    </Section>
  );
}
