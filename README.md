# TrustLens

**See the Risk Behind Every Message.**

TrustLens is a client-side prototype that reviews a suspicious SMS, email, or chat
message, explains the scam warning signs it recognises, highlights the evidence in
your own text, and suggests safer next steps. It runs entirely in the browser, with
no account, no upload, and no server-side storage of the message.

Built for **SETU 2026, Problem Statement PS-01** by Team One Piece.

---

## The problem

Fraud arrives inside ordinary-looking messages: a bank warning that your account
will be blocked, a delivery notice with a tracking link, a job offer, a prize you
never entered for. These messages work by creating urgency and by asking you to act
on a link or a code before you have time to think.

Most people have no quick way to ask *"what exactly is suspicious here?"* TrustLens
answers that question with written rules instead of an opaque verdict, so the
reasoning can be read, checked, and argued with.

## What it does

- **Analyses pasted messages** of up to 1,500 characters, from any channel.
- **Names the warning signs** it recognised, with the exact text that triggered each one.
- **Reads English, Hindi, Marathi and Hinglish** with a tested multilingual
  foundation. Coverage is partial and the language label is explicitly a heuristic.
- **Explains each match** in plain language and gives one concrete next step.
- **Highlights the evidence** inside the original message — including the awkward case
  where two findings overlap, so the shared text and the remaining evidence stay
  distinguishable.
- **Builds a 0–100 risk score** from rule weights, shown with its own limitations.
- **Lists every configured rule and what it decided**, including rules that did not
  match, so a clean result is never presented as a clearance.
- **Offers a safety checklist and reporting guidance** for India (National Cyber Crime
  Reporting Portal, helpline 1930).
- **Loads a bundled fictional sample** so the analyzer can be tried without pasting
  anything personal.

## How the analysis works

The engine is deterministic and rule-based. There is no model, no training data, and
no lookup against a URL reputation service.

1. **Normalise** the text (whitespace and case) while keeping offsets aligned to the
   original message, so highlights land on the characters the user actually typed.
2. **Extract URLs** and run structural checks on each one: hostname and TLD shape,
   brand-lookalike comparison, hyphenation, and shortener patterns. These read the
   address string only; no link is ever opened or requested.
3. **Evaluate five rules**, each a pure function over the normalised text and the
   extracted links:

   | Rule | What it looks for | Weight |
   | --- | --- | --- |
   | `credential-request` | A request for an OTP, password, PIN or card detail | 40 |
   | `suspicious-link` | A link or link-based call to action that looks deceptive | 25 |
   | `urgency-pressure` | Deadlines and pressure to act immediately | 20 |
   | `prize-bait` | A prize, reward or gift that asks you to claim it | 20 |
   | `account-threat` | A threat to block, suspend or close an account | 15 |

4. **Score** by adding the weights of matched rules once each, capped at 100. The
   uncapped total is kept, so a capped score can be explained rather than hidden.
   Risk bands: **Low** below 30, **Medium** from 30, **High** from 60.
5. **Place the evidence** in the message. Where two findings overlap, one mark owns the
   shared characters and the other finding's uncovered evidence is outlined separately;
   the interface says which finding owns what.

A rule that never ran is reported as *not evaluated*, which is deliberately different
from *not matched*.

### Language coverage

The same five rules now include contextual patterns for **Hindi and Marathi in
Devanagari**, and for **Hinglish** in Latin script. A rule still contributes its
weight once, evidence still points at the original characters, and no translation
API, model or network call is involved.

`detectLanguage()` reports a variety label next to the score. It is advisory, and it
never gates detection. Devanagari is shared by Hindi and Marathi, so the label is a
function-word heuristic, not a reliable language identifier; thin or conflicting
evidence is reported as **mixed** or **uncertain** with low confidence. Other Indian
and non-Indian languages, image-only messages and voice notes are not covered.

Measurements on a separate 60-case set — including the before/after numbers and the
remaining misses — are in [docs/MULTILINGUAL-EVALUATION.md](docs/MULTILINGUAL-EVALUATION.md).

## Technology

The stack below reflects the actual dependencies in `package.json`.

