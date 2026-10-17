# Candidate A2 — card-image refinement experiment

**Evaluation only. No production detection behavior was changed.** Candidate A2
exists in an evaluation module, a dry-run command and a test file. It is not
imported by the application, the engine or the shipped rules, and it has not been
integrated into production.

```bash
bun run evaluate:credential-a2
bun test src/lib/scam-detection/evaluation/credential-proposal-a2.test.ts
```

The command prints aggregate counts and case IDs only. It never prints message
text, URLs or rationales.

> All messages in this experiment are synthetic and internally authored. The
> original 100 cases, the 50-case holdout and the 60-case stress set were written
> by this project, not collected from real traffic. Nothing here estimates
> real-world accuracy, and no real-world precision or recall is claimed.

## 1. Problem being addressed

The [Candidate A/B proposal](CREDENTIAL-RULE-PROPOSAL.md) found that Candidate A
recovered five baseline misses across the original and holdout datasets without
adding a binary false positive. The [stress test](CREDENTIAL-STRESS-TEST.md) then
looked for the candidate's failure modes on wording close to its own vocabulary,
and found them:

| Case | Label | Candidate A | Candidate B | Construction |
| --- | --- | --- | --- | --- |
| `TL-C-029` | legitimate | false positive | false positive | asks for a receipt, explicitly **not** the card |
| `TL-C-033` | legitimate | false positive | false positive | conditional guidance about the bank's app |
| `TL-C-034` | legitimate | false positive | false positive | card photo sent **to yourself** |
| `TL-C-026` | legitimate | not flagged | false positive | passport upload in a **secure portal** |
| `TL-C-030` | legitimate | not flagged | false positive | explicitly says a card photo is **not needed** |

The question for this step was narrow: can targeted, documented card-image
safeguards remove those false positives **without losing any scam case Candidate
A currently recovers**? Recall improvement was explicitly out of scope, and no
new card vocabulary was added.

## 2. Reference behavior: Candidate A and Candidate B

Both reference candidates are unchanged, including their matching conditions,
evidence reasons and reported metrics.

| Candidate | Stress result | Original | Holdout |
| --- | --- | --- | --- |
| Production baseline | 3 TP / 4 FP / 26 TN / 17 FN | 25 / 3 / 33 / 13 | 12 / 1 / 19 / 8 |
| A (conservative) | 14 / 7 / 23 / 6 | 27 / 3 / 33 / 11 | 15 / 1 / 19 / 5 |
| B (broader) | 16 / 9 / 21 / 4 | 29 / 3 / 33 / 9 | 15 / 1 / 19 / 5 |

A2 is built on A, not on B. It reuses A's card-image patterns, protective-warning
guard and in-app guard, and delegates recovery-code and app-code matching to A
unchanged. Consequently:

- any A2 metric difference on a dataset is caused by a card-image suppression;
- A2 adds no identity-document matching, so B's `TL-C-026` false positive cannot
  occur in A2 at all;
- A2 does not treat `need` as a request, so B's `TL-C-030` false positive cannot
  occur either;
- A2 inherits all of A's remaining misses rather than widening vocabulary to
  chase them.

## 3. Candidate A2 design

### 3.1 Scoring

The overlay arithmetic is identical to the A/B experiment and is implemented once
in `simulateWithDetector()`:

```text
simulatedScore = min(100, baseline.score + (candidateMatched && !alreadyCredential ? 40 : 0))
```

- The +40 is the **existing** credential weight; A2 does not add a rule, weight or
  threshold.
- A message that already produced a credential finding is never counted twice.
- Risk is recomputed with the engine's own `riskLevelForScore`, preserving
  Medium ≥ 30, High ≥ 60 and the 100 cap.
- Ambiguous cases stay outside the binary metrics.

### 3.2 Safeguards

All five operate on one clause (the same sentence-like split A uses) and only on
**card-image** evidence. `cardSafeguardFor()` records the reason, so a test can
prove *which* safeguard fired rather than only that a score dropped.

