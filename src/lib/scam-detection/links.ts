import { mergeRanges } from "./normalize";
import type { AnalyzedLink, LinkIndicator, TextRange } from "./types";

/**
 * Lightweight, fully offline URL heuristics.
 *
 * These checks never resolve a hostname, never contact the URL, and never look
 * up reputation or registration data. They only look at the shape of the
 * address, so every indicator is indicative rather than conclusive.
 */

/** Hosts that hide the real destination behind a redirect. */
const SHORTENER_HOSTS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "is.gd",
  "v.gd",
  "ow.ly",
  "buff.ly",
  "rb.gy",
  "cutt.ly",
  "shorturl.at",
  "rebrand.ly",
  "tiny.cc",
  "s.id",
  "bit.do",
  "clck.ru",
  "t.ly",
  "urlz.fr",
  "shrtco.de",
  "bl.ink",
  "short.gy",
  "ulvis.net",
  "1url.com",
]);

/** TLDs with a high historical share of abuse. Treated as a weak signal only. */
const HIGH_RISK_TLDS = new Set([
  "zip",
  "mov",
  "top",
  "xyz",
  "click",
  "link",
  "icu",
  "gq",
  "tk",
  "ml",
  "cf",
  "ga",
  "cfd",
  "sbs",
  "quest",
  "monster",
  "buzz",
  "rest",
  "cam",
  "lol",
  "bar",
  "work",
  "online",
  "site",
  "live",
  "shop",
  "store",
  "club",
  "info",
]);

/**
 * A deliberately small starter list of frequently impersonated brands and the
 * domains those organisations actually publish. Matching is on whole
 * hyphen/dot-separated segments, which keeps false positives down.
 *
 * This list does not verify ownership — it only notices when an address
 * borrows a brand name without ending in that brand's published domain.
 */
const BRAND_TOKENS: ReadonlyArray<{ token: string; official: readonly string[] }> = [
  { token: "sbi", official: ["sbi.co.in", "onlinesbi.sbi", "onlinesbi.com", "sbicard.com"] },
  { token: "hdfc", official: ["hdfcbank.com", "hdfc.com", "hdfclife.com"] },
  { token: "icici", official: ["icicibank.com", "icicibank.co.in"] },
  { token: "axis", official: ["axisbank.com", "axisbank.in"] },
  { token: "kotak", official: ["kotak.com", "kotakbank.com"] },
  { token: "pnb", official: ["pnbindia.in", "netpnb.com"] },
  { token: "canara", official: ["canarabank.com"] },
  { token: "indusind", official: ["indusind.com"] },
  { token: "idfc", official: ["idfcfirstbank.com"] },
  { token: "yesbank", official: ["yesbank.in"] },
  { token: "paytm", official: ["paytm.com", "paytmbank.com"] },
  { token: "phonepe", official: ["phonepe.com"] },
  { token: "paypal", official: ["paypal.com"] },
  { token: "amazon", official: ["amazon.in", "amazon.com"] },
  { token: "flipkart", official: ["flipkart.com"] },
  { token: "netflix", official: ["netflix.com"] },
  { token: "irctc", official: ["irctc.co.in"] },
  { token: "uidai", official: ["uidai.gov.in"] },
  { token: "aadhaar", official: ["uidai.gov.in"] },
  { token: "epfo", official: ["epfindia.gov.in"] },
  { token: "incometax", official: ["incometax.gov.in"] },
  { token: "dhl", official: ["dhl.com"] },
  { token: "fedex", official: ["fedex.com"] },
  { token: "indiapost", official: ["indiapost.gov.in"] },
  { token: "jio", official: ["jio.com"] },
  { token: "airtel", official: ["airtel.in"] },
  { token: "whatsapp", official: ["whatsapp.com"] },
  { token: "microsoft", official: ["microsoft.com"] },
  { token: "apple", official: ["apple.com"] },
  { token: "instagram", official: ["instagram.com"] },
  { token: "linkedin", official: ["linkedin.com"] },
];

/** URLs that carry their own scheme, or start with `www.`. */
const PROTOCOL_URL_PATTERN = new RegExp(
  String.raw`\b(?:https?:\/\/|www\.)[^\s<>"'\`]+`,
  "gi",
);