- **React 19** + **TypeScript** (~5.9), bundled by **Vite 7**
- **Tailwind CSS v4** (`@tailwindcss/vite`) with shadcn/ui components on Radix primitives
- **Framer Motion** for motion, with reduced-motion fallbacks
- **lucide-react** icons, **sonner** toasts
- **React Router 7** (`react-router`)
- **Playwright** (`@playwright/test`) for the browser test suite
- **Bun** as package manager and unit-test runner
- **Convex** and `@convex-dev/auth` are present as hosting-platform scaffolding; the
  analyzer does not use a database, a backend function, or authentication. See
  [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Prerequisites

- **Bun** 1.1 or newer (the project is developed and tested with Bun)
- **Node.js** 20.19+ or 22.12+ if you run tooling through Node
- A Chromium build if you want to run the browser tests (see below)
- No API keys, accounts, or external services are required for the analyzer

The hosting environment supplies `VITE_CONVEX_URL`, which `src/main.tsx` uses to
construct the platform's Convex auth client at startup. The analyzer never queries it,
but the variable must be present for the app to boot, so a local clone needs the same
value in its environment. No other configuration is required.

## Install and run

```bash
bun install
bun run dev          # Vite dev server on http://localhost:5173
```

In the hosted SETU/Freebuff environment the dev server is already running and managed
by the platform; do not start a second one there.

Production build:

```bash
bun run build        # tsc -b && vite build
bun run preview      # serve the built output locally
```

## Tests

```bash
bun test                                    # unit + component suite
bun run evaluate                            # labelled evaluation dataset
bun run evaluate:holdout                    # separate 50-case holdout
bun run evaluate:credential-proposal        # proposal-only dry run
bun run evaluate:credential-stress          # Candidate A stress test
bun run evaluate:multilingual               # separate 60-case multilingual set
bun run test:e2e                            # real-browser Playwright suite
bunx tsc -b --noEmit                        # app type-check
bunx tsc -p tsconfig.e2e.json --noEmit      # browser-suite type-check
bun run lint                                # ESLint
```

**Unit and component tests** — 370 tests in 13 files, covering the rule engine, scoring,
link heuristics, overlap-aware highlighting, false-positive behaviour on benign
messages, multilingual detection and language limits, server-rendered component output,
the labelled evaluation datasets and the proposed-plan UI. The historical 100-case set,
its separate holdout, the credential-rule proposal and the Candidate A stress test are
documented in [docs/EVALUATION.md](docs/EVALUATION.md),
[docs/HOLDOUT-EVALUATION.md](docs/HOLDOUT-EVALUATION.md),
[docs/CREDENTIAL-RULE-PROPOSAL.md](docs/CREDENTIAL-RULE-PROPOSAL.md) and
[docs/CREDENTIAL-STRESS-TEST.md](docs/CREDENTIAL-STRESS-TEST.md). The multilingual set is
in [docs/MULTILINGUAL-EVALUATION.md](docs/MULTILINGUAL-EVALUATION.md).

**Browser tests** — 30 Playwright tests driving the real application in Chromium, in
two viewport projects (1280×900 and 390×844). Each test runs only in the project it
targets, so a full run reports **30 passed and 30 skipped** — skipped by design, not
skipped because anything failed. They cover the analysis flow, both evidence-navigation
paths, keyboard activation, reduced motion, the mobile layout, the pricing and API
sections, and a check that the analysed message is never transmitted.

The browser suite attaches to an **already running** server on `http://localhost:5173`;
`playwright.config.ts` deliberately contains no `webServer` block and never starts or
stops a server. Start the dev server yourself first.

On a fresh machine the browser needs to be downloaded and its system libraries installed:

```bash
bunx playwright install chromium-headless-shell
bunx playwright install-deps chromium-headless-shell   # Linux, needs root
```

The config pins the `chromium-headless-shell` channel, which is the smallest Chromium
build that can render and drive the app. Specs are named `*.e2e.ts` on purpose: `bun
test` collects `*.spec.ts`, so a Playwright spec with that name would be handed to the
unit runner.

**Passing tests do not establish detection accuracy.** They show that the engine behaves
as specified on the fixtures in the repository. The labelled sets are small, synthetic
and internally authored. Their precision/recall numbers describe those messages only;
no real-world accuracy figure is claimed anywhere in this project.

## Project structure

```
src/
  lib/scam-detection/   rule engine: types, rules, engine, links, highlight
                        language.ts / multilingual.ts — multilingual foundation (presentation-free)
  components/trust-lens/ landing sections, analyzer, results, pricing, API, business model
  components/ui/        shadcn/ui primitives
  data/trust-lens.ts    product copy, plans, sample message, limitations, safety text
  pages/                route components
e2e/                    Playwright specs and generated screenshots
docs/                   development, evaluation, monetization and demo documentation
```

## Privacy and data handling

Verified from the source and measured in the browser:

- Analysis is a **pure function call in the page**. The message is held in React state
  and passed to `analyzeMessage()`; there is no API client, no upload, and no storage
  in the analysis path.
- **No request, request body, or WebSocket frame carried the analysed text** in a
  measured session (a unique marker typed into the message appeared in no payload).
  This is asserted by a browser test.
- **Nothing is persisted** by TrustLens: after a check, `localStorage`, `sessionStorage`
  and cookies were all empty. There is no analytics or telemetry code. (The only code
  that would write a cookie is the unused shadcn sidebar primitive.) Closing the tab
  discards the text.
- **Links in a message are never opened, fetched, or resolved.** The URL itself is
  rendered as inert text, never as an anchor.
- **Platform screenshot code does run in the page, and that is a real caveat.** The
  hosting platform's `@vly-ai/integrations` module is imported in `src/main.tsx` and also
  injected by `vlyPlugin()`. At load it registers a `vly-screenshot-request` listener and
  immediately **preloads** `html2canvas-pro` from `cdn.jsdelivr.net` (no SRI), so remote
  third-party code executes on every page load. If a parent frame asks for a screenshot,
  it captures `document.body` — the region containing the message box — and posts the
  image back with target origin `"*"` and no origin check. This is platform scaffolding,
  not analyzer code, and it never transmits the message text on its own (measured). For a
  real deployment it should be removed at the platform level; see
  [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#platform-notes).

## Proposed plans and API

The landing page includes a **Protection for Every Level** pricing section and a
separate **Power Your Product with TrustLens API** section. Both are business-model
demonstrations, not live commercial features:

- **Free ₹0** is the analyzer on this page and is available now.
- **Premium ₹99/month** and **Business ₹2,999/month starting** are proposed. Their
  buttons open an explanation; there is no checkout.
- The API code panel is a labelled illustration. No endpoint exists, no keys are
  issued, and no usage is metered or billed.
- No payment details are collected, no waitlist exists, and no customer, revenue or
  testimonial figure is invented.

The full proposal, its constraints and its UI verification are in
[docs/MONETIZATION.md](docs/MONETIZATION.md).

## What this prototype is not

- **Not a scam determination.** A high score means the wording matches patterns that are
  common in scams. A low score means no configured rule matched; it does **not** mean the
  message is safe.
- **Not a URL reputation or live-link checker.** Link checks read the address string only.
  They do not verify ownership, registration, DNS, content, or whether a site is
  reachable, and they cannot know where a shortened link actually points.
- **Not sender verification.** TrustLens cannot see who really sent a message, whether a
  number or address was spoofed, or whether the organisation named is involved.
- **Not a machine-learning system.** There is no model and no training data.
- **Not validated for real-world accuracy.** The rule weights are editorial judgements,
  not calibrated probabilities. The repository contains small synthetic labelled sets,
  but their metrics describe only those hand-written messages.
- **Not production-ready.** It is an academic prototype with a single-page flow, no
  persistence, and no back end.

## Detection limitations

These are real gaps in the current rules, and they are also shown in the app's detection
breakdown:

- A credential request is counted only when the message *asks* for it. A bank-style alert
  that mentions a code while telling you never to share it is recorded as a note, not a
  match.
- Reward and cashback wording is counted only next to a claim, a win, or a free-gift
  offer; an ordinary balance notification is not counted.
- India's six-digit postal PIN code is not treated as a banking PIN, so a delivery message
  mentioning one is not flagged — and a scam hiding behind that wording would be missed.
- A message that names a code without asking for it or warning about it is still counted.
  That is the cautious choice, and the rule says so.
- Wording and link shape are all the engine can see. Paraphrased scams, image-only
  messages and voice notes are outside its reach.
- Multilingual coverage is a **foundation**: English, Hindi and Marathi in Devanagari,
  and Hinglish in Latin script. Other languages, romanised Marathi, heavy spelling
  variation and paraphrases that avoid the configured patterns are not covered.
- Language identification is heuristic. Hindi and Marathi share Devanagari, and the
  label can be mixed or uncertain; it never changes the score.
- Unicode trickery in links (homoglyphs, mixed scripts) is only partly handled.

## Reporting guidance

If you think a message is a scam attempt — in India — the message itself is evidence:

- Report suspected cybercrime at the **National Cyber Crime Reporting Portal**,
  [cybercrime.gov.in](https://www.cybercrime.gov.in/).
- For financial cyber fraud, call the **1930** helpline.
- Report it to the organisation being imitated through its official app or the number
  printed on your card or statement — never through a contact detail in the message.
- If money has already left your account, report immediately; a fast report gives the
  best chance of freezing the transfer.
- **Never share an OTP, password, PIN or card detail with anyone**, whoever the message
  claims to be from.

These are pointers to public reporting channels, not legal advice.

## Further documentation

- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — architecture, source layout, how to add a
  rule, testing strategy, platform notes, troubleshooting.
- [docs/MULTILINGUAL-EVALUATION.md](docs/MULTILINGUAL-EVALUATION.md) — supported
  varieties, language-identification limits, dataset, before/after metrics and misses.
- [docs/MONETIZATION.md](docs/MONETIZATION.md) — proposed consumer plans, API tiers,
  revenue model and the honesty constraints enforced in the UI.
- [docs/DEMO_GUIDE.md](docs/DEMO_GUIDE.md) — a short, repeatable demonstration with exact
  inputs and verified expected output.
