'use strict';
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { AppError } = require('./errorHandler');

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), config.upload.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `resume-${req.user._id}-${uniqueSuffix}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF files are allowed. Please upload a PDF resume.', 400), false);
  }
}

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSizeBytes,
    files: 1,
  },
  fileFilter,
});

function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(
        new AppError(
          `File too large. Maximum size is ${config.upload.maxFileSizeMb}MB.`,
          400
        )
      );
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Only one file can be uploaded at a time.', 400));
    }
    return next(new AppError(`Upload error: ${err.message}`, 400));
  }
  next(err);
}

module.exports = { upload, handleMulterError, uploadDir };
