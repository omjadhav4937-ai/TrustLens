import { expect, test, type Page } from "@playwright/test";

/**
 * Real-browser verification of the TrustLens investigation interface.
 *
 * Everything here drives the actual application served on port 5173 through a
 * real Chromium, so focus, scrolling, computed styles, keyboard activation and
 * viewport behaviour are measured rather than inferred from rendered markup.
 *
 * The spec talks to the DOM only — it imports nothing from the application — so
 * it cannot accidentally agree with the app's own assumptions.
 */

const MESSAGE =
  "URGENT: your account will be blocked today. Click here http://sbi-kyc-verify.online/update and share the OTP you received to claim your prize.";

/** The partial overlap this suite exists for, as offsets into MESSAGE. */
const LINK = { start: 55, end: 90 };
const CREDENTIAL = { start: 84, end: 121 };
/** The link occurrence the credential finding has no mark of its own for. */
const LINK_TEXT = MESSAGE.slice(LINK.start, LINK.end);
/** The part of it the two findings share: the last six characters. */
const SHARED_TEXT = MESSAGE.slice(CREDENTIAL.start, LINK.end);
/** The credential finding's evidence beyond the shared part. */
const REMAINDER_TEXT = MESSAGE.slice(LINK.end, CREDENTIAL.end);

const ALL_RULES = [
  "urgency-pressure",
  "account-threat",
  "suspicious-link",
  "credential-request",
  "prize-bait",
];

/* ---------------------------------------------------------------- helpers */

function watchForPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  return errors;
}

/** Submits a message through the real analyzer and waits for the report. */
async function analyze(page: Page, message = MESSAGE) {
  await page.goto("/");
  await page.getByLabel("Your message").fill(message);
  await page.getByRole("button", { name: "Analyze Message" }).click();
  await expect(page.locator("#results li[data-rule-id]").first()).toBeVisible();
  await waitForReveal(page);
}

/**
 * The panel fades in when scrolled into view, so wait until no ancestor is still
 * at zero opacity. Without this a screenshot could capture a genuinely blank
 * panel and a visibility assertion would be meaningless.
 */
async function waitForReveal(page: Page) {
  const mark = page.locator("#results .lens-mark").first();
  await expect(mark).toBeVisible();
  await expect
    .poll(() =>
      mark.evaluate((element) => {
        let node: Element | null = element;
        while (node) {
          if (getComputedStyle(node).opacity === "0") return "0";
          node = node.parentElement;
        }
        return "1";
      }),
    )
    .toBe("1");
}

/** Expands a finding card and activates its "Show in message" action. */
async function showInMessage(page: Page, ruleId: string) {
  const card = page.locator(`#results li[data-rule-id="${ruleId}"]`);
  const toggle = card.locator("button[aria-expanded]").first();
  if ((await toggle.getAttribute("aria-expanded")) !== "true") {
    await toggle.click();
  }
  await card.getByRole("button", { name: "Show in message" }).click();
}

/** What currently holds focus, in the terms this suite cares about. */
function focusInfo(page: Page) {
  return page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (!element) return { tag: "none", ruleId: null, target: null, isMark: false };
    return {
      tag: element.tagName.toLowerCase(),
      ruleId: element.getAttribute("data-rule-id"),
      target: element.getAttribute("data-focus-target-for"),
      isMark: element.classList.contains("lens-mark"),
    };
  });
}

/** Whether the focused element is fully inside the viewport. */
function focusInViewport(page: Page) {
  return page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return rect.height > 0 && rect.top >= 0 && rect.bottom <= window.innerHeight;
  });
}

/**
 * The message exactly as the panel rendered it.
 *
 * Rebuilt from the live DOM: text nodes are taken as they are, and every element
 * contributes its own text with the screen-reader spans stripped. This is the
 * strongest available check that marking never altered the message.
 */
function renderedMessage(page: Page) {
  return page.evaluate(() => {
    const container = document.querySelector(".whitespace-pre-wrap");
    if (!container) return null;
    return [...container.childNodes]
      .map((node) => {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
        const clone = (node as Element).cloneNode(true) as Element;
        clone.querySelectorAll(".sr-only").forEach((hidden) => hidden.remove());
        return clone.textContent ?? "";
      })
      .join("");
  });
}

async function statusText(page: Page) {
  return (await page.locator('p[role="status"]').innerText()).trim();
}

