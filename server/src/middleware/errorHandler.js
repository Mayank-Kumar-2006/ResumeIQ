'use strict';
const logger = require('../utils/logger');
const config = require('../config');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

function handleCastError(err) {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
}

function handleDuplicateKeyError(err) {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new AppError(`${field} '${value}' already exists. Please use a different value.`, 400);
}

function handleValidationError(err) {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join('. ')}`, 400);
}

function handleJwtError() {
  return new AppError('Invalid token. Please log in again.', 401);
}

function handleJwtExpiredError() {
  return new AppError('Your session has expired. Please log in again.', 401);
}

function sendErrorDev(err, res) {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
}

function sendErrorProd(err, res) {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  } else {
    logger.error('Unexpected error', { error: err.message });
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    });
  }
}

function errorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  logger.error(`${err.statusCode} - ${err.message}`, {
    path: req.path,
    method: req.method,
    stack: config.isDev ? err.stack : undefined,
  });

  let error = { ...err, message: err.message };

  if (err.name === 'CastError') error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateKeyError(err);
  if (err.name === 'ValidationError') error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError') error = handleJwtError();
  if (err.name === 'TokenExpiredError') error = handleJwtExpiredError();

  if (config.isDev) {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
}

function notFound(req, res, next) {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
}

module.exports = { AppError, errorHandler, notFound };