| # | Safeguard | Trigger | Reasoning |
| --- | --- | --- | --- |
| 1 | `excluded-object` | `not your/the/a card`, `instead of your card`, `rather than your card`, `no card photo` | The card is the object being ruled out. "Send a photo of your receipt, not your card" requests a receipt; the card noun is the exclusion. |
| 2 | `not-needed` | `do/does not need a photo of your card`, `no card photo is needed/required`, `card photo is not needed` | An explicit statement that no card image is wanted is the opposite of a disclosure request. |
| 3 | `self-directed` | `to yourself`, `to your own phone/number/email/inbox/device/cloud`, `for your records`, `on your own phone` | The sender is the intended recipient. A travel copy is storage advice, not disclosure to a third party. |
| 4 | `conditional-official-flow` | `only if`/`if`/`when` + `the bank's/official/provider's app asks/requests/prompts/requires` | Conditional guidance describes what to do **if the official flow asks**, not a request from this sender. |
| 5 | `official-portal-no-link` | an upload/submit verb + `in/to the … secure/onboarding/official portal`, when the message contains **no** link | The file goes to a named upload channel rather than to a person in the conversation. |

Guard precedence matters:

1. The two object-shaped safeguards (1 and 2) always apply.
2. A **third-party recipient** (`to me`, `to us`, `this chat`, `WhatsApp`, `send
   me`, `reply`, …) outranks safeguards 3–5. "Send it to yourself and forward it
   to me" is still a request.
3. Safeguards 4 and 5 are **disabled when the shipped link extractor finds a
   link**. A bank name, an app reference or the phrase "secure portal" is not
   treated as trust: a card request in a linked message is still flagged.
4. A bare mention of a bank, an app or a portal is never enough on its own. Each
   guard needs its own construction (an app asking, an upload verb, a named
   portal). There is no blanket "mentions app/bank/portal" suppression.

Safeguard 5 deliberately matches **portal** only, not every app. Candidate A
already has an in-app guard for "in the app"; widening A2's portal guard to
`app` would duplicate that guard and suppress more than the measured cases
justify.

### 3.3 What A2 deliberately does not do

- It does not add identity documents (Aadhaar, PAN, passport, ID card).
- It does not add `need`/`require` as request verbs.
- It does not add recovery-key, relay, WhatsApp-as-verb or "numbers" wording.
- It does not change recovery-code or app-code matching.
- It does not weaken protective-warning or negation handling. In particular
  `TL-C-014` remains unmatched; see §7.
- It does not modify `rules.ts`, `engine.ts`, normalization, link detection, the
  UI, public types, the datasets or Candidate A/B.

## 4. Before-and-after case analysis

Scores are simulated overlay scores. `—` means the candidate produced no signal.
"FP" marks a binary false positive; `TL-C-060` is ambiguous and therefore outside
the binary metrics.

| Case | Label | Baseline | Candidate A | Candidate B | Candidate A2 | A2 safeguard |
| --- | --- | --- | --- | --- | --- | --- |
| `TL-C-029` | legitimate | 0 Low | 40 Medium (FP) | 40 Medium (FP) | 0 Low | `excluded-object` |
| `TL-C-033` | legitimate | 0 Low | 40 Medium (FP) | 40 Medium (FP) | 0 Low | `conditional-official-flow` |
| `TL-C-034` | legitimate | 0 Low | 40 Medium (FP) | 40 Medium (FP) | 0 Low | `self-directed` |
| `TL-C-026` | legitimate | 0 Low | — → 0 Low | 40 Medium (FP) | 0 Low | not matched: A2 has no identity-document matching |
| `TL-C-030` | legitimate | 0 Low | — → 0 Low | 40 Medium (FP) | 0 Low | guard present, but A never had card evidence |
| `TL-C-060` | ambiguous | 0 Low | 40 Medium | 40 Medium | 0 Low | `official-portal-no-link` |

`TL-C-060` ("upload your card photo to the onboarding portal when HR asks") is
the only A match A2 drops that was not a binary case. It is ambiguous, so this
changes a review flag rather than a metric. The safeguard fires because the
message names an onboarding portal and contains no link; if the same message
carried a sender-supplied link it would still be flagged (tested).

### 4.1 Scam cases A2 still recovers

The +40 overlay is unchanged, so these keep the same simulated scores as A:

