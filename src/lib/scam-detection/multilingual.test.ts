import { describe, expect, it } from "bun:test";
import { analyzeMessage } from "./engine";
import { detectLanguage } from "./language";
import type { ScamAnalysis } from "./types";

/**
 * Behavioural tests for the multilingual foundation.
 *
 * They exercise the shipped detector through `analyzeMessage()`. Nothing here
 * changes a rule at runtime, and nothing performs I/O.
 */

function finding(analysis: ScamAnalysis, ruleId: string) {
  return analysis.findings.find((entry) => entry.ruleId === ruleId);
}

const SUSPICIOUS = [
  {
    name: "English",
    sentence:
      "Your account will be blocked today. Share your OTP immediately.",
  },
  {
    name: "Hindi",
    sentence: "आपका खाता आज बंद कर दिया जाएगा। अपना OTP तुरंत बताएं।",
  },
  {
    name: "Marathi",
    sentence: "तुमचे खाते आज बंद केले जाईल. तुमचा OTP लगेच सांगा.",
  },
  {
    name: "Hinglish",
    sentence: "Aaj tumhara account block ho jayega. Apna OTP turant share karo.",
  },
] as const;

describe("the four supplied examples", () => {
  for (const example of SUSPICIOUS) {
    it(`${example.name} is flagged High with the three expected rules`, () => {
      const analysis = analyzeMessage(example.sentence);

      expect(analysis.riskLevel).toBe("high");
      expect(analysis.score).toBeGreaterThanOrEqual(60);
      expect(analysis.matchedRuleIds).toContain("urgency-pressure");
      expect(analysis.matchedRuleIds).toContain("account-threat");
      expect(analysis.matchedRuleIds).toContain("credential-request");
      expect(analysis.findings.length).toBe(3);
    });
  }
});

describe("legitimate examples do not become findings", () => {
  const legitimate = [
    {
      name: "English bank confirmation",
      sentence:
        "Your bank sent a one-time password to your registered number. Never share this code with anyone.",
      language: "en",
    },
    {
      name: "English password discussion",
      sentence:
        "I changed my account password last week and turned on two-factor authentication.",
      language: "en",
    },
    {
      name: "English expired code",
      sentence:
        "The verification code I requested has expired. I will generate a new one at my desk.",
      language: "en",
    },
    {
      name: "English link",
      sentence:
        "Here is the staff handbook: https://college.example/handbook. Let me know if it does not open.",
      language: "en",
    },
    {
      name: "English scam-awareness note",
      sentence:
        "Scammers often pretend to be your bank. Never share an OTP or password, and call the number on your card.",
      language: "en",
    },
    {
      name: "Hindi code delivery",
      sentence: "आपका OTP भेज दिया गया है। यह कोड किसी के साथ साझा न करें।",
      language: "hi",
    },
    {
      name: "Hindi password discussion",
      sentence: "मैंने कल अपना पासवर्ड बदल दिया है। नया पासवर्ड मेरे पास सुरक्षित है।",
      language: "hi",
    },
    {
      name: "Hindi link",
      sentence: "कॉलेज का टाइम टेबल इस लिंक पर उपलब्ध है: https://college.example/timetable",
      language: "hi",
    },
    {
      name: "Marathi code delivery",
      sentence: "तुमचा OTP पाठवला आहे. हा कोड कोणालाही सांगू नका.",
      language: "mr",
    },
    {
      name: "Marathi password discussion",
      sentence: "मी काल माझा पासवर्ड बदलला. नवीन पासवर्ड माझ्याकडे सुरक्षित आहे.",
      language: "mr",
    },
    {
      name: "Marathi scam-awareness note",
      sentence:
        "आमच्या कार्यशाळेत ठग OTP कसे मागतात हे सांगितले जाईल. तुमचा OTP कोणालाही देऊ नका.",
      language: "mr",
    },
    {
      name: "Hinglish code delivery",
      sentence:
        "Aapka OTP bhej diya gaya hai. Yeh code kisi ke saath share mat karo.",
      language: "hinglish",
    },
    {
      name: "Hinglish password discussion",
      sentence:
        "Maine kal apna password badal diya. Naya password mere paas safe hai.",
      language: "hinglish",
    },
    {
      name: "Hinglish link",
      sentence:
        "College ka timetable is link par hai: https://college.example/timetable",
      language: "hinglish",
    },
  ] as const;

  for (const example of legitimate) {
    it(`${example.name} stays out of the credential rule`, () => {
      const analysis = analyzeMessage(example.sentence);

      expect(finding(analysis, "credential-request")).toBeUndefined();
      expect(analysis.riskLevel).toBe("low");
      expect(detectLanguage(example.sentence).code).toBe(example.language);
    });
  }
});

