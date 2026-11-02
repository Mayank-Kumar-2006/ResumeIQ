'use strict';
const Resume = require('../models/Resume');
const Analysis = require('../models/Analysis');
const { analyzeJobDescription } = require('../services/nlpService');
const { calculateScore } = require('../services/scoringEngine');
const { generateRecommendations } = require('../services/aiService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Escape user-supplied search text so it is treated as a literal query, not a regex program.
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// POST /api/analyses — Create a new analysis
async function createAnalysis(req, res, next) {
  try {
    const { resumeId, jobTitle, companyName, jobDescription } = req.validatedData;

    // Verify resume ownership
    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) {
      return next(new AppError('Resume not found or access denied.', 404));
    }

    if (resume.parseStatus === 'failed') {
      return next(
        new AppError(
          'This resume could not be parsed. Please upload a text-based PDF.',
          422
        )
      );
    }

    if (!resume.rawText || resume.rawText.length < 50) {
      return next(
        new AppError('Resume has too little content to analyze. Please upload a complete resume.', 422)
      );
    }

    // Create initial analysis record
    const analysis = await Analysis.create({
      user: req.user._id,
      resume: resume._id,
      resumeName: resume.name,
      jobTitle,
      companyName: companyName || '',
      jobDescription,
      status: 'processing',
    });

    // Run analysis asynchronously (respond immediately, update record)
    runAnalysis(analysis._id, resume, jobTitle, companyName, jobDescription).catch((err) => {
      logger.error('Analysis failed in background', { analysisId: analysis._id, error: err.message });
    });

    res.status(202).json({
      success: true,
      message: 'Analysis started. Poll /api/analyses/:id for results.',
      analysisId: analysis._id,
    });
  } catch (err) {
    next(err);
  }
}

async function runAnalysis(analysisId, resume, jobTitle, companyName, jobDescription) {
  try {
    // 1. Analyze job description
    const jdAnalysis = analyzeJobDescription(jobDescription);

    // 2. Calculate deterministic score
    const scoreResult = calculateScore({
      resumeText: resume.rawText,
      sections: resume.sections,
      detectedSectionNames: resume.detectedSections || [],
      requiredSkills: jdAnalysis.requiredSkills,
      preferredSkills: jdAnalysis.preferredSkills,
      keywords: jdAnalysis.keywords,
      experienceRequirement: jdAnalysis.experienceRequirement,
    });

    // 3. Generate AI recommendations (non-blocking, graceful failure)
    const allMatchedSkills = [
      ...scoreResult.matchedRequiredSkills,
      ...scoreResult.matchedPreferredSkills,
    ];
    const aiResult = await generateRecommendations({
      jobTitle,
      companyName,
      missingRequiredSkills: scoreResult.missingRequiredSkills,
      missingPreferredSkills: scoreResult.missingPreferredSkills,
      matchedSkills: allMatchedSkills,
      overallScore: scoreResult.overallScore,
      resumeText: resume.rawText,
      jobDescription,
      projectsSection: resume.sections?.projects || '',
      experienceSection: resume.sections?.experience || '',
    });

    // 4. Save completed analysis
    await Analysis.findByIdAndUpdate(analysisId, {
      status: 'completed',

      overallScore: scoreResult.overallScore,
      scoreBreakdown: scoreResult.scoreBreakdown,

      matchedRequiredSkills: scoreResult.matchedRequiredSkills,
      missingRequiredSkills: scoreResult.missingRequiredSkills,
      matchedPreferredSkills: scoreResult.matchedPreferredSkills,
      missingPreferredSkills: scoreResult.missingPreferredSkills,

      matchedKeywords: scoreResult.matchedKeywords,
      missingKeywords: scoreResult.missingKeywords,

      extractedRequiredSkills: jdAnalysis.requiredSkills,
      extractedPreferredSkills: jdAnalysis.preferredSkills,
      extractedKeywords: jdAnalysis.keywords,
      experienceRequirement: jdAnalysis.experienceRequirement,
      educationRequirement: jdAnalysis.educationRequirement,

      skillEvidence: scoreResult.skillEvidence,
      projectMatches: scoreResult.projectMatches,
      structureFeedback: scoreResult.structureFeedback,

      aiRecommendations: aiResult.available
        ? {
            available: true,
            summary: aiResult.summary,
            skillGapExplanation: aiResult.skillGapExplanation,
            bulletRewrites: aiResult.bulletRewrites,
            prioritizedSuggestions: aiResult.prioritizedSuggestions,
            projectHighlightSuggestions: aiResult.projectHighlightSuggestions,
            generatedAt: aiResult.generatedAt,
            model: aiResult.model,
          }
        : {
            available: false,
            summary: aiResult.reason || 'AI recommendations unavailable.',
          },
    });

    logger.info('Analysis completed', { analysisId, score: scoreResult.overallScore });
  } catch (err) {
    await Analysis.findByIdAndUpdate(analysisId, {
      status: 'failed',
      errorMessage: err.message,
    });
    throw err;
  }
}