| Dataset | Cases | Baseline → A2 | Family |
| --- | --- | --- | --- |
| stress | `TL-C-001`, `TL-C-005` | 0 → 40 Medium | card-image |
| stress | `TL-C-003` | 25 → 65 High | card-image (link already matched) |
| stress | `TL-C-006`, `TL-C-007`, `TL-C-008` | 0 → 40 Medium | recovery-code |
| stress | `TL-C-010`, `TL-C-011`, `TL-C-012`, `TL-C-015`, `TL-C-016` | 0 → 40 Medium | app-code |
| original | `TL-E-001` | 0 → 40 Medium | app-code |
| original | `TL-E-019` | 0 → 40 Medium | card-image |
| holdout | `TL-H-003` | 0 → 40 Medium | card-image |
| holdout | `TL-H-004` | 0 → 40 Medium | app-code |
| holdout | `TL-H-009` | 0 → 40 Medium | recovery-code |

No A2 safeguard fires on any of these messages; the test suite asserts that the
set of recovered IDs is identical to Candidate A's on all three datasets.

### 4.2 A matches dropped by A2

| Dataset | Dropped from A's matched set | Reason |
| --- | --- | --- |
| original | none | A2 matches exactly A's 5 cases |
| holdout | none | A2 matches exactly A's 3 cases |
| stress | `TL-C-029`, `TL-C-033`, `TL-C-034`, `TL-C-060` | the four intended suppressions above |

A2 catches **no** case that A missed. That is a deliberate result, not an
oversight: the miss review in §7 found candidates for a separate recall
experiment, which this refinement experiment did not attempt.

## 5. Metrics by dataset

The three datasets are reported separately. No combined headline metric is
computed, and none of the existing baselines was edited.

### 5.1 Original 100-case dataset

100 cases; 26 ambiguous excluded; 74 binary.

| Run | TP | FP | TN | FN | Precision | Recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Production baseline | 25 | 3 | 33 | 13 | 0.893 | 0.658 | 0.758 |
| Candidate A | 27 | 3 | 33 | 11 | 0.900 | 0.711 | 0.794 |
| Candidate B | 29 | 3 | 33 | 9 | 0.906 | 0.763 | 0.829 |
| **Candidate A2** | **27** | **3** | **33** | **11** | **0.900** | **0.711** | **0.794** |

- Recovered from baseline false negatives: `TL-E-001`, `TL-E-019` (2).
- New false positives: 0.
- Score changes 3; risk-band changes 3. One is ambiguous `TL-A-002`.
- Match counts: card-image 2, recovery-code 0, app-code 3; 5 matched cases.
- Ambiguous: 6 of 26 flagged (baseline 5; new flag `TL-A-002`).
- Safeguards applied: 0 cases. A2 is numerically identical to A here.

### 5.2 TL-H 50-case holdout

50 cases; 10 ambiguous excluded; 40 binary.

| Run | TP | FP | TN | FN | Precision | Recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Production baseline | 12 | 1 | 19 | 8 | 0.923 | 0.600 | 0.727 |
| Candidate A | 15 | 1 | 19 | 5 | 0.938 | 0.750 | 0.833 |
| Candidate B | 15 | 1 | 19 | 5 | 0.938 | 0.750 | 0.833 |
| **Candidate A2** | **15** | **1** | **19** | **5** | **0.938** | **0.750** | **0.833** |

- Recovered: `TL-H-003`, `TL-H-004`, `TL-H-009` (3).
- New false positives: 0.
- Score changes 3; risk-band changes 3.
- Match counts: card-image 1, recovery-code 1, app-code 1; 3 matched cases.
- Ambiguous: 4 of 10 flagged; none newly flagged.
- Safeguards applied: 0 cases. A2 is numerically identical to A here.

### 5.3 TL-C 60-case stress dataset

60 cases; 10 ambiguous excluded; 50 binary.

| Run | TP | FP | TN | FN | Precision | Recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Production baseline | 3 | 4 | 26 | 17 | 0.429 | 0.150 | 0.222 |
| Candidate A | 14 | 7 | 23 | 6 | 0.667 | 0.700 | 0.683 |
| Candidate B | 16 | 9 | 21 | 4 | 0.640 | 0.800 | 0.711 |
| **Candidate A2** | **14** | **4** | **26** | **6** | **0.778** | **0.700** | **0.737** |

