'use strict';
const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Resume name too long'],
    },
    originalFilename: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    parseStatus: {
      type: String,
      enum: ['pending', 'success', 'partial', 'failed'],
      default: 'pending',
    },
    parseError: {
      type: String,
      default: null,
    },
    rawText: {
      type: String,
      default: '',
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    sections: {
      contact: { type: String, default: '' },
      summary: { type: String, default: '' },
      skills: { type: String, default: '' },
      experience: { type: String, default: '' },
      education: { type: String, default: '' },
      projects: { type: String, default: '' },
      certifications: { type: String, default: '' },
      other: { type: String, default: '' },
    },
    detectedSections: {
      type: [String],
      default: [],
    },
    extractedSkills: {
      type: [String],
      default: [],
    },
    isScanned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

resumeSchema.virtual('analysisCount', {
  ref: 'Analysis',
  localField: '_id',
  foreignField: 'resume',
  count: true,
});

module.exports = mongoose.model('Resume', resumeSchema);
