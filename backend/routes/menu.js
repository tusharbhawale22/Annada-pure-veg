/**
 * routes/menu.js — Menu item routes
 * GET    /api/menu/items           — All items (public)
 * GET    /api/menu/items/specials  — Today's specials (public)
 * GET    /api/menu/items/:id       — Single item (public)
 * POST   /api/menu/items           — Add item (admin)
 * PUT    /api/menu/items/:id       — Update item (admin)
 * DELETE /api/menu/items/:id       — Delete item (admin)
 * PATCH  /api/menu/items/:id/toggle-special — Toggle today's special (admin)
 * PATCH  /api/menu/items/:id/toggle-available — Toggle availability (admin)
 */

const express = require('express');
const multer = require('multer');
const MenuItem = require('../models/MenuItem');
const { protect, adminOnly } = require('../middleware/auth');
const { validateMenuItem } = require('../middleware/validate');
const { menuImageStorage, cloudinary } = require('../config/cloudinary');

const router = express.Router();
const upload = multer({ storage: menuImageStorage });

// ── GET /api/menu/items ────────────────────────────────────
router.get('/items', async (req, res, next) => {
  try {
    const { category, search, available } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (available !== undefined) filter.isAvailable = available === 'true';

    let query = MenuItem.find(filter);

    // Full-text search
    if (search) {
      query = MenuItem.find({
        ...filter,
        $text: { $search: search },
      });
    }

    const items = await query.sort({ isTodaySpecial: -1, sortOrder: 1, name: 1 });

    res.json({ success: true, count: items.length, items });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/menu/items/specials ───────────────────────────
router.get('/items/specials', async (req, res, next) => {
  try {
    const specials = await MenuItem.find({ isTodaySpecial: true, isAvailable: true });
    res.json({ success: true, items: specials });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/menu/items/:id ────────────────────────────────
router.get('/items/:id', async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found.' });
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/menu/items ───────────────────────────────────
router.post('/items', protect, adminOnly, upload.single('image'), validateMenuItem, async (req, res, next) => {
  try {
    const itemData = { ...req.body };

    if (req.file) {
      itemData.imageUrl = req.file.path;
      itemData.cloudinaryPublicId = req.file.filename;
    }

    const item = await MenuItem.create(itemData);
    res.status(201).json({ success: true, message: 'Menu item added successfully.', item });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/menu/items/:id ────────────────────────────────
router.put('/items/:id', protect, adminOnly, upload.single('image'), async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found.' });

    const updateData = { ...req.body };

    if (req.file) {
      // Delete old image from Cloudinary
      if (item.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(item.cloudinaryPublicId);
      }
      updateData.imageUrl = req.file.path;
      updateData.cloudinaryPublicId = req.file.filename;
    }

    const updated = await MenuItem.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: 'Menu item updated.', item: updated });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/menu/items/:id ─────────────────────────────
router.delete('/items/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found.' });

    // Delete image from Cloudinary
    if (item.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(item.cloudinaryPublicId);
    }

    await item.deleteOne();
    res.json({ success: true, message: 'Menu item deleted.' });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/menu/items/:id/toggle-special ──────────────
router.patch('/items/:id/toggle-special', protect, adminOnly, async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    item.isTodaySpecial = !item.isTodaySpecial;
    await item.save();

    res.json({
      success: true,
      message: `"${item.name}" is ${item.isTodaySpecial ? 'now' : 'no longer'} Today's Special.`,
      item,
    });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/menu/items/:id/toggle-available ─────────────
router.patch('/items/:id/toggle-available', protect, adminOnly, async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.json({
      success: true,
      message: `"${item.name}" is now ${item.isAvailable ? 'Available' : 'Sold Out'}.`,
      item,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