- Recovered from baseline false negatives: 11 (`TL-C-001`, `TL-C-003`,
  `TL-C-005`–`TL-C-008`, `TL-C-010`–`TL-C-012`, `TL-C-015`, `TL-C-016`).
- New false positives: **0**. The remaining 4 are the production false positives
  (`TL-C-021`, `TL-C-023`, `TL-C-039`, `TL-C-042`) that neither A nor A2 touches.
- Score changes 17; risk-band changes 17. These include the 6 ambiguous cases A2
  still flags.
- Match counts: card-image 5, recovery-code 5, app-code 9; 19 matched cases.
- Safeguards applied: 4 — `excluded-object` 1, `self-directed` 1,
  `conditional-official-flow` 1, `official-portal-no-link` 1, `not-needed` 0.
- Ambiguous: 6 of 10 flagged (A flagged 7; A2 releases `TL-C-060`).

## 6. False-positive and false-negative trade-offs

**What improved.** On the only dataset that contains the problematic wording, A2
removes all three candidate-added false positives and keeps every recovered scam
case:

- false positives 7 → 4 (all 4 pre-existing production false positives);
- precision 0.667 → 0.778;
- F1 0.683 → 0.737;
- recall unchanged at 0.700;
- one fewer ambiguous flag (7 → 6).

**What it cost.** A2 adds no new false negative on any dataset. Its only lost
matches are the 4 intended stress drops: 3 legitimate cases and 1 ambiguous case.
On the original dataset and holdout the matched sets are identical to A's.

**What it did not fix.** The remaining 6 stress false negatives are unchanged
(§7), as are all production false positives (password confirmation, code typing,
forwarding a document that contains a code, bare OTP mentions). A2 is a
precision-only refinement of one family.

**What could still go wrong.** Safeguards 4 and 5 encode trust that the text
cannot verify. A text-only message that says "upload a card photo to the portal"
with no link is suppressed, even though a determined phishing message could omit
the link and send it separately. The link override narrows this risk but does not
eliminate it. Both guards are also untested against real onboarding mail; the
datasets contain no legitimate portal-upload example apart from `TL-C-026`.

## 7. Miss review: recovery codes, app codes and protected phrasing

Each remaining stress miss was inspected in its dataset message and classified.
None was fixed in A2.

| Case | Wording | Classification | Why it stays out of A2 |
| --- | --- | --- | --- |
| `TL-C-004` | "We need a photo of your card…" | Narrowly addressable | First-person `we need` is a plausible request form, but adding `need` would change A's stated conservatism and needs its own precision test. Candidate B already measures it. |
| `TL-C-009` | "I need the recovery key…" | Narrowly addressable | `recovery key` is a credential term A does not list. This is a recall extension, not a card-image refinement. |
| `TL-C-014` | "Don't keep the six-digit code … to yourself; forward it." | Ambiguous context problem | The protective pattern ("keep … to yourself") is inverted by "don't". Distinguishing it from a genuine storage warning requires clause-level negation semantics. Weakening protective handling globally to catch one case is exactly what this step was told not to do. |
| `TL-C-017` | "WhatsApp me the code your app generates." | Narrowly addressable | The channel is the verb. A and B do not list `whatsapp` as a disclosure verb here. Deferred. |
| `TL-C-018` | "Relay the verification code…" | Narrowly addressable | `relay` is a disclosure verb outside A's list. Deferred. |
| `TL-C-019` | "…use bhej do." | Language-coverage issue | The transliterated verb is `bhej do`, not B's `bhejo`/`bhejiye`. It is also already caught by the production multilingual rule, so it is not a baseline miss. |
| `TL-C-020` | "Send me the numbers your authenticator shows." | Narrowly addressable | `numbers` is a code term only in an authenticator context. Deferred with the others. |

Conclusion: the misses are a mixture of narrow vocabulary gaps, one language
coverage gap and one genuinely ambiguous negation construction. None is a
card-image problem, and none justifies broadening matching merely to raise recall
on seven known IDs. They are candidates for a separate A3 recall experiment.