/** Bare hostnames such as `sbi-kyc-verify.online/update`. */
const BARE_DOMAIN_PATTERN = new RegExp(
  String.raw`\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.(?:${[
    "com",
    "net",
    "org",
    "info",
    "biz",
    "online",
    "site",
    "shop",
    "store",
    "xyz",
    "top",
    "club",
    "live",
    "icu",
    "link",
    "click",
    "work",
    "app",
    "dev",
    "io",
    "co",
    "in",
    "ru",
    "tk",
    "ml",
    "ga",
    "cf",
    "gq",
    "zip",
    "mov",
    "sbs",
    "quest",
    "cam",
    "rest",
    "buzz",
    "monster",
    "lol",
    "bar",
    "sbi",
    "gov",
    "gov.in",
  ].join("|")})(?:\/[^\s<>"'\`]*)?`,
  "gi",
);

const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"]+$/;
const MAX_LINKS = 40;

function findCandidates(
  message: string,
  pattern: RegExp,
): Array<{ range: TextRange; text: string }> {
  const results: Array<{ range: TextRange; text: string }> = [];
  let regex: RegExp;
  try {
    regex = new RegExp(pattern.source, pattern.flags);
  } catch {
    return results;
  }

  let match: RegExpExecArray | null;
  while ((match = regex.exec(message)) !== null) {
    if (match[0].length === 0) {
      regex.lastIndex += 1;
      continue;
    }

    // Strip sentence punctuation that the greedy match swallowed.
    const text = match[0].replace(TRAILING_PUNCTUATION, "");
    if (text.length > 0) {
      results.push({
        range: { start: match.index, end: match.index + text.length },
        text,
      });
    }
    if (results.length >= MAX_LINKS) break;
  }
  return results;
}

function isIpv4Host(host: string): boolean {
  const parts = host.split(".");
  if (parts.length !== 4) return false;
  return parts.every(
    (part) => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255,
  );
}