/**
 * The visible text of every element matching `selector`, joined.
 *
 * Screen-reader spans are stripped, because they carry descriptions rather than
 * message text — and joined rather than read per element, because a highlighted
 * run may be split across lines.
 */
function visibleText(page: Page, selector: string) {
  return page.evaluate((selector) => {
    return [...document.querySelectorAll(selector)]
      .map((element) => {
        const clone = element.cloneNode(true) as Element;
        clone.querySelectorAll(".sr-only").forEach((hidden) => hidden.remove());
        return clone.textContent ?? "";
      })
      .join("");
  }, selector);
}

function computedStyle(page: Page, selector: string, properties: string[]) {
  return page.evaluate(
    ({ selector, properties }) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const style = getComputedStyle(element) as unknown as Record<string, string>;
      return Object.fromEntries(properties.map((property) => [property, style[property]]));
    },
    { selector, properties },
  );
}

async function assertNoPageErrors(errors: string[]) {
  expect(errors, `uncaught page errors: ${errors.join(" | ")}`).toEqual([]);
}

/* --------------------------------------------------------------- privacy */

test.describe("privacy", () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== "desktop", "desktop project only");
  });

  test("never transmits the analysed message", async ({ page }) => {
    // A unique marker so an echo of the text is unmistakable in any payload.
    const token = "ZXQPRIVACYTOKEN9137";
    const payloads: string[] = [];
    page.on("request", (request) => {
      payloads.push(request.url());
      const body = request.postData();
      if (body) payloads.push(body);
    });
    page.on("websocket", (socket) => {
      socket.on("framesent", (frame) => payloads.push(String(frame.payload)));
    });

    await analyze(page, `${token} ${MESSAGE}`);

    // The probe has to have seen traffic, or "nothing leaked" is meaningless.
    expect(payloads.length).toBeGreaterThan(0);
    expect(payloads.filter((payload) => payload.includes(token))).toEqual([]);
  });
});

/* ------------------------------------------------- the reported overlap */

test.describe("the reported partial overlap", () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== "desktop", "desktop project only");
  });

  test("renders both findings with their documented evidence", async ({ page }) => {
    await analyze(page);

    // The entire "What to do next" block is gone, not merely hidden: no
    // heading, checklist, relevance label, divider or reporting controls.
    const report = page.locator("#results");
    // The heading is gone; `getByText` alone would also match the lowercase
    // "read what to do next" sentence in the section description.
    await expect(report.getByRole("heading", { name: "What to do next" })).toHaveCount(0);
    await expect(report.getByText("Relevant to this message")).toHaveCount(0);
    await expect(report.getByText("Reporting in India")).toHaveCount(0);
    await expect(report.getByRole("checkbox")).toHaveCount(0);
    await expect(report.getByRole("link", { name: /cybercrime\.gov\.in/ })).toHaveCount(0);

    for (const ruleId of ALL_RULES) {
      await expect(page.locator(`#results li[data-rule-id="${ruleId}"]`)).toHaveCount(1);
    }

    // The link keeps its own mark — the whole URL — and that mark is what the
    // credential finding navigates to.
    await expect(
      page.locator(
        'button.lens-mark[data-rule-id="suspicious-link"][data-focus-target-for="credential-request"]',
      ),
    ).toHaveCount(1);
    expect(
      await visibleText(
        page,
        'button.lens-mark[data-rule-id="suspicious-link"][data-focus-target-for="credential-request"]',
      ),
    ).toBe(LINK_TEXT);
    expect(LINK_TEXT).toBe("http://sbi-kyc-verify.online/update");

    // The rule marks both the CTA phrase and the URL, so scoping above matters.
    expect(await page.locator('button.lens-mark[data-rule-id="suspicious-link"]').count()).toBe(2);

    // The six shared characters really are the tail of that mark, and the 31
    // that follow them are the credential finding's evidence beyond it.
    expect(SHARED_TEXT).toBe("update");
    expect(LINK_TEXT.endsWith(SHARED_TEXT)).toBe(true);
    expect(
      await visibleText(
        page,
        'mark.lens-evidence-remainder[data-evidence-for="credential-request"]',
      ),
    ).toBe(REMAINDER_TEXT);
    expect(REMAINDER_TEXT).toBe(" and share the OTP you received");
    expect(LINK_TEXT.length + REMAINDER_TEXT.length).toBe(CREDENTIAL.end - LINK.start);
  });

  test("leaves the displayed message byte-for-byte unchanged", async ({ page }) => {
    await analyze(page);
    expect(await renderedMessage(page)).toBe(MESSAGE);
  });

  test("never makes a message URL clickable", async ({ page }) => {
    await analyze(page);

    const container = page.locator(".whitespace-pre-wrap");
    await expect(container.locator("a")).toHaveCount(0);
    await expect(page.locator('a[href*="sbi-kyc-verify"]')).toHaveCount(0);
    // The URL is present as text, so the check above is not vacuous.
    await expect(container).toContainText("sbi-kyc-verify.online");
  });
});

