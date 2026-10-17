# Proposed plans, API and business model

**Nothing in this document is for sale.** There is no payment processing, no
checkout, no subscription record, no hosted API, no API key issuance, no usage
metering and no billing. Everything below is a product and pitch artefact for
SETU 2026, labelled as proposed wherever it appears in the interface.

## 1. Consumer plans — "Protection for Every Level"

Section id: `#pricing`. Component: `src/components/trust-lens/pricing.tsx`.
Copy and plan data: `src/data/trust-lens.ts` (`PRICING_PLANS`,
`PRICING_DISCLOSURE`).

| Plan | Price | Status | Audience | Features |
| --- | --- | --- | --- | --- |
| Free | ₹0/month | **Available now** | Individuals getting started | Basic message analysis, risk scores and warning signs, evidence-based explanations, safety recommendations |
| Premium | ₹99/month (proposed) | Coming soon | Individuals wanting convenience and higher usage | Higher analysis limits, analysis history, enhanced reports, additional convenience features |
| Business | ₹2,999/month starting (proposed) | Coming soon | Colleges, institutions, small organisations | Scam-awareness training resources, organisation-wide access options, administrative reporting, aggregate usage insights |

The Premium card is the featured card: a cyan/electric-blue border, a restrained
glow, and a **Most Popular** badge. It is not hidden behind hover or motion, and
its content is visible at every viewport.

### What each button does

- **Try Free** is an anchor to `#analyzer` on the same page. It scrolls to the
  working analyzer. It does not navigate to a dead route.
- **Coming Soon** is a real `<button>` that opens an accessible dialog explaining
  that the plan is proposed, that pricing and features need validation, and that
  no payment flow exists. It cannot collect an email address or payment detail.

### Disclosure shown with the cards

> Premium and Business plans are proposed offerings. Pricing and features are
> subject to validation. Subscriptions and payment processing are not currently
> active.

A second line states that no payment details are collected anywhere on the page.

## 2. API section — "Power Your Product with TrustLens API"

Section id: `#api`. Component: `src/components/trust-lens/api-section.tsx`.

The section pairs three intended benefits with a static code panel:

- **Explainable Results** — structured findings and explanations, not only a
  binary label.
- **Developer-Friendly Integration** — a future endpoint for supported
  workflows.
- **Flexible Usage Plans** — plans based on monthly usage and organisational
  requirements.

The code panel is labelled twice: a badge reads **Illustrative**, and a banner
reads **Illustrative example — not a live endpoint.** The request uses
`Authorization: Bearer YOUR_API_KEY`, and the response is explicitly described as
not a final contract. There is no fetch, no form, no hidden key and no working
endpoint.

### Proposed API plans

| Plan | Proposed price | Audience | Benefits |
| --- | --- | --- | --- |
| Developer | Free, with a future limited quota | Students, developers, prototype builders | Limited monthly requests, basic response schema, development/testing use |
| Startup | ₹1,499/month | Small applications and early teams | Higher request quota, usage reports, integration documentation, email support if operationally feasible |
| Growth / Enterprise | From ₹4,999/month; Enterprise by discussion | Growing platforms, fintech, marketplaces, larger organisations | Higher limits, organisational usage reporting, configurable quotas, enterprise support arrangements |

Every card carries a **Proposed** badge. The section repeats that no API is
hosted, no keys are issued, rate limiting and metering do not exist, billing does
not exist, and no uptime, latency, availability or accuracy guarantee is offered.

### API call to action

**Explore API Plans — Coming Soon** scrolls to the plan grid and reveals a
`role="status"` line saying API access is planned, not available, and that there
is no signup or waitlist. It does not open a fake dashboard and does not collect
personal data.

## 3. Business model

Section id: `#business-model`. Component:
`src/components/trust-lens/revenue-model.tsx`.

| Channel | Intended revenue | Customer value |
| --- | --- | --- |
| Individuals | Optional paid convenience on top of a free core | More history, higher limits, enhanced reports |
| Organisations | Future subscriptions | Scam-awareness training, organisation-wide access, administrative reporting |
| Developers and platforms | Future API subscriptions or usage-based pricing | Message-risk analysis embedded in their own workflows |

No revenue figure, customer count, conversion rate, testimonial or adoption
statistic is shown anywhere. The section states that the intent is to charge for
additional convenience and organisational capability, **not** for access to
private message content. It also states that this is a product intention, not a
completed privacy design, and that any future hosted API would need its own
privacy and security review.

## 4. Honesty constraints enforced in code and tests

- `PlanStatus` is `"available"` or `"proposed"`; only the Free plan is
  `available`.
- The proposal never renders a `<form>`, an email input, a card field or a
  checkout link. Static-render tests assert this.
- The API section renders no remote image, script or stylesheet.
- The API CTA performs no network request; a browser test watches for a
  `/v1/analyze` request and asserts none occurs.
- Every proposed plan and API tier carries a visible **Proposed** label.
- No fake testimonial, review, logo wall, customer count or revenue figure is
  present.

## 5. UI verification

Verified with Playwright in Chromium at 1280×900, 820×1180 and 390×844:

- The pricing cards sit in three columns on desktop, two on tablet and one on
  mobile, with no horizontal overflow.
- The code panel scrolls internally on narrow screens and does not widen the
  page.
- The header **Pricing** link scrolls to the section; the mobile menu remains
  unchanged.
- **Try Free** leaves the analyzer textarea and the Analyze button in the
  viewport.
- **Coming Soon** opens a dialog by pointer and by keyboard (Tab then Enter), and
  Escape closes it.
- Focus states are visible on the plan buttons, CTA and dialog controls.
- Reduced motion removes the reveal motion without hiding the content.

Static render tests additionally assert the heading hierarchy, the exact
disclosure text, the three plans, the three API tiers, the placeholder key and
the absence of checkout markup.

## 6. What remains unimplemented

- Payment processing, subscriptions, invoices, tax handling and refunds.
- Accounts, plan entitlements and usage limits.
- A hosted API, authentication for API keys, rate limiting, metering and
  billing.
- Any privacy or security design for a cloud API that would receive message
  text.
- Any validation of willingness to pay, price sensitivity or demand.

These are roadmap items. The interface says so on every relevant surface.
