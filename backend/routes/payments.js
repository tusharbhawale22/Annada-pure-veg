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
const User = require('../models/User');
const sendEmail = require('../config/email');
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
      // Find the order first to check existence and idempotency
      const existingOrder = await Order.findById(orderId);
      if (!existingOrder) {
        return res.status(404).json({ success: false, message: 'Order not found — may have been cancelled.' });
      }
      // Idempotency: if already paid, return success without re-processing
      if (existingOrder.paymentStatus === 'paid') {
        return res.json({ success: true, message: 'Payment already verified.', paymentId: existingOrder.razorpayPaymentId });
      }

      existingOrder.paymentStatus = 'paid';
      existingOrder.razorpayPaymentId = razorpay_payment_id;
      existingOrder.orderStatus = 'confirmed';
      existingOrder.statusHistory.push({ status: 'confirmed', note: 'Payment received via Razorpay' });
      await existingOrder.save();

      // Notify admins
      try {
        const admins = await User.find({ role: 'admin' });
        const emails = admins.map(a => a.email);
        const userDetails = await User.findById(existingOrder.user);
        if (emails.length > 0) {
          const emailSubject = `💰 New Paid Order Received! (#${existingOrder._id.toString().slice(-6)})`;
          const emailText = `Hello Admin,\n\nA new order has been placed and PAID ONLINE by ${userDetails ? userDetails.name : 'a customer'}.\nTotal Amount: ₹${existingOrder.totalAmount}\nPayment Method: Razorpay\n\nPlease check the admin dashboard for details.`;
          // Fire and forget to avoid blocking API response
          Promise.all(emails.map(email => sendEmail({ email, subject: emailSubject, text: emailText })))
            .catch(err => console.error('Background email error:', err));
        }
      } catch (emailErr) {
        console.error('Failed to send admin notification email:', emailErr);
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

// ── POST /api/payments/cancel ──────────────────────────────
router.post('/cancel', protect, async (req, res, next) => {
  try {
    const { orderId, type = 'order' } = req.body;

    if (type === 'order') {
      // Mark as cancelled/failed instead of deleting — keeps a record and prevents ghost orders
      const order = await Order.findById(orderId);
      if (order && order.paymentStatus !== 'paid') {
        // Only cancel if not already paid (safety check)
        order.orderStatus = 'cancelled';
        order.paymentStatus = 'failed';
        order.statusHistory.push({ status: 'cancelled', note: 'Payment not completed by user' });
        await order.save();
      }
    } else {
      await TiffinSubscription.findByIdAndUpdate(orderId, {
        paymentStatus: 'failed',
        status: 'cancelled',
      });
    }

    res.json({
      success: true,
      message: 'Payment cancelled.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
