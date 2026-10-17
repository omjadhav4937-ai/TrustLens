# Credential-rule improvement proposal and isolated dry run

**Proposal only. No production detection behavior has been changed.** The shipped
`analyzeMessage()` call, its rules, weights and thresholds are untouched. Both
candidates exist only in an evaluation module and a dry-run command.

```bash
bun run evaluate:credential-proposal
bun test src/lib/scam-detection/evaluation/credential-proposal.test.ts
```

The command prints aggregate counts and case IDs only. It never prints message
text, URLs or rationales.

## 1. Problem statement

The two existing evaluations showed the same family of misses: card-photo
requests, recovery codes, codes displayed inside an app, code requests phrased
outside the rule's vocabulary, and code-mixed wording. They also showed the
opposite risk: the current rule already produces three false positives in the
original dataset and one in the holdout, all around credential *mentions* or
password confirmation rather than actual disclosure.

Broadening credential detection carelessly would make onboarding, account setup
and routine verification worse. This proposal measures two scoped alternatives.

## 2. Current rule behavior (verified in source)

`credential-request` in `src/lib/scam-detection/rules.ts`:

- **Weight 40**, severity `critical`. It contributes at most once per message,
  and the engine caps the total at 100.
- **Standalone patterns** always count: `OTP`, `one-time password/passcode/code/PIN`,
  `CVV`, `CVC`, `MPIN`/`M-PIN`, `UPI PIN`, `ATM PIN`, `card PIN`.
- **Request patterns** count a credential term only when a request verb
  (`share`, `send`, `provide`, `give`, `tell`, `forward`, `confirm`, `enter`,
  `type`, `submit`, `reply with`, `verify`, `update`, `disclose`, `reveal`,
  `mention`, `click`) sits within 40 characters of a term such as `password`,
  `passcode`, `security code`, `verification code`, `card number`,
  `aadhaar number`, `PAN number`, `date of birth`, or `net banking password`.
- **"You received" pattern**: request verb + `otp|pin|password|passcode|code` +
  `you receive(d)` within a short window.
- **Protective warnings** (`do not share`, `never share`, `keep this code
  private`, `we never ask`) suppress a bare mention, unless a request elsewhere
  in the message overrides them.
- Evidence is a range in the original message (`occurrences`, `matchedText`,
  `matchedPhrases`), so any future rule must preserve offsets.

Consequences: a request for "the six-digit code shown in your app", a photo of
a card, or a recovery code has no listed term and scores 0 for this rule. A bare
`OTP` mention without a warning scores 40 even when no one asked for it.

The existing scoring configuration remains: credential 40, suspicious link 25,
urgency 20, prize 20, account threat 15, Medium ≥30, High ≥60, cap 100.

## 3. Candidate A — conservative

Candidate A adds three signal families but only when the message is clearly
asking the reader to disclose something. A match is still the **existing**
credential finding (+40), not a new rule or extra weight.

### A. Card-image requests

Matches when, inside one sentence-like clause:

- a disclosure/transfer verb (`share`, `send`, `forward`, `upload`, `provide`,
  `reply with`, `give`, `email`, `text`, `message`, `dm`, `whatsapp`),
- an image noun (`photo`, `photograph`, `picture`, `pic`, `image`, `scan`,
  `screenshot`), and
- a payment-card term (`card`, `debit/credit/ATM/payment/bank card`)

appear within 60 characters of each other, in any order that keeps the request
and the object connected. Bare card mentions, gift cards (scrubbed before
matching) and messages without a request do not match.

Suppressed when the clause carries a privacy warning or a negated request, and
when it describes an in-app flow ("in the app", "on the next screen") without a
person-to-person transfer marker (`chat`, `reply`, `send me`, `forward`, …).

### B. Recovery-code requests

Matches `recovery code(s)` or `backup code(s)` when a disclosure verb
(`share`, `send`, `forward`, `tell`, `read`, `give`, `provide`, `reply with`,
`text`, `email`, `message`) sits within 60 characters in either order.

"Store your backup codes somewhere safe" does not match (no request);
"never share your backup codes" does not match (protective warning).

### C. Codes displayed inside an app

Matches a code term (bare `code`/`passcode`, `verification/security/login/
sign-in/access code`, or a 4/5/6/8-digit code) when:

