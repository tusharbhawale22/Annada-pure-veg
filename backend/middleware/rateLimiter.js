/**
 * middleware/rateLimiter.js — API rate limiting to prevent abuse
 */

const rateLimit = require('express-rate-limit');

const isProd = process.env.NODE_ENV === 'production';

/**
 * generalLimiter — Applied to all /api routes
 * 100 requests per IP per 15 minutes in prod, 1000 in dev
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 100 : 1000,
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET', // Don't rate-limit GET requests
});

/**
 * authLimiter — Applied to login/register routes
 * 5 attempts per IP per 15 minutes in prod, 100 in dev
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 5 : 100,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * orderLimiter — Applied to POST /api/orders
 * 10 order attempts per IP per 10 minutes (prevent spam orders)
 */
const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many order attempts. Please wait a moment and try again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * uploadLimiter — Applied to image upload routes
 * 20 uploads per IP per hour
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many upload requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generalLimiter, authLimiter, orderLimiter, uploadLimiter };
