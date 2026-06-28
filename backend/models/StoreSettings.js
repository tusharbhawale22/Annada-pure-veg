/**
 * models/StoreSettings.js — Global store configuration
 * Single document pattern (only one settings doc exists)
 */

const mongoose = require('mongoose');

// ── Day timing sub-schema ──────────────────────────────────
const timingSchema = new mongoose.Schema({
  day:       { type: String, required: true },
  openTime:  { type: String, default: '07:00' }, // 24h format HH:MM
  closeTime: { type: String, default: '22:00' },
  isClosed:  { type: Boolean, default: false },
}, { _id: false });

// ── Store Settings schema ──────────────────────────────────
const storeSettingsSchema = new mongoose.Schema({
  storeName: {
    type: String,
    default: 'Annada Pure Veg',
    trim: true,
  },
  tagline: {
    type: String,
    default: 'Ghar Jaisi Subah, Har Subah 🌿',
    trim: true,
  },
  address: {
    type: String,
    default: 'Anand Park Bus Stop, near Sancheti Classes, Wadgaon Sheri, Pune - 411014',
    trim: true,
  },
  phone: {
    type: String,
    default: '+91 9763216146',
    trim: true,
  },
  whatsappNumber: {
    type: String,
    default: '919763216146', // Without '+', for wa.me links
    trim: true,
  },
  email: {
    type: String,
    default: 'info@annadapureveg.com',
    trim: true,
  },

  // ── Availability ──────────────────────────────────────────
  isOpen: {
    type: Boolean,
    default: true, // Admin can toggle store open/closed
  },
  closedMessage: {
    type: String,
    default: 'We are currently closed. Please check back during our working hours.',
  },

  // ── Timings ───────────────────────────────────────────────
  timings: {
    type: [timingSchema],
    default: [
      { day: 'Monday',    openTime: '07:00', closeTime: '22:00', isClosed: false },
      { day: 'Tuesday',   openTime: '07:00', closeTime: '22:00', isClosed: false },
      { day: 'Wednesday', openTime: '07:00', closeTime: '22:00', isClosed: false },
      { day: 'Thursday',  openTime: '07:00', closeTime: '22:00', isClosed: false },
      { day: 'Friday',    openTime: '07:00', closeTime: '22:00', isClosed: false },
      { day: 'Saturday',  openTime: '07:00', closeTime: '22:00', isClosed: false },
      { day: 'Sunday',    openTime: '07:00', closeTime: '21:00', isClosed: false },
    ],
  },

  // ── Delivery Configuration ────────────────────────────────
  deliveryFee: {
    type: Number,
    default: 30, // ₹30
  },
  minOrderAmount: {
    type: Number,
    default: 100, // ₹100 minimum
  },
  freeDeliveryAbove: {
    type: Number,
    default: 300, // Free delivery for orders above ₹300
  },
  deliveryAreas: {
    type: [String],
    default: ['Kharadi', 'Viman Nagar', 'Sainath Nagar', 'Wadgaon Sheri'],
  },

  // ── Financial ─────────────────────────────────────────────
  taxRate: {
    type: Number,
    default: 5, // 5% GST
    min: 0,
    max: 28,
  },

  // ── Location ─────────────────────────────────────────────
  googleMapsEmbedUrl: {
    type: String,
    // Google Maps embed for Anand Park, Wadgaon Sheri, Pune
    default: 'https://maps.google.com/maps?q=Annada%20Pure%20Veg,%20Anand%20Park,%20Wadgaon%20Sheri,%20Pune&t=&z=15&ie=UTF8&iwloc=&output=embed',
  },
  googleMapsLink: {
    type: String,
    default: 'https://www.google.com/maps/dir/?api=1&destination=Annada+Pure+Veg,+Anand+Park+Bus+Stop,+Wadgaon+Sheri,+Pune',
  },

  // ── Social Links ──────────────────────────────────────────
  socialLinks: {
    instagram: { type: String, default: '' },
    facebook:  { type: String, default: '' },
  },

  // ── Tiffin Pricing ────────────────────────────────────────
  tiffinPlans: {
    type: [{
      id:           { type: String },
      name:         { type: String },
      planType:     { type: String, enum: ['weekly', 'monthly'] },
      mealType:     { type: String, enum: ['lunch', 'dinner', 'both'] },
      price:        { type: Number },
      description:  { type: String },
      numberOfDays: { type: Number },
      deliveryTime: { type: String },
      foodItems:    { type: String, default: 'Dal + Sabzi + Roti + Rice' },
      isAvailable:  { type: Boolean, default: true },
    }],
    default: [
      { id: 'wl', name: 'Weekly Lunch',   planType: 'weekly',  mealType: 'lunch',  price: 350,  description: '7 fresh home-style lunches delivered daily',          numberOfDays: 7,  deliveryTime: '12:30 PM',                       foodItems: 'Dal + Sabzi + Roti + Rice', isAvailable: true },
      { id: 'wd', name: 'Weekly Dinner',  planType: 'weekly',  mealType: 'dinner', price: 350,  description: '7 nutritious dinners, freshly made every evening',      numberOfDays: 7,  deliveryTime: '6:00 PM',                        foodItems: 'Dal + Sabzi + Roti + Rice', isAvailable: true },
      { id: 'wb', name: 'Weekly Both',    planType: 'weekly',  mealType: 'both',   price: 650,  description: 'Lunch + Dinner for 7 days — best value!',               numberOfDays: 7,  deliveryTime: 'Lunch: 12:30 PM, Dinner: 6:00 PM', foodItems: 'Dal + Sabzi + Roti + Rice', isAvailable: true },
      { id: 'ml', name: 'Monthly Lunch',  planType: 'monthly', mealType: 'lunch',  price: 1300, description: '30 lunches — the most popular tiffin plan',             numberOfDays: 30, deliveryTime: '12:30 PM',                       foodItems: 'Dal + Sabzi + Roti + Rice', isAvailable: true },
      { id: 'md', name: 'Monthly Dinner', planType: 'monthly', mealType: 'dinner', price: 1300, description: '30 dinners delivered right to your door',               numberOfDays: 30, deliveryTime: '6:00 PM',                        foodItems: 'Dal + Sabzi + Roti + Rice', isAvailable: true },
      { id: 'mb', name: 'Monthly Both',   planType: 'monthly', mealType: 'both',   price: 2400, description: 'Lunch + Dinner for 30 days — ultimate convenience',     numberOfDays: 30, deliveryTime: 'Lunch: 12:30 PM, Dinner: 6:00 PM', foodItems: 'Dal + Sabzi + Roti + Rice', isAvailable: true },
    ],
  },
}, { timestamps: true });

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);
