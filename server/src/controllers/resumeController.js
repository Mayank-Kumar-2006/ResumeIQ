'use strict';
const path = require('path');
const Resume = require('../models/Resume');
const { parsePDF, cleanupFile } = require('../services/pdfParser');
const { extractSkillsFromText } = require('../services/nlpService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// POST /api/resumes — Upload and parse a new resume
async function uploadResume(req, res, next) {
  const filePath = req.file ? req.file.path : null;

  try {
    if (!req.file) {
      return next(new AppError('No file uploaded. Please select a PDF file.', 400));
    }

    const name = req.body.name || req.file.originalname.replace(/\.pdf$/i, '');

    // Create resume record immediately so user sees it
    const resume = await Resume.create({
      user: req.user._id,
      name,
      originalFilename: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      parseStatus: 'pending',
    });

    // Parse the PDF
    let parseResult;
    try {
      parseResult = await parsePDF(filePath);
    } catch (parseErr) {
      await Resume.findByIdAndUpdate(resume._id, {
        parseStatus: 'failed',
        parseError: parseErr.message,
      });
      cleanupFile(filePath);
      return next(new AppError(`PDF parsing failed: ${parseErr.message}`, 422));
    }

    if (!parseResult.success) {
      await Resume.findByIdAndUpdate(resume._id, {
        parseStatus: 'failed',
        parseError: parseResult.error,
        isScanned: parseResult.isScanned,
      });
      cleanupFile(filePath);
      return res.status(422).json({
        success: false,
        message: parseResult.error,
        isScanned: parseResult.isScanned,
      });
    }

    // Extract skills from the raw text
    const extractedSkills = extractSkillsFromText(parseResult.rawText);

    // Save parsed data to resume
    const updatedResume = await Resume.findByIdAndUpdate(
      resume._id,
      {
        parseStatus: parseResult.status,
        rawText: parseResult.rawText,
        wordCount: parseResult.wordCount,
        pageCount: parseResult.pageCount,
        sections: parseResult.sections,
        detectedSections: parseResult.detectedSectionNames,
        extractedSkills,
        isScanned: parseResult.isScanned,
        parseError: null,
      },
      { new: true }
    );

    // Clean up the uploaded file (text is stored in DB)
    cleanupFile(filePath);

    logger.info('Resume uploaded and parsed', {
      resumeId: resume._id,
      userId: req.user._id,
      words: parseResult.wordCount,
    });

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and parsed successfully.',
      resume: updatedResume,
      warning: parseResult.warning,
    });
  } catch (err) {
    cleanupFile(filePath);
    next(err);
  }
}

// GET /api/resumes — List user's resumes
async function getResumes(req, res, next) {
  try {
    const resumes = await Resume.find({ user: req.user._id })
      .select('-rawText -sections') // Exclude large fields from list view
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: resumes.length, resumes });
  } catch (err) {
    next(err);
  }
}

// GET /api/resumes/:id — Get a single resume (including text)
async function getResume(req, res, next) {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      return next(new AppError('Resume not found.', 404));
    }
    res.json({ success: true, resume });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/resumes/:id — Rename a resume
async function renameResume(req, res, next) {
  try {
    const { name } = req.validatedData;
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name },
      { new: true, runValidators: true }
    ).select('-rawText -sections');

    if (!resume) {
      return next(new AppError('Resume not found.', 404));
    }

    res.json({ success: true, resume });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/resumes/:id — Delete a resume
async function deleteResume(req, res, next) {
  try {
    const Analysis = require('../models/Analysis');

    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      return next(new AppError('Resume not found.', 404));
    }

    // Also delete associated analyses
    await Analysis.deleteMany({ resume: resume._id, user: req.user._id });
    await resume.deleteOne();

    logger.info('Resume deleted', { resumeId: resume._id, userId: req.user._id });
    res.json({ success: true, message: 'Resume and associated analyses deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadResume, getResumes, getResume, renameResume, deleteResume };