- a disclosure verb (`share`, `send`, `forward`, `tell`, `read`, `reply with`,
  `give`, `provide`, `text`, `message`) is within 60 characters, and
- the same clause contains a delivery context (`app`, `screen`, `displayed`,
  `shown`, `generated`, `authenticator`, `SMS`, `text message`, `mobile`,
  `phone`, `device`, `notification`).

It deliberately excludes `enter`, `type` and `submit`: "enter the code shown in
the app" is an instruction to the user, not a request to disclose it. It also
excludes `need`/`require`, identity-document images, and non-English verbs.

## 4. Candidate B — broader

Candidate B keeps all of A and adds:

- **Card images:** identity-linked documents (`Aadhaar`, `PAN card`, `passport`,
  `ID/identity card`, driving licence, voter ID), `copy/copies` as image nouns,
  and `need`/`require`/`can you send` as request forms. The in-app and
  protective-warning guards stay.
- **Recovery codes:** `recovery key(s)`, `account recovery code(s)`, and
  `disclose`, `divulge`, `need` as disclosure forms.
- **App codes:** `email`, `inbox`, `this number`, `registered mobile/phone` as
  context; `need`, `require`, `disclose`, `divulge` as verbs; and the
  transliterated verbs `bhejo`, `bhejiye`, `batao`, `bataye`, `share karo`.
- **Obfuscation:** a narrow second pass for `0TP` followed by a send/share verb
  and a phone/number/account context.

Candidate B is still clause-scoped and still refuses negated or warned clauses.
It introduces no new finding type; a match is the existing 40-point credential
finding.

## 5. Representative examples

| Should match | Candidate | Why |
| --- | --- | --- |
| "Please send a photo of your debit card to confirm the order." | A + B | Request + image + payment card |
| "Forward me the recovery code the app just sent." | A + B | Recovery term + disclosure verb |
| "Send the six-digit code shown in the app." | A + B | Code + app context + disclosure verb |
| "We need the six-digit verification code sent to your mobile number." | B only | Adds `need` as a request form |
| "Turant code bhejiye jo abhi SMS aaya hai." | B only | Transliterated verb + SMS context |
| "Email a scan of your passport before the interview." | B only | Identity-document image |

| Should not match | Candidate | Why |
| --- | --- | --- |
| "Keep a photo of your card in a safe place." | A + B | No request |
| "Never send a photo of your card to anyone." | A + B | Negated request |
| "Can you send me a photo of the gift card you bought?" | A + B | Gift card, not a credential card |
| "Upload a photo of your ID in the app to finish verification." | A + B | In-app flow, no personal transfer |
| "Store your backup codes somewhere safe." | A + B | Advice, not disclosure |
| "Never share your backup codes with anyone." | A + B | Protective warning |
| "Enter the code shown in the app to sign in." | A + B | In-app entry, not disclosure |
| "Your code is valid for 10 minutes." | A + B | Mention only |
| "Send me the gift card codes." | A + B | No authentication context |
| "Do not share the code with anyone." | A + B | Negated request |

These are synthetic fixtures; none contains a live URL.

## 6. Original dataset — baseline and simulated

100 cases; 26 ambiguous excluded from the binary metrics; 74 binary.

| Run | TP | FP | TN | FN | Precision | Recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Baseline (shipped engine) | 25 | 3 | 33 | 13 | 0.893 | 0.658 | 0.758 |
| Candidate A (simulated) | 27 | 3 | 33 | 11 | 0.900 | 0.711 | 0.794 |
| Candidate B (simulated) | 29 | 3 | 33 | 9 | 0.906 | 0.763 | 0.829 |

- Recovered from baseline false negatives — A: `TL-E-001`, `TL-E-019` (2).
  B: `TL-E-001`, `TL-E-002`, `TL-E-005`, `TL-E-019` (4).
- New false positives: **0** for both candidates.
- Score changes / risk-band changes — A: 3 / 3; B: 5 / 5. The third/fifth change
  is the ambiguous `TL-A-002`, not a binary case.
- Family matches — A: card-image 2, recovery-code 0, app-code 3 (5 cases).
  B: card-image 3, recovery-code 0, app-code 5 (8 cases).
- Ambiguous: baseline flags 5, A flags 6, B flags 6. Newly flagged: `TL-A-002`
  for both.

## 7. Holdout — baseline and simulated