## 8. Ambiguous-case findings

Ambiguous cases are reported separately and never enter precision, recall, F1 or
the confusion matrix.

| Dataset | Ambiguous | Baseline flags | A flags | B flags | A2 flags | A2 newly flagged |
| --- | --- | --- | --- | --- | --- | --- |
| original | 26 | 5 | 6 | 6 | 6 | `TL-A-002` |
| holdout | 10 | 4 | 4 | 5 | 4 | none |
| stress | 10 | 0 | 7 | 8 | 6 | `TL-C-051`, `TL-C-053`–`TL-C-055`, `TL-C-057`, `TL-C-059` |

`TL-C-060` is the only ambiguous case whose flag changed: A and B flag it, A2
suppresses it through the portal safeguard. That is a reduction in review cost,
not evidence that the message is safe. The case remains labelled ambiguous
because the text cannot establish whether the onboarding portal is the
employer's real system.

Where text-only evidence cannot separate a legitimate workflow from a scam — a
portal upload with no link, a conditional app instruction, a card photo sent to
oneself — A2 documents the uncertainty and either keeps the flag (when a link or
third party is present) or suppresses it with a named safeguard. It does not
claim the suppressed messages are legitimate.

## 9. Regressions introduced by A2

| Risk | Status |
| --- | --- |
| Lost a scam recovery | None on original, holdout or stress. The recovered-ID list is identical to A's on all three. |
| Added a binary false positive | None on any dataset. |
| Added a false negative | None. A2 adds no matching conditions, so it cannot turn a non-match into a miss beyond the intended suppressions. |
| Changed an existing finding's score | Only through suppression; no double counting, cap or threshold change. Messages that already produced a credential finding are untouched. |
| Changed A or B behavior | None. `detectCredentialSignal` and `simulateCandidate` keep their signatures and results; A/B signals report an empty suppression list. |
| Changed datasets or baselines | None. Content fingerprints and both formatted baseline reports are pinned in tests. |
| Over-suppression | Safeguards 4 and 5 are the risk. They are disabled by a detected link or a third-party recipient, and both directions are tested. A text-only portal upload could still be missed. |
| Scope leak into production | None. A2 is only reachable from its evaluation module and dry-run script; no application file imports it. |

## 10. Regression tests

`src/lib/scam-detection/evaluation/credential-proposal-a2.test.ts` adds 41 tests:

- each of the five safeguards, with a legitimate example it releases **and** a
  genuine request that survives;
- the three original Candidate A false positives (`TL-C-029`, `TL-C-033`,
  `TL-C-034`) and the two additional Candidate B false positives (`TL-C-026`,
  `TL-C-030`);
- genuine card-image disclosure requests, legitimate card verification,
  self-directed storage, conditional official-app instructions, secure portal
  uploads and identity-document uploads;
- recovery-code privacy warnings and genuine recovery-code requests;
- negation and mixed-clause constructions, including a clause-scoped warning
  followed by an unrelated request;
- no double counting of an existing credential finding;
- the 100-point cap, Medium at 40 and High at 100;
- determinism across repeated runs;
- ambiguous cases excluded from the binary metrics, with `TL-C-060` reported as a
  suppression rather than an error;
- the three dataset content fingerprints and both formatted baseline report
  fingerprints, unchanged;
- a fetch-throwing run and an output check that no message, rationale or URL is
  printed;
- pinned A and B stress metrics, so the experiment cannot silently alter them.

## 11. Checks and results

Run from the repository root on the delivered tree:

| Command | Exit | Result |
| --- | --- | --- |
| `bun run evaluate` | 0 | Original 100-case baseline unchanged: 25 / 3 / 33 / 13 |
| `bun run evaluate:holdout` | 0 | Holdout baseline unchanged: 12 / 1 / 19 / 8 |
| `bun run evaluate:credential-proposal` | 0 | A and B output unchanged on both datasets |
| `bun run evaluate:credential-stress` | 0 | Stress baseline unchanged: 3 / 4 / 26 / 17 |
| `bun run evaluate:credential-a2` | 0 | New three-dataset A2 report |
| `bun test src/lib/scam-detection/evaluation/credential-proposal-a2.test.ts` | 0 | 41 pass, 0 fail |
| `bun test` | 0 | 407 pass, 0 fail (14 files) |
| `bunx tsc -b --noEmit` | 0 | No type errors |
| `bunx eslint` on the new/changed files | 0 | Clean |
| `bun run build` | 0 | Production build succeeds |

