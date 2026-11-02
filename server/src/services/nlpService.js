'use strict';
const { ALIAS_LOOKUP, SKILL_ALIASES } = require('./skillDictionary');
const { normalizeText } = require('./pdfParser');

/**
 * Stop-words — generic filler that should not be treated as meaningful keywords
 */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall',
  'must', 'can', 'this', 'that', 'these', 'those', 'we', 'you', 'they', 'it', 'he', 'she',
  'our', 'your', 'their', 'its', 'my', 'his', 'her', 'as', 'if', 'not', 'so', 'up',
  'about', 'into', 'through', 'also', 'such', 'any', 'all', 'both', 'each', 'more',
  'most', 'other', 'than', 'then', 'when', 'where', 'which', 'who', 'how', 'what',
  'able', 'work', 'team', 'strong', 'good', 'new', 'use', 'using', 'used', 'well',
  'plus', 'role', 'job', 'position', 'company', 'opportunity', 'candidate', 'experience',
  'join', 'looking', 'seeking', 'required', 'preferred', 'nice', 'have', 'including',
  'etc', 'eg', 'ie', 'following', 'ability', 'knowledge', 'understanding', 'hands-on',
]);

/**
 * Patterns that indicate "required" vs "preferred" context in job descriptions
 */
const REQUIRED_INDICATORS = [
  /\b(required|must\s+have|mandatory|essential|necessary|need)\b/i,
  /\b(you\s+will\s+need|you\s+must|should\s+have|minimum\s+qualifications?)\b/i,
  /\b(require[sd]|requires|expected)\b/i,
];

const PREFERRED_INDICATORS = [
  /\b(preferred|nice\s+to\s+have|bonus|desirable|plus|ideally|advantageous)\b/i,
  /\b(an?\s+advantage|would\s+be\s+a\s+plus|great\s+if)\b/i,
];

const EXPERIENCE_PATTERNS = [
  /(\d+\+?\s*(?:to\s*\d+)?\s*years?\s+(?:of\s+)?(?:experience|exp))/gi,
  /(?:experience|exp)[\s:]+(\d+\+?\s*(?:to\s*\d+)?\s*years?)/gi,
];

