const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// @route   POST /api/reviews
// @desc    Submit a review for a delivered order
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { orderId, rating, comment } = req.body;

    if (!orderId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Please provide all fields' });
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this order' });
    }

    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Only delivered orders can be reviewed' });
    }

    if (order.hasReviewed) {
      return res.status(400).json({ success: false, message: 'Order has already been reviewed' });
    }

    const review = await Review.create({
      user: req.user.id,
      order: orderId,
      rating,
      comment
    });

    order.hasReviewed = true;
    await order.save();

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/reviews
// @desc    Get all approved reviews (populated with user name and area)
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const reviews = await Review.find({ isApproved: true })
      .populate({
        path: 'user',
        select: 'name addresses.area', // Getting name and area for testimonials
      })
      .sort({ createdAt: -1 })
      .limit(10); // get top 10 recent reviews

    // Format the response slightly to extract area from addresses array if it exists
    const formattedReviews = reviews.map(r => {
      let area = 'Pune';
      if (r.user && r.user.addresses && r.user.addresses.length > 0) {
        area = r.user.addresses[0].area || 'Pune';
      }
      return {
        _id: r._id,
        name: r.user ? r.user.name : 'Anonymous',
        area,
        rating: r.rating,
        text: r.comment,
        avatar: ['👩', '👨', '👩‍🦱', '👨‍🦰'][Math.floor(Math.random() * 4)], // Random avatar for now
        createdAt: r.createdAt
      };
    });

    res.status(200).json({ success: true, data: formattedReviews });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
