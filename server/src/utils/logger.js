'use strict';
const config = require('../config');

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = config.isDev ? 3 : 2;

function format(level, message, meta) {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    return `${base} ${JSON.stringify(meta)}`;
  }
  return base;
}

const logger = {
  error: (msg, meta = {}) => {
    if (levels.error <= currentLevel) console.error(format('error', msg, meta));
  },
  warn: (msg, meta = {}) => {
    if (levels.warn <= currentLevel) console.warn(format('warn', msg, meta));
  },
  info: (msg, meta = {}) => {
    if (levels.info <= currentLevel) console.info(format('info', msg, meta));
  },
  debug: (msg, meta = {}) => {
    if (levels.debug <= currentLevel) console.debug(format('debug', msg, meta));
  },
};

module.exports = logger;
