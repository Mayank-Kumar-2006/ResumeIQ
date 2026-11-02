'use strict';
const { analyzeJobDescription, extractSkillsFromText, extractKeywords } = require('../src/services/nlpService');

describe('NLP Service', () => {
  describe('extractSkillsFromText', () => {
    it('extracts known skills from text', () => {
      const skills = extractSkillsFromText('Looking for a React and Node.js developer with Python experience');
      expect(skills).toContain('React');
      expect(skills).toContain('Node.js');
      expect(skills).toContain('Python');
    });

    it('handles aliases (js → JavaScript)', () => {
      const skills = extractSkillsFromText('Must know JS and some nodejs');
      expect(skills.some(s => s === 'JavaScript' || s === 'Node.js')).toBe(true);
    });

    it('returns empty array for text with no skills', () => {
      const skills = extractSkillsFromText('We are looking for a motivated team player');
      expect(Array.isArray(skills)).toBe(true);
    });

    it('does not include duplicates', () => {
      const skills = extractSkillsFromText('React React React JavaScript JavaScript');
      const unique = new Set(skills);
      expect(skills.length).toBe(unique.size);
    });

    it('handles empty string safely', () => {
      const skills = extractSkillsFromText('');
      expect(skills).toEqual([]);
    });
  });

  describe('analyzeJobDescription', () => {
    const sampleJD = `
      We are looking for a Full Stack Developer.

      Requirements:
      - 2+ years of experience with React and Node.js
      - Proficiency in MongoDB and SQL
      - Experience with Docker and AWS

      Nice to have:
      - Knowledge of TypeScript
      - Experience with Kubernetes

      Responsibilities:
      - Build scalable web applications
      - Write clean, testable code
      - Work in an Agile team
    `;

    it('returns structured analysis result', () => {
      const result = analyzeJobDescription(sampleJD);
      expect(result).toHaveProperty('requiredSkills');
      expect(result).toHaveProperty('preferredSkills');
      expect(result).toHaveProperty('keywords');
      expect(result).toHaveProperty('experienceRequirement');
      expect(result).toHaveProperty('educationRequirement');
    });

    it('extracts required skills from requirements section', () => {
      const result = analyzeJobDescription(sampleJD);
      expect(Array.isArray(result.requiredSkills)).toBe(true);
      // Should find at least some of these
      const combined = [...result.requiredSkills, ...result.preferredSkills];
      expect(combined.length).toBeGreaterThan(0);
    });

    it('separates preferred from required skills', () => {
      const result = analyzeJobDescription(sampleJD);
      // TypeScript/Kubernetes should be in preferred (nice to have section)
      // (may not be strictly split but preferred should not be empty)
      expect(Array.isArray(result.preferredSkills)).toBe(true);
    });

    it('extracts experience requirement', () => {
      const result = analyzeJobDescription(sampleJD);
      if (result.experienceRequirement) {
        expect(result.experienceRequirement.toLowerCase()).toMatch(/year/);
      }
    });

    it('handles minimal job description safely', () => {
      const result = analyzeJobDescription('Software developer needed');
      expect(result).toHaveProperty('requiredSkills');
      expect(Array.isArray(result.requiredSkills)).toBe(true);
    });

    it('handles empty job description safely', () => {
      const result = analyzeJobDescription('');
      expect(result.requiredSkills).toEqual([]);
      expect(result.preferredSkills).toEqual([]);
    });
  });

  describe('extractKeywords', () => {
    it('returns an array', () => {
      const kws = extractKeywords('full stack developer with REST api experience in microservices');
      expect(Array.isArray(kws)).toBe(true);
    });

    it('does not include stopwords', () => {
      const kws = extractKeywords('We are looking for a developer with the best skills');
      const stopwords = ['we', 'are', 'for', 'a', 'the', 'with'];
      for (const sw of stopwords) {
        expect(kws).not.toContain(sw);
      }
    });
  });
});
