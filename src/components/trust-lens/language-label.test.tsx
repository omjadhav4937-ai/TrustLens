import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RiskOverview } from "@/components/trust-lens/risk-overview";
import { analyzeMessage } from "@/lib/scam-detection";

/**
 * The language label is advisory, but it has to be visible — and honest about
 * uncertainty — so a reader is never given a confident identification that the
 * detector cannot support.
 */

function renderLabel(message: string): string {
  return renderToStaticMarkup(
    <RiskOverview
      analysis={analyzeMessage(message)}
      selectedRuleId={null}
      onSelectFinding={() => {}}
    />,
  );
}

describe("language label in the risk report", () => {
  it("shows a clear Hindi label", () => {
    const html = renderLabel("आपका खाता बंद हो जाएगा। तुरंत सूचना दें।");

    expect(html).toContain("Language (heuristic)");
    expect(html).toContain("Hindi (Devanagari)");
  });

  it("shows a Hinglish label", () => {
    const html = renderLabel(
      "Aaj tumhara account block ho jayega. Apna OTP turant share karo.",
    );

    expect(html).toContain("Hinglish (Latin script)");
  });

  it("reports mixed or uncertain Devanagari instead of guessing", () => {
    const html = renderLabel("यह एक सामान्य संदेश है।");

    expect(html).toMatch(/Mixed or uncertain \(Devanagari\)|Uncertain \(Devanagari\)/);
    expect(html).toMatch(/could not be identified confidently|Devanagari is shared/i);
  });
});