50 cases; 10 ambiguous excluded; 40 binary.

| Run | TP | FP | TN | FN | Precision | Recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Baseline (shipped engine) | 11 | 1 | 19 | 9 | 0.917 | 0.550 | 0.687 |
| Candidate A (simulated) | 14 | 1 | 19 | 6 | 0.933 | 0.700 | 0.800 |
| Candidate B (simulated) | 15 | 1 | 19 | 5 | 0.938 | 0.750 | 0.833 |

- Recovered — A: `TL-H-003`, `TL-H-004`, `TL-H-009` (3).
  B: the same three plus `TL-H-014` (4).
- New false positives: **0** for both.
- Score/band changes — A: 3 / 3; B: 5 / 5. B's extra change is ambiguous
  `TL-H-042`.
- Family matches — A: card-image 1, recovery-code 1, app-code 1 (3 cases).
  B: card-image 2, recovery-code 1, app-code 2 (5 cases).
- Ambiguous: baseline flags 4; A flags 4; B flags 5. Newly flagged by B:
  `TL-H-042` (passport scan request).

These are simulated overlays, not production results. The two datasets are
reported separately; no combined metric is calculated.

## 8. False-positive and false-negative analysis

**False positives.** Neither candidate adds a binary false positive on either
dataset. The existing false positives remain and are not addressed by this
proposal: original `TL-E-006` (bare OTP), `TL-E-008` (internal urgent OTP) and
`TL-E-023` (demo OTP); holdout `TL-H-040` (password confirmation in account
setup). Candidate A leaves all four unchanged; so does B.

The only additional *ambiguous* flags are `TL-A-002` (IT helpdesk asking to read
a code back — both candidates) and `TL-H-042` (passport scan request — B only).
Ambiguous flags are reported separately and do not enter the confusion matrix.

