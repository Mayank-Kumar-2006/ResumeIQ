'use strict';
require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/resumeiq',
  },

  jwt: {
    // A development-only fallback keeps local setup simple; production must provide a strong secret.
    secret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'local_dev_only_secret_change_before_deploy_32_chars'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

    gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-3.1-flash-lite',
    isConfigured: !!process.env.GEMINI_API_KEY,
  },

  upload: {
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5,
    maxFileSizeBytes: (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5) * 1024 * 1024,
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    allowedMimeTypes: ['application/pdf'],
  },

  cors: {
    // Comma-separated origins are supported for split frontend/backend deployments.
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
    analysisMax: parseInt(process.env.ANALYSIS_RATE_LIMIT_MAX, 10) || 20,
  },
};

module.exports = config;
