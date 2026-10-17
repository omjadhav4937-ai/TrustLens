# Demo guide

A short, repeatable walkthrough — roughly eight to ten minutes. Every score and finding
below was produced by the engine in this repository, not estimated.

**Before you start:** the dev server is running on `http://localhost:5173` and the page is
open at `/`. Every message is synthetic, and every URL below is inert text inside a code
block — nothing here is a live link, and the product never renders one as clickable.

**Reset between runs:** press *Clear*, or reload the page. The analyzer keeps no history.

---

## 1. Open the landing page

Point out, in order:

- The headline and tagline: *See the Risk Behind Every Message.*
- The three trust points: written rules instead of an opaque model, privacy-first
  processing, and guidance you can act on.
- *How it works* — four steps, each naming what the tool does rather than how clever it is.
- The footer disclaimer, which already says the tool *cannot guarantee* whether a message
  is fraudulent. Say that out loud; it sets the tone for the rest of the demo.

## 2. Enter a clearly suspicious message

Two options. **A** is one click: press **Load Sample Message**. **B** is better for a live
demo because the audience sees the text arrive.

Message A — the bundled sample (fictional SBI KYC scam):

```text
Dear Customer, your SBI YONO account will be BLOCKED today because your KYC is not updated. Update immediately within 24 hours by clicking http://sbi-kyc-verify.online/update and confirm your details. Share the OTP you receive on this number with our verification executive to restore your services. - SBI Customer Care
```

## 3. Run the analysis and explain the score

Press **Analyze Message**. Expected result — **score 100, risk level High**, four warning
signs:

| Rule | Weight | Text it matched |
| --- | --- | --- |
| `credential-request` | 40 | `Share the OTP you receive` |
| `suspicious-link` | 25 | `clicking http://sbi-kyc-verify.online/update` |
| `urgency-pressure` | 20 | `immediately` (matched twice) |
| `account-threat` | 15 | `account will be BLOCKED today because your KYC is not updated` |

`prize-bait` is listed as **not matched** — the fifth rule ran and found nothing. Point
that out: the report shows what was checked and cleared, not only what fired.

Say explicitly: **100 is a heuristic ceiling, not a certainty.** The score is the sum of
four editorial weights, capped at 100. It means "this wording matches known scam
patterns", not "this message is a scam".

## 4. Select a finding and show its evidence

Click the `credential-request` card. It expands, and the matching text in the message is
emphasised. Press **Show in message** and note three things:

- Focus lands on the highlighted text, and the page scrolls it into view.
- The status line above the message says which finding is being shown.
- The card stays selected — the reader is never thrown back to an unrelated place.

Keyboard equivalent: `Tab` to a highlighted phrase and press `Enter` (or `Space`). It
selects the same finding. This is worth showing, because the highlights are real buttons,
not decoration.

## 5. Demonstrate the shared-evidence overlap

This is the case the interface was built around: two findings claim the same characters.
Clear the box and paste this:

```text
URGENT: your account will be blocked today. Click here http://sbi-kyc-verify.online/update and share the OTP you received to claim your prize.
```

Expected result — **score 100, risk level High**, five warning signs, and this time the
total is **capped**: the weights add up to 120, and the panel states it exactly — *"The
matched rule weights add up to 120 points, which is capped at the maximum of 100."*

| Rule | Weight | Text it matched |
| --- | --- | --- |
| `credential-request` | 40 | `update and share the OTP you received` |
| `suspicious-link` | 25 | `Click here`, and the URL |
| `urgency-pressure` | 20 | `URGENT` |
| `prize-bait` | 20 | `claim your`, `prize` |
| `account-threat` | 15 | `account will be blocked` |

Now open the `credential-request` card and press **Show in message**. Talk through what
the audience is seeing:

- The credential finding has **no mark of its own**: the link's mark already covers the
  first six characters of its evidence, the word `update`.
- Focus lands on **the link's mark**, because that is where the evidence physically is.
- The link's mark is drawn with a **double underline** — a shared mark, not an ordinary one.
- The remaining 31 characters, ` and share the OTP you received`, are outlined with a
  **dashed top rule**: evidence that belongs to the selected finding but has no mark.
- The status line says both things at once: the shared text carries the link's mark, and
  the rest is outlined for this finding. It does not pretend the whole phrase is
  highlighted.
- The message itself is untouched, and the URL is still plain text — it cannot be clicked.

If someone asks why the credential finding doesn't just get its own highlight: one
character range cannot belong to two marks without one of them lying about what it
covers. The design keeps each mark honest and shows the remainder separately.

## 6. Show a comparatively benign message

Clear, then paste:

```text
Your parcel from the courier was delivered to reception this morning. The front desk closes at 6pm on weekdays.
```

Expected result — **score 0, risk level Low, no findings**. All five rules report
**not matched**.

Say this precisely: *no configured rule matched*. Do **not** say the message is safe —
TrustLens cannot know who sent it. The panel deliberately refuses to reassure, and the
caveat under the score says a low score is not proof of safety.

Optional discussion point — a benign message that still trips one rule:

```text
Hi Sam, the group project draft is in the shared folder. Can we meet at the library at 4pm tomorrow to review chapter three? Nothing urgent.
```

