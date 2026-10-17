# Development notes

How TrustLens is put together, how to work on it, and what to watch out for.

See the [README](../README.md) for product scope, privacy behaviour, and limitations.

## Architecture

Three layers, deliberately separated so the detection logic can be tested and reasoned
about without a browser:

```
src/lib/scam-detection/        presentation-free engine (no React, no DOM)
        │  analyzeMessage(text) -> ScamAnalysis
        ▼
src/data/trust-lens.ts         product copy: labels, limitations, safety actions, sample
        │
        ▼
src/components/trust-lens/     React rendering, interaction, evidence navigation
```

`analyzeMessage` is a pure function. It performs no I/O, opens no links, and reads no
global state, so the same input always yields the same analysis (apart from
`analyzedAt`).

### Data flow of one check

1. `Analyzer` holds the textarea in state. Submitting calls `analyzeMessage(message)`.
2. The result is lifted to `Landing`, which owns it as the single source of truth. Editing
   the textarea after a check **discards** the result and says so, so a report can never
   describe text that is no longer in the box.
3. `ResultsPanel` renders `ResultsExplorer`, keyed on `analysis.analyzedAt`, so a new
   check starts from a clean slate (no stale selection, no card left open).
4. `buildHighlightPlan(message, findings)` turns findings into segments. Each finding
   resolves to a target: `own` (its own mark), `shared` (another rule's mark covers its
   evidence) or `absent` (nothing to point at).
5. Activating *Show in message* focuses the resolved mark, adds a temporary pulse, and
   writes one sentence into the inspector's `role="status"` line. Failures are reported
   through `navigationFailure()`, never swallowed.

### Evidence model

- A **mark** (`button.lens-mark`) is a control: it is focusable, activates selection, and
  carries `data-rule-id` plus, when another finding navigates to it,
  `data-focus-target-for`.
- A **remainder** (`mark.lens-evidence-remainder`) is evidence only: not focusable, not a
  control, and outlined along the top so it cannot be mistaken for a mark.
- States are distinguished by **shape** as well as colour — dotted (ordinary), double
  (shared), inset ring (selected), dashed/solid top rule (remainder) — so the distinction
  survives greyscale and colour-vision differences.

## Source layout

| Path | Responsibility |
| --- | --- |
| `src/lib/scam-detection/types.ts` | Shared types: `ScamAnalysis`, `ScamFinding`, `RuleEvaluation`, rule and link shapes |
| `src/lib/scam-detection/normalize.ts` | Whitespace/case normalisation that preserves original offsets |
| `src/lib/scam-detection/links.ts` | URL extraction and structural indicators (`observed` vs `inferred`) |
| `src/lib/scam-detection/rules.ts` | The five rules: id, weight, copy, pure `detect()` |
| `src/lib/scam-detection/engine.ts` | Orchestration, scoring, thresholds, summary and score explanation |
| `src/lib/scam-detection/highlight.ts` | Segments, per-finding targets, navigation-failure classification |
| `src/lib/scam-detection/index.ts` | Public surface of the engine |
| `src/lib/scam-detection/evaluation/` | 100-case dataset, 50-case holdout, 60-case stress set, deterministic runner, integrity tests, credential proposal dry run (see [EVALUATION.md](EVALUATION.md), [HOLDOUT-EVALUATION.md](HOLDOUT-EVALUATION.md), [CREDENTIAL-RULE-PROPOSAL.md](CREDENTIAL-RULE-PROPOSAL.md), [CREDENTIAL-STRESS-TEST.md](CREDENTIAL-STRESS-TEST.md)) |
| `src/data/trust-lens.ts` | Copy, `SAMPLE_MESSAGE`, limitations, safety actions, reporting details |
| `src/components/trust-lens/` | Landing sections, analyzer, results, evidence navigation |
| `src/pages/` | Route components (`Landing`, `Auth`, `Dashboard`, `NotFound`) |
| `e2e/` | Playwright specs (`*.e2e.ts`) and generated screenshots |
| `src/components/ui/` | shadcn/ui primitives (generated, mostly untouched) |

## Engine API

