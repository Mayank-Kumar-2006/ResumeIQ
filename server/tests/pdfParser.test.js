'use strict';
const { normalizeText, detectSections } = require('../src/services/pdfParser');

describe('PDF Parser Service', () => {
  describe('normalizeText', () => {
    it('collapses multiple spaces to single space', () => {
      const result = normalizeText('Hello    World   Test');
      expect(result).toBe('Hello World Test');
    });

    it('normalizes Windows line endings', () => {
      const result = normalizeText('Line1\r\nLine2\r\nLine3');
      expect(result).toBe('Line1\nLine2\nLine3');
    });

    it('limits consecutive blank lines to two', () => {
      const result = normalizeText('Para1\n\n\n\n\nPara2');
      expect(result).not.toMatch(/\n{3,}/);
    });

    it('normalizes smart quotes', () => {
      const result = normalizeText('‘smart’ “quotes”');
      expect(result).toBe("'smart' \"quotes\"");
    });

    it('returns empty string for null/undefined input', () => {
      expect(normalizeText(null)).toBe('');
      expect(normalizeText(undefined)).toBe('');
      expect(normalizeText('')).toBe('');
    });
  });

  describe('detectSections', () => {
    const sampleResume = `John Doe | john@example.com

SKILLS
React, Node.js, Python, MongoDB, Docker

EDUCATION
B.Tech in Computer Science
XYZ University, 2024

EXPERIENCE
Software Intern - ABC Corp (Jan 2024 - Jun 2024)
- Developed REST APIs using Node.js and Express
- Implemented React frontend components

PROJECTS
E-commerce Platform (React, Node.js, MongoDB)
- Built full-stack shopping application
- Integrated payment gateway

CERTIFICATIONS
AWS Cloud Practitioner`;

    it('detects skills section', () => {
      const { sections, detectedSectionNames } = detectSections(sampleResume);
      expect(detectedSectionNames).toContain('skills');
      expect(sections.skills).toBeTruthy();
    });

    it('detects education section', () => {
      const { detectedSectionNames } = detectSections(sampleResume);
      expect(detectedSectionNames).toContain('education');
    });

    it('detects experience section', () => {
      const { detectedSectionNames } = detectSections(sampleResume);
      expect(detectedSectionNames).toContain('experience');
    });

    it('detects projects section', () => {
      const { detectedSectionNames } = detectSections(sampleResume);
      expect(detectedSectionNames).toContain('projects');
    });

    it('handles resume with no sections gracefully', () => {
      const { sections, detectedSectionNames } = detectSections('John Doe software developer');
      expect(Array.isArray(detectedSectionNames)).toBe(true);
      expect(typeof sections).toBe('object');
    });

    it('handles empty string', () => {
      const { sections, detectedSectionNames } = detectSections('');
      expect(detectedSectionNames).toEqual([]);
    });
  });
});