**False negatives still remaining.** Candidate A still misses `TL-E-002` (`0TP`),
`TL-E-005` (long message asking for a code "sent to the registered mobile
number"), and `TL-H-014` (code-mixed Hindi/English). B recovers all three.
Neither candidate touches the non-credential misses (`TL-S-003`, `TL-S-008`,
`TL-S-020`, `TL-S-022`, `TL-S-023`, `TL-E-013`, `TL-E-015`, `TL-E-020`,
`TL-E-024`), which need link, urgency, prize or family-impersonation work rather
than credential detection.

**Trade-off.** B adds three true catches and one extra ambiguous flag across the
two datasets, with no measured binary false positive. That looks dominant on
this data, but the extra catch comes partly from identity-document matching,
which is common in legitimate KYC and was not measured against real onboarding
mail. The synthetic sets contain no legitimate passport/Aadhaar scan request,
so their zero-FP result cannot settle that risk.

## 9. Named-case inspection

Baseline scores are production-engine scores. Simulated scores apply the
overlay; a matched case only receives +40 once. `—` means no candidate match.

| Case | Label | Baseline | Candidate A | Candidate B | Judgment |
| --- | --- | --- | --- | --- | --- |
| `TL-H-003` | scam | 0 Low | card-image → 40 Medium | card-image → 40 Medium | Desirable catch |
| `TL-H-004` | scam | 0 Low | app-code → 40 Medium | app-code → 40 Medium | Desirable catch |
| `TL-H-009` | scam | 0 Low | recovery-code → 40 Medium | recovery-code → 40 Medium | Desirable catch |
| `TL-H-014` | scam | 0 Low | — → 0 Low | app-code → 40 Medium | A misses; B desirable |
| `TL-H-040` | legitimate | 40 Medium | — → 40 Medium | — → 40 Medium | Undesirable existing FP; unchanged |
| `TL-S-003` | scam | 25 Low | — → 25 Low | — → 25 Low | Still missed; link-only, out of scope |
| `TL-S-008` | scam | 25 Low | — → 25 Low | — → 25 Low | Still missed; link-only, out of scope |
| `TL-S-020` | scam | 0 Low | — → 0 Low | — → 0 Low | Still missed; no configured signal |
| `TL-S-022` | scam | 20 Low | — → 20 Low | — → 20 Low | Still missed; prize-only, out of scope |
| `TL-S-023` | scam | 20 Low | — → 20 Low | — → 20 Low | Still missed; urgency-only, out of scope |
| `TL-E-001` | scam | 0 Low | app-code → 40 Medium | app-code → 40 Medium | Desirable catch |
| `TL-E-002` | scam | 20 Low | — → 20 Low | app-code → 60 High | A misses; B desirable |
| `TL-E-005` | scam | 0 Low | — → 0 Low | app-code → 40 Medium | A misses; B desirable |
| `TL-E-013` | scam | 25 Low | — → 25 Low | — → 25 Low | Still missed; link-only, out of scope |
| `TL-E-015` | scam | 25 Low | — → 25 Low | — → 25 Low | Still missed; link-only, out of scope |
| `TL-E-019` | scam | 0 Low | card-image → 40 Medium | card-image → 40 Medium | Desirable catch |
| `TL-E-020` | scam | 20 Low | — → 20 Low | — → 20 Low | Still missed; urgency-only, out of scope |
| `TL-E-024` | scam | 25 Low | — → 25 Low | — → 25 Low | Still missed; link-only, out of scope |

No matching condition was weakened to force any of these outcomes; the misses
above are reported as misses.

## 10. Ambiguous-case analysis

- **Original** (26 ambiguous): baseline flags 5; A and B flag 6. The new flag is
  `TL-A-002`, an IT-helpdesk message asking a colleague to read back a code. It
  deserves human review, and the label stays ambiguous.
- **Holdout** (10 ambiguous): baseline flags 4; A flags 4; B flags 5. The new B
  flag is `TL-H-042`, a request for a passport scan before an interview. It could
  be legitimate onboarding; the proposal does not treat it as a binary error.

Because ambiguous cases are excluded from precision/recall, these flags are a
review cost rather than a measured false-positive rate.

## 11. Known limitations

- **Text only.** The proposal cannot see the sender, prior relationship, link
  destination or whether the recipient started an onboarding flow. This is why
  card-photo and identity-document requests remain context-dependent.
- **Clause-scoped.** A warning in one sentence and a request in another are
  judged separately, which is deliberate but can miss a request that spans
  sentences.
- **No semantic understanding.** "Need" is treated as a request only in B; "the
  code from your app" with no image/context word still misses.
- **Code-mixed support is not a language detector.** B has five transliterated
  verbs. That is a narrow token list, not coverage of Hindi, Hinglish or any
  other language.
- **Identity documents.** B's extra recall comes partly from matching passport
  and Aadhaar scans; the datasets contain no legitimate example of that pattern,
  so B's real-world false-positive risk is unknown.
- **Small synthetic samples.** These are 100 and 50 hand-written cases, not
  representative traffic. Differences of one or two cases move the percentages
  substantially. No real-world accuracy is claimed.

## 12. Recommendation

**Recommend Candidate A as the basis for a future production change, not B.**

Reasons:

1. A recovers five previously missed scams across the two datasets (2 original,
   3 holdout) with **no new binary false positive** and only one new ambiguous
   flag.
2. B's additional catches (`TL-E-002`, `TL-E-005`, `TL-H-014`) are real, but
   they come from narrow obfuscation/transliteration tokens and from broadening
   card-image matching to identity documents. The latter is exactly the shape of
   routine, legitimate KYC and was not tested against any legitimate example.
3. A's in-app guard and protective-warning clause handling directly target the
   legitimate-onboarding risk that motivated this proposal.

If the team later wants B's extra recall, the safer sequence is to add its
app-code wording (`need`/`require`, `0TP`, SMS context) first, and evaluate
identity-document matching separately against real onboarding examples. B should
not be adopted wholesale on the strength of two small synthetic sets.

Candidate A still misses the long-message request, the substituted `0TP`, the
transliterated code request, and every non-credential failure. Those remain
candidates for later work, not reasons to widen this rule without more evidence.

## 13. No production behavior has changed

- `rules.ts`, `engine.ts`, `normalize.ts`, `links.ts`, `types.ts`, the UI and
  `ScamAnalysis` are untouched.
- Weights remain 20/15/25/40/20; thresholds 30/60; cap 100.
- The original 100 cases and 50-case holdout are unchanged.
- `bun run evaluate` output is byte-identical to the pre-step baseline;
  `bun run evaluate:holdout` is unchanged.
- The proposal lives only in
  `src/lib/scam-detection/evaluation/credential-proposal.ts` and is not imported
  by application code.
