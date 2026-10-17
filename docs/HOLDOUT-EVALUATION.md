# Holdout evaluation (TL-H)

A second, independently authored set of 50 synthetic messages, scored with the
same shipped detector and the same rules as the original evaluation. It exists to
check whether the original result was an artefact of its own examples.

```bash
bun run evaluate:holdout                     # 50 holdout cases, IDs only
bun test src/lib/scam-detection/evaluation/holdout
```

> These 50 messages are synthetic examples written inside this project. They are
> not externally validated, not statistically representative, and the metrics
> below are **not estimates of real-world performance**. This is not independent
> external validation: the author knows how the detector works.

## Separation from the original dataset

- `HOLDOUT_CASES` lives in `src/lib/scam-detection/evaluation/holdout/` and is
  never spread into `EVALUATION_CASES`.
- `bun run evaluate` still reports exactly the original 100 cases; its output is
  byte-identical to before this step (verified with a saved baseline diff).
- `bun run evaluate:holdout` is a separate command and a separate report with a
  `Dataset: TL-H …` line.
- No holdout result was used to change a rule, weight, threshold or score cap.
- No original label, expected score or case was edited.

The original 100-case metrics remain 25 TP / 3 FP / 33 TN / 13 FN, precision
0.893, recall 0.658, F1 0.758 (see [EVALUATION.md](EVALUATION.md)).

## Composition

| Bucket / label | Cases |
| --- | --- |
| scam | 20 |
| legitimate | 20 |
| ambiguous | 10 |
| **Total** | **50** |

The holdout has no separate edge-case collection; its bucket mirrors its label,
and 16 cases carry a `difficulty` note instead.

| Challenge category | Cases |
| --- | --- |
| `bank-kyc-impersonation` | 4 |
| `otp-credential-request` | 7 |
| `suspicious-link` | 2 |
| `parcel-delivery` | 4 |
| `prize-cashback-reward` | 3 |
| `account-threat-urgency` | 4 |
| `ordinary-conversation` | 7 |
| `legitimate-security-warning` | 4 |
| `no-suspicious-indicators` | 7 |
| `mixed-signals` | 5 |
| `false-positive-challenge` | 1 |
| `obfuscation-evasion` | 2 |

The set deliberately includes card-photo and recovery-code requests, a
Hindi/English code-mixed scam, a long calm message with the request at the end,
a userinfo-trick link, and unusual addresses, because those are the shapes the
first evaluation suggested were weak. It does not reuse or paraphrase an
original message: IDs are `TL-H-001`…`TL-H-050`, messages are new, and a test
asserts the two datasets share no ID or message text.

## Labelling method

Labels and rationales were written from each message's meaning before the
holdout was run, and were not revised after seeing scores. `scam` means the
message's purpose is to obtain money, access or identity data; `legitimate`
means an ordinary process with nothing unsafe requested; `ambiguous` means the
text withholds a fact (sender identity, prior relationship, whether an order was
placed) that decides the answer.

Ambiguous cases are excluded from precision, recall, F1 and the confusion
matrix, in both directions. The source files contain labels and rationales for
audit; the CLI prints aggregate counts and case IDs only.

## Results

Positive prediction is Medium or High (score ≥ 30), identical to the original
evaluation. Risk bands over all 50 cases: **low 34, medium 16, high 0**.

Binary subset (40 scam/legitimate cases, ambiguous excluded):

| Metric | Value |
| --- | --- |
| Predicted positive | 12 |
| Predicted negative | 28 |
| True positives | 11 |
| False positives | 1 |
| True negatives | 19 |
| False negatives | 9 |
| Precision | 0.917 (91.7%) |
| Recall | 0.550 (55.0%) |
| F1 | 0.687 |

|  | Predicted positive | Predicted negative |
| --- | --- | --- |
| Expected `scam` (20) | 11 | 9 |
| Expected `legitimate` (20) | 1 | 19 |

By bucket:

| Bucket | Cases | Low | Medium | High | Predicted positive |
| --- | --- | --- | --- | --- | --- |
| scam | 20 | 9 | 11 | 0 | 11 |
| legitimate | 20 | 19 | 1 | 0 | 1 |
| ambiguous | 10 | 6 | 4 | 0 | 4 |

Ambiguous cases (10): 4 were scored Medium and 6 Low. Flagged for review:
`TL-H-045` (meter OTP), `TL-H-046` (teacher requesting Aadhaar),
`TL-H-048` (courier OTP question), `TL-H-049` (loan offer asking date of birth).
Each was scored 40 by the credential rule. Their label does not change: the text
alone cannot establish the sender.

