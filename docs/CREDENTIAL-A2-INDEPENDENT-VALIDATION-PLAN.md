# Candidate A2 — independent validation and evidence design

**Status: research and planning only.** Candidate A2 remains experimental and is
not integrated. Nothing in this document is an evaluation result, a production
decision, or permission to change detection behaviour.

This plan follows the [A2 refinement report](CREDENTIAL-RULE-REFINEMENT.md) and
the Step 17 isolation and reproducibility review. It specifies what evidence
would be required before A2 could be considered for a separate, controlled
integration experiment. No such experiment is authorised here.

> **Terminology.** "Verified" means observed in this repository with the shipped
> evaluation harness. "Proposed" means a target, threshold or test design that
> has not been run. All thresholds in this document are **proposed**, not
> established results. All datasets described here are **planned**; they do not
> exist yet.

## 1. Executive summary

Candidate A2 is a precision refinement of Candidate A's card-image matching. On
the internally authored 60-case stress set it reduces false positives from 7 to
4 while preserving all 11 recoveries, and it leaves the original 100-case and
50-case holdout results identical to A. Its module is isolated from the
application and absent from the production bundle.

That evidence is not sufficient for integration. Step 17 showed five
reproducible suppression failures in read-only probes:

1. negation/exclusion before an explicit card-photo transfer;
2. a self-directed instruction followed by third-party forwarding in a later
   sentence;
3. a conditional bank-app instruction followed by a transfer request;
4. a named "secure portal" used to request a card photo for a refund;
5. obfuscated links that bypass the link override.

A2's evidence also has no text offsets, so it cannot yet produce production
highlights.

This plan therefore defines:

- an independently labelled dataset that was not used to design the safeguards;
- an adversarial matrix with a hard rule that **hiding an explicit request fails
  the safeguard regardless of F1**;
- proposed acceptance gates with confidence intervals and small-sample handling;
- the evidence fields a future production rule must emit;
- a six-stage validation workflow where no stage authorises production.

**Current decision: no-go for integration; proceed to Stage A only.**

## 2. Verified current baseline

### 2.1 Production isolation (verified)

- No file under `src/` outside `src/lib/scam-detection/evaluation/` imports an
  evaluation module, `credential-proposal`, or `credential-proposal-a2`.
- `src/lib/scam-detection/index.ts` exports only the production surface:
  types, engine, rules, highlight, links and language. It does not re-export
  evaluation code.
- No Convex/backend file references the detector or the experiment.
- A2 is referenced only by `credential-proposal-a2.test.ts` and
  `scripts/evaluate-credential-a2.ts`.
- A2's markers (`excluded-object`, `official-portal-no-link`, "Credential A2")
  do not appear in `dist/` or `isolate/`.
- A2 imports the evaluation proposal (which in turn calls the engine) and the
  pure `extractLinks()` function from production. The dependency is one-way:
  production never imports A2.

### 2.2 Verified metrics

Rerun in Step 17 with no file changes; reproduced again at the start of Step 18.

| Dataset | Run | TP | FP | TN | FN | Precision | Recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Original (74 binary / 26 ambiguous) | Production baseline | 25 | 3 | 33 | 13 | 0.893 | 0.658 | 0.758 |
| Original | Candidate A | 27 | 3 | 33 | 11 | 0.900 | 0.711 | 0.794 |
| Original | Candidate B | 29 | 3 | 33 | 9 | 0.906 | 0.763 | 0.829 |
| Original | **Candidate A2** | **27** | **3** | **33** | **11** | **0.900** | **0.711** | **0.794** |
| Holdout (40 binary / 10 ambiguous) | Production baseline | 12 | 1 | 19 | 8 | 0.923 | 0.600 | 0.727 |
| Holdout | Candidate A | 15 | 1 | 19 | 5 | 0.938 | 0.750 | 0.833 |
| Holdout | Candidate B | 15 | 1 | 19 | 5 | 0.938 | 0.750 | 0.833 |
| Holdout | **Candidate A2** | **15** | **1** | **19** | **5** | **0.938** | **0.750** | **0.833** |
| Stress (50 binary / 10 ambiguous) | Production baseline | 3 | 4 | 26 | 17 | 0.429 | 0.150 | 0.222 |
| Stress | Candidate A | 14 | 7 | 23 | 6 | 0.667 | 0.700 | 0.683 |
| Stress | Candidate B | 16 | 9 | 21 | 4 | 0.640 | 0.800 | 0.711 |
| Stress | **Candidate A2** | **14** | **4** | **26** | **6** | **0.778** | **0.700** | **0.737** |

