/**
 * models/User.js — User schema (customers & admins)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Address sub-schema ─────────────────────────────────────
const addressSchema = new mongoose.Schema({
  label:    { type: String, default: 'Home', trim: true },
  line1:    { type: String, required: true, trim: true },
  area:     { type: String, required: true, trim: true },
  pincode:  { type: String, required: true, trim: true },
  landmark: { type: String, trim: true },
}, { _id: true });

// ── User schema ────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
  },
  passwordHash: {
    type: String,
    required: true,
    select: false, // Never return password in queries by default
  },
  addresses: {
    type: [addressSchema],
    default: [],
    validate: {
      validator: (arr) => arr.length <= 5,
      message: 'You can save a maximum of 5 addresses',
    },
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
}, { timestamps: true });

// ── Indexes ────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });

// ── Instance Methods ───────────────────────────────────────

/**
 * Compare plain-text password with stored hash
 * @param {string} password — plain text password
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

/**
 * Return safe user object (no passwordHash)
 */
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

// ── Pre-save hook: hash password ───────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if the password field has been modified
  if (!this.isModified('passwordHash')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);