```ts
import {
  analyzeMessage,        // (text: string) => ScamAnalysis
  riskLevelForScore,     // (score: number) => "low" | "medium" | "high"
  buildSummary,          // one-sentence summary for a result
  buildScoreExplanation, // where the score came from
  RULES, getRuleById,    // rule catalogue
  extractLinks,          // (text) => AnalyzedLink[]
  buildHighlightPlan,    // (text, findings) => { segments, targets }
  navigationFailure,     // reason a navigation cannot happen, or null
  MAX_SCORE, RISK_THRESHOLD_MEDIUM, RISK_THRESHOLD_HIGH,
} from "@/lib/scam-detection";
```

`ScamAnalysis` always contains `ruleEvaluations` for **every** rule, each with a status of
`matched`, `not-matched`, `not-evaluated` or `error`. That distinction is load-bearing: a
rule that never ran must not be displayed as if it had cleared the message.

## Adding or changing a rule

1. Add the rule to `RULES` in `src/lib/scam-detection/rules.ts` with an id, weight,
   severity, copy, and a pure `detect(context)` returning ranges (plus an optional
   `note`).
2. Keep `detect` total: never throw, never touch the network, and return unsorted or
   overlapping ranges if that is natural — the engine merges and clamps them, and a rule
   contributes at most once.
3. Expect these suites to react, and update them deliberately rather than loosening
   assertions:
   - `engine.test.ts` — scoring, thresholds, capping, rule evaluation statuses
   - `coverage.test.ts` — every rule is reachable and its copy is present
   - `false-positives.test.ts` — benign messages stay quiet
   - `highlight.test.ts` — offsets, marks, shared evidence and remainders
   - `evaluation/evaluation.test.ts` — dataset integrity and the evaluation
     snapshot. If a rule change alters the measured counts, update the snapshot
     deliberately and explain the new numbers; never loosen it silently.
   - `evaluation/holdout/holdout.test.ts` — holdout integrity, separation from
     the original dataset, and its own snapshot. The two reports stay separate.
4. Weights are editorial. Changing one changes the risk band of fixtures, so update the
   documented demo output in [DEMO_GUIDE.md](DEMO_GUIDE.md) at the same time.

Do not change weights, thresholds, or scoring semantics to make a test pass. If a rule is
wrong, fix the rule and say why in the commit.

## Testing

```bash
bun test                                 # 305 tests, 9 files
bun run evaluate                         # 100-case detector evaluation (see EVALUATION.md)
bun run evaluate:holdout                 # separate 50-case holdout (see HOLDOUT-EVALUATION.md)
bun run evaluate:credential-proposal     # proposal-only dry run; never used by the app
bun run evaluate:credential-stress       # Candidate A stress test (see CREDENTIAL-STRESS-TEST.md)
bun run test:e2e                         # 21 browser tests, 2 viewport projects
bunx tsc -b --noEmit                     # app
bunx tsc -p tsconfig.e2e.json --noEmit   # browser suite
bun run lint
```

Constraints worth knowing:

- **Spec naming.** `bun test` collects `*.spec.ts` files. Browser specs are therefore
  named `*.e2e.ts`, and `playwright.config.ts` matches `**/*.e2e.ts`. Renaming a spec to
  `*.spec.ts` hands it to the unit runner and breaks the suite.
- **Server ownership.** `playwright.config.ts` has no `webServer` block on purpose. The
  suite attaches to the server already running on `http://localhost:5173` and must never
  start, stop, or restart it.
- **Browser.** The config pins `channel: "chromium-headless-shell"`. On a fresh machine:
  `bunx playwright install chromium-headless-shell` and
  `bunx playwright install-deps chromium-headless-shell`.
- **Screenshots.** `e2e/screenshots/` is generated by the suite and is not tracked. Any
  committed screenshot would go stale silently; there is no visual-diff baseline.

## Workflow

1. `bun install`
2. `bun run dev` — Vite on port 5173. In the hosted environment this is already running
   and platform-managed; do not start another.
