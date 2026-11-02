'use strict';
const { extractSkillsFromText, extractKeywords } = require('./nlpService');

/**
 * ResumeIQ Scoring Engine
 *
 * Scoring formula (configurable weights must sum to 1.0):
 *
 *   SKILLS_MATCH       = 0.40  — required + preferred skills found in resume
 *   KEYWORD_MATCH      = 0.25  — important keywords from JD found in resume
 *   PROJECT_RELEVANCE  = 0.15  — relevant technologies mentioned in projects section
 *   EXPERIENCE_REL     = 0.10  — relevant experience section matches
 *   RESUME_STRUCTURE   = 0.10  — presence of expected resume sections
 *
 * Final score = Σ(weight_i × subscore_i) × 100, clamped to [0, 100].
 *
 * Assumptions:
 *  - Required skills count 3× more than preferred skills within the skills subscore.
 *  - Missing preferred skills do not penalize below 50% of the skills score.
 *  - Student resumes are not penalized solely for lack of professional experience.
 *  - Keyword deduplication: each keyword is counted once regardless of frequency.
 *  - Score is not an official ATS score. It is ResumeIQ's algorithmic compatibility estimate.
 */

const DEFAULT_WEIGHTS = {
  skillsMatch: 0.40,
  keywordMatch: 0.25,
  projectRelevance: 0.15,
  experienceRelevance: 0.10,
  resumeStructure: 0.10,
};

const IDEAL_SECTIONS = ['skills', 'education', 'experience', 'projects', 'certifications'];
const IMPORTANT_SECTIONS = ['skills', 'education', 'experience'];

/**
 * Main scoring function.
 *
 * @param {object} params
 * @param {string} params.resumeText  - Full normalized resume text
 * @param {object} params.sections    - Detected resume sections { skills, experience, projects, ... }
 * @param {string[]} params.detectedSectionNames - Which sections were detected
 * @param {string[]} params.requiredSkills  - Required skills from JD
 * @param {string[]} params.preferredSkills - Preferred skills from JD
 * @param {string[]} params.keywords        - Important keywords from JD
 * @param {object} [params.weights]         - Override scoring weights
 * @returns {object} Full scoring result
 */
function calculateScore(params) {
  const {
    resumeText = '',
    sections = {},
    detectedSectionNames = [],
    requiredSkills = [],
    preferredSkills = [],
    keywords = [],
    experienceRequirement = '',
    weights = DEFAULT_WEIGHTS,
  } = params;

  // --- 1. Skills Match (40%) ---
  const skillsResult = scoreSkills(resumeText, requiredSkills, preferredSkills);

  // --- 2. Keyword Match (25%) ---
  const keywordResult = scoreKeywords(resumeText, keywords);

  // --- 3. Project Relevance (15%) ---
  const projectResult = scoreProjectRelevance(
    sections.projects || '',
    resumeText,
    requiredSkills,
    preferredSkills
  );

  // --- 4. Experience Relevance (10%) ---
  const experienceResult = scoreExperienceRelevance(
    sections.experience || '',
    resumeText,
    requiredSkills,
    experienceRequirement
  );

  // --- 5. Resume Structure (10%) ---
  const structureResult = scoreResumeStructure(detectedSectionNames);

  // --- Weighted total ---
  const weightedScore =
    weights.skillsMatch * skillsResult.score +
    weights.keywordMatch * keywordResult.score +
    weights.projectRelevance * projectResult.score +
    weights.experienceRelevance * experienceResult.score +
    weights.resumeStructure * structureResult.score;

  const overallScore = Math.round(Math.min(100, Math.max(0, weightedScore * 100)));

  return {
    overallScore,
    scoreBreakdown: {
      skillsMatch: Math.round(skillsResult.score * 100),
      keywordMatch: Math.round(keywordResult.score * 100),
      projectRelevance: Math.round(projectResult.score * 100),
      experienceRelevance: Math.round(experienceResult.score * 100),
      resumeStructure: Math.round(structureResult.score * 100),
    },
    weights,
    // Skills detail
    matchedRequiredSkills: skillsResult.matchedRequired,
    missingRequiredSkills: skillsResult.missingRequired,
    matchedPreferredSkills: skillsResult.matchedPreferred,
    missingPreferredSkills: skillsResult.missingPreferred,
    skillEvidence: skillsResult.evidence,
    // Keywords
    matchedKeywords: keywordResult.matched,
    missingKeywords: keywordResult.missing,
    // Projects
    projectMatches: projectResult.matches,
    // Structure
    structureFeedback: {
      detectedSections: detectedSectionNames,
      missingSections: structureResult.missingSections,
      suggestions: structureResult.suggestions,
    },
  };
}

