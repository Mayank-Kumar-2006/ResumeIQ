'use strict';
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Section header patterns for detection
 */
const SECTION_PATTERNS = {
  contact: /^(contact|personal\s+info(rmation)?|about\s+me)/i,
  summary: /^(summary|objective|profile|about|professional\s+summary|career\s+objective)/i,
  skills: /^(skills?|technical\s+skills?|core\s+competencies|technologies|tools?\s+&\s+technologies)/i,
  experience: /^(experience|work\s+experience|employment|professional\s+experience|work\s+history|internship)/i,
  education: /^(education|academic|qualification|degree)/i,
  projects: /^(projects?|personal\s+projects?|academic\s+projects?|portfolio|open\s+source)/i,
  certifications: /^(certifications?|certificates?|licenses?|credentials?|courses?)/i,
  achievements: /^(achievements?|awards?|honors?|accomplishments?)/i,
};

/**
 * Normalize text extracted from PDF
 * - Collapses multiple spaces/newlines
 * - Removes control characters
 * - Normalizes unicode dashes and quotes
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[^\S\n]+/g, ' ')        // collapse horizontal whitespace
    .replace(/\n{3,}/g, '\n\n')       // max 2 consecutive newlines
    .replace(/[‘’]/g, "'")  // smart single quotes
    .replace(/[“”]/g, '"')  // smart double quotes
    .replace(/[–—]/g, '-')  // em/en dashes
    .replace(/ /g, ' ')          // non-breaking space
    .trim();
}

/**
 * Detect named sections in resume text and split content by section.
 */
function detectSections(text) {
  const lines = text.split('\n');
  const sections = {
    contact: '',
    summary: '',
    skills: '',
    experience: '',
    education: '',
    projects: '',
    certifications: '',
    other: '',
  };
  const detectedSectionNames = [];

  let currentSection = 'contact';
  const sectionBuffer = { contact: [] };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (sectionBuffer[currentSection]) {
        sectionBuffer[currentSection].push('');
      }
      continue;
    }

    // Check if this line looks like a section header
    // (short line, possibly all-caps or title-case, matches known patterns)
    const isLikelySectionHeader =
      trimmed.length <= 60 &&
      Object.entries(SECTION_PATTERNS).some(([sectionKey, pattern]) => {
        if (pattern.test(trimmed)) {
          if (!sectionBuffer[sectionKey]) {
            sectionBuffer[sectionKey] = [];
            detectedSectionNames.push(sectionKey);
          }
          currentSection = sectionKey;
          return true;
        }
        return false;
      });

    if (!isLikelySectionHeader) {
      if (!sectionBuffer[currentSection]) {
        sectionBuffer[currentSection] = [];
      }
      sectionBuffer[currentSection].push(line);
    }
  }

  // Join buffers into section text
  for (const [key, lines_] of Object.entries(sectionBuffer)) {
    sections[key] = lines_.join('\n').trim();
  }

  return { sections, detectedSectionNames };
}

/**
 * Quick check: does this text look like it came from a scanned image PDF?
 * Heuristics: very few words, lots of whitespace, non-ASCII garbage.
 */
function isLikelyScanned(text, pageCount) {
  if (!text || text.trim().length < 50) return true;
  const words = text.split(/\s+/).filter(Boolean);
  const wordsPerPage = pageCount > 0 ? words.length / pageCount : words.length;
  return wordsPerPage < 50; // fewer than 50 words/page is suspicious
}

/**
 * Main PDF parsing function.
 * @param {string} filePath - Absolute path to the uploaded PDF file
 * @returns {Promise<object>} Parsed resume data
 */
async function parsePDF(filePath) {
  let dataBuffer;
  try {
    dataBuffer = fs.readFileSync(filePath);
  } catch (err) {
    throw new Error(`Could not read file: ${err.message}`);
  }

  let pdfData;
  try {
    pdfData = await pdfParse(dataBuffer, {
      // Limit pages to avoid DoS with huge PDFs
      max: 10,
    });
  } catch (err) {
    logger.warn('PDF parse error', { error: err.message });
    throw new Error(
      'Could not parse this PDF. It may be password-protected, corrupted, or in an unsupported format.'
    );
  }

  const rawText = normalizeText(pdfData.text);
  const pageCount = pdfData.numpages || 1;
  const wordCount = rawText.split(/\s+/).filter(Boolean).length;

  // Detect scanned PDFs
  const scanned = isLikelyScanned(rawText, pageCount);

  if (scanned && wordCount < 30) {
    return {
      success: false,
      status: 'failed',
      error:
        'This appears to be a scanned/image PDF. Please use a text-based PDF or copy-paste your resume text.',
      rawText: '',
      wordCount: 0,
      pageCount,
      sections: {},
      detectedSectionNames: [],
      isScanned: true,
    };
  }

  const { sections, detectedSectionNames } = detectSections(rawText);

  const parseStatus = wordCount < 100 ? 'partial' : 'success';

  logger.info('PDF parsed successfully', {
    pages: pageCount,
    words: wordCount,
    sections: detectedSectionNames,
    scanned,
  });

  return {
    success: true,
    status: parseStatus,
    rawText,
    wordCount,
    pageCount,
    sections,
    detectedSectionNames,
    isScanned: scanned,
    warning:
      scanned
        ? 'Parsing quality may be reduced. If results seem incorrect, try a text-based PDF.'
        : wordCount < 100
        ? 'Limited text was extracted. Please verify the resume content is correct.'
        : null,
  };
}

/**
 * Clean up an uploaded file from disk.
 */
function cleanupFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    logger.warn('Failed to clean up uploaded file', { filePath, error: err.message });
  }
}

module.exports = { parsePDF, cleanupFile, normalizeText, detectSections };
