# Detector evaluation

A reproducible, labelled dataset and runner for the **current** TrustLens rules.
It measures what the shipped engine does on hand-written examples. It does not
change the engine, and it does not estimate real-world accuracy.

```bash
bun run evaluate                              # plain-text report, case IDs only
bun test src/lib/scam-detection/evaluation    # integrity + reproducibility checks
```

> **These 100 messages are synthetic evaluation examples, not a representative
> sample of real-world scams.** They were written to probe specific rule shapes
> and to include deliberate false-positive traps. Percentages below describe this
> dataset only.

## Dataset design

| Bucket | Cases | Purpose |
| --- | --- | --- |
| `scam` | 25 | Clearly hostile messages across the five rules |
| `legitimate` | 25 | Ordinary transactions, workplace notes, security notices |
| `ambiguous` | 25 | Messages whose meaning depends on sender or relationship |
| `edge-case` | 25 | Deliberately hard cases, labelled where the text supports it |

Total: **100**. Every bucket has exactly 25 cases.

| Label | Cases | Used in binary metrics? |
| --- | --- | --- |
| `scam` | 38 | Yes |
| `legitimate` | 36 | Yes |
| `ambiguous` | 26 | **No** — reported separately |

The label counts are not 25/25/25 because edge cases still carry a ground-truth
label. The 26 ambiguous cases are the 25 in the ambiguous bucket plus one edge
case (`TL-E-012`, a raffle prize) whose missing context is whether the recipient
entered the draw.

Challenge categories (a case belongs to exactly one):

| Category | Cases |
| --- | --- |
| `bank-kyc-impersonation` | 6 |
| `otp-credential-request` | 9 |
| `suspicious-link` | 9 |
| `parcel-delivery` | 6 |
| `prize-cashback-reward` | 6 |
| `account-threat-urgency` | 6 |
| `ordinary-conversation` | 11 |
| `legitimate-security-warning` | 7 |
| `no-suspicious-indicators` | 12 |
| `mixed-signals` | 12 |
| `false-positive-challenge` | 9 |
| `obfuscation-evasion` | 7 |

Each case records a stable ID (`TL-S-001` … `TL-E-025`), the message, its label,
a rationale written from the message content, a challenge category, and — for
edge cases — a note on why it is hard. Ambiguous cases also record the missing
context.

All content is fictional. Hosts use `.invalid` or `.example` domains, with
documentation IP ranges (`192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`)
where a bare address is the point. No entry points at a live service, and no
dataset URL is visited or resolved.

Rule references below use the engine's IDs: `urgency-pressure`,
`account-threat`, `suspicious-link`, `credential-request`, `prize-bait`.

## Evaluation methodology

`evaluateDataset()` calls the shipped `analyzeMessage()` once per case, in
dataset order. Nothing else in the engine is touched.

**Positive prediction.** A case is predicted positive when its risk band is
`medium` or `high`, i.e. its score is at least `RISK_THRESHOLD_MEDIUM` (30).
Medium is the default because the product's own Medium advice already says
"treat with caution and verify", so treating only High as positive would hide the
borderline results this evaluation exists to surface. Using High only would
raise precision and lower recall; that alternative was not adopted and is not
reported as a second metric.

**Binary handling.** Precision, recall, F1 and the confusion matrix use only
cases labelled `scam` or `legitimate` (74 cases). Ambiguous cases never enter
those counts, in either direction.

**Confusion matrix definition.**

|  | Predicted positive | Predicted negative |
| --- | --- | --- |
| Expected `scam` | true positive | false negative |
| Expected `legitimate` | false positive | true negative |

**Zero denominators.** Precision, recall or F1 are reported as `undefined`
(`null` in the report object) rather than invented when the denominator is zero.

**Low is not safe.** A Low result means few configured warning signs matched. It
does not establish that the message is safe; the engine only knows five rules.

**Manual review.** The report lists binary errors plus every ambiguous case the
detector scored Medium or High. All ambiguous IDs are listed separately.

