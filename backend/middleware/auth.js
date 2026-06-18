/**
 * middleware/auth.js — JWT authentication & role-based authorization
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — Verifies JWT from httpOnly cookie or Authorization header
 * Attaches req.user to the request object
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check httpOnly cookie (preferred — more secure)
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Fallback: Authorization header (Bearer token)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please log in to continue.',
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user (with passwordHash excluded via select: false in schema)
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token is invalid.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    next(error);
  }
};

/**
 * adminOnly — Restricts route to admin role users only
 * Must be used AFTER protect middleware
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Admin privileges required.',
  });
};

/**
 * generateToken — Creates a signed JWT for a user
 * @param {string} userId — MongoDB _id of the user
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * setTokenCookie — Sets httpOnly JWT cookie on the response
 * @param {object} res — Express response object
 * @param {string} token — JWT token
 */
const setTokenCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,          // JS cannot access this cookie — prevents XSS
    secure: isProd,          // Only HTTPS in production
    sameSite: isProd ? 'none' : 'lax', // Cross-site in production (for Vercel/Railway)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

/**
 * clearTokenCookie — Clears the JWT cookie (logout)
 */
const clearTokenCookie = (res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    expires: new Date(0),
  });
};

module.exports = { protect, adminOnly, generateToken, setTokenCookie, clearTokenCookie };
