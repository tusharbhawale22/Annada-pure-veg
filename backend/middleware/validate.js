/**
 * middleware/validate.js — Request validation middleware using express-validator
 */

const { validationResult, body, param } = require('express-validator');

/**
 * handleValidationErrors — Reads express-validator results and returns 400 if any errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg, // Return first error for UX simplicity
      errors: errors.array(),
    });
  }
  next();
};

// ── Auth Validators ────────────────────────────────────────

const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit Indian mobile number'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),

  handleValidationErrors,
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),

  handleValidationErrors,
];

// ── Menu Item Validators ───────────────────────────────────

const validateMenuItem = [
  body('name')
    .trim()
    .notEmpty().withMessage('Item name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isNumeric().withMessage('Price must be a number')
    .custom((val) => val > 0).withMessage('Price must be greater than 0'),

  body('category')
    .notEmpty().withMessage('Category is required'),

  handleValidationErrors,
];

// ── Order Validators ───────────────────────────────────────

const validateOrder = [
  body('items')
    .isArray({ min: 1 }).withMessage('Order must have at least one item'),

  body('items.*.menuItem')
    .notEmpty().withMessage('Menu item ID is required')
    .isMongoId().withMessage('Invalid menu item ID'),

  body('items.*.quantity')
    .isInt({ min: 1, max: 20 }).withMessage('Quantity must be between 1 and 20'),

  body('orderType')
    .notEmpty().withMessage('Order type is required')
    .isIn(['delivery', 'pickup']).withMessage('Order type must be delivery or pickup'),

  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['razorpay', 'cod']).withMessage('Invalid payment method'),

  body('deliveryAddress.line1')
    .if(body('orderType').equals('delivery'))
    .notEmpty().withMessage('Delivery address is required for delivery orders'),

  body('deliveryAddress.area')
    .if(body('orderType').equals('delivery'))
    .notEmpty().withMessage('Delivery area is required'),

  body('deliveryAddress.pincode')
    .if(body('orderType').equals('delivery'))
    .notEmpty().withMessage('Pincode is required')
    .matches(/^\d{6}$/).withMessage('Please enter a valid 6-digit pincode'),

  handleValidationErrors,
];

// ── Coupon Validators ──────────────────────────────────────

const validateCoupon = [
  body('code')
    .trim()
    .notEmpty().withMessage('Coupon code is required')
    .toUpperCase(),

  body('discountType')
    .notEmpty().withMessage('Discount type is required')
    .isIn(['percentage', 'flat']).withMessage('Discount type must be percentage or flat'),

  body('discountValue')
    .notEmpty().withMessage('Discount value is required')
    .isNumeric().withMessage('Discount value must be a number')
    .custom((val) => val > 0).withMessage('Discount value must be greater than 0'),

  body('expiresAt')
    .notEmpty().withMessage('Expiry date is required')
    .isISO8601().withMessage('Invalid expiry date format'),

  handleValidationErrors,
];

// ── Tiffin Validators ──────────────────────────────────────

const validateTiffinSubscription = [
  body('planType')
    .notEmpty().withMessage('Plan type is required')
    .isIn(['weekly', 'monthly']).withMessage('Plan type must be weekly or monthly'),

  body('mealType')
    .notEmpty().withMessage('Meal type is required')
    .isIn(['lunch', 'dinner', 'both']).withMessage('Meal type must be lunch, dinner, or both'),

  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Invalid start date format'),

  body('deliveryAddress.line1').notEmpty().withMessage('Delivery address is required'),
  body('deliveryAddress.area').notEmpty().withMessage('Delivery area is required'),
  body('deliveryAddress.pincode')
    .notEmpty().withMessage('Pincode is required')
    .matches(/^\d{6}$/).withMessage('Please enter a valid 6-digit pincode'),

  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateMenuItem,
  validateOrder,
  validateCoupon,
  validateTiffinSubscription,
  handleValidationErrors,
};
