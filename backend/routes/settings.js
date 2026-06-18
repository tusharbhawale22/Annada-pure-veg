/**
 * routes/settings.js — Store settings routes
 * GET /api/settings       — Get store settings (public)
 * PUT /api/settings       — Update settings (admin)
 * PATCH /api/settings/toggle-store — Toggle store open/closed (admin)
 */

const express = require('express');
const StoreSettings = require('../models/StoreSettings');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/settings ──────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      // Create default settings if none exist
      settings = await StoreSettings.create({});
    }
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/settings ──────────────────────────────────────
router.put('/', protect, adminOnly, async (req, res, next) => {
  try {
    let settings = await StoreSettings.findOne();

    if (!settings) {
      settings = await StoreSettings.create(req.body);
    } else {
      settings = await StoreSettings.findByIdAndUpdate(settings._id, req.body, {
        new: true,
        runValidators: true,
      });
    }

    res.json({ success: true, message: 'Settings updated.', settings });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/settings/toggle-store ──────────────────────
router.patch('/toggle-store', protect, adminOnly, async (req, res, next) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) settings = await StoreSettings.create({});

    settings.isOpen = !settings.isOpen;
    await settings.save();

    res.json({
      success: true,
      message: `Store is now ${settings.isOpen ? '🟢 Open' : '🔴 Closed'}`,
      isOpen: settings.isOpen,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
