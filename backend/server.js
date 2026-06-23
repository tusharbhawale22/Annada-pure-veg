/** 
 * server.js — Express application entry point
 * Annada Pure Veg Backend API
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// ── Import Routes ──────────────────────────────────────────
const authRoutes     = require('./routes/auth');
const menuRoutes     = require('./routes/menu');
const orderRoutes    = require('./routes/orders');
const paymentRoutes  = require('./routes/payments');
const couponRoutes   = require('./routes/coupons');
const analyticsRoutes = require('./routes/analytics');
const customerRoutes = require('./routes/customers');
const settingsRoutes = require('./routes/settings');
const tiffinRoutes   = require('./routes/tiffin');
const uploadRoutes   = require('./routes/upload');
const reviewsRoutes  = require('./routes/reviews');

// ── Connect to MongoDB ─────────────────────────────────────
connectDB();

const app = express();

// Trust proxy for rate limiting (needed behind reverse proxies like Render/Vercel)
app.set('trust proxy', 1);

// ── Security Middleware ────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow Cloudinary images
}));

// ── CORS ───────────────────────────────────────────────────
// ── CORS ───────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',').map((u) => u.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


// ── Body Parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Request Logging ────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Rate Limiting (applied to all /api routes) ─────────────
app.use('/api', generalLimiter);

// ── Health Check ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '🌿 Annada Pure Veg API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/menu',      menuRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/payments',  paymentRoutes);
app.use('/api/coupons',   couponRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings',  settingsRoutes);
app.use('/api/tiffin',    tiffinRoutes);
app.use('/api/upload',    uploadRoutes);
app.use('/api/reviews',   reviewsRoutes);

// ── 404 Handler ────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ── Global Error Handler (must be last middleware) ─────────
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Annada Pure Veg API running on port ${PORT}`);
  console.log(`🌿 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

module.exports = app;
