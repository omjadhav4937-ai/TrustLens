# Demo guide

A short, repeatable walkthrough — roughly six to eight minutes. Every score and finding
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

## 7. Show the safety guidance

Scroll to the safety section and the checklist inside the report:

- Each matched finding contributes a specific action ("I will not share an OTP…", "I will
  not open a link I was not expecting…"), not generic advice.
- Ticking the boxes changes nothing about the score, and the panel says so — a completed
  checklist does not make a message safe.
- The reporting block names India's National Cyber Crime Reporting Portal and the **1930**
  helpline, and opens the portal in a new tab with `rel="noopener noreferrer"`.
- The analysis report and the footer both carry the same caveat: a high score does not
  prove fraud, and a low score does not prove safety.

## 8. Explain current limitations and future work

Close on what the prototype is and is not:

- **Rules, not a model.** Five written heuristics over wording and URL shape. No training
  data, no reputation lookup, no sender verification, no link opened.
- **Structural URL checks only.** The lookalike-domain and high-risk-TLD checks read the
  address string. They do not know where a shortened link really goes.
- **No accuracy claim.** The weights are editorial and no labelled dataset has been
  evaluated, so no accuracy, precision or recall figure exists — and none is claimed.
- **Documented blind spots.** Paraphrased scams, image-only messages, voice notes, other
  languages, and homoglyph tricks are only partly or not at all covered. A bank alert that
  mentions a code while warning you not to share it is deliberately recorded as a note
  rather than a match.
- **Next steps, in priority order:** evaluate the rules against a labelled corpus and
  publish measured precision/recall; add multilingual and homoglyph normalisation; add
  trusted-channel verification guidance per organisation. Each of those needs evidence
  before it becomes a claim.

---

## Presenter notes

- **Do not say** "this message is definitely a scam", "we detect 98% of scams", "we check
  the link live", "we verify the sender", or "the score is accurate". None of that is true
  of this build.
- **Do say** "this wording matches four written rules", "the score is a screening signal",
  "we highlight the exact text so you can judge it yourself".
- **Accessibility, if asked:** every highlight is a keyboard-reachable button; there is a
  skip link to the analyzer; the navigation, mobile menu, and reveal animations honour
  `prefers-reduced-motion`; status changes are announced through a `role="status"` region.
  A screen reader has not been used to verify what is spoken — say that plainly rather
  than claiming it works.
- **If the demo machine is offline**, the analyzer still works: analysis is local. Only the
  platform's preview toolbar may look degraded.
- **If a section looks blank**, it is probably the in-view fade; scroll slightly. If the
  whole page is blank, the build has a type error — run `bunx tsc -b --noEmit`.
