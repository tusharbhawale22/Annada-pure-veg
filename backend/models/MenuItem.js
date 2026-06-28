/**
 * models/MenuItem.js — Menu item schema
 * All items are 100% vegetarian (Annada Pure Veg)
 */

const mongoose = require('mongoose');

const CATEGORIES = [
  "Today's Menu",
  'Special Dishes',
  'Best Dishes',
  'Morning Booster',
  'Healthy Tummy',
  'Yummy Bites',
  'Wrap',
  'Pizza',
  'Maggi',
  'Tiffin',
  'Others',
];

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Description cannot exceed 300 characters'],
    default: '',
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [1, 'Price must be at least ₹1'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: CATEGORIES,
      message: `Category must be one of: ${CATEGORIES.join(', ')}`,
    },
  },
  imageUrl: {
    type: String,
    default: '',
  },
  cloudinaryPublicId: {
    type: String,
    default: '', // Used to delete old images when updating
  },
  isVeg: {
    type: Boolean,
    default: true, // Always true — Annada Pure Veg is 100% vegetarian
  },
  isAvailable: {
    type: Boolean,
    default: true, // Set to false to mark as "Sold Out"
  },
  isTodaySpecial: {
    type: Boolean,
    default: false, // Featured at the top of the menu
  },
  sortOrder: {
    type: Number,
    default: 0, // For manual ordering within category
  },
  preparationTime: {
    type: Number,
    default: 10, // Minutes
    min: 1,
  },
}, { timestamps: true });

// ── Indexes ────────────────────────────────────────────────
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ isAvailable: 1 });
menuItemSchema.index({ isTodaySpecial: 1 });
menuItemSchema.index({ name: 'text', description: 'text' }); // Full-text search

module.exports = mongoose.model('MenuItem', menuItemSchema);
module.exports.CATEGORIES = CATEGORIES;