Full-project `bun run lint` is reported separately in
[DEVELOPMENT.md](DEVELOPMENT.md#lint-baseline); it still fails on pre-existing
errors in generated UI files that this step did not touch.

Baseline comparison: the original 100-case report, the holdout report, the stress
baseline and both A/B overlays are byte-identical to their saved outputs. Tests
pin the dataset fingerprints (`f09babc7`, `1747e87e`, `4509fd78`) and the two
report fingerprints (`7da6717f`, `9ddc53a9`).

## 12. Files changed by this experiment

Added:

- `src/lib/scam-detection/evaluation/credential-proposal-a2.ts`
- `src/lib/scam-detection/evaluation/credential-proposal-a2.test.ts`
- `scripts/evaluate-credential-a2.ts`
- `docs/CREDENTIAL-RULE-REFINEMENT.md`

Modified:

- `src/lib/scam-detection/evaluation/credential-proposal.ts` — additive types
  (`CredentialCandidateLabel`, suppression labels), a generic
  `simulateWithDetector()` used by A2, optional suppression reporting, and an
  A2 label in the formatter. A/B matching logic is unchanged.
- `package.json` — adds `evaluate:credential-a2`.
- `docs/CREDENTIAL-RULE-PROPOSAL.md`, `docs/CREDENTIAL-STRESS-TEST.md`,
  `docs/DEVELOPMENT.md` — link to this document and record the new command and
  test count.

Deleted: none.

Not modified: `src/lib/scam-detection/rules.ts`, `engine.ts`, `normalize.ts`,
`links.ts`, `types.ts`, `highlight.ts`, any UI component or public type, all
three dataset directories, and the Candidate A/B matching conditions.

## 13. Limitations

- **Synthetic, internally authored data.** The refinement was measured on the
  same 210 cases that motivated it. It is not independent validation.
- **Small samples.** Three suppressions move stress precision by 0.111. One case
  either way changes the conclusion's strength.
- **Two safeguards have no measured case.** `not-needed` never fires because A
  never had evidence to suppress in `TL-C-030`, and `official-portal-no-link`
  only changes an ambiguous case. Their behavior is covered by unit tests, not by
  dataset volume.
- **Text only.** No sender identity, prior relationship, link destination or
  session context is available. That is why portal and conditional guards remain
  context-dependent.
- **English-only vocabulary.** The safeguards are English regexes. They say
  nothing about Hindi, Marathi or Hinglish card-image wording.
- **No production evidence.** Nothing here shows how the safeguards behave on
  real bank mail, real onboarding flows or real attacks.

## 14. Recommendation

**A2 is ready for an integration-readiness review, not for production.**

1. It resolves the exact failure the stress test identified: all three
   Candidate A card-image false positives disappear, and the two Candidate B
   card-image false positives cannot occur because A2 never matched them.
2. It does so with **no lost scam recovery and no new false positive** on any of
   the three datasets.
3. Its precision and F1 on the stress set improve (0.667 → 0.778, 0.683 → 0.737)
   while recall stays at 0.700.
4. The original dataset and holdout are numerically unchanged, so the refinement
   is confined to the cases that motivated it.

Before any production work, a readiness review should:

- test the portal and conditional guards against legitimate onboarding and
  banking mail that is not part of these 210 synthetic cases;
- decide whether suppressing a text-only portal upload is acceptable, or whether
  it should remain a review flag;
- run A2's five guards as part of a combined candidate with a separately
  evaluated recall extension (first-person `need`, `recovery key`, `relay`,
  `WhatsApp me`, authenticator "numbers"), rather than folding recall work into
  this refinement;
- keep the protective-phrase inversion (`TL-C-014`) as its own experiment, since
  it is the one miss that touches privacy-warning semantics.

Until then, production detection behavior is unchanged.
