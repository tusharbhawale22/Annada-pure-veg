/**
 * seed.js — Database seed script for Annada Pure Veg
 *
 * Run with: npm run seed
 *
 * Creates:
 *  - 1 admin user
 *  - 21 pure vegetarian menu items
 *  - Store settings (Wadgaon Sheri, Pune)
 *  - 3 coupon codes
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User          = require('./models/User');
const MenuItem      = require('./models/MenuItem');
const Coupon        = require('./models/Coupon');
const StoreSettings = require('./models/StoreSettings');

// ── Connect ────────────────────────────────────────────────
async function connect() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');
}

// ── Seed Data ──────────────────────────────────────────────

const menuItems = [
  // ── POHA ────────────────────────────────────────────────
  {
    name: 'Kanda Poha',
    description: 'Fluffy flattened rice with golden onions, mustard seeds, curry leaves, and fresh coriander. Topped with sev and lemon.',
    price: 50,
    category: 'Morning Booster',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: true,
    sortOrder: 1,
    preparationTime: 10,
  },
  {
    name: 'Batata Poha',
    description: 'Soft poha with tender spiced potatoes, roasted peanuts, turmeric, and a squeeze of fresh lemon.',
    price: 55,
    category: 'Morning Booster',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: false,
    sortOrder: 2,
    preparationTime: 10,
  },
  {
    name: 'Dadpe Pohe',
    description: 'Traditional Maharashtrian raw poha tossed with fresh coconut, green chillies, lemon, and mustard. Light and refreshing.',
    price: 45,
    category: 'Morning Booster',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: false,
    sortOrder: 3,
    preparationTime: 5,
  },

  // ── UPMA ────────────────────────────────────────────────
  {
    name: 'Rava Upma',
    description: 'Semolina simmered with mixed vegetables, tempered with mustard, urad dal, and curry leaves. Served with coconut chutney.',
    price: 55,
    category: 'Morning Booster',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: false,
    sortOrder: 1,
    preparationTime: 15,
  },
  {
    name: 'Ragi Upma',
    description: 'Healthy finger millet upma with mixed vegetables and a tempering of mustard and green chillies. Rich in calcium.',
    price: 65,
    category: 'Morning Booster',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: false,
    sortOrder: 2,
    preparationTime: 15,
  },

  // ── IDLI-SAMBHAR ────────────────────────────────────────
  {
    name: 'Idli Sambhar (2 pcs)',
    description: 'Soft, pillowy steamed rice cakes served with piping hot lentil sambhar and two kinds of coconut chutney.',
    price: 60,
    category: 'Morning Booster',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: false,
    sortOrder: 1,
    preparationTime: 5,
  },
  {
    name: 'Idli Sambhar (4 pcs)',
    description: 'Four soft idlis with generous sambhar and chutney — perfect for a hearty breakfast.',
    price: 100,
    category: 'Morning Booster',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: false,
    sortOrder: 2,
    preparationTime: 5,
  },
  {
    name: 'Mini Idli Sambhar (8 pcs)',
    description: 'Eight bite-sized idlis floating in a bowl of aromatic sambhar with ghee — the Pune favourite!',
    price: 80,
    category: 'Morning Booster',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: true,
    sortOrder: 3,
    preparationTime: 10,
  },
  {
    name: 'Rava Idli (2 pcs)',
    description: 'Fluffy semolina idlis with cashews and mustard, served with tomato chutney. Light yet filling.',
    price: 70,
    category: 'Morning Booster',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: false,
    sortOrder: 4,
    preparationTime: 10,
  },

  // ── VADA ────────────────────────────────────────────────
  {
    name: 'Medu Vada (2 pcs)',
    description: 'Crispy, golden urad dal vadas with a soft center — served with sambhar and coconut chutney.',
    price: 65,
    category: 'Morning Booster',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: false,
    sortOrder: 1,
    preparationTime: 10,
  },
  {
    name: 'Sambar Vada',
    description: 'Medu vadas dunked in hot sambhar and topped with fresh onion, coriander, and a dollop of chutney. A Pune breakfast classic.',
    price: 75,
    category: 'Morning Booster',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: true,
    sortOrder: 2,
    preparationTime: 10,
  },
  {
    name: 'Dahi Vada',
    description: 'Soft, soaked vadas in cool, creamy yogurt, drizzled with tamarind chutney, mint chutney, and roasted cumin.',
    price: 80,
    category: 'Morning Booster',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: false,
    sortOrder: 3,
    preparationTime: 10,
  },

  // ── PARATHA ─────────────────────────────────────────────
  {
    name: 'Aloo Paratha',
    description: 'Whole wheat flatbread stuffed with perfectly spiced mashed potatoes. Served with curd, homemade butter, and pickle.',
    price: 70,
    category: 'Morning Booster',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: false,
    sortOrder: 1,
    preparationTime: 15,
  },
  {
    name: 'Methi Paratha',
    description: 'Nutritious fenugreek leaves kneaded into whole wheat dough, rolled thin and cooked with a generous dollop of ghee.',
    price: 65,
    category: 'Morning Booster',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: false,
    sortOrder: 2,
    preparationTime: 15,
  },
  {
    name: 'Pyaaz Paratha',
    description: 'Flaky, layered paratha stuffed with spiced onions and green chillies. Served with curd and spicy pickle.',
    price: 65,
    category: 'Morning Booster',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: false,
    sortOrder: 3,
    preparationTime: 15,
  },

  // ── CHAI & DRINKS ────────────────────────────────────────
  {
    name: 'Masala Chai',
    description: 'Our signature brew — ginger, cardamom, cinnamon, and cloves simmered in full-cream milk. The soul of every morning.',
    price: 25,
    category: 'Others',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: false,
    sortOrder: 1,
    preparationTime: 5,
  },
  {
    name: 'Adrak Chai',
    description: 'Strong ginger tea with a warming kick — the perfect companion for a rainy Pune morning.',
    price: 20,
    category: 'Others',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: false,
    sortOrder: 2,
    preparationTime: 5,
  },
  {
    name: 'Cold Taak (Buttermilk)',
    description: 'Refreshing spiced buttermilk with roasted cumin, coriander, and a pinch of rock salt. Served chilled.',
    price: 30,
    category: 'Others',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: false,
    sortOrder: 3,
    preparationTime: 3,
  },

  // ── COMBOS ───────────────────────────────────────────────
  {
    name: 'Breakfast Combo - Poha & Chai',
    description: 'Our bestselling combo — Kanda Poha + Masala Chai. Ghar jaisi subah, har subah!',
    price: 70,
    category: 'Others',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: true,
    sortOrder: 1,
    preparationTime: 10,
  },
  {
    name: 'South Indian Combo',
    description: 'Idli Sambhar (2 pcs) + Medu Vada (1 pc) + Masala Chai. A complete South Indian breakfast experience.',
    price: 110,
    category: 'Others',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: false,
    sortOrder: 2,
    preparationTime: 10,
  },
  {
    name: 'Full Breakfast Thali',
    description: 'The complete spread! Poha + Upma + Idli (2 pcs) + Medu Vada (1 pc) + Sambhar + Chutney + Masala Chai. Perfect for a king\'s breakfast!',
    price: 160,
    category: 'Others',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: false,
    sortOrder: 3,
    preparationTime: 15,
  },

  // ── SPECIAL DISHES ──────────────────────────────────────
  {
    name: 'Special Amritsari Chole Kulche',
    description: 'Authentic spiced chickpea curry served with two soft, leavened clay-oven baked flatbreads stuffed with spiced potatoes and paneer. Served with pickle and butter.',
    price: 150,
    category: 'Special Dishes',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: true,
    sortOrder: 1,
    preparationTime: 15,
  },
  {
    name: 'Annada Special Veg Biryani',
    description: 'Fragrant basmati rice layered with fresh seasonal vegetables and premium spices, slow-cooked in a sealed handi. Served with cucumber raita.',
    price: 140,
    category: 'Special Dishes',
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: true,
    sortOrder: 2,
    preparationTime: 20,
  },

  // ── TODAY'S MENU ────────────────────────────────────────
  {
    name: 'Dal Bati Churma (Today Only)',
    description: 'Traditional Rajasthani treat: hard wheat rolls baked over charcoal, crushed and served with rich mixed lentil curry (dal) and sweet crumbled wheat mixture (churma). Topped with pure ghee.',
    price: 130,
    category: "Today's Menu",
    isVeg: true,
    isAvailable: true,
    isTodaySpecial: true,
    sortOrder: 1,
    preparationTime: 15,
  },
];

const coupons = [
  {
    code: 'WELCOME10',
    description: '10% off on your first order',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscount: 50,
    minOrderAmount: 100,
    maxUses: 500,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    isActive: true,
    applicableTo: 'orders',
  },
  {
    code: 'SAVE20',
    description: 'Flat ₹20 off on orders above ₹150',
    discountType: 'flat',
    discountValue: 20,
    minOrderAmount: 150,
    maxUses: 200,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
    isActive: true,
    applicableTo: 'orders',
  },
  {
    code: 'TIFFIN50',
    description: 'Flat ₹50 off on tiffin subscriptions',
    discountType: 'flat',
    discountValue: 50,
    minOrderAmount: 300,
    maxUses: 100,
    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
    isActive: true,
    applicableTo: 'tiffin',
  },
];

const storeSettings = {
  storeName: 'Annada Pure Veg',
  tagline: 'Ghar Jaisi Subah, Har Subah 🌿',
  address: 'Anand Park Bus Stop, near Sancheti Classes, Wadgaon Sheri, Pune - 411014',
  phone: '+91 98765 43210',
  whatsappNumber: '919876543210',
  email: 'info@annadapureveg.com',
  isOpen: true,
  timings: [
    { day: 'Monday',    openTime: '07:00', closeTime: '22:00', isClosed: false },
    { day: 'Tuesday',   openTime: '07:00', closeTime: '22:00', isClosed: false },
    { day: 'Wednesday', openTime: '07:00', closeTime: '22:00', isClosed: false },
    { day: 'Thursday',  openTime: '07:00', closeTime: '22:00', isClosed: false },
    { day: 'Friday',    openTime: '07:00', closeTime: '22:00', isClosed: false },
    { day: 'Saturday',  openTime: '07:00', closeTime: '22:00', isClosed: false },
    { day: 'Sunday',    openTime: '07:00', closeTime: '21:00', isClosed: false },
  ],
  deliveryFee: 30,
  minOrderAmount: 100,
  freeDeliveryAbove: 300,
  deliveryAreas: ['Kharadi', 'Viman Nagar', 'Sainath Nagar', 'Wadgaon Sheri'],
  taxRate: 5,
  googleMapsLink: 'https://www.google.com/maps/dir/?api=1&destination=Annada+Pure+Veg,+Anand+Park+Bus+Stop,+Wadgaon+Sheri,+Pune',
};

// ── Run Seed ───────────────────────────────────────────────
async function seed() {
  try {
    await connect();

    console.log('\n🌱 Starting seed...\n');

    // ── Clear existing data ─────────────────────────────────
    await User.deleteMany({});
    await MenuItem.deleteMany({});
    await Coupon.deleteMany({});
    await StoreSettings.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // ── Create admin user ───────────────────────────────────
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash('Admin@123', salt);

    const admin = await User.create({
      name: 'Annada Admin',
      email: 'admin@annadapureveg.com',
      phone: '9876543210',
      passwordHash,
      role: 'admin',
      isActive: true,
    });
    // Skip pre-save hook (already hashed)
    await User.updateOne({ _id: admin._id }, { passwordHash });

    console.log(`✅ Admin created: admin@annadapureveg.com / Admin@123`);

    // ── Create menu items ───────────────────────────────────
    const items = await MenuItem.insertMany(menuItems);
    console.log(`✅ Menu items created: ${items.length} items`);

    // ── Create coupons ──────────────────────────────────────
    await Coupon.insertMany(coupons);
    console.log('✅ Coupons created: WELCOME10, SAVE20, TIFFIN50');

    // ── Create store settings ───────────────────────────────
    await StoreSettings.create(storeSettings);
    console.log('✅ Store settings created');

    // ── Summary ─────────────────────────────────────────────
    console.log('\n🎉 Seed complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Store     : Annada Pure Veg');
    console.log('  Admin     : admin@annadapureveg.com');
    console.log('  Password  : Admin@123');
    console.log('  Menu items:', items.length);
    console.log('  Coupons   : WELCOME10 | SAVE20 | TIFFIN50');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    console.error(err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