/* -------------------------------------------------- navigation paths A-D */

test.describe("navigation", () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== "desktop", "desktop project only");
  });

  test("A — a finding with its own mark focuses that mark", async ({ page }) => {
    const errors = watchForPageErrors(page);
    await analyze(page);
    await showInMessage(page, "suspicious-link");

    const focus = await focusInfo(page);
    expect(focus.isMark).toBe(true);
    expect(focus.ruleId).toBe("suspicious-link");
    expect(focus.target).toContain("suspicious-link");
    // Polled: the browser animates the scroll, so this is the settled position.
    await expect.poll(() => focusInViewport(page)).toBe(true);

    // Selection is retained, and the status describes the action.
    await expect(page.locator('#results li[data-rule-id="suspicious-link"]')).toHaveAttribute(
      "data-selected",
      "true",
    );
    expect(await statusText(page)).toContain("Its matches are emphasised");

    await assertNoPageErrors(errors);
  });

  test("B — a partially overlapping finding focuses the shared mark", async ({ page }) => {
    const errors = watchForPageErrors(page);
    await analyze(page);
    await showInMessage(page, "credential-request");

    // Focus lands on the link's mark, not on one of its own: it has none.
    const focus = await focusInfo(page);
    expect(focus.isMark).toBe(true);
    expect(focus.ruleId).toBe("suspicious-link");
    expect(focus.target).toContain("credential-request");
    await expect.poll(() => focusInViewport(page)).toBe(true);

    // The selection stays with the finding the reader chose.
    await expect(
      page.locator('#results li[data-rule-id="credential-request"]'),
    ).toHaveAttribute("data-selected", "true");
    await expect(page.locator('#results li[data-rule-id="suspicious-link"]')).toHaveAttribute(
      "data-selected",
      "false",
    );

    // Both treatments are present at once…
    await expect(page.locator('button.lens-mark[data-emphasis="shared"]')).toHaveCount(1);
    await expect(page.locator('mark.lens-evidence-remainder[data-evidence-for="credential-request"]')).toHaveCount(1);

    // …and the status describes the whole of the evidence honestly.
    const status = await statusText(page);
    expect(status).toContain("Showing Request for an OTP");
    expect(status).toContain("the shared text carries their mark");
    expect(status).toContain("the rest of its evidence is outlined for this finding");
    expect(status).not.toContain("only the overlapping part");

    // The message is still intact after all of that.
    expect(await renderedMessage(page)).toBe(MESSAGE);
    await assertNoPageErrors(errors);
  });

  test("C — every finding on this message has a reachable target", async ({ page }) => {
    const errors = watchForPageErrors(page);
    await analyze(page);

    // The absent-target branch cannot be produced by the interface, so the
    // honest check is the converse: no finding can fail to navigate.
    for (const ruleId of ALL_RULES) {
      await showInMessage(page, ruleId);

      const focus = await focusInfo(page);
      expect(focus.isMark, `${ruleId} did not land on a mark`).toBe(true);
      expect(focus.target, `${ruleId} landed on the wrong target`).toContain(ruleId);

      const status = await statusText(page);
      expect(status, `${ruleId} reported a failed navigation`).not.toContain("could not");
      expect(status).not.toContain("nothing was highlighted");
    }

    await assertNoPageErrors(errors);
  });

  test("D — a detached target fails gracefully, with no unhandled error", async ({ page }) => {
    const errors = watchForPageErrors(page);
    await analyze(page);

    const card = page.locator('#results li[data-rule-id="credential-request"]');
    await card.locator("button[aria-expanded]").first().click();

    // Deterministic simulation of the unreachable branch: remove the node the
    // mark registry still points at. React is not told, so the registry keeps a
    // detached element — exactly the stale-reference case the guard exists for.
    const removed = await page.evaluate(() => {
      const mark = document.querySelector(
        'button.lens-mark[data-focus-target-for="credential-request"]',
      );
      if (!mark) return false;
      mark.remove();
      return true;
    });
    expect(removed).toBe(true);

    await card.getByRole("button", { name: "Show in message" }).click();

    // Reported, not hidden; and nothing unrelated was focused.
    const status = await statusText(page);
    expect(status).toContain("could not be brought into view");
    expect(status).toContain("nothing was highlighted");

    const focus = await focusInfo(page);
    expect(focus.isMark).toBe(false);

    // The selection is still the finding the reader asked for.
    await expect(card).toHaveAttribute("data-selected", "true");

    // No exception escaped, and the panel is still functional afterwards.
    await expect(page.locator("#results").getByText("Message inspector")).toBeVisible();
    await assertNoPageErrors(errors);
  });
});