## Errors and limitations observed

**False positive**

- `TL-H-040` (40, Medium) — a legitimate account-setup message saying "create a
  password and confirm it". The credential rule sees the request verb `confirm`
  next to `password`.

**False negatives**

| ID | Score | What the message does | Why it was missed |
| --- | --- | --- | --- |
| `TL-H-003` | 0 | Asks for a picture of the card beside an ID | No listed credential term |
| `TL-H-004` | 0 | Asks for the "4-digit code" that just arrived by SMS | No listed term; wording avoids "OTP"/"you received" |
| `TL-H-007` | 0 | Broadband disconnection threat with a call-back number | "Disconnection" is not a blocking verb; no urgency keyword |
| `TL-H-009` | 0 | Asks to forward a "recovery code" | Recovery codes are not in the credential vocabulary |
| `TL-H-012` | 20 | Cloud account deleted in 30 days | "Deleted" is not a blocking verb; deadline only |
| `TL-H-014` | 0 | Code-mixed Hindi/English account closure + code request | All patterns are English-only |
| `TL-H-015` | 25 | Guaranteed returns on a bare-address payment page | Link rule alone caps at 25 |
| `TL-H-016` | 20 | Prize with an upfront processing fee | Only "prize" matches; no second signal |
| `TL-H-019` | 20 | Gift-card codes requested urgently by a "boss" | Only "urgently" matches |

These are the same structural limits the original evaluation found (fixed
credential vocabulary, single-weight link and prize rules, English-only
patterns, blocking verbs), now reproduced on new messages. They were not used to
tune anything in this step.

## Comparison with the original dataset

| Measure | Original (100) | Holdout (50) | Difference |
| --- | --- | --- | --- |
| Binary cases | 74 | 40 | — |
| TP / FP / TN / FN | 25 / 3 / 33 / 13 | 11 / 1 / 19 / 9 | — |
| Precision | 0.893 | 0.917 | +0.024 |
| Recall | 0.658 | 0.550 | −0.108 |
| F1 | 0.758 | 0.687 | −0.070 |

The holdout's precision is slightly higher and its recall noticeably lower. With
40 binary cases these differences are small-sample observations, not a ranking.
They may reflect:

- **Composition.** The holdout has a higher share of hard shapes (card photo,
  recovery code, code-mixed text, calm long messages, link-only scams) and no
  separate edge-case bucket; the original has 25 dedicated edge cases but also
  many explicit scam scripts.
- **Authoring.** This holdout was written after seeing the first report, so the
  author's attention was on the shapes the rules were known to miss. That makes
  it a deliberately adversarial holdout, not a random one.
- **Sampling noise.** A single-digit count difference moves these percentages by
  several points.

The two datasets are reported separately. **No combined 150-case metric is
computed or claimed.**

## Privacy and network verification

- The runner imports only `analyzeMessage`; grep finds no `fetch`, XHR, axios,
  storage API or beacon in the holdout modules or CLI.
- A test replaces `fetch` with a throwing function and runs the whole holdout.
- A test asserts every URL host is `.invalid`, `.example`, `example.com` or a
  documentation IP; nothing is fetched or resolved.
- The formatted report contains no URLs, no message bodies and no rationales; a
  test checks every holdout message and rationale against the output.

## Test results

| Command | Result |
| --- | --- |
| `bun run evaluate:holdout` | exit 0; 50 cases, 16 predicted positive |
| `bun test src/lib/scam-detection/evaluation/holdout` | exit 0; 16 pass, 0 fail |
| `bun test` | exit 0; 258 pass, 0 fail (242 previous + 16 new) |
| `bun run evaluate` | exit 0; original report unchanged |
| `bunx tsc -b --noEmit` | exit 0 |
| `bunx eslint src/lib/scam-detection/evaluation scripts` | exit 0 |

## Limitations

Fifty internally authored examples cannot establish accuracy, fairness or
coverage. The set is English-first with one code-mixed message, heavily Indian
banking/delivery in context, and every URL uses a reserved domain, which removes
real TLD signals. The labels are one author's judgements, including the
ambiguous boundary. A different author would produce different numbers, and a
real inbox contains far more variety, legitimate bulk mail, and deliberate
adaptation to detectors.

This is a leakage-reduced check, not a blind or external one: the author knows
the rule shapes. No result here should be read as a real-world false-positive or
false-negative rate.

## Next step

Run the same two datasets through the detector after any future rule change and
report both separately, so an improvement on one set is never assumed to hold on
the other.