describe("language identification limits", () => {
  it("labels clear Devanagari Hindi and Marathi separately", () => {
    const hindi = detectLanguage("आपका खाता बंद हो जाएगा और तुरंत सूचना दें।");
    const marathi = detectLanguage("तुमचे खाते बंद होईल, लगेच सांगा.");

    expect(hindi.code).toBe("hi");
    expect(marathi.code).toBe("mr");
  });

  it("reports uncertain or mixed when Devanagari evidence is thin", () => {
    const ambiguous = detectLanguage("यह एक सामान्य संदेश है।");

    expect(["mixed", "uncertain"]).toContain(ambiguous.code);
    expect(ambiguous.confidence).toBe("low");
    expect(ambiguous.note).toContain("Devanagari");
  });

  it("reports a mixed script when Hindi and Latin text are combined", () => {
    const mixed = detectLanguage("आपका account बंद हो जाएगा। तुरंत OTP भेजें।");

    expect(mixed.code).toBe("hi");
    expect(mixed.script).toBe("mixed");
    expect(mixed.label).toContain("mixed script");
  });

  it("recognises Hinglish without treating every English sentence as Hinglish", () => {
    expect(
      detectLanguage("Aaj tumhara account block ho jayega. Apna OTP turant share karo.")
        .code,
    ).toBe("hinglish");
    expect(
      detectLanguage("Your account will be blocked today. Share your OTP immediately.")
        .code,
    ).toBe("en");
  });

  it("returns a low-confidence label rather than inventing an identification", () => {
    const short = detectLanguage("ok");
    const empty = detectLanguage("   ");

    expect(short.code).toBe("en");
    expect(short.confidence).toBe("low");
    expect(empty.code).toBe("uncertain");
    expect(empty.script).toBe("none");
  });
});

describe("evidence integrity", () => {
  it("keeps every Devanagari occurrence pointing at the original text", () => {
    const message = "आपका खाता आज बंद कर दिया जाएगा। अपना OTP तुरंत बताएं।";
    const analysis = analyzeMessage(message);

    for (const entry of analysis.findings) {
      expect(entry.occurrences.length).toBeGreaterThan(0);
      for (const range of entry.occurrences) {
        const slice = message.slice(range.start, range.end);
        expect(slice.length).toBeGreaterThan(0);
        expect(entry.matchedPhrases).toContain(slice);
      }
    }
  });

  it("counts repeated Devanagari evidence once per rule", () => {
    const message =
      "तुरंत OTP भेजें। तुरंत OTP भेजें। तुरंत OTP भेजें।";
    const analysis = analyzeMessage(message);

    expect(finding(analysis, "credential-request")?.weight).toBe(40);
    expect(finding(analysis, "urgency-pressure")?.weight).toBe(20);
    expect(analysis.score).toBe(60);
    expect(analysis.findings).toHaveLength(2);
  });

  it("keeps overlapping evidence from double-counting a rule", () => {
    const analysis = analyzeMessage("OTP turant share karo");
    const credential = finding(analysis, "credential-request");
    const urgency = finding(analysis, "urgency-pressure");

    expect(credential).toBeDefined();
    expect(urgency).toBeDefined();
    expect(analysis.score).toBe(60);

    const overlaps = credential!.occurrences.some((left) =>
      urgency!.occurrences.some(
        (right) => left.start < right.end && left.end > right.start,
      ),
    );
    expect(overlaps).toBe(true);
  });

  it("still caps the score at 100 and reports the uncapped total", () => {
    const message =
      "बधाई हो! आपका खाता आज बंद हो जाएगा। तुरंत लिंक पर क्लिक करें और अपना OTP बताएं। आपने इनाम जीता है।";
    const analysis = analyzeMessage(message);

    expect(new Set(analysis.matchedRuleIds)).toEqual(
      new Set([
        "credential-request",
        "suspicious-link",
        "urgency-pressure",
        "prize-bait",
        "account-threat",
      ]),
    );
    expect(analysis.rawScore).toBe(120);
    expect(analysis.score).toBe(100);
    expect(analysis.scoreWasCapped).toBe(true);
    expect(analysis.scoreExplanation).toContain("capped at the maximum of 100");
  });

  it("recognises recovery-code requests in Devanagari and Hinglish", () => {
    const hindi = analyzeMessage("अपना रिकव्हरी कोड भेजें।");
    const hinglish = analyzeMessage("Recovery code bhejo.");

    expect(finding(hindi, "credential-request")?.weight).toBe(40);
    expect(finding(hinglish, "credential-request")?.weight).toBe(40);
    expect(hindi.riskLevel).toBe("medium");
    expect(hinglish.riskLevel).toBe("medium");
  });

  it("never links or fetches a URL found in a multilingual message", () => {
    const message =
      "आपका खाता बंद हो जाएगा। तुरंत https://secure-bank.invalid/verify पर जाएं।";
    const analysis = analyzeMessage(message);

    expect(analysis.links).toHaveLength(1);
    expect(analysis.links[0].url).toContain(".invalid");
    expect(analysis.links[0].end).toBeGreaterThan(analysis.links[0].start);
    // The address is only ever text and offsets: the engine never opens it.
    expect(analysis.message).toBe(message);
    expect(analysis.message.slice(
      analysis.links[0].start,
      analysis.links[0].end,
    )).toBe(analysis.links[0].url);
  });
});

describe("determinism and privacy", () => {
  it("produces the same result for the same multilingual message", () => {
    const message = "तुमचे खाते आज बंद केले जाईल. तुमचा OTP लगेच सांगा.";
    const first = analyzeMessage(message);
    const second = analyzeMessage(message);

    expect({ ...first, analyzedAt: 0 }).toEqual({ ...second, analyzedAt: 0 });
  });

  it("runs with fetch disabled", () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (() => {
      throw new Error("network access attempted during multilingual analysis");
    }) as unknown as typeof fetch;

    try {
      const analysis = analyzeMessage(
        "आपका खाता आज बंद कर दिया जाएगा। अपना OTP तुरंत बताएं।",
      );
      expect(analysis.score).toBe(75);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