/* ------------------------------------------------- keyboard and focus */

test.describe("keyboard", () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== "desktop", "desktop project only");
  });

  test("Enter on a mark selects the rule that owns it", async ({ page }) => {
    await analyze(page);

    const mark = page.locator('button.lens-mark[data-rule-id="account-threat"]').first();
    await mark.focus();
    await expect(mark).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page.locator('#results li[data-rule-id="account-threat"]')).toHaveAttribute(
      "data-selected",
      "true",
    );
    await expect(mark).toHaveAttribute("data-emphasis", "selected");
  });

  test("Space on a mark selects the rule that owns it", async ({ page }) => {
    await analyze(page);

    const mark = page.locator('button.lens-mark[data-rule-id="prize-bait"]').first();
    await mark.focus();
    await page.keyboard.press(" ");

    await expect(page.locator('#results li[data-rule-id="prize-bait"]')).toHaveAttribute(
      "data-selected",
      "true",
    );
    await expect(mark).toHaveAttribute("data-emphasis", "selected");
  });

  test("a keyboard-focused mark paints a visible focus ring", async ({ page }) => {
    await analyze(page);

    const mark = page.locator('button.lens-mark[data-rule-id="account-threat"]').first();
    await mark.focus();
    // Reached by script, so focus-visible may not apply until a key is pressed.
    await page.keyboard.press("Tab");
    await mark.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");

    const shadow = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null;
      return element ? getComputedStyle(element).boxShadow : "none";
    });
    expect(shadow).not.toBe("none");
  });

  test("keeps the evidence remainder out of the keyboard path", async ({ page }) => {
    await analyze(page);

    const focusability = await page.evaluate(() => {
      const mark = document.querySelector("button.lens-mark") as HTMLElement | null;
      const remainder = document.querySelector("mark.lens-evidence-remainder") as HTMLElement | null;
      return {
        markTabIndex: mark?.tabIndex ?? null,
        markTag: mark?.tagName.toLowerCase() ?? null,
        remainderTabIndex: remainder?.tabIndex ?? null,
        remainderTag: remainder?.tagName.toLowerCase() ?? null,
        remainderType: remainder?.getAttribute("type") ?? null,
      };
    });

    expect(focusability.markTag).toBe("button");
    expect(focusability.markTabIndex).toBe(0);
    expect(focusability.remainderTag).toBe("mark");
    // -1 means it is not reachable by Tab: it is evidence, not a control.
    expect(focusability.remainderTabIndex).toBe(-1);
    expect(focusability.remainderType).toBeNull();
  });

  test("announces the shared evidence once, and the status once", async ({ page }) => {
    await analyze(page);
    await showInMessage(page, "credential-request");

    // One status region, so the live announcement cannot double up.
    await expect(page.locator("p[role=\"status\"]")).toHaveCount(1);
    // One description of the remainder, however the run is cut up.
    await expect(page.locator("mark.lens-evidence-remainder .sr-only")).toHaveCount(1);
    const described = await page.locator("mark.lens-evidence-remainder .sr-only").innerText();
    expect(described).toContain("also evidence for");
    expect(described).toContain("Request for an OTP");
  });
});

/* ------------------------------------------------------------ visual states */