/** Parses a hostname defensively; returns null instead of throwing. */
function parseHost(rawUrl: string): string | null {
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(rawUrl)
    ? rawUrl
    : `http://${rawUrl.replace(/^www\./i, "")}`;

  try {
    const parsed = new URL(withScheme);
    const host = parsed.hostname.toLowerCase();
    return host.length > 0 ? host : null;
  } catch {
    const withoutScheme = withScheme.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
    const authority = withoutScheme.split(/[/?#]/)[0] ?? "";
    const candidate = authority.split("@").pop()?.split(":")[0]?.toLowerCase() ?? "";
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(candidate) ? candidate : null;
  }
}

function authorityOf(rawUrl: string): string {
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(rawUrl)
    ? rawUrl
    : `http://${rawUrl}`;
  return withScheme.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").split(/[/?#]/)[0] ?? "";
}

function hostSegments(host: string): string[] {
  return host.split(/[.-]/).filter((segment) => segment.length > 0);
}

function isPublishedDomain(host: string, official: readonly string[]): boolean {
  return official.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
}

let cachedBrandSegments: Set<string> | null = null;
function allBrandSegments(): Set<string> {
  if (!cachedBrandSegments) {
    cachedBrandSegments = new Set(BRAND_TOKENS.map((brand) => brand.token));
  }
  return cachedBrandSegments;
}

/** Swaps the characters that are commonly substituted for letters. */
function deobfuscate(host: string): string {
  return host
    .replace(/0/g, "o")
    .replace(/1/g, "l")
    .replace(/3/g, "e")
    .replace(/5/g, "s")
    .replace(/4/g, "a")
    .replace(/rn/g, "m");
}

function hostIndicators(host: string, rawUrl: string): LinkIndicator[] {
  const indicators: LinkIndicator[] = [];
  const segments = hostSegments(host);
  const labels = host.split(".");
  const tld = labels.length > 1 ? (labels[labels.length - 1] ?? "") : "";

  if (isIpv4Host(host) || host.startsWith("[")) {
    indicators.push({
      id: "raw-ip-address",
      strength: "strong",
      label: "Numeric IP address",
      explanation:
        "The link points at a bare numeric address instead of a named website. Organisations normally publish services on a domain name, so this is worth treating with suspicion.",
    });
  }

  if (host.startsWith("xn--") || labels.some((label) => label.startsWith("xn--"))) {
    indicators.push({
      id: "punycode-domain",
      strength: "strong",
      label: "Encoded international domain",
      explanation:
        "The domain uses an encoded form that can display as ordinary letters while pointing somewhere else entirely. This technique is used to imitate real brands.",
    });
  }

  if (authorityOf(rawUrl).includes("@")) {
    indicators.push({
      id: "userinfo-trick",
      strength: "strong",
      label: "Misleading address structure",
      explanation:
        "The address contains an “@” before the domain, which lets the visible part of a link differ from the site you would actually reach.",
    });
  }

  if (SHORTENER_HOSTS.has(host.replace(/^www\./, ""))) {
    indicators.push({
      id: "url-shortener",
      strength: "strong",
      label: "Shortened link",
      explanation:
        "Link shorteners hide the real destination until the link is opened, which is why they appear so often in scam messages.",
    });
  }

  if (/\.apk\b/i.test(rawUrl) || /\.apk($|\?)/i.test(host)) {
    indicators.push({
      id: "app-download-link",
      strength: "strong",
      label: "Application download link",
      explanation:
        "The link points at an installable application file rather than a web page. Apps installed this way bypass official stores, where they would normally be checked.",
    });
  }

  for (const brand of BRAND_TOKENS) {
    if (!segments.includes(brand.token)) continue;
    if (isPublishedDomain(host, brand.official)) continue;
    indicators.push({
      id: "lookalike-domain",
      strength: "strong",
      label: `Imitates “${brand.token}”`,
      explanation: `The address uses the name “${brand.token}” but does not end in that organisation's published domain (${brand.official[0]}). It may be imitating the real site.`,
    });
    break;
  }

  const cleaned = deobfuscate(host);
  if (cleaned !== host) {
    const cleanedSegments = new Set(hostSegments(cleaned));
    const newlyRevealed = [...allBrandSegments()].find(
      (token) => cleanedSegments.has(token) && !segments.includes(token),
    );
    if (newlyRevealed) {
      indicators.push({
        id: "character-substitution",
      strength: "strong",
        label: "Letters swapped for lookalikes",
        explanation: `Replacing lookalike characters in the address reveals the name “${newlyRevealed}”. Substituting characters like 1 for “l” or 0 for “o” is a common way to fake a brand's address.`,
      });
    }
  }

  if (HIGH_RISK_TLDS.has(tld)) {
    indicators.push({
      id: "high-risk-tld",
      label: `Uncommon domain ending (.${tld})`,
      explanation: `The address ends in “.${tld}”, an ending that appears far more often in bulk scam campaigns than in everyday business correspondence. On its own this proves nothing.`,
      strength: "weak",
    });
  }

  const hyphenCount = (host.match(/-/g) ?? []).length;
  if (hyphenCount >= 2) {
    indicators.push({
      id: "hyphenated-domain",
      label: "Heavily hyphenated domain",
      explanation:
        "The domain string is built from several hyphenated words, a pattern typical of throwaway domains registered to imitate a service.",
      strength: "weak",
    });
  }

  if (labels.length >= 4) {
    indicators.push({
      id: "deep-subdomain",
      label: "Deeply nested address",
      explanation:
        "The address stacks several subdomains before the real domain, which is often used to push a brand name into the part people read first.",
      strength: "weak",
    });
  }

  if (host.length >= 30) {
    indicators.push({
      id: "long-host",
      label: "Unusually long address",
      explanation:
        "The domain is longer than most published addresses, which is common in lookalike domains.",
      strength: "weak",
    });
  }

  if ((host.match(/\d/g) ?? []).length >= 4) {
    indicators.push({
      id: "digit-heavy-host",
      label: "Digit-heavy domain",
      explanation:
        "The domain mixes in a large number of digits, which is more typical of automatically generated addresses than of official ones.",
      strength: "weak",
    });
  }

  return indicators;
}

function analyzeLink(
  url: string,
  range: TextRange,
  host: string | null,
  indicators: LinkIndicator[],
): AnalyzedLink {
  const strongCount = indicators.filter((item) => item.strength === "strong").length;
  const weakCount = indicators.length - strongCount;

  return {
    url,
    host,
    start: range.start,
    end: range.end,
    indicators,
    // One strong signal is enough; weak signals must stack up before they count,
    // which keeps ordinary links from being flagged.
    suspicious: strongCount >= 1 || weakCount >= 2,
  };
}

/**
 * Extracts every URL-looking string from the message and runs the offline
 * heuristics over it. Invalid input is tolerated: nothing here throws and no
 * network request is ever made.
 */
export function extractLinks(message: string): AnalyzedLink[] {
  if (!message) return [];

  const primaryHits = findCandidates(message, PROTOCOL_URL_PATTERN);
  const occupied = mergeRanges(primaryHits.map((hit) => hit.range));

  const secondaryHits = findCandidates(message, BARE_DOMAIN_PATTERN).filter(
    (hit) =>
      !occupied.some(
        (range) => hit.range.start < range.end && hit.range.end > range.start,
      ),
  );

  return [...primaryHits, ...secondaryHits]
    .sort((a, b) => a.range.start - b.range.start)
    .map((hit) => {
      const host = parseHost(hit.text);
      const indicators = host ? hostIndicators(host, hit.text) : [];
      return analyzeLink(hit.text, hit.range, host, indicators);
    });
}