/**
 * Skills scoring
 * Required skills: 3 points each
 * Preferred skills: 1 point each
 * Max possible = 3 * |required| + 1 * |preferred|
 * Score = earned / max (or 1.0 if both lists are empty)
 */
function scoreSkills(resumeText, requiredSkills, preferredSkills) {
  const resumeSkills = extractSkillsFromText(resumeText);
  const resumeSkillSet = new Set(resumeSkills.map((s) => s.toLowerCase()));

  const matchedRequired = [];
  const missingRequired = [];
  const matchedPreferred = [];
  const missingPreferred = [];
  const evidence = {};

  for (const skill of requiredSkills) {
    const matched = resumeSkillSet.has(skill.toLowerCase());
    if (matched) {
      matchedRequired.push(skill);
      evidence[skill] = findSkillEvidence(resumeText, skill);
    } else {
      missingRequired.push(skill);
    }
  }

  for (const skill of preferredSkills) {
    const matched = resumeSkillSet.has(skill.toLowerCase());
    if (matched) {
      matchedPreferred.push(skill);
      evidence[skill] = findSkillEvidence(resumeText, skill);
    } else {
      missingPreferred.push(skill);
    }
  }

  const totalRequired = requiredSkills.length;
  const totalPreferred = preferredSkills.length;

  if (totalRequired === 0 && totalPreferred === 0) {
    return {
      score: 0.5, // Neutral when no skills specified
      matchedRequired,
      missingRequired,
      matchedPreferred,
      missingPreferred,
      evidence,
    };
  }

  const maxPoints = totalRequired * 3 + totalPreferred * 1;
  const earnedPoints = matchedRequired.length * 3 + matchedPreferred.length * 1;

  const score = maxPoints > 0 ? earnedPoints / maxPoints : 0;

  return {
    score: Math.min(1, score),
    matchedRequired,
    missingRequired,
    matchedPreferred,
    missingPreferred,
    evidence,
  };
}

/**
 * Keyword scoring — simple ratio of matched keywords
 */
function scoreKeywords(resumeText, keywords) {
  if (!keywords || keywords.length === 0) {
    return { score: 0.5, matched: [], missing: [] };
  }

  const resumeLower = resumeText.toLowerCase();
  const matched = [];
  const missing = [];

  // Deduplicate keywords list first
  const uniqueKeywords = [...new Set(keywords.map((k) => k.toLowerCase()))];

  for (const kw of uniqueKeywords) {
    if (resumeLower.includes(kw)) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  }

  const score = matched.length / uniqueKeywords.length;
  return { score, matched, missing };
}

/**
 * Project relevance — looks for required/preferred skills in the projects section.
 * If no projects section exists, falls back to any project-like text in resume.
 */
