'use strict';
const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const { authenticate } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');
const { validate, renameResumeSchema } = require('../validators');

router.use(authenticate);

router.post('/', upload.single('resume'), handleMulterError, resumeController.uploadResume);
router.get('/', resumeController.getResumes);
router.get('/:id', resumeController.getResume);
router.patch('/:id', validate(renameResumeSchema), resumeController.renameResume);
router.delete('/:id', resumeController.deleteResume);

module.exports = router;