A2's stress suppressions: `TL-C-029` (excluded-object), `TL-C-033`
(conditional-official-flow), `TL-C-034` (self-directed), `TL-C-060`
(official-portal-no-link, ambiguous). `not-needed` fired zero times. Original
and holdout suppressions: zero.

### 2.3 Verified test and check status

| Check | Result |
| --- | --- |
| Focused A2 tests | 41 pass, 0 fail |
| Full `bun test` | 407 pass, 0 fail, 14 files |
| Evaluation scripts | all exit 0; baselines reproduce exactly |
| Multilingual baseline | 22 / 1 / 27 / 2, unchanged |
| Full-project lint | exit 1: 3 errors / 17 warnings, all pre-existing in generated UI files |
| Protected-file checksums | all 26 protected files unchanged during review |

### 2.4 Observed suppression failures (verified behaviour, not measured rates)

These messages were authored during Step 17 as read-only probes. They are **not
part of any dataset** and were not scored. They demonstrate that the current
matcher can suppress explicit requests.

| Probe pattern (synthetic) | A | A2 | Mechanism |
| --- | --- | --- | --- |
| "That is not your card, so send a photo of your card to this chat." | match | **suppressed** | `excluded-object` runs before the third-party check |
| "No card photo is needed, just send the card photo to me." | match | **suppressed** | `excluded-object`/`not-needed` run before the third-party check |
| "Send a photo of your card to yourself. Then forward it to me." | match | **missed** | `self-directed` is clause-scoped; the transfer is in the next sentence |
| "Upload a card photo if the bank's app asks. Then send it to me." | match | **missed** | same cross-sentence gap for `conditional-official-flow` |
| "Upload a card photo to the secure portal to release your refund before Friday." | match | **suppressed** | portal wording is treated as a channel, with no link |
| "…secure portal at secure-portal dot invalid" / "hxxp://…" | match | **suppressed** | `extractLinks()` does not detect these obfuscations |