function scoreProjectRelevance(projectsSection, fullResumeText, requiredSkills, preferredSkills) {
  const targetText = projectsSection || '';

  if (!targetText.trim()) {
    // If no projects section: partial credit if skills appear elsewhere
    const allSkills = [...requiredSkills, ...preferredSkills];
    if (allSkills.length === 0) return { score: 0.5, matches: [] };

    // Give partial credit — projects being absent doesn't mean zero for students
    return { score: 0.3, matches: [] };
  }

  const allTargetSkills = [...requiredSkills, ...preferredSkills];
  if (allTargetSkills.length === 0) return { score: 0.7, matches: [] };

  const projectSkills = extractSkillsFromText(targetText);
  const projectSkillSet = new Set(projectSkills.map((s) => s.toLowerCase()));

  const matches = allTargetSkills.filter((s) => projectSkillSet.has(s.toLowerCase()));

  const score = matches.length / Math.max(allTargetSkills.length, 1);
  return { score: Math.min(1, score), matches };
}

/**
 * Experience relevance — checks if required skills appear in experience section.
 * Students without experience are not heavily penalized.
 */
function scoreExperienceRelevance(experienceSection, fullResumeText, requiredSkills, experienceRequirement = '') {
  const hasExperienceSection = experienceSection.trim().length > 50;

  // Do not penalize students for lacking professional experience when the JD does not state a requirement.
  if (!String(experienceRequirement || '').trim()) return { score: 0.7 };
  if (requiredSkills.length === 0) return { score: 0.7 };

  if (!hasExperienceSection) {
    // Student-friendly: partial credit even without experience section
    return { score: 0.4 };
  }

  const expSkills = extractSkillsFromText(experienceSection);
  const expSkillSet = new Set(expSkills.map((s) => s.toLowerCase()));

  const matched = requiredSkills.filter((s) => expSkillSet.has(s.toLowerCase()));
  const score = matched.length / requiredSkills.length;

  return { score: Math.min(1, score + 0.3) }; // +0.3 bonus for having experience section
}

/**
 * Resume structure scoring
 */
function scoreResumeStructure(detectedSectionNames) {
  const detected = new Set(detectedSectionNames.map((s) => s.toLowerCase()));

  // Important sections that should be present
  const importantPresent = IMPORTANT_SECTIONS.filter((s) => detected.has(s));
  const idealPresent = IDEAL_SECTIONS.filter((s) => detected.has(s));

  const missingSections = IMPORTANT_SECTIONS.filter((s) => !detected.has(s));
  const suggestions = [];

  if (missingSections.includes('skills')) {
    suggestions.push('Add a dedicated Skills section to highlight your technical competencies.');
  }
  if (missingSections.includes('education')) {
    suggestions.push('Include an Education section with your degree, institution, and graduation year.');
  }
  if (missingSections.includes('experience')) {
    suggestions.push(
      'Add an Experience or Projects section to showcase hands-on work. Internships, academic projects, and open-source contributions all count.'
    );
  }
  if (!detected.has('projects')) {
    suggestions.push('Consider adding a Projects section to demonstrate practical skills.');
  }
  if (!detected.has('summary')) {
    suggestions.push(
      'A brief Professional Summary at the top helps recruiters quickly understand your profile.'
    );
  }

  // Score based on coverage of important + ideal sections
  const importantScore = importantPresent.length / IMPORTANT_SECTIONS.length;
  const idealScore = idealPresent.length / IDEAL_SECTIONS.length;
  const score = importantScore * 0.7 + idealScore * 0.3;

  return {
    score: Math.min(1, score),
    missingSections,
    suggestions,
  };
}

/**
 * Find the first sentence/line in the resume that contains this skill.
 * Used to provide evidence for skill matches.
 */
function findSkillEvidence(resumeText, skill) {
  const skillLower = skill.toLowerCase();
  const sentences = resumeText.split(/[.\n]/);
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(skillLower)) {
      const trimmed = sentence.trim();
      if (trimmed.length > 10 && trimmed.length < 300) {
        return trimmed;
      }
    }
  }
  return `Found "${skill}" in resume`;
}

module.exports = {
  calculateScore,
  scoreSkills,
  scoreKeywords,
  scoreProjectRelevance,
  scoreExperienceRelevance,
  scoreResumeStructure,
  DEFAULT_WEIGHTS,
};
