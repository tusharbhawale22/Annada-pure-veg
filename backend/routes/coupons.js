/**
 * routes/coupons.js — Coupon management
 * POST   /api/coupons/validate       — Validate & calculate discount (customer)
 * GET    /api/coupons                — All coupons (admin)
 * POST   /api/coupons                — Create coupon (admin)
 * PUT    /api/coupons/:id            — Update coupon (admin)
 * DELETE /api/coupons/:id            — Delete coupon (admin)
 */

const express = require('express');
const Coupon = require('../models/Coupon');
const { protect, adminOnly } = require('../middleware/auth');
const { validateCoupon } = require('../middleware/validate');

const router = express.Router();

// ── POST /api/coupons/validate ─────────────────────────────
router.post('/validate', protect, async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) return res.status(400).json({ success: false, message: 'Coupon code is required.' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code.' });
    if (coupon.expiresAt < new Date()) return res.status(400).json({ success: false, message: 'This coupon has expired.' });
    if (coupon.usedCount >= coupon.maxUses) return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit.' });
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon.`,
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.discountValue;
    }
    discount = Math.min(discount, orderAmount); // Can't discount more than order

    res.json({
      success: true,
      message: `Coupon applied! You save ₹${discount.toFixed(0)} 🎉`,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discount: Math.round(discount),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/coupons (admin) ───────────────────────────────
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/coupons (admin) ──────────────────────────────
router.post('/', protect, adminOnly, validateCoupon, async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, message: 'Coupon created.', coupon });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/coupons/:id (admin) ───────────────────────────
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    res.json({ success: true, message: 'Coupon updated.', coupon });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/coupons/:id (admin) ───────────────────────
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