test.describe("visual states", () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== "desktop", "desktop project only");
  });

  test("separates the four states by shape, not only by colour", async ({ page }) => {
    // A state is identified by everything it paints with, so two states pass
    // only if they are distinguishable at all — the requirement — rather than
    // because one particular property happens to differ.
    const WITNESS = ["borderTopStyle", "borderBottomStyle", "fontWeight", "backgroundColor"];
    const signature = async (selector: string) =>
      JSON.stringify(await computedStyle(page, selector, WITNESS));

    await analyze(page);

    const plain = await signature('button.lens-mark[data-emphasis="none"]');
    const related = await signature("mark.lens-evidence-remainder");
    expect(plain).not.toBe(related);

    // Neither state relies on colour alone: one is dotted, the other dashed.
    expect(await computedStyle(page, 'button.lens-mark[data-emphasis="none"]', [
      "borderBottomStyle",
    ])).toEqual({ borderBottomStyle: "dotted" });
    expect(await computedStyle(page, "mark.lens-evidence-remainder", [
      "borderTopStyle",
    ])).toEqual({ borderTopStyle: "dashed" });

    await showInMessage(page, "credential-request");

    // The shared mark replaces a plain one, so it must not look like one.
    expect(await computedStyle(page, 'button.lens-mark[data-emphasis="shared"]', [
      "borderBottomStyle",
    ])).toEqual({ borderBottomStyle: "double" });
    expect(await computedStyle(page, 'mark.lens-evidence-remainder[data-evidence-emphasis="selected"]', [
      "borderTopStyle",
    ])).toEqual({ borderTopStyle: "solid" });

    expect(await signature('button.lens-mark[data-emphasis="shared"]')).not.toBe(plain);
    expect(
      await signature('mark.lens-evidence-remainder[data-evidence-emphasis="selected"]'),
    ).not.toBe(related);
  });

  test("weights the selected mark so it reads without its ring", async ({ page }) => {
    await analyze(page);
    await showInMessage(page, "account-threat");

    const selected = await computedStyle(page, 'button.lens-mark[data-emphasis="selected"]', [
      "fontWeight",
      "boxShadow",
    ]);
    const plain = await computedStyle(page, 'button.lens-mark[data-emphasis="none"]', [
      "fontWeight",
      "boxShadow",
    ]);

    expect(Number(selected?.fontWeight)).toBeGreaterThan(Number(plain?.fontWeight));
    expect(plain?.boxShadow).not.toBe(selected?.boxShadow);
  });

  test("captures the states for human review", async ({ page }) => {
    // Captured, not compared: no automated visual diff runs here.
    await analyze(page);
    await showInMessage(page, "credential-request");
    await page.locator("#results").screenshot({ path: "e2e/screenshots/desktop-shared-and-remainder.png" });

    await showInMessage(page, "urgency-pressure");
    await page.locator("#results").screenshot({ path: "e2e/screenshots/desktop-selected-mark.png" });
  });
});

/* -------------------------------------------------------- reduced motion */

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test.beforeEach(() => {
    test.skip(test.info().project.name !== "desktop", "desktop project only");
  });

  test("shows the proposed plan sections without motion", async ({ page }) => {
    await page.goto("/");
    await page.locator("#pricing").scrollIntoViewIfNeeded();

    await expect(
      page.getByRole("heading", { name: "Protection for Every Level" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Power Your Product with TrustLens API" }),
    ).toBeVisible();

    const opacity = () =>
      page.evaluate(() => {
        const heading = [...document.querySelectorAll("h2")].find((element) =>
          element.textContent?.includes("Protection for Every Level"),
        );
        let node: Element | null = heading ?? null;
        let lowest = 1;
        while (node) {
          lowest = Math.min(lowest, Number(getComputedStyle(node).opacity));
          node = node.parentElement;
        }
        return lowest;
      });
    // The page-level fade still runs; poll until it has settled at 1.
    await expect.poll(opacity).toBe(1);
  });

  test("drops the pulse animation and the transitions", async ({ page }) => {
    await analyze(page);
    expect(
      await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches),
    ).toBe(true);

    await showInMessage(page, "credential-request");

    const styles = await computedStyle(page, 'button.lens-mark[data-emphasis="shared"]', [
      "transitionDuration",
      "animationName",
    ]);

    // The pulse keyframes are inside a no-preference query, so nothing animates.
    expect(styles?.animationName).toBe("none");
    expect(styles?.transitionDuration).toBe("0s");
  });
});

/* ------------------------------------------- proposed plans and the API */

