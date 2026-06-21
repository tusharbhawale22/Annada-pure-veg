/**
 * models/Order.js — Customer order schema
 */

const mongoose = require('mongoose');

// ── Order Item sub-schema ──────────────────────────────────
const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  name:     { type: String, required: true }, // Snapshot at time of order
  price:    { type: Number, required: true }, // Snapshot at time of order
  quantity: { type: Number, required: true, min: 1 },
  imageUrl: { type: String, default: '' },
}, { _id: true });

// ── Status History sub-schema ──────────────────────────────
const statusHistorySchema = new mongoose.Schema({
  status:    { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note:      { type: String, default: '' },
}, { _id: false });

// ── Order schema ───────────────────────────────────────────
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for offline orders
  },
  isOffline: {
    type: Boolean,
    default: false,
  },
  customerName: {
    type: String,
    default: '',
  },
  customerPhone: {
    type: String,
    default: '',
  },
  orderNumber: {
    type: String,
    unique: true,
    // Auto-generated in pre-save hook: APV00001, APV00002, ...
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: (arr) => arr.length > 0,
      message: 'Order must have at least one item',
    },
  },

  // ── Pricing ──────────────────────────────────────────────
  subtotal:     { type: Number, required: true },
  deliveryFee:  { type: Number, default: 0 },
  discount:     { type: Number, default: 0 },  // Coupon discount
  tax:          { type: Number, default: 0 },  // GST amount
  totalAmount:  { type: Number, required: true },
  couponCode:   { type: String, default: '' },

  // ── Delivery ─────────────────────────────────────────────
  deliveryAddress: {
    line1:    { type: String },
    area:     { type: String },
    pincode:  { type: String },
    landmark: { type: String },
  },
  orderType: {
    type: String,
    enum: ['delivery', 'pickup', 'dine-in', 'takeaway'],
    required: true,
  },

  // ── Payment ───────────────────────────────────────────────
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cod', 'cash', 'upi', 'card'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  razorpayOrderId:   { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },

  // ── Order Status ──────────────────────────────────────────
  orderStatus: {
    type: String,
    enum: [
      'placed',          // Order received
      'confirmed',       // Admin confirmed
      'preparing',       // Kitchen is making it
      'ready',           // Ready for pickup/delivery
      'out_for_delivery',// On the way
      'delivered',       // Completed
      'cancelled',       // Cancelled
    ],
    default: 'placed',
  },
  statusHistory: {
    type: [statusHistorySchema],
    default: [],
  },

  estimatedDeliveryTime: { type: Date },
  notes: { type: String, default: '' }, // Customer notes / special instructions
  hasReviewed: { type: Boolean, default: false }, // Track if order is reviewed

}, { timestamps: true });

// ── Indexes ────────────────────────────────────────────────
orderSchema.index({ user: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderNumber: 1 });

// ── Pre-save: auto-generate order number ───────────────────
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `APV${String(count + 1).padStart(5, '0')}`;
    this.statusHistory.push({
      status: 'placed',
      note: 'Order placed successfully',
    });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
