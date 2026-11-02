'use strict';
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

function signToken(userId) {
  return jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

function sendTokenResponse(user, statusCode, res) {
  const token = signToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password } = req.validatedData;

    const existing = await User.findOne({ email });
    if (existing) {
      return next(new AppError('An account with this email already exists.', 400));
    }

    const user = await User.create({ name, email, password });
    logger.info('New user registered', { userId: user._id });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.validatedData;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('This account has been disabled. Please contact support.', 403));
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    logger.info('User logged in', { userId: user._id });
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function getMe(req, res, next) {
  try {
    res.json({
      success: true,
      user: req.user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
async function logout(req, res) {
  res.json({ success: true, message: 'Logged out successfully.' });
}

// PATCH /api/auth/profile
async function updateProfile(req, res, next) {
  try {
    const { name } = req.validatedData;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/auth/change-password
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.validatedData;

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return next(new AppError('Current password is incorrect.', 401));
    }

    user.password = newPassword;
    await user.save();

    logger.info('User changed password', { userId: user._id });
    const token = signToken(user._id);
    res.json({ success: true, message: 'Password changed successfully.', token });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/auth/account
async function deleteAccount(req, res, next) {
  try {
    const Resume = require('../models/Resume');
    const Analysis = require('../models/Analysis');

    // Delete all user data
    await Analysis.deleteMany({ user: req.user._id });
    await Resume.deleteMany({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);

    logger.info('User account deleted', { userId: req.user._id });
    res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe, logout, updateProfile, changePassword, deleteAccount };
