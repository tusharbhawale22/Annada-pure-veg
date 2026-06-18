/**
 * models/TiffinSubscription.js — Tiffin service subscription schema
 */

const mongoose = require('mongoose');

const tiffinSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subscriptionNumber: {
    type: String,
    unique: true,
    // Auto-generated: TIF0001, TIF0002, ...
  },

  // ── Plan Details ──────────────────────────────────────────
  planType: {
    type: String,
    enum: ['weekly', 'monthly'],
    required: [true, 'Plan type is required'],
  },
  mealType: {
    type: String,
    enum: ['lunch', 'dinner', 'both'],
    required: [true, 'Meal type is required'],
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
    required: true,
    // Auto-calculated: +7 days for weekly, +30 days for monthly
  },

  // ── Delivery ─────────────────────────────────────────────
  deliveryAddress: {
    line1:    { type: String, required: true, trim: true },
    area:     { type: String, required: true, trim: true },
    pincode:  { type: String, required: true, trim: true },
    landmark: { type: String, trim: true, default: '' },
  },
  deliveryTime: {
    lunch:  { type: String, default: '12:30 PM' },
    dinner: { type: String, default: '8:00 PM' },
  },

  // ── Status ────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'completed'],
    default: 'active',
  },
  pausedUntil: {
    type: Date,
    default: null, // Set when status = 'paused'
  },

  // ── Payment ───────────────────────────────────────────────
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'failed'],
    default: 'pending',
  },
  razorpayOrderId:   { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },

  // ── Notes ─────────────────────────────────────────────────
  notes: {
    type: String,
    default: '',
    maxlength: 300,
  },
  renewalReminder: {
    type: Boolean,
    default: true, // Whether to remind user before expiry
  },
}, { timestamps: true });

// ── Indexes ────────────────────────────────────────────────
tiffinSubscriptionSchema.index({ user: 1 });
tiffinSubscriptionSchema.index({ status: 1 });
tiffinSubscriptionSchema.index({ endDate: 1 });
tiffinSubscriptionSchema.index({ subscriptionNumber: 1 });

// ── Pre-save: auto-generate subscription number ────────────
tiffinSubscriptionSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('TiffinSubscription').countDocuments();
    this.subscriptionNumber = `TIF${String(count + 1).padStart(4, '0')}`;

    // Auto-calculate end date
    const start = new Date(this.startDate);
    if (this.planType === 'weekly') {
      this.endDate = new Date(start.setDate(start.getDate() + 7));
    } else {
      this.endDate = new Date(start.setDate(start.getDate() + 30));
    }
  }
  next();
});

// ── Virtual: days remaining ────────────────────────────────
tiffinSubscriptionSchema.virtual('daysRemaining').get(function () {
  if (this.status !== 'active') return 0;
  const diff = this.endDate - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

module.exports = mongoose.model('TiffinSubscription', tiffinSubscriptionSchema);