Output is deterministic: `analyzedAt` is not copied into the report, every list
is in dataset order or sorted by ID, and the formatter prints case IDs rather
than message bodies.

## Results (measured on this dataset)

Risk bands over all 100 cases: **low 67, medium 21, high 12**.

Binary subset (74 cases):

| Metric | Value |
| --- | --- |
| Predicted positive | 28 |
| Predicted negative | 46 |
| True positives | 25 |
| False positives | 3 |
| True negatives | 33 |
| False negatives | 13 |
| Precision | 0.893 (89.3%) |
| Recall | 0.658 (65.8%) |
| F1 | 0.758 |

|  | Predicted positive | Predicted negative |
| --- | --- | --- |
| Expected `scam` (38) | 25 | 13 |
| Expected `legitimate` (36) | 3 | 33 |

By bucket:

| Bucket | Cases | Low | Medium | High | Predicted positive |
| --- | --- | --- | --- | --- | --- |
| scam | 25 | 5 | 11 | 9 | 20 |
| legitimate | 25 | 25 | 0 | 0 | 0 |
| ambiguous | 25 | 20 | 4 | 1 | 5 |
| edge-case | 25 | 17 | 6 | 2 | 8 |

False positives (legitimate, scored Medium or High):

- `TL-E-006` — bare OTP delivery with no "do not share" line (40, Medium)
- `TL-E-008` — internal message about a shared test account OTP (60, High)
- `TL-E-023` — internal note with a demo OTP (40, Medium)

False negatives (scam, scored Low):

`TL-S-003`, `TL-S-008`, `TL-S-020`, `TL-S-022`, `TL-S-023`,
`TL-E-001`, `TL-E-002`, `TL-E-005`, `TL-E-013`, `TL-E-015`, `TL-E-019`,
`TL-E-020`, `TL-E-024`.

Ambiguous cases scored Medium or High (5 of 26): `TL-A-001`, `TL-A-012`,
`TL-A-015`, `TL-A-017`, `TL-A-024`.

## Findings

These are observations about this dataset, not general claims about detection
accuracy.

**Detected consistently**

- Bank/KYC impersonation with a link, deadline or blocking threat: 4 of 4.
- Credential requests that use a listed term (`OTP`, `CVV`, `one-time password`)
  or a request verb next to `password`, `card number`, `date of birth`: 7 of 7.
- The 25 ordinary legitimate messages all scored Low (0 false positives).
- Postal `PIN code` messages and a cancellation confirmation stayed Low even
  though they touch `PIN` or a blocking verb.

**Scam-like messages that scored Low**

- `TL-S-003`, `TL-S-008`, `TL-E-013`, `TL-E-015`, `TL-E-024` reached only 25
  points: the link rule contributes 25 on its own and cannot leave the Low band.
- `TL-S-020` scored 0: "Update it here" plus a `.invalid` address raises no
  configured rule, because the link has no strong indicator and is not a
  recognised call to action.
- `TL-S-022` (20) and `TL-S-023` (20), `TL-E-002` (20) and `TL-E-020` (20) carry
  one medium-weight signal each. A prize claim, a family emergency and an
  urgency phrase cannot reach Medium alone.
- `TL-E-001`, `TL-E-005`, `TL-E-019` scored 0: they ask for a "six-digit code",
  a "verification code", or a photo of a card without any term in the
  credential list and without a link or deadline.
- `TL-E-002` shows character substitution (`0TP`) slipping past the OTP
  pattern; `TL-E-001` and `TL-E-019` avoid every listed credential term by
  asking for a "six-digit code" or a photo of a card. `TL-E-003` borrows postal
  `PIN code` wording but is still caught, because the request sits directly
  beside the word PIN.

**Legitimate messages that scored Medium or High**

All three are in the edge-case bucket and all are caused by rule 4:

- `TL-E-006` and `TL-E-023`: a bare OTP with no protective warning. The current
  rule counts that by design; real OTP deliveries often omit the warning.
