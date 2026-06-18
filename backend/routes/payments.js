/**
 * routes/payments.js — Razorpay payment routes
 * POST /api/payments/create-order   — Create Razorpay order
 * POST /api/payments/verify         — Verify payment signature
 */

const express = require('express');
const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const Order = require('../models/Order');
const TiffinSubscription = require('../models/TiffinSubscription');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/payments/create-order ───────────────────────
router.post('/create-order', protect, async (req, res, next) => {
  try {
    const { orderId, type = 'order' } = req.body; // type: 'order' | 'tiffin'

    let amount, currency = 'INR', receipt;

    if (type === 'order') {
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
      if (order.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
      amount = Math.round(order.totalAmount * 100); // Razorpay uses paise
      receipt = `order_${order.orderNumber}`;
    } else {
      const sub = await TiffinSubscription.findById(orderId);
      if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found.' });
      amount = Math.round(sub.price * 100);
      receipt = `tiffin_${sub.subscriptionNumber}`;
    }

    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      notes: {
        type,
        userId: req.user._id.toString(),
        itemId: orderId,
      },
    });

    // Store Razorpay order ID
    if (type === 'order') {
      await Order.findByIdAndUpdate(orderId, { razorpayOrderId: razorpayOrder.id });
    } else {
      await TiffinSubscription.findByIdAndUpdate(orderId, { razorpayOrderId: razorpayOrder.id });
    }

    res.json({
      success: true,
      razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/payments/verify ──────────────────────────────
router.post('/verify', protect, async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      type = 'order',
    } = req.body;

    // Verify HMAC signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.',
      });
    }

    // Update payment status
    if (type === 'order') {
      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          paymentStatus: 'paid',
          razorpayPaymentId: razorpay_payment_id,
          orderStatus: 'confirmed',
        },
        { new: true }
      );

      if (order) {
        order.statusHistory.push({ status: 'confirmed', note: 'Payment received via Razorpay' });
        await order.save();
      }
    } else {
      await TiffinSubscription.findByIdAndUpdate(orderId, {
        paymentStatus: 'paid',
        razorpayPaymentId: razorpay_payment_id,
        status: 'active',
      });
    }

    res.json({
      success: true,
      message: 'Payment verified successfully! 🎉',
      paymentId: razorpay_payment_id,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
