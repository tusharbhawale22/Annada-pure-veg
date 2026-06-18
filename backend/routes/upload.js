/**
 * routes/upload.js — Cloudinary image upload route
 * POST /api/upload/image — Upload an image (admin only)
 */

const express = require('express');
const multer = require('multer');
const { menuImageStorage, cloudinary } = require('../config/cloudinary');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const upload = multer({
  storage: menuImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'), false);
    }
  },
});

// ── POST /api/upload/image ─────────────────────────────────
router.post('/image', protect, adminOnly, uploadLimiter, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    res.json({
      success: true,
      message: 'Image uploaded successfully.',
      imageUrl: req.file.path,
      publicId: req.file.filename,
    });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/upload/image — Delete an image from Cloudinary
router.delete('/image', protect, adminOnly, async (req, res, next) => {
  try {
    const { publicId } = req.body;
    if (!publicId) return res.status(400).json({ success: false, message: 'Public ID is required.' });

    await cloudinary.uploader.destroy(publicId);
    res.json({ success: true, message: 'Image deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