test.describe("proposed plans and the illustrative API", () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== "desktop", "desktop project only");
  });

  test("reaches pricing from the header and renders all three plans", async ({ page }) => {
    const errors = watchForPageErrors(page);
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "Pricing" })
      .click();

    await expect(
      page.getByRole("heading", { level: 2, name: "Protection for Every Level" }),
    ).toBeVisible();
    await expect(page.locator("[data-plan]")).toHaveCount(3);
    await expect(page.locator('[data-plan="premium"]')).toContainText("Most Popular");
    await expect(page.locator('[data-plan="premium"]')).toContainText("₹99");
    await expect(page.locator('[data-plan="business"]')).toContainText("₹2,999");

    // The heading is a real h2 inside the pricing section, not a styled div.
    const headingInsideSection = await page.evaluate(() => {
      const section = document.querySelector("#pricing");
      const heading = section?.querySelector("h2");
      return heading?.textContent?.trim() ?? null;
    });
    expect(headingInsideSection).toBe("Protection for Every Level");

    await assertNoPageErrors(errors);
  });

  test("Try Free moves the reader to the working analyzer", async ({ page }) => {
    await page.goto("/#pricing");
    await page.getByRole("link", { name: "Try Free" }).click();

    const textarea = page.getByLabel("Your message");
    await expect(textarea).toBeInViewport();
    await expect(
      page.getByRole("button", { name: "Analyze Message" }),
    ).toBeInViewport();
  });

  test("Coming Soon explains the plan and never starts a checkout", async ({ page }) => {
    const errors = watchForPageErrors(page);
    await page.goto("/#pricing");

    const premium = page.locator('[data-plan="premium"]');
    await premium.getByRole("button", { name: "Coming Soon" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Premium is a proposed plan");
    await expect(dialog).toContainText(
      "Subscriptions and payment processing are not currently active.",
    );
    await expect(dialog).toContainText("no subscription or payment flow exists yet");
    await expect(dialog.locator("input")).toHaveCount(0);

    // Two "Close" controls exist: the footer button and the icon button.
    await dialog.getByRole("button", { name: "Close" }).first().click();
    await expect(dialog).toBeHidden();
    await assertNoPageErrors(errors);
  });

  test("the paid-plan button is reachable and operable by keyboard", async ({ page }) => {
    await page.goto("/#pricing");

    await page.getByRole("link", { name: "Try Free" }).focus();
    await page.keyboard.press("Tab");

    const focusedText = await page.evaluate(
      () => document.activeElement?.textContent?.trim() ?? "",
    );
    expect(focusedText).toBe("Coming Soon");

    const focusPaint = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null;
      if (!element) return null;
      const style = getComputedStyle(element);
      return { boxShadow: style.boxShadow, outlineStyle: style.outlineStyle };
    });
    expect(focusPaint?.boxShadow ?? "none").not.toBe("none");

    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("the API section is visibly illustrative and its CTA is honest", async ({ page }) => {
    const errors = watchForPageErrors(page);
    const apiRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/v1/analyze")) apiRequests.push(request.url());
    });

    await page.goto("/#api");
    await expect(
      page.getByRole("heading", { name: "Power Your Product with TrustLens API" }),
    ).toBeVisible();
    await expect(page.locator("#api")).toContainText(
      "Illustrative example — not a live endpoint.",
    );
    await expect(page.locator("#api")).toContainText("YOUR_API_KEY");
    await expect(page.locator("[data-api-plan]")).toHaveCount(3);
    await expect(page.locator("#api")).toContainText("Proposed");

    await page.getByRole("button", { name: "Explore API Plans — Coming Soon" }).click();

    await expect(page.getByRole("status")).toBeVisible();
    await expect(page.getByRole("status")).toContainText(
      "API access is planned, not available",
    );
    await expect(page.locator("#api-plans")).toBeInViewport();
    expect(apiRequests).toEqual([]);

    await assertNoPageErrors(errors);
  });

  test("keeps proposed-plan text at a readable contrast", async ({ page }) => {
    await page.goto("/#pricing");
    await page.locator("#pricing").scrollIntoViewIfNeeded();

    const ratios = await page.evaluate(() => {
      type Rgba = { r: number; g: number; b: number; a: number };
      // Computed colours are oklch()/color(srgb ...), not rgb(), so resolve
      // each one through a canvas rather than parsing the string.
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      const parse = (value: string): Rgba => {
        if (!context) return { r: 0, g: 0, b: 0, a: 0 };
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = "#000";
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        const data = context.getImageData(0, 0, 1, 1).data;
        return { r: data[0], g: data[1], b: data[2], a: data[3] / 255 };
      };
      const over = (top: Rgba, bottom: Rgba): Rgba => ({
        r: top.r * top.a + bottom.r * (1 - top.a),
        g: top.g * top.a + bottom.g * (1 - top.a),
        b: top.b * top.a + bottom.b * (1 - top.a),
        a: top.a + bottom.a * (1 - top.a),
      });
      const luminance = (color: Rgba) => {
        const channel = (value: number) => {
          const c = value / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
      };
      const contrast = (element: Element) => {
        const layers: Rgba[] = [];
        let node: Element | null = element;
        while (node) {
          const color = parse(getComputedStyle(node).backgroundColor);
          if (color.a > 0) layers.push(color);
          if (color.a >= 0.99) break;
          node = node.parentElement;
        }
        let background: Rgba = { r: 255, g: 255, b: 255, a: 1 };
        for (let index = layers.length - 1; index >= 0; index -= 1) {
          background = over(layers[index], background);
        }
        const foreground = over(parse(getComputedStyle(element).color), background);
        const a = luminance(foreground);
        const b = luminance(background);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      };

      const pick = (selector: string) => {
        const element = document.querySelector(selector);
        return element ? Number(contrast(element).toFixed(2)) : null;
      };

      return {
        audience: pick('[data-plan="premium"] p'),
        feature: pick('[data-plan="premium"] li span'),
        disclosure: pick("#pricing .max-w-3xl p"),
        apiPlanText: pick('[data-api-plan="startup"] p'),
        code: pick("#api pre span"),
      };
    });

    for (const [name, ratio] of Object.entries(ratios)) {
      expect(ratio, `${name} has no measurable contrast`).not.toBeNull();
      expect(ratio ?? 0, `${name} contrast`).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("keeps the new sections inside the viewport", async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto("/");
    await page.locator("#pricing").scrollIntoViewIfNeeded();

    const tabletCards = await page.locator("[data-plan]").evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { x: Math.round(rect.x), y: Math.round(rect.y) };
      }),
    );
    // 820px lands on the two-column tablet layout: the third card wraps.
    expect(tabletCards).toHaveLength(3);
    expect(tabletCards[0].y).toBe(tabletCards[1].y);
    expect(tabletCards[2].y).toBeGreaterThan(tabletCards[1].y);
    expect(tabletCards[2].x).toBe(tabletCards[0].x);

    await page.locator("#api-plans").scrollIntoViewIfNeeded();

    const geometry = await page.evaluate(() => ({
      pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
      codePanelOverflow: [...document.querySelectorAll("#api pre")].map(
        (pre) => pre.scrollWidth - pre.clientWidth,
      ),
    }));

    expect(geometry.pageOverflow).toBeLessThanOrEqual(0);
    // A code line may scroll inside its own panel; it must not widen the page.
    expect(geometry.codePanelOverflow.length).toBeGreaterThan(0);

    // At the lg breakpoint the five-link navigation appears; it must still fit.
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    const navOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(navOverflow).toBeLessThanOrEqual(1);
    await expect(
      page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Pricing" }),
    ).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/#api");
    const desktopOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(desktopOverflow).toBeLessThanOrEqual(1);
  });
});

