'use strict';
require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const config = require('./config');
const logger = require('./utils/logger');

const PORT = config.port;

async function startServer() {
  if (config.nodeEnv === 'production' && config.jwt.secret.length < 32) {
    logger.error('JWT_SECRET must be configured with at least 32 characters in production.');
    process.exit(1);
  }

  try {
    await connectDB();
    logger.info('Database connection established');
  } catch (err) {
    logger.warn(`Database connection failed: ${err.message}. Server will start without DB.`);
  }

  const server = app.listen(PORT, () => {
    logger.info(`ResumeIQ server running on port ${PORT} [${config.nodeEnv}]`);
    logger.info(`Health check: http://localhost:${PORT}/api/health`);
    logger.info(`AI recommendations: ${config.gemini.isConfigured ? 'ENABLED' : 'DISABLED (no Gemini API key)'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Closing server gracefully...');
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received. Closing server...');
    server.close(() => process.exit(0));
  });

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled promise rejection', { error: err.message });
  });
}

startServer();
