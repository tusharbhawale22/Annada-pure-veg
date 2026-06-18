/**
 * models/Coupon.js — Discount coupon schema
 */

const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [20, 'Coupon code cannot exceed 20 characters'],
    match: [/^[A-Z0-9]+$/, 'Coupon code can only contain letters and numbers'],
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  discountType: {
    type: String,
    enum: ['percentage', 'flat'],
    required: true,
    default: 'percentage',
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [1, 'Discount must be at least 1'],
  },
  maxDiscount: {
    type: Number,
    default: null, // For percentage type — cap the max discount amount
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxUses: {
    type: Number,
    default: 100,
    min: 1,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiry date is required'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  applicableTo: {
    type: String,
    enum: ['all', 'orders', 'tiffin'],
    default: 'all',
  },
}, { timestamps: true });

// ── Indexes ────────────────────────────────────────────────
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, expiresAt: 1 });

// ── Virtual: is coupon still valid? ───────────────────────
couponSchema.virtual('isValid').get(function () {
  return (
    this.isActive &&
    this.expiresAt > new Date() &&
    this.usedCount < this.maxUses
  );
});

module.exports = mongoose.model('Coupon', couponSchema);
