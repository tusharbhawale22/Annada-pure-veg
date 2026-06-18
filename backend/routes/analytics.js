/**
 * routes/analytics.js — Admin analytics & dashboard data
 * GET /api/analytics/dashboard   — Summary cards for today
 * GET /api/analytics/revenue     — Revenue over date range
 * GET /api/analytics/top-items   — Best-selling items
 */

const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const TiffinSubscription = require('../models/TiffinSubscription');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All analytics routes require admin
router.use(protect, adminOnly);

// ── GET /api/analytics/dashboard ──────────────────────────
router.get('/dashboard', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's orders
    const todayOrders = await Order.find({
      createdAt: { $gte: today, $lt: tomorrow },
      orderStatus: { $ne: 'cancelled' },
    });

    // Today's revenue
    const todayRevenue = todayOrders
      .filter((o) => o.paymentStatus === 'paid' || o.paymentMethod === 'cod')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // New customers today
    const newCustomers = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: today, $lt: tomorrow },
    });

    // Active tiffin subscriptions
    const activeTiffins = await TiffinSubscription.countDocuments({ status: 'active' });

    // Best-selling item today
    const itemCounts = {};
    todayOrders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.name;
        itemCounts[key] = (itemCounts[key] || 0) + item.quantity;
      });
    });
    const bestSellerToday = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];

    // Last 7 days revenue for chart
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayOrders = await Order.find({
        createdAt: { $gte: date, $lt: nextDate },
        orderStatus: { $ne: 'cancelled' },
      });

      const dayRevenue = dayOrders
        .filter((o) => o.paymentStatus === 'paid' || o.paymentMethod === 'cod')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      last7Days.push({
        date: date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        revenue: Math.round(dayRevenue),
        orders: dayOrders.length,
      });
    }

    // Recent 5 orders
    const recentOrders = await Order.find()
      .populate('user', 'name phone')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      dashboard: {
        todayRevenue: Math.round(todayRevenue),
        todayOrders: todayOrders.length,
        newCustomers,
        activeTiffins,
        bestSellerToday: bestSellerToday ? { name: bestSellerToday[0], count: bestSellerToday[1] } : null,
        last7DaysChart: last7Days,
        recentOrders,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/analytics/revenue ────────────────────────────
router.get('/revenue', async (req, res, next) => {
  try {
    const { from, to, groupBy = 'day' } = req.query;

    const start = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = to ? new Date(to) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Revenue by category
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      orderStatus: { $ne: 'cancelled' },
    });

    const categoryRevenue = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        // We don't store category in order items, so use a general grouping
        const revenue = item.price * item.quantity;
        categoryRevenue['Food Items'] = (categoryRevenue['Food Items'] || 0) + revenue;
      });
    });

    const totalRevenue = orders
      .filter((o) => o.paymentStatus === 'paid' || o.paymentMethod === 'cod')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({
      success: true,
      revenue: {
        total: Math.round(totalRevenue),
        totalOrders: orders.length,
        byCategory: Object.entries(categoryRevenue).map(([name, value]) => ({ name, value })),
        dateRange: { from: start, to: end },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/analytics/top-items ──────────────────────────
router.get('/top-items', async (req, res, next) => {
  try {
    const { limit = 5, days = 30 } = req.query;

    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const orders = await Order.find({
      createdAt: { $gte: since },
      orderStatus: { $ne: 'cancelled' },
    });

    const itemStats = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!itemStats[item.name]) {
          itemStats[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        itemStats[item.name].quantity += item.quantity;
        itemStats[item.name].revenue += item.price * item.quantity;
      });
    });

    const topItems = Object.values(itemStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, parseInt(limit));

    res.json({ success: true, topItems });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
