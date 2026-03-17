const ENGLISH_BAD_WORDS = [
  "fuck",
  "fucking",
  "shit",
  "bitch",
  "bastard",
  "asshole",
  "idiot",
  "stupid",
  "moron",
  "dumbass",
  "slut",
  "whore",
  "retard",
];

const SINHALA_SLANG_WORDS = [
  "හුත්තා",
  "හුකනවා",
  "පකයා",
  "වේසී",
  "ගූ",
  "පොන්නයා",
  "අම්මපා",
];

const HIGH_RISK_PATTERNS = [
  "suicide",
  "kill myself",
  "want to die",
  "end my life",
  "self harm",
  "self-harm",
  "cut myself",
  "i want to die",
  "i am going to die",
  "මැරෙන්න ඕන",
  "මැරෙන්න හිතෙනවා",
  "මම මැරෙනවා",
];

const MEDIUM_RISK_PATTERNS = [
  "panic attack",
  "severe anxiety",
  "hopeless",
  "worthless",
  "nobody cares",
  "i am broken",
  "self hate",
  "hate myself",
  "i am useless",
  "lonely",
  "depressed",
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function maskWord(word) {
  return "*".repeat(word.length);
}

function findPattern(text, list) {
  const lower = text.toLowerCase();
  return list.filter((item) => lower.includes(item.toLowerCase()));
}

function getRiskLevel(text) {
  const highMatches = findPattern(text, HIGH_RISK_PATTERNS);
  if (highMatches.length > 0) {
    return {
      riskLevel: "HIGH",
      riskReason: highMatches.join(", "),
    };
  }

  const mediumMatches = findPattern(text, MEDIUM_RISK_PATTERNS);
  if (mediumMatches.length > 0) {
    return {
      riskLevel: "MEDIUM",
      riskReason: mediumMatches.join(", "),
    };
  }

  return {
    riskLevel: "NONE",
    riskReason: null,
  };
}

function moderateLocally(text) {
  if (!text || typeof text !== "string") {
    return {
      originalText: "",
      maskedText: "",
      blocked: false,
      riskLevel: "NONE",
      riskReason: null,
      moderationMeta: {
        source: "local-fallback",
        flaggedWords: [],
        categories: [],
      },
    };
  }

  let maskedText = text;
  const flaggedWords = [];

  const allWords = [...ENGLISH_BAD_WORDS, ...SINHALA_SLANG_WORDS];

  for (const badWord of allWords) {
    const regex = new RegExp(`\\b${escapeRegex(badWord)}\\b`, "gi");
    if (regex.test(maskedText)) {
      flaggedWords.push(badWord);
      maskedText = maskedText.replace(regex, (match) => maskWord(match));
    }
  }

  const risk = getRiskLevel(text);

  return {
    originalText: text,
    maskedText,
    blocked: false,
    riskLevel: risk.riskLevel,
    riskReason: risk.riskReason,
    moderationMeta: {
      source: "local-fallback",
      flaggedWords,
      categories: flaggedWords.length > 0 ? ["abusive-language"] : [],
    },
  };
}

async function moderateText(text) {
  const localResult = moderateLocally(text);

  if (!process.env.MODERATION_URL) {
    return localResult;
  }

  try {
    const response = await fetch(process.env.MODERATION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      return localResult;
    }

    const data = await response.json();

    return {
      originalText: text,
      maskedText: data.maskedText || localResult.maskedText,
      blocked: typeof data.blocked === "boolean" ? data.blocked : false,
      riskLevel: data.riskLevel || localResult.riskLevel,
      riskReason: data.riskReason || localResult.riskReason,
      moderationMeta: {
        source: "python-service",
        ...(data.moderationMeta || {}),
        localFallbackFlaggedWords: localResult.moderationMeta.flaggedWords,
      },
    };
  } catch (error) {
    return {
      ...localResult,
      moderationMeta: {
        ...localResult.moderationMeta,
        serviceError: error.message,
      },
    };
  }
}

module.exports = {
  moderateText,
};