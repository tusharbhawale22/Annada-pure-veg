/**
 * routes/auth.js — Authentication routes
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/logout
 * GET  /api/auth/me
 * PUT  /api/auth/profile
 * PUT  /api/auth/change-password
 * POST /api/auth/address
 * DELETE /api/auth/address/:addressId
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, generateToken, setTokenCookie, clearTokenCookie } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// ── POST /api/auth/register ────────────────────────────────
router.post('/register', authLimiter, validateRegister, async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Create user (passwordHash will be hashed in pre-save hook)
    const user = await User.create({ name, email, phone, passwordHash: password });

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to Annada Pure Veg 🌿',
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login ───────────────────────────────────
router.post('/login', authLimiter, validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user WITH passwordHash (select: false in schema)
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.json({
      success: true,
      message: `Welcome back, ${user.name}! 🌿`,
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/logout ──────────────────────────────────
router.post('/logout', (req, res) => {
  clearTokenCookie(res);
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ── GET /api/auth/me ───────────────────────────────────────
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/auth/profile ──────────────────────────────────
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: 'Profile updated successfully.', user });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/auth/change-password ─────────────────────────
router.put('/change-password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save({ validateBeforeSave: false }); // Skip re-hashing in pre-save

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/address ─────────────────────────────────
router.post('/address', protect, async (req, res, next) => {
  try {
    const { label, line1, area, pincode, landmark } = req.body;
    const user = await User.findById(req.user._id);

    if (user.addresses.length >= 5) {
      return res.status(400).json({ success: false, message: 'You can save a maximum of 5 addresses.' });
    }

    user.addresses.push({ label, line1, area, pincode, landmark });
    await user.save();

    res.json({ success: true, message: 'Address added successfully.', addresses: user.addresses });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/auth/address/:addressId ───────────────────
router.delete('/address/:addressId', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(
      (addr) => addr._id.toString() !== req.params.addressId
    );
    await user.save();

    res.json({ success: true, message: 'Address removed.', addresses: user.addresses });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