Positive controls also verified: a third-party recipient **within the same
clause** keeps the match ("send it to yourself, then forward it to me"; "for your
records and email it to our agent"), and a detected real link disables the
portal/conditional safeguards even when the link is in another sentence.

### 2.5 Verified versus proposed

| Item | Status |
| --- | --- |
| A2 isolation, metrics, suppressions, test counts | **Verified** in this repository |
| The five suppression failures above | **Verified behaviour** of the current matcher on synthetic probes; frequency unknown |
| A2's precision on real bank alerts, onboarding mail or non-English card requests | **Unknown**; not measured |
| Any threshold, sample size, CI or gate in §5 | **Proposed**, not run |
| Any dataset composition in §3 | **Planned**, not collected or authored |
| Evidence-producing rule design in §6 | **Requirements only**, not implemented |

## 3. Dataset design and labeling protocol

### 3.1 Independence principles

1. **Authors must not have seen A2.** Case writers, labelers and adjudicators
   must not read `credential-proposal-a2.ts`, its tests, the refinement report or
   the probe list before labels are frozen.
2. **Pre-registration.** The category matrix, label codebook, inclusion rules and
   proposed gates are frozen and hashed before any case is scored.
3. **No reuse.** No message from the original 100, holdout 50, stress 60 or
   multilingual 60 sets may appear, be paraphrased from, or be used to tune A2.
4. **Real and independently authored data are reported separately.** Synthetic
   cases may supplement coverage but cannot be the sole basis for a go decision.
5. **Labels describe the message, not the detector.** A case is labelled by what
   the message asks the recipient to do and by verifiable context, never by
   whether A2 fires.
6. **No live content.** Cases use reserved domains, documentation IP ranges,
   placeholder numbers and fictional organisations. Nothing is fetched, opened
   or resolved.

### 3.2 Planned composition

Targets below are **proposed minimums**, not collected counts. Every cell is per
language group: English, Hindi (Devanagari), Marathi (Devanagari), Hinglish
(Latin), and mixed-script/code-switched.

| Category | Minimum per language group | Minimum total | Notes |
| --- | --- | --- | --- |
| Legitimate bank alerts (balance, freeze notice, statement) | 8 | 40 | Include messages that mention cards without asking for an image |
| Legitimate onboarding instructions (KYC, payroll, account setup) | 8 | 40 | Include in-app and portal flows |
| Legitimate card-photo requests (genuine workflows) | 6 | 30 | Only where the workflow can be justified independently |
| Fraudulent card-photo requests | 10 | 50 | Explicit and obfuscated variants |
| Credential and OTP scams | 10 | 50 | Include app-code, recovery-code, code-mixed |
| Benign privacy and security warnings | 8 | 40 | "Never share…", "we never ask…", PIN/card safety notices |
| Ambiguous messages | 6 | 30 | Context-dependent; excluded from binary metrics |
| **Core subtotal** | | **280** | |

Plus the adversarial matrix in §4 (12 categories × 5 language groups × 4 cases =
240) and a margin for adjudication losses. **Proposed overall target: 550–650
cases**, of which at least 40% should be real or independently authored by people
outside this project. These figures are planning targets, not evidence.

Coverage rules:

- Devanagari cases must be authored or reviewed by native Hindi/Marathi speakers;
  automatic translation is not acceptable as the sole source.
- Marathi and Hindi must be distinguished by a native reviewer, not by script
  alone.
- Hinglish and mixed-script cases must include Latin–Devanagari switching within
  one message and within one clause.
- Every language group must contain both explicit and implicit card-photo
  requests, and at least one legitimate portal/app flow.

### 3.3 Sourcing and provenance

Preferred order:

1. Consented, privacy-reviewed real messages contributed for evaluation.
2. Independently authored messages from people who have not seen A2 (bank
   employees, support staff, translators, security trainers).
3. Public scam corpora with compatible licences, after PII removal.
4. Internally authored synthetic cases, used only to fill category gaps and never
   as the only support for a gate.

Each case records: source type, language, script, channel (SMS/email/chat/app),
category, whether a link is present (real vs obfuscated vs none), and whether the
sender identity is verifiable from the text. Source files stay offline and out of
the repository; only hashed, PII-free fixtures may be committed if the team
decides to version them.

### 3.4 Labeling protocol

1. Write a codebook with positive, negative, ambiguous and "cannot determine"
   definitions, including card-image and third-party-transfer examples.
2. Two labelers label each case independently, blinded to each other and to A2.
3. Adjudicate disagreements with a third reviewer; record the reason.
4. Report inter-labeler agreement (proposed target: Cohen's κ ≥ 0.80 overall and
   ≥ 0.70 per language group). Below that, revise the codebook and relabel.
5. Freeze labels and publish a dataset fingerprint (ID + label + text hash)
   before scoring.
6. Keep a separate "design" split for error analysis and a held-out "test" split
   that is scored once. No re-tuning on the test split.

### 3.5 Privacy and safety

- Remove names, numbers, account identifiers, UPI IDs and addresses.
- Replace every host with `.invalid`/`.example` or a documentation IP; never
  create clickable links.
- Do not store screenshots containing personal data.
- No network calls during collection, scoring or review.
- Treat scam text as hostile content: no execution, no previews, no link
  expansion.

### 3.6 Planned case record

| Field | Purpose |
| --- | --- |
| `id` | Stable, non-sequential within public reports |
| `language`, `script`, `mixed` | Per-language metrics |
| `channel` | SMS, email, chat, app notification |
| `category` | §3.2/§4 category |
| `label` | `scam`, `legitimate`, `ambiguous`, `cannot-determine` |
| `rationale` | Why the label holds, written before scoring |
| `linkKind` | `none`, `plain`, `obfuscated`, `split-across-message` |
| `thirdParty` | Whether a transfer to another person is requested |
| `sensitiveItem` | Card image, OTP, recovery code, identity document, none |
| `provenance` | Real-consented, independent-authored, public corpus, synthetic |
| `notes` | Context needed for ambiguous cases |

## 4. Adversarial test matrix

All examples below are synthetic illustrations, not dataset entries. Non-English
rows describe the required construction; native speakers must author the actual
messages.

| ID | Category | Synthetic illustration | Expected safe behaviour | Why it matters |
| --- | --- | --- | --- | --- |
| ADV-01 | Negation + explicit request | "We don't need to make this hard — send a photo of your card to this chat." | **Flag.** Negation elsewhere must not suppress an explicit transfer. | The current `not-needed`/protective logic can be bypassed or over-applied. |
| ADV-02 | Exclusion + explicit request | "This is not your card, so send a photo of your card to this chat." | **Flag.** The exclusion refers to a different object, not the request. | `excluded-object` currently suppresses this exact shape. |
| ADV-03 | Self-directed + forwarding | "Send a photo of your card to yourself. Then forward it to me." | **Flag.** The second sentence completes a third-party request. | `self-directed` is clause-scoped and currently misses it. |
| ADV-04 | Conditional app + transfer | "Upload a card photo if the bank's app asks. Then send it to me." | **Flag.** A conditional first sentence cannot neutralize the transfer. | `conditional-official-flow` is clause-scoped. |
| ADV-05 | Named unverified portal | "Upload a card photo to the secure portal to release your refund before Friday." | **Flag.** A portal name is not proof of legitimacy; the refund/urgency frame is suspicious. | Current portal guard suppresses a complete scam. |
| ADV-06 | Real link | Same as ADV-05 plus a documentation-IP URL. | **Flag.** A sender-supplied link must disable workflow trust. | Verified behaviour today; must remain. |
| ADV-07 | Obfuscated link | "…at secure-portal dot invalid" / "hxxp://…" | **Flag or explicit ambiguous flag.** Obfuscation must not justify suppression. | `extractLinks()` misses these forms. |
| ADV-08 | Cross-sentence request | "We reviewed your account. The card photo goes to this chat." | **Flag.** The request spans sentences. | Clause splitting loses requests whose verb and object are separated. |
| ADV-09 | Cross-message/thread | Message 1: "We will need a card photo." Message 2: "Send it here." | **Ambiguous by design**; document that single-message analysis cannot see the thread. | Sets an honest boundary for the detector. |
| ADV-10 | Hindi variants | Devanagari constructions of ADV-01–05 and ADV-08. | **Flag** where the request is explicit. | Multilingual A2 behaviour is unmeasured. |
| ADV-11 | Marathi variants | Devanagari Marathi constructions of ADV-01–05. | **Flag** where explicit. | Marathi is not interchangeable with Hindi. |
| ADV-12 | Hinglish / mixed script | Romanised or mixed-script negation, self-direction and portal requests. | **Flag** where explicit; no language-based suppression. | Current safeguards are English regexes. |

Minimum **4 cases per cell**, with at least 2 carrying a real risk (not merely
benign text). Each cell must include one case where the correct answer is
"legitimate" to test the opposite direction.

### 4.1 Definitions that gate the matrix

- **Harmful suppression:** a candidate signal that would have produced a
  credential finding on an explicit sensitive-item request to a third party, but
  is removed by a safeguard. Any single occurrence is a hard failure.
- **Benign suppression:** a candidate signal removed on a case labelled
  legitimate or ambiguous. Desirable, but never traded against a harmful one.
- **Unverified brand:** any organisation, app or portal named only in message
  text, with no independently checked sender or domain. It may never be a reason
  to suppress.

### 4.2 Expected behaviour precedence

1. Explicit third-party transfer of a sensitive item → **flag**, regardless of
   negation, exclusion, self-direction, conditionality or portal naming.
2. A link is suspicious evidence, never a reason to trust; a detected link
   disables workflow-shaped suppression.
3. Named brands, apps and portals are neutral. They neither prove legitimacy nor
   create suspicion on their own.
4. If text cannot distinguish a legitimate workflow from an attack, the output
   must be **ambiguous/review**, not silently suppressed.

## 5. Metrics and proposed acceptance gates

### 5.1 Metrics to report

For each dataset and language group, separately:

- TP, FP, TN, FN at the existing positive definition (Medium or High).
- Precision, recall, F1.
- False-positive rate = FP / (FP + TN); false-negative rate = FN / (FN + TP).
- Net false-positive delta versus Candidate A and versus production, with case
  IDs.
- Per-safeguard **suppression counts**: fired, benign suppressions, harmful
  suppressions, and unclassified.
- Recall by category (bank alert, onboarding, card request, OTP, warning).
- Risk-band distribution and score-change counts.
- Ambiguous flags, reported outside the binary metrics.
- Evidence validity: findings with valid offsets / all findings.

Do not combine datasets into one headline number.

### 5.2 Small samples and uncertainty

- Report raw counts beside every proportion.
- Use Wilson score intervals for recall, precision and FPR; Clopper–Pearson when
  an exact interval is required; bootstrap the F1 difference for paired
  comparisons.
- Minimum **30 positive and 30 negative** cases per cell before quoting a
  proportion; below that, report "insufficient evidence".
- A zero count is not zero risk: report the upper confidence bound (e.g. with
  n = 240 and zero harmful suppressions, the 95% upper bound is still about
  1.2%). These bounds are **proposed** and must be computed with the final n.
- Predefine the primary endpoint (harmful suppressions) before scoring.

### 5.3 Proposed acceptance gates

All gates are **proposed**, for a future controlled offline experiment. They are
not current results.

| Gate | Proposed criterion | Rationale |
| --- | --- | --- |
| **G1 Harmful suppression** | **Zero** harmful suppressions on the adversarial set, and the 95% upper bound for the harmful-suppression rate below 1%. | A safeguard that hides an explicit request fails regardless of F1. |
| **G2 Recall non-inferiority** | No confirmed scam ID caught by A is lost by A2 on any dataset; lower 95% bound of recall difference (A2 − A) > −0.03. | Precision gains cannot be bought with missed scams. |
| **G3 False-positive reduction** | A2 has fewer card-image false positives than A on the independent legitimate set, with a paired bootstrap interval excluding zero, and ≥ 25% relative reduction. | This is the refinement's purpose. |
| **G4 Overall quality** | F1 ≥ A on every dataset separately (not pooled); no dataset regresses. | Secondary check; cannot override G1 or G2. |
| **G5 Per-language** | No language group loses more than 5 percentage points of recall versus A; every group has ≥ 30 binary cases. | English-only regexes must not silently degrade other languages. |
| **G6 Multilingual preservation** | Production multilingual suite unchanged (22 / 1 / 27 / 2, F1 0.936) and no new multilingual false positive. | A2 must not alter existing production detection. |
| **G7 Evidence integrity** | 100% of accepted findings have in-bounds offsets, reconstructable matched text and a resolvable highlight target; every suppression carries a clause span and reason. | A2 currently has no offsets. |
| **G8 Scoring invariants** | Rule contributes once; total capped at 100; Medium ≥ 30 and High ≥ 60 unchanged; no double count with the shipped credential rule. | Preserves the published model. |
| **G9 Determinism and privacy** | Byte-identical repeated runs; fetch disabled; no message text or rationale in CLI output; no network. | Existing evaluation contract. |
| **G10 Label quality** | κ ≥ 0.80 overall and ≥ 0.70 per language group; labels frozen before scoring. | Prevents label drift toward the matcher. |

### 5.4 Failure precedence

G1, G2, G6 and G7 are **blocking**. A failure in any of them stops the stage even
if every other metric improves. Aggregate F1 is never a tie-breaker for a harmful
suppression.

## 6. Evidence-producing architecture requirements

Design requirements only; no implementation in this step or in Candidate A2.

### 6.1 Required output per accepted finding

| Field | Requirement |
| --- | --- |
| `ruleId` | Stable identifier, distinct from `credential-request` unless the rule is merged |
| `matchedText` | Exact substring from the original message |
| `matchedPhrases` | Every distinct phrase, in appearance order |
| `occurrences` | Half-open `{start, end}` ranges in the **original** message, merged, in bounds |
| `explanation` | User-facing reason tied to the matched evidence |
| `weight` | Existing editorial weight; the rule counts once |
| `suppression` | Diagnostics only: safeguard id, clause range, reason; never rendered as trust |

### 6.2 Matching and context requirements

- Evaluate explicit transfer constructions with **sentence-plus-neighbour context**
  where the request and recipient can be split; an isolated clause is not enough.
- Give explicit third-party requests precedence over every suppression reason.
- Normalise link obfuscations before deciding whether a link is present; absence
  of a detected link must never be treated as trust.
- Treat named brands, apps and portals as neutral tokens.
- Keep protective warnings clause-scoped, but do not let a negated protective
  phrase ("don't keep it to yourself") invert into a suppression.
- Record why a candidate signal was suppressed so it can be counted in
  evaluation; suppressions must not disappear silently.

### 6.3 Compatibility invariants

- Offsets must remain valid after the engine's length-preserving normalisation.
- Range merging, overlapping findings and shared-evidence behaviour must match
  the existing highlight plan.
- A finding must resolve to a mark or a documented remainder; navigation failure
  must be reported, not swallowed.
- Weights, thresholds and cap remain unchanged; the rule contributes once.
- Suppression metadata is internal; the UI must not display "suppressed" as
  "safe".
- No new public `ScamAnalysis` fields until a separate type review.

### 6.4 Test obligations before any UI integration

Offset reconstruction on mixed scripts; overlapping and adjacent evidence;
shared evidence and remainders; highlight target resolution for every finding;
determinism; empty and malformed input; no network; and a check that suppressed
evidence never produces a finding or a highlight.

## 7. Staged validation workflow

No stage authorises production integration. Each ends in a written decision.

| Stage | Purpose | Entry criteria | Exit criteria (proposed) |
| --- | --- | --- | --- |
| **A. Dataset design and independent labeling** | Build the §3 set and §4 matrix with frozen labels. | This plan approved; codebook written; authors blinded to A2. | κ targets met; labels frozen; fingerprint published; no A2 output consulted. |
| **B. Baseline evaluation and evaluator verification** | Confirm the harness reproduces production, A and A2 on the new set; audit scoring code. | Stage A exit; harness unchanged. | Baseline numbers reproducible twice; positive definition and exclusions verified; no double counting. |
| **C. Candidate A2 adversarial evaluation** | Score A2 once on the frozen test split; run ADV-01–12 and per-safeguard counts. | Stage B exit; analysis plan pre-registered. | G1–G5, G8, G9 evaluated; every harmful suppression listed with its mechanism. |
| **D. Evidence-offset and UI compatibility design** | Specify and prototype (offline) the §6 evidence fields and highlight behaviour. | Stage C shows no blocking failure. | G7 design reviewed; offset and highlight tests specified; no UI change in this stage. |
| **E. Controlled offline comparison** | Compare A, A2 and any revised candidate on the frozen set and the existing three datasets; compute intervals. | Stage D exit; implementation exists behind an evaluation flag only. | G1–G10 pass with intervals; per-language results reported; no dataset regression. |
| **F. Human review and integration decision** | Independent reviewers inspect harmful suppressions, ambiguous cases and evidence quality. | Stage E exit; full report and diff available. | Written go/no-go by the product and detection owners; separate integration task required. |

Stop conditions: any harmful suppression at Stage C; any confirmed scam loss at
Stage E; any multilingual regression; any accepted finding without valid offsets.
A stop returns the candidate to design, not to production.

## 8. Risks and limitations

- **Overfitting.** The existing 210 cases were written by the same project that
  wrote the matchers. Independently authored cases may show different error
  patterns.
- **Small samples.** The stress set has 20 scam and 30 legitimate cases; one case
  moves precision by several points. Real-world uncertainty remains wide even
  after Stage A.
- **Language coverage.** A2 is English regex logic. Hindi, Marathi, Hinglish and
  mixed-script card-image behaviour is unmeasured; translation is not native
  authoring.
- **Clause splitting.** Punctuation-based clauses are the root of the verified
  cross-sentence failures. Fixing this changes matching semantics and needs its
  own design review.
- **Link evasion.** Obfuscated links and links sent in a second message bypass the
  override. No text-only detector can fully solve this.
- **Trust from names.** Any rule that treats "bank", "official app" or "secure
  portal" as reassurance can be imitated trivially.
- **Base rates.** Real traffic contains far more legitimate onboarding than
  attacks; a small FPR can swamp precision at low prevalence.
- **Label bias.** Authors may unconsciously write cases that fit the matcher.
  Blinding, adjudication and κ reporting reduce but do not eliminate this.
- **Privacy.** Real-message collection needs consent, scrubbing and access
  control that this repository does not currently implement.
- **Evidence regression.** Adding offsets can break overlap, highlighting and
  navigation that currently pass 407 tests.
- **Maintenance.** Five regex safeguards add branching complexity; each needs
  documentation and adversarial tests to remain safe.
- **No real-world accuracy claim.** Nothing here estimates production accuracy.

## 9. Explicit go/no-go decision criteria

### Current decision

**NO-GO for integration. Proceed to Stage A.** A2 remains experimental. The
decision is based on verified suppression failures, absent independent data,
unmeasured multilingual behaviour and missing evidence offsets.

### Proposed GO criteria for Stage C (adversarial evaluation)

All must hold:

- independent labels frozen, κ targets met;
- harness reproduces the verified baselines;
- analysis plan pre-registered;
- no change to production code, datasets or thresholds.

### Proposed GO criteria for Stage E (controlled offline comparison)

- G1 harmful suppressions: zero, with the upper bound below 1%;
- G2 recall non-inferiority on every dataset;
- G3 measurable false-positive reduction with an interval excluding zero;
- G4 no dataset F1 regression;
- G5 per-language floors met;
- G6 multilingual suite unchanged;
- G7 every finding has valid offsets and a resolvable highlight;
- G8 scoring invariants intact;
- G9 determinism and privacy intact;
- G10 label quality met.

### Automatic NO-GO

- Any harmful suppression, including one discovered during human review.
- Any confirmed scam case caught by A and lost by A2.
- Any multilingual regression.
- Any accepted finding without in-bounds evidence.
- Any attempt to justify suppression by a named brand, app or portal alone.
- Any gate evaluated on data that was used to tune the safeguards.

### Authority

A pass at Stage E does **not** authorise production integration. It authorises a
separate integration proposal with its own diff review, tests, rollout plan and
owner sign-off. Until then, the production engine, rules, thresholds, UI,
datasets and baselines remain unchanged.
