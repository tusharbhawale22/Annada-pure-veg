/**
 * routes/orders.js — Order management routes
 * POST  /api/orders             — Place new order (customer)
 * GET   /api/orders/my          — My orders (customer)
 * GET   /api/orders/:id         — Order detail (customer/admin)
 * GET   /api/orders             — All orders (admin)
 * PATCH /api/orders/:id/status  — Update status (admin)
 */

const express = require('express');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Coupon = require('../models/Coupon');
const StoreSettings = require('../models/StoreSettings');
const { protect, adminOnly } = require('../middleware/auth');
const { validateOrder } = require('../middleware/validate');
const { orderLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// ── POST /api/orders ───────────────────────────────────────
router.post('/', protect, orderLimiter, validateOrder, async (req, res, next) => {
  try {
    const { items, orderType, paymentMethod, deliveryAddress, couponCode, notes } = req.body;

    // Fetch store settings for fees and tax rate
    const settings = await StoreSettings.findOne();
    const taxRate = settings?.taxRate || 5;
    const deliveryFee = orderType === 'delivery' ? (settings?.deliveryFee || 30) : 0;

    // Validate all menu items and build order items
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        return res.status(404).json({ success: false, message: `Menu item ${item.menuItem} not found.` });
      }
      if (!menuItem.isAvailable) {
        return res.status(400).json({ success: false, message: `"${menuItem.name}" is currently not available.` });
      }

      const lineTotal = menuItem.price * item.quantity;
      subtotal += lineTotal;

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        imageUrl: menuItem.imageUrl,
      });
    }

    // Check minimum order amount
    if (settings?.minOrderAmount && subtotal < settings.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ₹${settings.minOrderAmount}. Your cart is ₹${subtotal}.`,
      });
    }

    // Check free delivery
    let isEligibleForFreeDelivery = false;
    if (orderType === 'delivery' && deliveryAddress && deliveryAddress.area) {
      const targetArea = deliveryAddress.area.trim().toLowerCase();
      const allowedAreas = settings?.deliveryAreas || ['Kharadi', 'Viman Nagar', 'Sainath Nagar', 'Wadgaon Sheri'];
      isEligibleForFreeDelivery = allowedAreas.some(area => area.trim().toLowerCase() === targetArea);
    }

    const actualDeliveryFee = (isEligibleForFreeDelivery && settings?.freeDeliveryAbove && subtotal >= settings.freeDeliveryAbove)
      ? 0 : deliveryFee;


    // Apply coupon
    let discount = 0;
    let validCouponCode = '';
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && coupon.expiresAt > new Date() && coupon.usedCount < coupon.maxUses) {
        // Enforce single-use check during order creation
        const existingUsage = await Order.findOne({
          user: req.user._id,
          couponCode: couponCode.toUpperCase(),
          paymentStatus: { $ne: 'failed' }
        });

        if (!existingUsage && subtotal >= coupon.minOrderAmount) {
          if (coupon.discountType === 'percentage') {
            discount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
          } else {
            discount = coupon.discountValue;
          }
          validCouponCode = coupon.code;
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
    }

    // Calculate totals
    const taxableAmount = subtotal - discount + actualDeliveryFee;
    const tax = Math.round((taxableAmount * taxRate) / 100);
    const totalAmount = taxableAmount + tax;

    // Create order
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      subtotal,
      deliveryFee: actualDeliveryFee,
      discount,
      tax,
      totalAmount,
      couponCode: validCouponCode,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      orderType,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      notes: notes || '',
    });

    const populated = await Order.findById(order._id).populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! 🎉',
      order: populated,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/orders/my ─────────────────────────────────────
router.get('/my', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/orders — All orders (admin) ───────────────────
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, paymentMethod, date, search } = req.query;

    const filter = {};
    if (status) filter.orderStatus = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    let query = Order.find(filter).populate('user', 'name email phone');

    // Search by order number or customer name
    if (search) {
      const users = await require('../models/User').find({
        name: { $regex: search, $options: 'i' },
      }).select('_id');
      query = Order.find({
        ...filter,
        $or: [
          { orderNumber: { $regex: search, $options: 'i' } },
          { user: { $in: users.map((u) => u._id) } },
        ],
      }).populate('user', 'name email phone');
    }

    const orders = await query
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      orders,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/orders/:id ────────────────────────────────────
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Customers can only view their own orders
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/orders/:id/status ──────────────────────────
router.patch('/:id/status', protect, adminOnly, async (req, res, next) => {
  try {
    const { status, note } = req.body;

    const validStatuses = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    order.orderStatus = status;
    order.statusHistory.push({ status, note: note || '' });

    // Mark payment as paid for COD when delivered
    if (status === 'delivered' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
    }

    await order.save();

    res.json({ success: true, message: `Order status updated to "${status}".`, order });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/orders/offline (Admin Only) ──────────────────
router.post('/offline', protect, adminOnly, async (req, res, next) => {
  try {
    const { items, orderType, paymentMethod, paymentStatus, customerName, customerPhone, deliveryAddress, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must have at least one item.' });
    }

    // Fetch settings for tax and delivery fee
    const settings = await StoreSettings.findOne();
    const taxRate = settings?.taxRate || 5;
    const deliveryFee = orderType === 'delivery' ? (settings?.deliveryFee || 30) : 0;

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        return res.status(404).json({ success: false, message: `Menu item ${item.menuItem} not found.` });
      }

      const lineTotal = menuItem.price * item.quantity;
      subtotal += lineTotal;

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        imageUrl: menuItem.imageUrl,
      });
    }

    // Apply delivery fee only if it's delivery and subtotal is below freeDeliveryAbove threshold
    const actualDeliveryFee = (orderType === 'delivery' && settings?.freeDeliveryAbove && subtotal >= settings.freeDeliveryAbove)
      ? 0 : deliveryFee;

    // Calculate totals
    const taxableAmount = subtotal + actualDeliveryFee;
    const tax = Math.round((taxableAmount * taxRate) / 100);
    const totalAmount = taxableAmount + tax;

    // Create the offline order
    const order = await Order.create({
      items: orderItems,
      subtotal,
      deliveryFee: actualDeliveryFee,
      discount: 0,
      tax,
      totalAmount,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      orderType,
      paymentMethod,
      paymentStatus: paymentStatus || 'paid',
      orderStatus: 'delivered',
      isOffline: true,
      customerName: customerName || 'Offline Customer',
      customerPhone: customerPhone || '',
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: 'Offline order created successfully! 📝',
      order,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
