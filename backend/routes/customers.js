/**
 * routes/customers.js — Customer management (admin)
 * GET /api/customers          — All customers list
 * GET /api/customers/:id      — Customer detail + order history
 */

const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const TiffinSubscription = require('../models/TiffinSubscription');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect, adminOnly);

// ── GET /api/customers ─────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const filter = { role: 'customer' };
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(filter);

    // Add order count and total spend for each customer
    const enriched = await Promise.all(
      customers.map(async (customer) => {
        const orders = await Order.find({
          user: customer._id,
          orderStatus: { $ne: 'cancelled' },
        });
        const totalSpend = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        return {
          ...customer.toObject(),
          orderCount: orders.length,
          totalSpend: Math.round(totalSpend),
        };
      })
    );

    res.json({
      success: true,
      customers: enriched,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/customers/:id ─────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

    const orders = await Order.find({ user: customer._id }).sort({ createdAt: -1 });
    const tiffins = await TiffinSubscription.find({ user: customer._id }).sort({ createdAt: -1 });
    const totalSpend = orders.filter(o => o.orderStatus !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({
      success: true,
      customer: customer.toObject(),
      orders,
      tiffins,
      stats: {
        totalOrders: orders.length,
        totalSpend: Math.round(totalSpend),
        activeTiffins: tiffins.filter((t) => t.status === 'active').length,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
