/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable SW in dev
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'cloudinary-images',
        expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 }, // 30 days
      },
    },
    {
      urlPattern: /\/api\/menu\/items/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'menu-api-cache',
        expiration: { maxEntries: 10, maxAgeSeconds: 60 * 5 }, // 5 min
      },
    },
  ],
});

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Enable strict mode for better React compatibility
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
