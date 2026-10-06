const rateLimit = require('express-rate-limit');

const limitMessage = (message) => ({
  success: false,
  message,
});

// General limit for the whole API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage('Too many requests. Please try again later.'),
});

// Stricter limit for login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage(
    'Too many login attempts. Please try again in 15 minutes.'
  ),
});

// Strict limit for AI calls
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitMessage(
    'AI analysis limit reached. Please try again later.'
  ),
});

module.exports = {
  apiLimiter,
  authLimiter,
  aiLimiter,
};