Expected result — **score 20, risk level Low**, one finding: `urgency-pressure` matched
the word `urgent`. This is the most honest moment in the demo: the rule fired on an
ordinary word, the score stayed low, and the report still shows the reader exactly what
triggered it so they can judge for themselves. Heuristics produce this; that is why the
interface shows reasoning instead of a verdict.

## 7. Show multilingual coverage (optional, 60 seconds)

The detector now has a tested foundation for Hindi and Marathi in Devanagari, and for
Hinglish. Clear the box and try one message. All three of these produce the same
verified result: **score 75, risk level High**, with three findings.

Hindi:

```text
आपका खाता आज बंद कर दिया जाएगा। अपना OTP तुरंत बताएं।
```

Marathi:

```text
तुमचे खाते आज बंद केले जाईल. तुमचा OTP लगेच सांगा.
```

Hinglish:

```text
Aaj tumhara account block ho jayega. Apna OTP turant share karo.
```

| Rule | Weight | Text it matched (Hindi example) |
| --- | --- | --- |
| `credential-request` | 40 | `OTP तुरंत बताएं` |
| `urgency-pressure` | 20 | `तुरंत` |
| `account-threat` | 15 | `खाता आज बंद` |

Then paste this legitimate Hindi code delivery:

```text
आपका OTP भेज दिया गया है। यह कोड किसी के साथ साझा न करें।
```

Expected result — **score 0, risk level Low**. The credential rule names the warning in
its decision: the message tells the reader not to share the code, so the mention is not
counted. Say plainly that the language chip is a **heuristic**: Hindi and Marathi both
use Devanagari, so TrustLens can report mixed or uncertain, and the label never changes
the score. Coverage is partial; other languages are not supported.

## 8. Show the proposed plans and API

Scroll to **Protection for Every Level**:

- Free ₹0 is available now and its **Try Free** button returns to the analyzer.
- Premium ₹99 and Business ₹2,999 are clearly labelled **Proposed — not available**.
- Press **Coming Soon** on Premium. A dialog explains that no subscription or payment
  flow exists. Point out that there is no email field, no card field and no checkout.
- Read the disclosure aloud: pricing and features are subject to validation, and
  subscriptions and payment processing are not active.

Scroll to **Power Your Product with TrustLens API**:

- The code panel is marked **Illustrative example — not a live endpoint**, and the key
  is the literal `YOUR_API_KEY`.
- The three API plans are labelled **Proposed**. Press **Explore API Plans — Coming
  Soon**; the page scrolls and a status line says access is planned, not available.
- Point at the “What is not available today” block: no hosted API, no keys, no metering,
  no billing, no uptime guarantee.

This is the business-model story, not a claim that the business is running. Say that.

## 9. Show the safety guidance

Scroll to the safety section and the checklist inside the report:

- Each matched finding contributes a specific action ("I will not share an OTP…", "I will
  not open a link I was not expecting…"), not generic advice.
- Ticking the boxes changes nothing about the score, and the panel says so — a completed
  checklist does not make a message safe.
- The reporting block names India's National Cyber Crime Reporting Portal and the **1930**
  helpline, and opens the portal in a new tab with `rel="noopener noreferrer"`.
- The analysis report and the footer both carry the same caveat: a high score does not
  prove fraud, and a low score does not prove safety.

## 10. Explain current limitations and future work

Close on what the prototype is and is not:

- **Rules, not a model.** Five written heuristics over wording and URL shape. No training
  data, no reputation lookup, no sender verification, no link opened.
- **Structural URL checks only.** The lookalike-domain and high-risk-TLD checks read the
  address string. They do not know where a shortened link really goes.
- **No real-world accuracy claim.** The repository has small, synthetic, internally
  authored labelled sets, and their numbers describe only those messages. The weights
  remain editorial judgements, not calibrated probabilities.
- **Documented blind spots.** Paraphrased scams, image-only messages, voice notes and
  homoglyph tricks are only partly or not at all covered. Multilingual coverage is a
  foundation for English, Hindi, Marathi and Hinglish, not comprehensive language
  support. A bank alert that mentions a code while warning you not to share it is
  deliberately recorded as a note rather than a match.
- **Next steps, in priority order:** validate against a larger external corpus; refine
  the card-image credential proposal (still not production-ready); widen language
  coverage beyond the tested four varieties; add trusted-channel verification guidance
  per organisation. Each of those needs evidence before it becomes a claim.

---

## Presenter notes

- **Do not say** "this message is definitely a scam", "we detect 98% of scams", "we check
  the link live", "we verify the sender", or "the score is accurate". None of that is true
  of this build.
- **Do say** "this wording matches four written rules", "the score is a screening signal",
  "we highlight the exact text so you can judge it yourself".
- **Accessibility, if asked:** every highlight is a keyboard-reachable button; there is a
  skip link to the analyzer; the navigation, mobile menu, pricing dialogs and reveal
  animations honour `prefers-reduced-motion`; status changes are announced through a
  `role="status"` region. The paid-plan buttons open by Tab and Enter, and Escape
  closes them. A screen reader has not been used to verify what is spoken — say that
  plainly rather than claiming it works.
- **If the demo machine is offline**, the analyzer still works: analysis is local. Only the
  platform's preview toolbar may look degraded.
- **If a section looks blank**, it is probably the in-view fade; scroll slightly. If the
  whole page is blank, the build has a type error — run `bunx tsc -b --noEmit`.