/* ------------------------------------------------------- narrow viewport */

test.describe("narrow viewport", () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== "mobile", "mobile project only");
  });

  test("reveals the report panel instead of leaving it invisible", async ({ page }) => {
    // Regression: the reveal used `amount: 0.2`, a fraction of the *element*.
    // The panel is ~4700px tall at this width against an 844px viewport, so the
    // highest reachable ratio is ~0.18 and the fade could never play — leaving
    // the entire report at opacity 0 for good.
    //
    // Intermittent by nature: the small empty placeholder does satisfy the old
    // threshold, so the bug only bit when that placeholder was never in view
    // before the tall report replaced it. Against the old code this test failed
    // roughly one run in three, and it caught the defect on the suite's first
    // real run. The obvious way to *guarantee* the failure — parking the
    // viewport at the foot of the page — backfires, because the foot of the page
    // is where the placeholder lives, so it fires the observer instead.
    await analyze(page);

    const lowestOpacity = () =>
      page.evaluate(() => {
        let node = document.querySelector("#results .lens-mark") as HTMLElement | null;
        let lowest = 1;
        while (node) {
          lowest = Math.min(lowest, Number(getComputedStyle(node).opacity));
          node = node.parentElement;
        }
        return lowest;
      });
    // Polled, because the fade has to finish: an in-flight 0.69 is not proof.
    await expect.poll(lowestOpacity).toBe(1);
  });

  test("lays out the report without horizontal overflow", async ({ page }) => {
    await analyze(page);

    // The removal holds at the narrow viewport too.
    const report = page.locator("#results");
    await expect(report.getByRole("heading", { name: "What to do next" })).toHaveCount(0);
    await expect(report.getByText("Relevant to this message")).toHaveCount(0);
    await expect(report.getByText("Reporting in India")).toHaveCount(0);
    await expect(report.getByRole("checkbox")).toHaveCount(0);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);

    // The evidence and its remainder are both still rendered and visible.
    await expect(page.locator('button.lens-mark[data-focus-target-for="credential-request"]')).toBeVisible();
    await expect(page.locator("mark.lens-evidence-remainder")).toBeVisible();
  });

  test("navigates to the shared mark inside the narrow viewport", async ({ page }) => {
    const errors = watchForPageErrors(page);
    await analyze(page);
    await showInMessage(page, "credential-request");

    const focus = await focusInfo(page);
    expect(focus.isMark).toBe(true);
    await expect.poll(() => focusInViewport(page)).toBe(true);
    expect(await renderedMessage(page)).toBe(MESSAGE);

    await page.locator("#results").screenshot({ path: "e2e/screenshots/mobile-shared-and-remainder.png" });
    await assertNoPageErrors(errors);
  });

  test("keeps highlighted runs inside the message column", async ({ page }) => {
    await analyze(page);

    const geometry = await page.evaluate(() => {
      const container = document.querySelector(".whitespace-pre-wrap");
      if (!container) return null;
      const bounds = container.getBoundingClientRect();
      const panel = container.parentElement;
      const runs = [...document.querySelectorAll("button.lens-mark, mark.lens-evidence-remainder")];
      // How far each run reaches past the text column, in either direction.
      const overhangs = runs.map((run) => {
        const rect = run.getBoundingClientRect();
        return Math.max(bounds.left - rect.left, rect.right - bounds.right);
      });
      return {
        runs: runs.length,
        worstOverhang: Math.round(Math.max(...overhangs) * 10) / 10,
        panelOverflow: panel ? panel.scrollWidth - panel.clientWidth : null,
        pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
      };
    });

    expect(geometry?.runs ?? 0).toBeGreaterThan(4);

    // Nothing scrolls sideways, in the page or inside the panel.
    expect(geometry?.pageOverflow ?? 1).toBeLessThanOrEqual(0);
    expect(geometry?.panelOverflow ?? 1).toBeLessThanOrEqual(0);

    // A run may still hang by at most one preserved space (`pre-wrap` keeps the
    // space that follows a mark, and it hangs rather than breaks the line).
    // Measured at 6px here: one mono space plus the mark's 2.4px inline padding.
    expect(geometry?.worstOverhang ?? 99).toBeLessThanOrEqual(8);
  });
});

