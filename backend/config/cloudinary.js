/**
 * config/cloudinary.js — Cloudinary configuration
 * Used for menu item image uploads
 */

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Multer-Cloudinary storage engine for menu item images
 * Images are stored in the 'annada-pure-veg/menu' folder on Cloudinary
 */
const menuImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'annada-pure-veg/menu',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'fill', gravity: 'auto' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  },
});

module.exports = { cloudinary, menuImageStorage };
