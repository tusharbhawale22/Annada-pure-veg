import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import FloatingCartButton from '@/components/FloatingCartButton';
import WhatsAppButton from '@/components/WhatsAppButton';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://annada-pure-veg.netlify.app'),
  title: {
    default: 'Annada Pure Veg — Ghar Jaisi Subah, Har Subah',
    template: '%s | Annada Pure Veg',
  },
  description:
    'Order fresh 100% pure vegetarian breakfast online from Annada Pure Veg, Wadgaon Sheri, Pune. Poha, Idli, Vada, Paratha & more. Also offering daily tiffin services to Kharadi, Viman Nagar & Sainath Nagar.',
  keywords: [
    'pure veg breakfast Pune',
    'tiffin service Pune',
    'Annada Pure Veg',
    'Wadgaon Sheri food',
    'Kharadi tiffin',
    'Viman Nagar tiffin',
    'Idli Sambhar Pune',
    'Poha Pune',
    'online breakfast delivery Pune',
  ],
  authors: [{ name: 'Annada Pure Veg' }],
  creator: 'Annada Pure Veg',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://annadapureveg.com',
    siteName: 'Annada Pure Veg',
    title: 'Annada Pure Veg — 100% Pure Vegetarian Breakfast & Tiffin',
    description:
      'Fresh, homestyle vegetarian breakfast delivered to your door in Pune. Poha, Idli, Vada, Paratha & daily tiffin service.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Annada Pure Veg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Annada Pure Veg — Pure Veg Breakfast & Tiffin, Pune',
    description: 'Fresh homestyle vegetarian breakfast. Order online or subscribe to our tiffin service.',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#E65100',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-cream text-espresso antialiased">
        <Providers>
          {/* Sticky top navbar */}
          <Navbar />

          {/* Slide-in cart drawer */}
          <CartDrawer />

          {/* Page content */}
          <main>{children}</main>

          {/* Footer */}
          <Footer />

          {/* Floating buttons */}
          <FloatingCartButton />
          <WhatsAppButton />
        </Providers>
      </body>
    </html>
  );
}