/* ---------------------------------- narrow viewport: plans and the API */

test.describe("narrow viewport — plans and API", () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== "mobile", "mobile project only");
  });

  test("stacks the pricing cards and keeps the page inside the viewport", async ({ page }) => {
    const errors = watchForPageErrors(page);
    await page.goto("/");
    await page.locator("#pricing").scrollIntoViewIfNeeded();

    await expect(page.locator("[data-plan]")).toHaveCount(3);
    const boxes = await page.locator("[data-plan]").evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
        };
      }),
    );

    expect(new Set(boxes.map((box) => box.x)).size).toBe(1);
    expect(boxes[0].y).toBeLessThan(boxes[1].y);
    expect(boxes[1].y).toBeLessThan(boxes[2].y);
    expect(boxes.every((box) => box.width > 250)).toBe(true);

    const pricingOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(pricingOverflow).toBeLessThanOrEqual(1);

    await page.locator("#api").scrollIntoViewIfNeeded();
    await expect(
      page.getByRole("heading", { name: "Power Your Product with TrustLens API" }),
    ).toBeVisible();
    await expect(page.locator("[data-api-plan]")).toHaveCount(3);

    const apiOverflow = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth - window.innerWidth,
      panels: [...document.querySelectorAll("#api pre")].map((pre) => ({
        client: pre.clientWidth,
        scroll: pre.scrollWidth,
      })),
    }));
    expect(apiOverflow.page).toBeLessThanOrEqual(1);
    expect(apiOverflow.panels.length).toBeGreaterThan(0);

    await page.getByRole("button", { name: "Explore API Plans — Coming Soon" }).click();
    await expect(page.getByRole("status")).toContainText(
      "API access is planned, not available",
    );
    await assertNoPageErrors(errors);
  });
});
