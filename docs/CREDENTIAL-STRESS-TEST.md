# Candidate A stress test

**Evaluation only. No production detection behavior was changed.** The stress set
is separate from the original 100 cases and the 50-case holdout, and Candidate A/B
matching logic was not modified for this test.

```bash
bun run evaluate:credential-stress
bun test src/lib/scam-detection/evaluation/stress
```

The command prints aggregate counts and case IDs only. It never prints message
text, URLs or rationales.

> All 60 messages are synthetic and internally authored. This is not independent
> real-world validation, and the metrics are not estimates of production
> accuracy.

## 1. Purpose and limitations

The previous two datasets showed Candidate A recovering five baseline false
negatives with no binary false positive. That is promising but easy to over-read:
both datasets were written before the candidate patterns existed. This stress set
was written specifically to look for the candidate's failure modes, with
legitimate wording that sits close to its matching rules.

It cannot establish real-world precision. It can show whether the candidate's
rules are too broad in realistic legitimate phrasing, and whether its gaps are
narrow or structural.

## 2. Dataset construction and labeling

60 cases, fixed before scoring:

| Label | Cases | IDs |
| --- | --- | --- |
| scam | 20 | `TL-C-001`–`TL-C-020` |
| legitimate | 30 | `TL-C-021`–`TL-C-050` |
| ambiguous | 10 | `TL-C-051`–`TL-C-060` |

Every case has a rationale; difficult cases also carry a difficulty note. Labels
were assigned from the message's meaning and were not revised after seeing the
candidate output. The ambiguous cases are excluded from precision, recall, F1 and
the confusion matrix.

The set deliberately includes cases the candidate misses (`TL-C-004`,
`TL-C-009`, `TL-C-014`, `TL-C-017`–`TL-C-020`) and cases where its wording
overlaps legitimate messages (`TL-C-029`, `TL-C-033`, `TL-C-034`). Those are
kept, not pruned.

## 3. Challenge categories

**Positive cases:** card photo / card-plus-ID requests; recovery and backup-code
requests; app-displayed six-digit and four-digit codes; disclosure verbs before
and after the sensitive item; long messages with the request at the end; a
negation-like request; channel-as-verb ("WhatsApp me …"); "relay"; "numbers"
instead of "code"; and one Hindi/English code-mixed message.

**Negative cases:** password setup and confirmation; in-app code entry; code
typing into a field; recovery-code storage and privacy warnings; passport upload
in a secure portal; card photos for personal records; card photos explicitly not
requested; "send the receipt, not the card"; conditional "only if the app asks";
a card photo sent to oneself; security notices that mention card photos and
recovery codes; ordinary document sharing.

## 4. Baseline results (production detector)

50 binary cases; 10 ambiguous excluded.

| TP | FP | TN | FN | Precision | Recall | F1 |
| --- | --- | --- | --- | --- | --- | --- |
| 2 | 4 | 26 | 18 | 0.333 | 0.100 | 0.154 |

