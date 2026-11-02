'use strict';
const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
    },
    resumeName: { type: String, default: '' },

    // Job Info
    jobTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Job title too long'],
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: [200, 'Company name too long'],
      default: '',
    },
    jobDescription: {
      type: String,
      required: true,
      maxlength: [20000, 'Job description too long'],
    },

    // Scores  (0-100)
    overallScore: { type: Number, default: 0, min: 0, max: 100 },
    scoreBreakdown: {
      skillsMatch: { type: Number, default: 0 },
      keywordMatch: { type: Number, default: 0 },
      projectRelevance: { type: Number, default: 0 },
      experienceRelevance: { type: Number, default: 0 },
      resumeStructure: { type: Number, default: 0 },
    },

    // Skills
    matchedRequiredSkills: { type: [String], default: [] },
    missingRequiredSkills: { type: [String], default: [] },
    matchedPreferredSkills: { type: [String], default: [] },
    missingPreferredSkills: { type: [String], default: [] },

    // Keywords
    matchedKeywords: { type: [String], default: [] },
    missingKeywords: { type: [String], default: [] },

    // Extracted Job Info
    extractedRequiredSkills: { type: [String], default: [] },
    extractedPreferredSkills: { type: [String], default: [] },
    extractedKeywords: { type: [String], default: [] },
    experienceRequirement: { type: String, default: '' },
    educationRequirement: { type: String, default: '' },

    // Evidence
    skillEvidence: { type: mongoose.Schema.Types.Mixed, default: {} },
    projectMatches: { type: [String], default: [] },

    // Structure feedback
    structureFeedback: {
      detectedSections: { type: [String], default: [] },
      missingSections: { type: [String], default: [] },
      suggestions: { type: [String], default: [] },
    },

    // AI Recommendations
    aiRecommendations: {
      available: { type: Boolean, default: false },
      summary: { type: String, default: '' },
      skillGapExplanation: { type: String, default: '' },
      bulletRewrites: { type: [mongoose.Schema.Types.Mixed], default: [] },
      prioritizedSuggestions: { type: [String], default: [] },
      projectHighlightSuggestions: { type: [String], default: [] },
      generatedAt: { type: Date },
      model: { type: String, default: '' },
    },

    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
    },
    errorMessage: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Index for history queries
analysisSchema.index({ user: 1, createdAt: -1 });
analysisSchema.index({ user: 1, jobTitle: 'text', companyName: 'text' });

module.exports = mongoose.model('Analysis', analysisSchema);
