import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";

import { ApiSection } from "@/components/trust-lens/api-section";
import { Pricing } from "@/components/trust-lens/pricing";
import { RevenueModel } from "@/components/trust-lens/revenue-model";
import {
  API_DISCLOSURE,
  API_LIMITATIONS,
  PRICING_DISCLOSURE,
  PRICING_PLANS,
  REVENUE_PRIVACY_NOTE,
} from "@/data/trust-lens";

/**
 * Static render checks for the proposed plans and the illustrative API.
 *
 * They verify the copy that is actually produced, the absence of a checkout or
 * a live endpoint, and that the free call to action points at the analyzer.
 * Pointer behaviour, focus movement and layout need a browser and are covered
 * by the Playwright suite instead.
 */

function render(element: ReactElement): string {
  return renderToStaticMarkup(element);
}

const pricing = render(<Pricing />);
const api = render(<ApiSection />);
const revenue = render(<RevenueModel />);

describe("pricing section", () => {
  it("uses the requested heading and supporting copy", () => {
    expect(pricing).toContain("Protection for Every Level");
    expect(pricing).toContain(
      "Start with essential scam awareness. Unlock more ways to stay informed as your needs grow.",
    );
  });

  it("renders all three plans with their proposed prices and features", () => {
    expect(PRICING_PLANS).toHaveLength(3);
    for (const plan of PRICING_PLANS) {
      expect(pricing).toContain(plan.name);
      expect(pricing).toContain(plan.price);
      for (const feature of plan.features) {
        expect(pricing).toContain(feature);
      }
    }
    expect(pricing).toContain("₹0");
    expect(pricing).toContain("₹99");
    expect(pricing).toContain("₹2,999");
  });

  it("marks the featured plan without hiding its content", () => {
    expect(pricing).toContain("Most Popular");
    expect(pricing).toContain("Proposed — not available");
  });

  it("sends Try Free to the working analyzer", () => {
    expect(pricing).toContain('href="#analyzer"');
    expect(pricing).toContain(">Try Free<");
  });

  it("offers no checkout and collects no payment details", () => {
    expect(pricing).not.toMatch(/buy now|checkout|subscribe now|add to cart/i);
    expect(pricing).not.toMatch(/<form/i);
    expect(pricing).not.toMatch(/type="email"/i);
    expect(pricing).not.toMatch(/<input/i);
  });

  it("labels paid plans as coming soon in buttons, not links", () => {
    expect(pricing.match(/>Coming Soon</g)).toHaveLength(2);
    expect(pricing).not.toContain('href="#pricing"');
    expect(pricing.match(/<button/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("carries the exact pricing disclosure", () => {
    expect(pricing).toContain(PRICING_DISCLOSURE);
  });
});

describe("API section", () => {
  it("uses the requested title and description", () => {
    expect(api).toContain("Power Your Product with TrustLens API");
    expect(api).toContain(
      "Bring explainable scam-warning capabilities into the digital experiences you build.",
    );
    expect(api).toContain("TrustLens plans to offer API access");
  });

  it("labels the code panel as illustrative and not a live endpoint", () => {
    expect(api).toContain("Illustrative example — not a live endpoint.");
    expect(api).toContain("Illustrative response");
    expect(api).toContain("not a final contract");
  });

  it("uses an obviously nonfunctional placeholder key", () => {
    expect(api).toContain("YOUR_API_KEY");
    expect(api).not.toMatch(/sk_live_|Bearer [A-Za-z0-9]{20,}/);
  });

  it("shows the full example request and response", () => {
    for (const token of [
      "POST",
      "/v1/analyze",
      "Content-Type",
      "riskScore",
      "riskLevel",
      "credential_request",
      "urgency_pressure",
      "Do not share verification codes.",
    ]) {
      expect(api).toContain(token);
    }
  });

  it("labels every API plan as proposed and repeats the limitations", () => {
    expect(api.match(/>Proposed</g)).toHaveLength(3);
    expect(api).toContain("₹1,499");
    expect(api).toContain("₹4,999");
    for (const limitation of API_LIMITATIONS) {
      expect(api).toContain(limitation);
    }
    expect(api).toContain(API_DISCLOSURE);
  });

  it("uses a button for the API call to action and has no form", () => {
    expect(api).toContain("Explore API Plans — Coming Soon");
    expect(api).toMatch(/<button[^>]*type="button"/);
    expect(api).not.toMatch(/<form/i);
    expect(api).not.toMatch(/type="email"/i);
    expect(api).not.toMatch(/api[_-]?waitlist/i);
  });

  it("loads no remote image, script or stylesheet", () => {
    expect(api).not.toMatch(/<img|<script|@import|https?:\/\/[^"\s]*\.(png|jpg|svg|css|js)/i);
  });
});

describe("business model section", () => {
  it("explains the three revenue channels without inventing figures", () => {
    expect(revenue).toContain("How TrustLens could earn revenue");
    expect(revenue).toContain("Individuals");
    expect(revenue).toContain("Organisations");
    expect(revenue).toContain("Developers and platforms");
    expect(revenue).not.toMatch(/₹\s?\d|million|billion|% of|ARR|MRR/i);
    expect(revenue).not.toMatch(/testimonial|customer count|users today/i);
  });

  it("states the privacy limit of the intended model", () => {
    // React escapes apostrophes in text children.
    expect(revenue.replace(/&#x27;/g, "'")).toContain(REVENUE_PRIVACY_NOTE);
  });
});
