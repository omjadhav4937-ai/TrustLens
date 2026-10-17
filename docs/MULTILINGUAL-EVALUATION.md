# Multilingual detection and evaluation

A tested foundation for messages written in English, Hindi (Devanagari),
Marathi (Devanagari) and Hinglish, plus a separate 60-case evaluation set.

```bash
bun run evaluate:multilingual
bun test src/lib/scam-detection/multilingual.test.ts
bun test src/lib/scam-detection/evaluation/multilingual
```

> The 60 messages below are synthetic examples written inside this project. The
> metrics describe **these messages only**. They are not an estimate of
> real-world accuracy, and the set was authored by the same person who wrote the
> patterns.

## 1. What changed

The five existing rules now include contextual patterns for Hindi, Marathi and
Hinglish. Nothing else about scoring changed:

- No new rule, weight or threshold.
- No change to the 40/25/20/20/15 weights, the 30/60 bands, or the 100 cap.
- A message still contributes a rule's weight at most once, however many times
  the rule matches.
- Evidence ranges still point into the original message; Devanagari offsets are
  not remapped or translated.
- Analysis is still a pure local function: no translation API, model or network
  call.

The patterns live in `src/lib/scam-detection/multilingual.ts` and are merged into
the existing rule arrays in `rules.ts`. The language label comes from
`src/lib/scam-detection/language.ts` and is advisory: no rule reads it, so a
wrong label cannot hide or create a finding.

## 2. Supported varieties

| Variety | What the foundation recognises |
| --- | --- |
| English | The original patterns, unchanged |
| Hindi (Devanagari) | Urgency, account/service suspension, credential requests, link calls to action, prize bait, protective "do not share" warnings |
| Marathi (Devanagari) | The same six families with Marathi verb forms and inflections |
| Hinglish (Latin script) | The same families with common Hindi words/verbs written in Latin script, including mixed Hindi-English messages |

Not covered: other Indian languages, Bengali/Tamil/Telugu scripts, Arabic,
Chinese, image-only messages, voice notes, romanised Marathi, heavy spelling
variation, and paraphrases that avoid every configured shape. The list is a
foundation, not comprehensive language support.

### Language identification is a heuristic

Hindi and Marathi share Devanagari, so **script detection is not language
identification**. `detectLanguage()` counts a short list of distinguishing
function words and verb forms:

- A clear margin reports `hi` or `mr`.
- A thin margin, or no markers, reports `mixed` or `uncertain` with low
  confidence.
- Latin script with at least two Hinglish markers reports `hinglish`; otherwise
  it falls back to `en`, marked low-confidence for short text.

The result is shown as a heuristic in the risk report and never gates detection.
On this dataset the heuristic agreed with the authored variety for all 60 cases,
but that is a property of examples written with those markers, not evidence of
reliable language ID. Real messages mix scripts, spell words informally, and
borrow vocabulary constantly.

## 3. Dataset

`src/lib/scam-detection/evaluation/multilingual/` contains 60 cases, 15 per
variety:

| Label | Cases | Used in binary metrics? |
| --- | --- | --- |
| `scam` | 24 | Yes |
| `legitimate` | 28 | Yes |
| `ambiguous` | 8 | No |

Each variety has 6 scam, 7 legitimate and 2 ambiguous cases. IDs are
`TL-M-001`…`TL-M-060`; the dataset is never merged into the original 100, the
50-case holdout or the 60-case stress set. A test asserts that no ID or message
text is shared, and a content fingerprint freezes the authored text.

All hosts use `.invalid` / `.example` reserved domains, and no URL is resolved.
Labels and rationales were written from the message content before the
multilingual patterns were implemented. The full messages are in the dataset
files; the report prints case IDs only.

## 4. Method

- `evaluateMultilingual()` calls the shipped `analyzeMessage()` once per case.
- A positive prediction is Medium or High (`score >= 30`), matching every other
  evaluation in this repository.
- Ambiguous cases are reported separately and never enter precision, recall, F1
  or the confusion matrix.
- Per-variety metrics are computed independently, so one variety cannot change
  another's denominator.
- Language-identification agreement is reported next to the metrics, not folded
  into them.

## 5. Results

### 5.1 Before and after

The same dataset was run before the multilingual patterns existed (production
detector at that moment) and after. Nothing else changed between the two runs.

| Run | TP | FP | TN | FN | Precision | Recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Before multilingual patterns | 12 | 10 | 18 | 12 | 0.545 | 0.500 | 0.522 |
| After multilingual patterns | 22 | 1 | 27 | 2 | 0.957 | 0.917 | 0.936 |

Confusion matrix after the change:

|  | Predicted positive | Predicted negative |
| --- | --- | --- |
| Expected `scam` (24) | 22 | 2 |
| Expected `legitimate` (28) | 1 | 27 |

### 5.2 By variety

| Variety | Cases | TP | FP | TN | FN | Precision | Recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| English | 15 | 4 | 1 | 6 | 2 | 0.800 | 0.667 | 0.727 |
| Hindi | 15 | 6 | 0 | 7 | 0 | 1.000 | 1.000 | 1.000 |
| Marathi | 15 | 6 | 0 | 7 | 0 | 1.000 | 1.000 | 1.000 |
| Hinglish | 15 | 6 | 0 | 7 | 0 | 1.000 | 1.000 | 1.000 |