Baseline true positives are incidental: `TL-C-002` (share + Aadhaar card) and
`TL-C-013` (send + verification code). Baseline false positives are `TL-C-021`
and `TL-C-042` (password setup/confirmation), `TL-C-023` ("type the verification
code" in a field) and `TL-C-039` (forward an email containing a code in a PDF).
No ambiguous case was flagged.

The low baseline recall is a composition effect: this set deliberately avoids
standalone `OTP`/`CVV` wording and focuses on code/card phrasing the existing rule
does not recognise. It is not evidence that the production detector performs this
way in general.

## 5. Candidate A results

| Method | TP | FP | TN | FN | Precision | Recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Baseline | 2 | 4 | 26 | 18 | 0.333 | 0.100 | 0.154 |
| Candidate A | 13 | 7 | 23 | 7 | 0.650 | 0.650 | 0.650 |

- Recovered 11 baseline false negatives: `TL-C-001`, `TL-C-003`, `TL-C-005`–
  `TL-C-008`, `TL-C-010`–`TL-C-012`, `TL-C-015`, `TL-C-016`.
- Added 3 false positives: `TL-C-029`, `TL-C-033`, `TL-C-034`.
- Score changes: 21. Risk-band changes: 21. These include the 7 newly flagged
  ambiguous cases, not only binary cases.
- Matches by family: card-image 9, recovery-code 5, app-code 9; 23 matched cases.
- Ambiguous: 7 of 10 flagged (`TL-C-051`, `TL-C-053`–`TL-C-055`, `TL-C-057`,
  `TL-C-059`, `TL-C-060`).

Candidate A still misses `TL-C-004` ("need a photo"), `TL-C-009` ("recovery
key"), `TL-C-014` (protective phrase suppresses a request), `TL-C-017`
(WhatsApp as verb), `TL-C-018` ("relay"), `TL-C-019` ("bhej do") and `TL-C-020`
("numbers").

## 6. Candidate B results

| Method | TP | FP | TN | FN | Precision | Recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Baseline | 2 | 4 | 26 | 18 | 0.333 | 0.100 | 0.154 |
| Candidate B | 15 | 9 | 21 | 5 | 0.625 | 0.750 | 0.682 |

- Recovered 13: A's 11 plus `TL-C-004` and `TL-C-009`.
- Added 5 false positives: `TL-C-026`, `TL-C-029`, `TL-C-030`, `TL-C-033`,
  `TL-C-034` (passport upload, receipt-not-card, negated need, conditional app
  upload, send-to-self).
- Score/band changes: 26. Family matches: card-image 13, recovery-code 6,
  app-code 9; 28 matched cases.
- Ambiguous: 8 of 10 flagged (A's 7 plus `TL-C-052`, the passport scan).

B recovers two more scams than A but adds two more legitimate false positives and
lowers precision to 0.625.

## 7. False-positive and false-negative analysis

**The important new finding is the card-image false positives.** Candidate A
matches three realistic legitimate messages:

- `TL-C-029`: "Send a photo of your receipt, not your card."
- `TL-C-033`: "Upload a card photo only if the bank's app asks for it."
- `TL-C-034`: "Send a photo of your card to yourself before travelling…"

The first has an explicit negated object; the second is conditional guidance
about an official app; the third has the cardholder as the recipient. Candidate A
sees a verb, an image noun and a card term in these cases, and its guards do not
cover these three constructions. B additionally matches a passport upload in a
secure portal (`TL-C-026`) and a negated "we do not need a photo" (`TL-C-030`).

**False negatives are real too.** Both candidates miss `TL-C-014`, where a
protective phrase ("don't keep … to yourself") suppresses an actual request, and
`TL-C-017`–`TL-C-020`, which use channel-as-verb ("WhatsApp me"), "relay",
"numbers", and a transliterated "bhej do". These are not edge-case trivia; they
are ordinary wording variations.

**Net effect.** Candidate A substantially improves recall on this set (0.100 →
0.650) but 3 new false positives in 30 legitimate messages is too high to treat
the rule as ready. Candidate B's higher recall comes with 5 new false positives
and lower precision.

## 8. Ambiguous cases

All 10 were scored Low by the production detector. A flags 7, B flags 8. The
flagged cases involve card images (`TL-C-051`, `TL-C-060`), recovery codes
(`TL-C-053`, `TL-C-057`), app codes (`TL-C-054`, `TL-C-055`, `TL-C-059`) and, for
B only, a passport scan (`TL-C-052`). All are context-dependent: the sender, prior
relationship or purpose is missing. None were forced into the binary metrics.

## 9. Code-mixed-language limitations

`TL-C-019` is a single Hindi/English example: "App me jo code dikh raha hai use
bhej do." Both candidates miss it. Candidate B has five transliterated verbs, but
"bhej do" is not among them. This is not a language capability and should not be
expanded by adding individual tokens; a genuine solution needs a different
approach and a much larger labelled set.

## 10. Recommendation

**Further refinement, not production integration yet.** The new evidence does
not support Candidate A as-is:

1. It improves F1 from 0.154 to 0.650 on this stress set, and it still adds no
   false positive to the original or holdout datasets. That is real progress.
2. But three of 30 realistic legitimate messages become false positives, all in
   the card-image family. "Not your card", conditional app guidance, and
   send-to-self are common enough that this would not be safe to ship.
3. Candidate B is not a substitute: it has lower precision (0.625) and one more
   ambiguous flag.

The next proposal should refine Candidate A's card-image family before any
production work: require a third-party recipient, reject negated/excluded card
objects, and broaden the in-app guard to official-portal wording. It should also
address the protective-phrase false negative without weakening privacy warnings.
That refined candidate should be re-run against the original, holdout and this
stress set before a production-integration proposal. No candidate is ready to
ship today.

## 11. No production behavior changed

`rules.ts`, `engine.ts`, normalization, links, UI, public types, the original 100
cases, the 50-case holdout and the Candidate A/B implementation are untouched.
`bun run evaluate` and `bun run evaluate:holdout` remain byte-identical to their
saved baselines. The stress set exists only under
`src/lib/scam-detection/evaluation/stress/` and is not imported by application
code.