const EDUCATION_PATTERNS = [
  /\b(bachelor'?s?|b\.?s\.?|b\.?tech\.?|b\.?e\.?)\s+(?:degree\s+)?(?:in\s+[\w\s]+)?/gi,
  /\b(master'?s?|m\.?s\.?|m\.?tech\.?|m\.?e\.?|mba)\s+(?:degree\s+)?(?:in\s+[\w\s]+)?/gi,
  /\b(phd|ph\.d\.?|doctorate)\s+(?:in\s+[\w\s]+)?/gi,
  /\b(computer science|information technology|software engineering|electrical engineering)\b/gi,
];

/**
 * Normalize a token for lookup
 */
function normalizeToken(token) {
  return token.toLowerCase().replace(/[^a-z0-9+#./\s]/g, '').trim();
}

/**
 * Extract canonical skill name from text fragment
 */
function extractSkillFromText(text) {
  const normalized = normalizeToken(text);
  if (ALIAS_LOOKUP.has(normalized)) {
    return ALIAS_LOOKUP.get(normalized);
  }
  return null;
}

/**
 * Scan text for all known skills using multi-word phrase matching.
 * Returns an array of canonical skill names (deduplicated).
 */
function extractSkillsFromText(text) {
  const normalized = text.toLowerCase();
  const found = new Set();

  // Try to match multi-word aliases first (longer phrases = more specific)
  const allEntries = [];
  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    allEntries.push({ canonical, phrase: canonical.toLowerCase(), len: canonical.split(/\s+/).length });
    for (const alias of aliases) {
      allEntries.push({ canonical, phrase: alias.toLowerCase(), len: alias.split(/\s+/).length });
    }
  }

  // Sort by phrase length descending so longer matches take priority
  allEntries.sort((a, b) => b.len - a.len);

  for (const { canonical, phrase } of allEntries) {
    // Word-boundary-aware matching: ensure not just a substring
    const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // For phrases with special chars (C++, C#), use simple includes
    let matches = false;
    if (/[+#]/.test(phrase)) {
      matches = normalized.includes(phrase);
    } else {
      const re = new RegExp(`(?:^|[\\s,;/(\\[\\-])${escapedPhrase}(?:[\\s,;/)\\]\\-]|$)`, 'i');
      matches = re.test(normalized);
    }
    if (matches) {
      found.add(canonical);
    }
  }

  return [...found];
}

/**
 * Split job description into sections (required, preferred, responsibilities, etc.)
 * and classify skills from each section.
 */
function analyzeJobDescription(jobDescription) {
  const normalized = normalizeText(jobDescription);
  const lines = normalized.split('\n');

  // Segment job description into buckets
  const segments = {
    required: [],
    preferred: [],
    responsibilities: [],
    general: [],
  };

  let currentSegment = 'general';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect segment headers
    if (/\b(requirement|required|must\s+have|mandatory|essential)\b/i.test(trimmed) &&
        trimmed.length < 80) {
      currentSegment = 'required';
    } else if (/\b(preferred|nice\s+to\s+have|bonus|plus|desirable)\b/i.test(trimmed) &&
               trimmed.length < 80) {
      currentSegment = 'preferred';
    } else if (/\b(responsibilities|duties|what\s+you.ll\s+do|role|tasks)\b/i.test(trimmed) &&
               trimmed.length < 80) {
      currentSegment = 'responsibilities';
    } else if (/\b(qualification|about|who\s+we|overview|description)\b/i.test(trimmed) &&
               trimmed.length < 80) {
      currentSegment = 'general';
    } else {
      segments[currentSegment].push(trimmed);
    }
  }

  // If we couldn't segment well, use context-based heuristic on every line
  const requiredSkillsSet = new Set();
  const preferredSkillsSet = new Set();

  // Process structured segments
  const requiredText = segments.required.join(' ');
  const preferredText = segments.preferred.join(' ');

  for (const skill of extractSkillsFromText(requiredText)) {
    requiredSkillsSet.add(skill);
  }
  for (const skill of extractSkillsFromText(preferredText)) {
    preferredSkillsSet.add(skill);
  }

  // For general/responsibilities text, use line-level context
  const otherText = [...segments.responsibilities, ...segments.general].join('\n');

  for (const line of otherText.split('\n')) {
    const isRequired = REQUIRED_INDICATORS.some((p) => p.test(line));
    const isPreferred = PREFERRED_INDICATORS.some((p) => p.test(line));

    const lineSkills = extractSkillsFromText(line);
    for (const skill of lineSkills) {
      if (isPreferred) {
        preferredSkillsSet.add(skill);
      } else {
        // Default to required if context is ambiguous
        requiredSkillsSet.add(skill);
      }
    }
  }

  // Skills in preferred should not also appear in required (preferred = bonus)
  for (const skill of preferredSkillsSet) {
    if (requiredSkillsSet.has(skill)) {
      preferredSkillsSet.delete(skill);
    }
  }

  // Extract important keywords (non-skill nouns and phrases)
  const keywords = extractKeywords(normalized);

  // Extract experience and education requirements
  const experienceReq = extractExperienceRequirement(normalized);
  const educationReq = extractEducationRequirement(normalized);

  return {
    requiredSkills: [...requiredSkillsSet],
    preferredSkills: [...preferredSkillsSet],
    keywords,
    experienceRequirement: experienceReq,
    educationRequirement: educationReq,
    rawText: normalized,
  };
}

/**
 * Extract non-skill important keywords from text.
 * Excludes stop words and known skills.
 */
function extractKeywords(text) {
  const allSkillWords = new Set();
  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    allSkillWords.add(canonical.toLowerCase());
    for (const a of aliases) allSkillWords.add(a.toLowerCase());
  }

  // Extract candidate keywords from multi-word phrases and single important words
  const importantPhrases = [
    'full stack', 'full-stack', 'front end', 'back end', 'frontend', 'backend',
    'software engineer', 'software developer', 'web developer', 'data engineer',
    'product management', 'project management', 'team player', 'problem solving',
    'code review', 'unit testing', 'integration testing', 'test driven', 'tdd',
    'pair programming', 'technical documentation', 'deployment', 'scalability',
    'performance optimization', 'cross-functional', 'startup', 'saas', 'b2b', 'b2c',
    'api integration', 'third party', 'open source', 'cloud native', 'serverless',
    'event driven', 'message queue', 'kafka', 'rabbitmq', 'celery', 'websocket',
    'oauth', 'jwt', 'authentication', 'authorization', 'encryption', 'https',
  ];

  const found = new Set();
  const normalized = text.toLowerCase();

  for (const phrase of importantPhrases) {
    if (normalized.includes(phrase)) {
      found.add(phrase);
    }
  }

  // Single-word tokens: keep if not stopword, not short, not purely numeric
  const tokens = text.toLowerCase().split(/[\s,;|•·\-()[\]]+/).filter(Boolean);
  for (const token of tokens) {
    const t = token.replace(/[^a-z0-9+#./]/g, '');
    if (
      t.length >= 4 &&
      !STOP_WORDS.has(t) &&
      !allSkillWords.has(t) &&
      !/^\d+$/.test(t) &&
      ALIAS_LOOKUP.has(t) === false
    ) {
      // Only add if it appears 2+ times (indicates importance)
      const count = (text.toLowerCase().match(new RegExp(`\\b${t}\\b`, 'g')) || []).length;
      if (count >= 2) {
        found.add(t);
      }
    }
  }

  return [...found].slice(0, 50); // cap at 50 keywords
}

/**
 * Extract experience requirement (e.g., "3+ years of experience")
 */
function extractExperienceRequirement(text) {
  for (const pattern of EXPERIENCE_PATTERNS) {
    const match = pattern.exec(text);
    if (match) {
      return match[0].trim();
    }
  }
  return '';
}

/**
 * Extract education requirement
 */
function extractEducationRequirement(text) {
  for (const pattern of EDUCATION_PATTERNS) {
    const match = pattern.exec(text);
    if (match) {
      return match[0].trim();
    }
  }
  return '';
}

module.exports = {
  analyzeJobDescription,
  extractSkillsFromText,
  extractKeywords,
  extractExperienceRequirement,
  extractEducationRequirement,
  normalizeToken,
};