// GET /api/analyses/:id — Get a single analysis result
async function getAnalysis(req, res, next) {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!analysis) {
      return next(new AppError('Analysis not found or access denied.', 404));
    }

    res.json({ success: true, analysis });
  } catch (err) {
    next(err);
  }
}

// GET /api/analyses — List user's analyses (with search and filter)
async function getAnalyses(req, res, next) {
  try {
    const { search, sort = '-createdAt', page = 1, limit = 20 } = req.query;

    const query = { user: req.user._id };

    if (search) {
      const safeSearch = escapeRegex(String(search).slice(0, 100));
      query.$or = [
        { jobTitle: { $regex: safeSearch, $options: 'i' } },
        { companyName: { $regex: safeSearch, $options: 'i' } },
        { resumeName: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const parsedPage = Number.parseInt(page, 10);
    const parsedLimit = Number.parseInt(limit, 10);
    if (!Number.isInteger(parsedPage) || parsedPage < 1 || !Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return next(new AppError('Invalid pagination. Page must be at least 1 and limit must be between 1 and 100.', 400));
    }
    const sortFields = new Set(['createdAt', '-createdAt', 'overallScore', '-overallScore', 'jobTitle', '-jobTitle']);
    const safeSort = sortFields.has(sort) ? sort : '-createdAt';
    const skip = (parsedPage - 1) * parsedLimit;
    const total = await Analysis.countDocuments(query);
    const analyses = await Analysis.find(query)
      .select('-jobDescription -skillEvidence -aiRecommendations.bulletRewrites')
      .sort(safeSort)
      .skip(skip)
      .limit(parsedLimit)
      .lean();

    res.json({
      success: true,
      total,
      page: parsedPage,
      totalPages: Math.ceil(total / parsedLimit),
      analyses,
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/analyses/:id
async function deleteAnalysis(req, res, next) {
  try {
    const analysis = await Analysis.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!analysis) {
      return next(new AppError('Analysis not found or access denied.', 404));
    }

    res.json({ success: true, message: 'Analysis deleted.' });
  } catch (err) {
    next(err);
  }
}

// POST /api/analyses/:id/ai-recommendations — Regenerate AI recommendations
async function regenerateAI(req, res, next) {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'completed',
    });

    if (!analysis) {
      return next(new AppError('Completed analysis not found.', 404));
    }

    const resume = await Resume.findById(analysis.resume);
    if (!resume) {
      return next(new AppError('Associated resume not found.', 404));
    }

    const allMatchedSkills = [
      ...analysis.matchedRequiredSkills,
      ...analysis.matchedPreferredSkills,
    ];

    const aiResult = await generateRecommendations({
      jobTitle: analysis.jobTitle,
      companyName: analysis.companyName,
      missingRequiredSkills: analysis.missingRequiredSkills,
      missingPreferredSkills: analysis.missingPreferredSkills,
      matchedSkills: allMatchedSkills,
      overallScore: analysis.overallScore,
      resumeText: resume.rawText,
      jobDescription: analysis.jobDescription,
      projectsSection: resume.sections?.projects || '',
      experienceSection: resume.sections?.experience || '',
    });

    await Analysis.findByIdAndUpdate(analysis._id, {
      aiRecommendations: aiResult.available
        ? {
            available: true,
            summary: aiResult.summary,
            skillGapExplanation: aiResult.skillGapExplanation,
            bulletRewrites: aiResult.bulletRewrites,
            prioritizedSuggestions: aiResult.prioritizedSuggestions,
            projectHighlightSuggestions: aiResult.projectHighlightSuggestions,
            generatedAt: aiResult.generatedAt,
            model: aiResult.model,
          }
        : { available: false, summary: aiResult.reason },
    });

    res.json({
      success: true,
      aiRecommendations: aiResult,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/analyses/stats — Dashboard stats
async function getStats(req, res, next) {
  try {
    const [totalAnalyses, completedAnalyses, recentAnalyses] = await Promise.all([
      Analysis.countDocuments({ user: req.user._id }),
      Analysis.countDocuments({ user: req.user._id, status: 'completed' }),
      Analysis.find({ user: req.user._id, status: 'completed' })
        .sort('-createdAt')
        .limit(5)
        .select('jobTitle companyName overallScore createdAt resumeName')
        .lean(),
    ]);

    const Resume = require('../models/Resume');
    const savedResumes = await Resume.countDocuments({ user: req.user._id });

    const avgScore =
      recentAnalyses.length > 0
        ? Math.round(recentAnalyses.reduce((sum, a) => sum + a.overallScore, 0) / recentAnalyses.length)
        : 0;

    res.json({
      success: true,
      stats: {
        totalAnalyses,
        completedAnalyses,
        savedResumes,
        avgScore,
        recentAnalyses,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createAnalysis,
  getAnalysis,
  getAnalyses,
  deleteAnalysis,
  regenerateAI,
  getStats,
};
