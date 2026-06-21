/**
 * routes/tiffin.js — Tiffin subscription routes
 * POST   /api/tiffin/subscribe      — New subscription (customer)
 * GET    /api/tiffin/my             — My subscriptions (customer)
 * GET    /api/tiffin/:id            — Subscription detail
 * PATCH  /api/tiffin/:id/pause      — Pause subscription
 * PATCH  /api/tiffin/:id/resume     — Resume subscription
 * PATCH  /api/tiffin/:id/cancel     — Cancel subscription
 * GET    /api/tiffin                — All subscriptions (admin)
 * PATCH  /api/tiffin/:id/status     — Update status (admin)
 */

const express = require('express');
const TiffinSubscription = require('../models/TiffinSubscription');
const StoreSettings = require('../models/StoreSettings');
const { protect, adminOnly } = require('../middleware/auth');
const { validateTiffinSubscription } = require('../middleware/validate');

const router = express.Router();

// ── POST /api/tiffin/subscribe ─────────────────────────────
router.post('/subscribe', protect, validateTiffinSubscription, async (req, res, next) => {
  try {
    const { planType, mealType, startDate, deliveryAddress, deliveryTime, notes } = req.body;

    // Get plan price from store settings
    const settings = await StoreSettings.findOne();
    const plan = settings?.tiffinPlans?.find(
      (p) => p.planType === planType && p.mealType === mealType
    );

    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid tiffin plan selected.' });
    }

    const subscription = await TiffinSubscription.create({
      user: req.user._id,
      planType,
      mealType,
      startDate: new Date(startDate),
      deliveryAddress,
      deliveryTime,
      price: plan.price,
      notes,
    });

    const populated = await TiffinSubscription.findById(subscription._id).populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: `Tiffin subscription created! Your ${planType} ${mealType} plan starts on ${new Date(startDate).toLocaleDateString('en-IN')} 🍱`,
      subscription: populated,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/tiffin/my ─────────────────────────────────────
router.get('/my', protect, async (req, res, next) => {
  try {
    const subscriptions = await TiffinSubscription.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, subscriptions });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/tiffin — All subscriptions (admin) ────────────
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const subscriptions = await TiffinSubscription.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await TiffinSubscription.countDocuments(filter);

    res.json({
      success: true,
      subscriptions,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/tiffin/:id ────────────────────────────────────
router.get('/:id', protect, async (req, res, next) => {
  try {
    const sub = await TiffinSubscription.findById(req.params.id).populate('user', 'name email phone');
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found.' });

    // Customers can only view their own
    if (req.user.role !== 'admin' && sub.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, subscription: sub });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/tiffin/:id/pause ────────────────────────────
router.patch('/:id/pause', protect, async (req, res, next) => {
  try {
    const sub = await TiffinSubscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found.' });

    if (sub.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (sub.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Only active subscriptions can be paused.' });
    }

    sub.status = 'paused';
    sub.pausedAt = new Date();
    sub.pausedUntil = req.body.pausedUntil ? new Date(req.body.pausedUntil) : null;
    await sub.save();

    res.json({ success: true, message: 'Subscription paused.', subscription: sub });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/tiffin/:id/resume ───────────────────────────
router.patch('/:id/resume', protect, async (req, res, next) => {
  try {
    const sub = await TiffinSubscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found.' });

    if (sub.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (sub.status !== 'paused') {
      return res.status(400).json({ success: false, message: 'Only paused subscriptions can be resumed.' });
    }

    // Calculate pause duration and extend endDate
    if (sub.pausedAt) {
      const pauseDurationMs = Date.now() - new Date(sub.pausedAt).getTime();
      if (pauseDurationMs > 0) {
        sub.endDate = new Date(new Date(sub.endDate).getTime() + pauseDurationMs);
      }
    }

    sub.status = 'active';
    sub.pausedAt = null;
    sub.pausedUntil = null;
    await sub.save();

    res.json({ success: true, message: 'Subscription resumed.', subscription: sub });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/tiffin/:id/cancel ───────────────────────────
router.patch('/:id/cancel', protect, async (req, res, next) => {
  try {
    const sub = await TiffinSubscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found.' });

    if (sub.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    sub.status = 'cancelled';
    await sub.save();

    res.json({ success: true, message: 'Subscription cancelled.', subscription: sub });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