- `TL-E-008`: an internal "urgent … OTP expired" message stacks the credential
  and urgency weights (60), though nobody is asked for a secret.

The 25 ordinary legitimate cases produced no Medium or High scores, so the
false-positive rate here is concentrated in credential *mentions* rather than
in ordinary commerce, delivery or reward mail.

**Context-dependent cases needing review**

`TL-A-001` (recruiter collecting ID), `TL-A-012` (security team asking for date
of birth), `TL-A-015` (payment link by SMS), `TL-A-017` (colleague asking for an
OTP) and `TL-A-024` (courier OTP handover) were flagged Medium/High. Each could
be a normal process and each could be the opening of a scam; the message alone
cannot settle it. The remaining 21 ambiguous cases scored Low, which likewise
does not clear them.

**Limitations exposed by the rules**

- Rule 4 recognises a fixed vocabulary. Requests phrased as "the code in your
  app", "a photo of your card", or `0TP` are invisible.
- Its postal `PIN code` exemption is necessary but exploitable by a scam that
  copies postal wording.
- Rule 5 weights prize bait at 20, so a prize message with no second signal
  cannot leave Low.
- Rule 3 weights a suspicious link at 25 for any number of links, so a single
  deceptive address cannot leave Low on its own.
- The account-threat rule's verb list does not include "locked" or
  "disconnected", which `TL-E-020` and `TL-S-008` exploit.
- Long, calm messages can hide one request (`TL-E-005`).

**Possible future work (not done here)**

Concept-level detection of credential requests (asking for a code or a card
image regardless of the noun used), a wider blocking-verb list, and link risk
that can accumulate across several weak signals. None of these changes were made
in this step; the dataset was not used to tune the rules.

## Privacy and network verification

- `analyzeMessage()` is pure: no I/O, no logging, no storage. The evaluation
  calls it and nothing else.
- The evaluation modules import only the engine and their own files. There is no
  `fetch`, `XMLHttpRequest`, storage API, or external scanner in the dataset,
  runner, formatter or CLI.
- A test replaces `globalThis.fetch` with a function that throws, runs the whole
  evaluation, and passes — so no code path attempts a request.
- A test asserts every URL host in the dataset is `.invalid`, `.example`,
  `example.com`, or a documentation IP range. Nothing is resolvable by design.
- The formatter prints case IDs only. A test asserts the report contains no
  `http://`/`https://` string and none of the longer message bodies.
- No dataset URL was visited, resolved, or fetched while building this.

## Test results

| Command | Result |
| --- | --- |
| `bun run evaluate` | exit 0; 100 cases, 33 predicted positive, 74 binary cases |
| `bun test src/lib/scam-detection/evaluation` | exit 0; 16 pass, 0 fail |
| `bun test` | exit 0; 242 pass, 0 fail (226 existing + 16 new) |
| `bunx tsc -b --noEmit` | exit 0 |
| `bunx eslint src/lib/scam-detection/evaluation scripts/evaluate-detector.ts` | exit 0 |

## Regression verification

- `src/lib/scam-detection/rules.ts`, `engine.ts`, `links.ts`, `types.ts` and
  `highlight.ts` are unchanged: no rule, weight, threshold, cap or output field
  was edited.
- The UI is unchanged. The public `ScamAnalysis` shape is unchanged.
- All pre-existing tests pass unmodified.

## Limitations

This dataset cannot establish real-world accuracy. It is small, written by one
author, English-only, weighted toward Indian banking and delivery contexts, and
the edge cases were chosen with knowledge of the rule shapes. Reserved `.invalid`
hosts remove the TLD signals that real phishing links often carry, which makes
some link cases harder than they would be in production; conversely, the scam
messages are cleaner and more explicit than much real spam. Precision and recall
here describe these 100 examples only.

A Low score means the five configured rules found little. It is not a safety
certificate, and no result in this report should be read as one.