3. Make the change, then run `bunx tsc -b --noEmit` and `bun test`.
4. If the change touches the UI, run `bun run test:e2e` against the live server.
5. Before handing off: `bun run build`.

## Platform notes

TrustLens is hosted on the Freebuff/Vly platform, which supplies some scaffolding:

- `src/main.tsx` imports `@vly-ai/integrations`, mounts `VlyToolbar` from the read-only
  file `vly-toolbar-readonly.tsx`, and wraps the app in `ConvexAuthProvider`.
- A `ConvexReactClient` is constructed from `VITE_CONVEX_URL`. The product makes no
  queries, mutations, or actions, so nothing is stored server-side.
- `/auth` and `/dashboard` are starter scaffolding. They are reachable by URL but are not
  linked from the product, and the analyzer needs no account. `RequireAuth` is kept intact
  so the routes keep working.
- Platform-owned files (`vly-toolbar-readonly.tsx`, `src/convex/auth.ts`,
  `src/convex/auth.config.ts`, `src/convex/auth/emailOtp.ts`) are marked *do not modify*.

### What `@vly-ai/integrations` actually does

Verified by reading the package and exercising it in the browser:

1. **Screenshot listener.** Importing the module runs a side effect that registers a
   `message` listener for `vly-screenshot-request`, then *preloads*
   `https://cdn.jsdelivr.net/npm/html2canvas-pro@2.0.4/dist/html2canvas-pro.min.js`
   (no `integrity` attribute) so it is ready before the first request. On a request it
   captures `document.body` and posts the data URL to `window.parent` with target origin
   `"*"`. Its handler does not check `event.origin`.
2. **`vlyPlugin()`** injects `import '@vly-ai/integrations'` plus a small HMR/runtime
   error forwarder into `index.html`. Vite bundles both, which is why the integration is
   present in **production** output as well as in the dev preview.
3. **`VlyToolbar`** is separate from the package: it listens for
   `vly-toolbar-enable-select`, inspects components, and rasterises the selected element
   with `@zumer/snapdom`. It is the editor's element picker.

None of this is used by the analyzer. `src/lib/vly-integrations.ts` (an unused wrapper
for AI/email/payment calls) has been removed; if a Convex action needs those clients,
call `createVlyIntegrations` from the package directly, as `integrations.md` now shows.

**If you remove it for a deployment**, drop `vlyPlugin()` from the `plugins` array and
the import in `src/main.tsx`. Measured effect in this repository: the entry chunk goes
from 474,274 to 471,107 bytes (gzip 147.41 → 146.15 kB), and `html2canvas-pro` and
`vly-screenshot-request` disappear from `dist`. You also lose the editor's dev-time
error forwarding and its screenshot/thumbnail capture, so this is a hosting decision
rather than a product one.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Blank preview or white page | Usually a TypeScript or import error blocking the bundle. Run `bunx tsc -b --noEmit` and read the first error. |
| "Invalid hook call" at runtime | Duplicate React copies. `vite.config.ts` already dedupes React; do not add another React dependency. |
| Browser tests all fail to launch | Missing Chromium libraries. Run `bunx playwright install-deps chromium-headless-shell` as root. |
| `ECONNREFUSED ::1:5173` in Playwright | No dev server running. Start `bun run dev` first; never let the test config start one. |
| `bun test` reports Playwright errors | A browser spec was renamed to `*.spec.ts`. Rename it back to `*.e2e.ts`. |
| Result disappears while typing | Expected: the report is discarded when the message changes, and the UI says so. |
| Reveal animation leaves sections invisible | A `Reveal` `amount` fraction that the element cannot reach in the viewport. Use `amount: "some"` for content taller than the screen. |

## Lint baseline

`bun run lint` currently reports **3 errors and 17 warnings** in files this project does
not own: `src/components/ui/carousel.tsx` (`react-hooks/set-state-in-effect`),
`src/components/ui/sidebar.tsx` (`react-hooks/purity`), `src/hooks/use-mobile.ts`
(`react-hooks/set-state-in-effect`), plus `react-refresh/only-export-components`
warnings in UI primitives. They predate the product code. Fix them by addressing the
cause, never by disabling the rule.