Before the change, Hindi and Marathi each scored 2 TP / 3 FP / 4 TN / 4 FN, and
Hinglish scored 4 TP / 3 FP / 4 TN / 2 FN. The perfect rows above are a direct
consequence of authoring both the cases and the patterns; they are not evidence
that real Hindi, Marathi or Hinglish messages will score this way.

### 5.3 Errors that remain

| Case | Label | Score | Why |
| --- | --- | --- | --- |
| `TL-M-026` | legitimate | 40 Medium | English: "The new one is already in the password manager we share." The existing request-verb pattern sees `share` beside `password`. This false positive predates multilingual support and was deliberately not changed in this step. |
| `TL-M-003` | scam | 20 Low | English prize + claim link: the prize rule contributes 20 and the reserved `.invalid` link raises no link indicator, so the total stays below Medium. |
| `TL-M-005` | scam | 0 Low | English delivery-fee message: no configured urgency, credential, link or blocking shape fires on the reserved address. |

### 5.4 Ambiguous cases

Two of the eight ambiguous cases were flagged Medium: `TL-M-057` (Marathi request
for a received code) and `TL-M-059` (Hinglish request for a received code). Both
are normal between colleagues and hostile from a stranger. They remain excluded
from the binary metrics and are listed for human review.

## 6. Historical datasets after the change

The multilingual patterns are language-specific, so the original English 100-case
report is **byte-identical** to the saved pre-change baseline.

Two mixed-language cases in the historical sets did change, as expected:

| Dataset | Before | After | Cause |
| --- | --- | --- | --- |
| Holdout (50) | 11 TP / 1 FP / 19 TN / 9 FN; P 0.917, R 0.550, F1 0.687 | 12 TP / 1 FP / 19 TN / 8 FN; P 0.923, R 0.600, F1 0.727 | `TL-H-014`, a code-mixed Hindi/English closure and code request, is now caught |
| Stress (60) | 2 TP / 4 FP / 26 TN / 18 FN; P 0.333, R 0.100, F1 0.154 | 3 TP / 4 FP / 26 TN / 17 FN; P 0.429, R 0.150, F1 0.222 | `TL-C-019` ("App me jo code dikh raha hai use bhej do") is now caught by the production detector |

The Candidate A/B proposal logic was not edited. Its simulated overlay was re-run
on the new baseline; those numbers moved with the baseline and are recorded in
[CREDENTIAL-RULE-PROPOSAL.md](CREDENTIAL-RULE-PROPOSAL.md) and
[CREDENTIAL-STRESS-TEST.md](CREDENTIAL-STRESS-TEST.md). The recommendation to
refine Candidate A before production is unchanged.

No historical label, message or case was edited. The 100-case, holdout and stress
content fingerprints are asserted unchanged in tests.

## 7. Evidence, scoring and link integrity

Verified by unit tests:

- Every Devanagari occurrence slices back to a phrase in `matchedPhrases` of the
  original message.
- Repeating "तुरंत OTP भेजें" three times still contributes urgency 20 and
  credential 40 once each.
- A credential range that overlaps an urgency range still awards both rules
  fully, and the ranges remain distinguishable.
- A Hindi message that triggers all five rules reaches `rawScore` 120 and
  `score` 100 with `scoreWasCapped: true`.
- URLs in multilingual messages are parsed to offsets and text only; the message
  is unchanged and no request is made.
- Analysis runs with `globalThis.fetch` replaced by a throwing function.

## 8. Privacy and network verification

- No translation service, remote AI service, model download or external analysis
  call exists in the detection path.
- `language.ts`, `multilingual.ts` and the multilingual evaluation modules import
  only local modules. No `fetch`, XHR, beacon or storage API is used.
- Every dataset URL is on a reserved host; a test asserts this.
- The formatted report prints case IDs and aggregate counts only. A test rejects
  any URL and any message over 30 characters in the output.

## 9. Limitations

1. **Synthetic and authored with knowledge of the patterns.** The perfect
   Hindi/Marathi/Hinglish rows are not a performance claim.
2. **One author, one style.** Spellings, regional vocabulary and code-mixing vary
   far more than 15 examples per variety can represent.
3. **Not a language identifier.** Devanagari is shared; the Hindi/Marathi split
   is a function-word guess, and short messages are often reported uncertain.
4. **Fixed vocabulary.** Paraphrases such as "the digits that came to your phone"
   or "read me the number" may still miss.
5. **One script family.** Punjabi, Bengali, Tamil, Telugu and every non-Indian
   language remain outside the supported set.
6. **No real-world accuracy.** Precision and recall here describe 60 hand-written
   messages, not an inbox.

## 10. Reproduce

| Command | Result |
| --- | --- |
| `bun run evaluate:multilingual` | 60 cases; 52 binary cases; 23 binary predicted positive |
| `bun test src/lib/scam-detection/multilingual.test.ts` | detection, offsets, capping, language limits |
| `bun test src/lib/scam-detection/evaluation/multilingual` | dataset integrity, metrics, privacy |
| `bun run evaluate` | original 100-case output unchanged |
| `bun run evaluate:holdout` | 12 TP / 1 FP / 19 TN / 8 FN |
| `bun run evaluate:credential-stress` | baseline 3 TP / 4 FP / 26 TN / 17 FN |
