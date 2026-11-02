'use strict';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resumes');
const analysisRoutes = require('./routes/analyses');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// — Security headers
app.use(helmet());

// — CORS
app.use(
  cors({
    origin: [...new Set([
      ...config.cors.clientUrl.split(',').map((origin) => origin.trim()).filter(Boolean),
      'http://localhost:5173',
      'http://localhost:3000',
    ])],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// — Body parsing (limit size)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// — HTTP logging
if (config.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );
}

// — Global rate limit
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP. Please try again later.' },
});
app.use('/api/', globalLimiter);

// — Health check (unauthenticated, no rate limit)
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    aiConfigured: config.gemini.isConfigured,
    version: '1.0.0',
  });
});

// — Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/analyses', analysisRoutes);

// — 404 handler
app.use(notFound);

// — Global error handler
app.use(errorHandler);

module.exports = app;
