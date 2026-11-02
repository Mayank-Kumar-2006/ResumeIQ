'use strict';
const {
  calculateScore,
  scoreSkills,
  scoreKeywords,
  scoreProjectRelevance,
  scoreExperienceRelevance,
  scoreResumeStructure,
  DEFAULT_WEIGHTS,
} = require('../src/services/scoringEngine');

describe('Scoring Engine', () => {
  describe('experience relevance', () => {
    it('does not penalize candidates for missing experience when the job description states no experience requirement', () => {
      expect(scoreExperienceRelevance('', '', ['React'], '').score).toBe(0.7);
    });

    it('gives partial credit when experience is explicitly required but no experience section exists', () => {
      expect(scoreExperienceRelevance('', '', ['React'], '2+ years of experience').score).toBe(0.4);
    });
  });
  // --- scoreSkills ---
  describe('scoreSkills', () => {
    it('matches required skills present in resume text', () => {
      const result = scoreSkills(
        'Experienced in React, Node.js and Python development',
        ['React', 'Node.js', 'Python'],
        []
      );
      expect(result.matchedRequired).toContain('React');
      expect(result.matchedRequired).toContain('Node.js');
      expect(result.matchedRequired).toContain('Python');
      expect(result.missingRequired).toHaveLength(0);
      expect(result.score).toBeCloseTo(1.0);
    });

    it('identifies missing required skills', () => {
      const result = scoreSkills(
        'Experienced in React development',
        ['React', 'Docker', 'Kubernetes'],
        []
      );
      expect(result.matchedRequired).toContain('React');
      expect(result.missingRequired).toContain('Docker');
      expect(result.missingRequired).toContain('Kubernetes');
      expect(result.score).toBeCloseTo(1 / 3);
    });

    it('scores zero when no skills match', () => {
      const result = scoreSkills(
        'Experienced in teaching and cooking',
        ['React', 'Python'],
        []
      );
      expect(result.score).toBe(0);
      expect(result.matchedRequired).toHaveLength(0);
    });

    it('returns neutral score when no skills are required', () => {
      const result = scoreSkills('Any resume text here', [], []);
      expect(result.score).toBe(0.5);
    });

    it('handles preferred skills separately from required', () => {
      const result = scoreSkills(
        'React developer with TypeScript skills',
        ['React'],
        ['TypeScript', 'Docker']
      );
      expect(result.matchedPreferred).toContain('TypeScript');
      expect(result.missingPreferred).toContain('Docker');
    });

    it('handles empty resume text safely', () => {
      const result = scoreSkills('', ['React', 'Python'], ['Docker']);
      expect(result.score).toBe(0);
      expect(result.matchedRequired).toHaveLength(0);
    });

    it('does not double-count repeated keywords', () => {
      const result = scoreSkills(
        'React React React React developer using React framework and React components',
        ['React'],
        []
      );
      expect(result.matchedRequired).toHaveLength(1);
      expect(result.score).toBeCloseTo(1.0);
    });

    it('recognizes skill aliases (js → JavaScript)', () => {
      const result = scoreSkills(
        'Proficient in JS and nodejs development',
        ['JavaScript', 'Node.js'],
        []
      );
      expect(result.matchedRequired.length).toBeGreaterThanOrEqual(1);
    });
  });

  // --- scoreKeywords ---
  describe('scoreKeywords', () => {
    it('returns neutral score for empty keyword list', () => {
      const result = scoreKeywords('Any resume text', []);
      expect(result.score).toBe(0.5);
      expect(result.matched).toHaveLength(0);
    });

    it('matches keywords found in resume', () => {
      const result = scoreKeywords(
        'Full stack developer with REST api experience',
        ['full stack', 'rest']
      );
      expect(result.matched.length).toBeGreaterThan(0);
    });

    it('identifies missing keywords', () => {
      const result = scoreKeywords(
        'React developer',
        ['microservices', 'kubernetes', 'kafka']
      );
      expect(result.missing.length).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(0.5);
    });

    it('deduplicates repeated keywords in input list', () => {
      const result = scoreKeywords(
        'Full stack developer',
        ['full stack', 'full stack', 'full stack']
      );
      // Should only count once
      expect(result.matched.length).toBeLessThanOrEqual(1);
    });
  });

  // --- scoreProjectRelevance ---
  describe('scoreProjectRelevance', () => {
    it('gives partial credit when no projects section exists', () => {
      const result = scoreProjectRelevance('', 'some resume text', ['React'], []);
      expect(result.score).toBeLessThan(0.5);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('scores higher when project section mentions required skills', () => {
      const withProjects = scoreProjectRelevance(
        'Built a React application with Node.js backend',
        'full resume',
        ['React', 'Node.js'],
        []
      );
      const withoutProjects = scoreProjectRelevance('', 'full resume', ['React', 'Node.js'], []);
      expect(withProjects.score).toBeGreaterThan(withoutProjects.score);
    });

    it('returns neutral when no skills needed', () => {
      const result = scoreProjectRelevance('Some project text', 'full resume', [], []);
      expect(result.score).toBe(0.7);
    });
  });

  // --- scoreResumeStructure ---
  describe('scoreResumeStructure', () => {
    it('gives full marks for complete resume sections', () => {
      const result = scoreResumeStructure(['skills', 'education', 'experience', 'projects', 'certifications']);
      expect(result.score).toBeGreaterThanOrEqual(0.9);
      expect(result.missingSections).toHaveLength(0);
    });

    it('deducts for missing important sections', () => {
      const result = scoreResumeStructure(['education']); // missing skills, experience
      expect(result.score).toBeLessThan(0.8);
      expect(result.missingSections).toContain('skills');
    });

    it('handles empty section list', () => {
      const result = scoreResumeStructure([]);
      expect(result.score).toBeLessThanOrEqual(0.3);
      expect(result.missingSections.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('provides suggestions for missing sections', () => {
      const result = scoreResumeStructure(['education']);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some((s) => s.length > 10)).toBe(true);
    });
  });

  // --- calculateScore (integration) ---
  describe('calculateScore', () => {
    const sampleResume = `
      SKILLS: React, Node.js, JavaScript, MongoDB, Git
      EDUCATION: B.Tech Computer Science, XYZ University, 2024
      PROJECTS:
        E-commerce App — Built with React and Node.js, integrated MongoDB
        Weather Dashboard — JavaScript, REST API integration
      EXPERIENCE:
        Software Intern at ABC Corp — React, Node.js, API development
    `;

    it('returns a score between 0 and 100', () => {
      const result = calculateScore({
        resumeText: sampleResume,
        sections: { skills: 'React, Node.js', projects: 'E-commerce App', experience: 'Internship' },
        detectedSectionNames: ['skills', 'education', 'projects', 'experience'],
        requiredSkills: ['React', 'Node.js'],
        preferredSkills: ['TypeScript'],
        keywords: ['full stack', 'api'],
      });
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(typeof result.overallScore).toBe('number');
    });

    it('returns a higher score for a well-matched resume', () => {
      const goodResult = calculateScore({
        resumeText: sampleResume,
        sections: { skills: 'React, Node.js', projects: 'React app' },
        detectedSectionNames: ['skills', 'education', 'projects', 'experience'],
        requiredSkills: ['React', 'Node.js', 'JavaScript'],
        preferredSkills: ['MongoDB'],
        keywords: ['api'],
      });

      const badResult = calculateScore({
        resumeText: 'Marketing professional with Excel and PowerPoint skills',
        sections: {},
        detectedSectionNames: [],
        requiredSkills: ['React', 'Node.js', 'JavaScript'],
        preferredSkills: ['MongoDB'],
        keywords: ['api'],
      });

      expect(goodResult.overallScore).toBeGreaterThan(badResult.overallScore);
    });

    it('handles completely empty data safely', () => {
      const result = calculateScore({
        resumeText: '',
        sections: {},
        detectedSectionNames: [],
        requiredSkills: [],
        preferredSkills: [],
        keywords: [],
      });
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('returns all expected fields', () => {
      const result = calculateScore({
        resumeText: sampleResume,
        sections: {},
        detectedSectionNames: ['skills', 'education'],
        requiredSkills: ['React'],
        preferredSkills: [],
        keywords: ['api'],
      });
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('scoreBreakdown');
      expect(result).toHaveProperty('matchedRequiredSkills');
      expect(result).toHaveProperty('missingRequiredSkills');
      expect(result).toHaveProperty('matchedKeywords');
      expect(result).toHaveProperty('missingKeywords');
      expect(result).toHaveProperty('structureFeedback');
      expect(result.scoreBreakdown).toHaveProperty('skillsMatch');
      expect(result.scoreBreakdown).toHaveProperty('keywordMatch');
      expect(result.scoreBreakdown).toHaveProperty('projectRelevance');
      expect(result.scoreBreakdown).toHaveProperty('experienceRelevance');
      expect(result.scoreBreakdown).toHaveProperty('resumeStructure');
    });

    it('score breakdown values are 0-100', () => {
      const result = calculateScore({
        resumeText: sampleResume,
        sections: { skills: 'React' },
        detectedSectionNames: ['skills'],
        requiredSkills: ['React', 'Docker'],
        preferredSkills: ['Kubernetes'],
        keywords: ['microservices'],
      });
      for (const val of Object.values(result.scoreBreakdown)) {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(100);
      }
    });
  });
});
