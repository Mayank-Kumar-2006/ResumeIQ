'use strict';
const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const { authenticate } = require('../middleware/auth');
const { validate, analysisRequestSchema } = require('../validators');
const rateLimit = require('express-rate-limit');
const config = require('../config');

const analysisLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.analysisMax,
  message: { success: false, message: 'Too many analysis requests. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate);

router.get('/stats', analysisController.getStats);
router.post('/', analysisLimiter, validate(analysisRequestSchema), analysisController.createAnalysis);
router.get('/', analysisController.getAnalyses);
router.get('/:id', analysisController.getAnalysis);
router.delete('/:id', analysisController.deleteAnalysis);
router.post('/:id/ai-recommendations', analysisLimiter, analysisController.regenerateAI);

module.exports = router;
