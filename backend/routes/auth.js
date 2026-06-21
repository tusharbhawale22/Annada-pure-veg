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
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../config/email');
const { protect, generateToken, setTokenCookie, clearTokenCookie } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// ── POST /api/auth/register ────────────────────────────────
router.post('/register', authLimiter, validateRegister, async (req, res, next) => {
  try {
    const { name, email, phone, password, address } = req.body;

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Build addresses array — include registration address if provided
    const addresses = [];
    if (address && address.line1 && address.area && address.pincode) {
      addresses.push({
        label:    address.label || 'Home',
        line1:    address.line1,
        area:     address.area,
        pincode:  address.pincode,
        landmark: address.landmark || '',
      });
    }

    // Create user (passwordHash will be hashed in pre-save hook)
    const user = await User.create({ name, email, phone, passwordHash: password, addresses });

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

// ── POST /api/auth/forgot-password ─────────────────────────
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address.' });
    }

    const otp = user.createPasswordResetOTP();
    await user.save({ validateBeforeSave: false });

    // Send reset email containing the OTP
    const emailSubject = 'Annada Pure Veg — Password Reset OTP';
    const emailText = `Hello ${user.name},\n\nYour password reset OTP is ${otp}.\n\nThis OTP will expire in 10 minutes.\n\nIf you did not request this, you can ignore this email.\n\nAnnada Pure Veg 🌿`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #E65100; margin: 0;">Annada Pure Veg 🌿</h2>
          <p style="color: #666; font-style: italic; margin: 5px 0 0 0;">Ghar Jaisi Subah, Har Subah</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <div style="padding: 20px 0; text-align: center;">
          <p style="text-align: left;">Hello <strong>${user.name}</strong>,</p>
          <p style="text-align: left;">We received a request to reset the password for your account. Please use the following One-Time Password (OTP) to reset your password:</p>
          <div style="background-color: #FDF0E6; border: 1px dashed #E65100; color: #E65100; padding: 15px 30px; font-size: 28px; font-weight: bold; letter-spacing: 5px; display: inline-block; margin: 20px auto; border-radius: 8px;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 13px; text-align: left; margin-top: 20px;">This OTP will expire in 10 minutes. If you did not request a password reset, you can safely ignore this email.</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 11px; color: #999; text-align: center; margin-top: 20px;">
          Annada Pure Veg, Anand Park Bus Stop, Wadgaon Sheri, Pune - 411014
        </p>
      </div>
    `;

    let previewUrl = null;
    try {
      previewUrl = await sendEmail({
        email: user.email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });
    } catch (mailErr) {
      console.error('Error sending reset email:', mailErr);
    }

    const responseData = {
      success: true,
      message: 'Password reset OTP has been sent to your email.',
    };

    if (previewUrl) {
      responseData.previewUrl = previewUrl;
    }

    res.json(responseData);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/reset-password/:token ───────────────────
router.post('/reset-password/:token', async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Find user with matching token and unexpired expiry date
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset token is invalid or has expired.' });
    }

    user.passwordHash = password; // plaintext, pre-save hook will hash it
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully! You can now log in.' });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/reset-password-otp ───────────────────────
router.post('/reset-password-otp', async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ success: false, message: 'Email, OTP and new password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const hashedOtp = crypto
      .createHash('sha256')
      .update(otp.trim())
      .digest('hex');

    // Find user with matching email, OTP and unexpired expiry
    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetToken: hashedOtp,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'OTP is invalid or has expired.' });
    }

    user.passwordHash = password; // plaintext, pre-save hook will hash it
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully! You can now log in.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
