'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, Phone, MapPin, Clock, Instagram, Facebook } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Hide footer on admin pages
  if (pathname?.startsWith('/admin')) return null;

  const quickLinks = [
    { href: '/',        label: 'Home'        },
    { href: '/menu',    label: 'Our Menu'    },
    { href: '/tiffin',  label: 'Tiffin Service' },
    { href: '/auth/login', label: 'Login'    },
  ];

  const categories = ['Poha', 'Upma', 'Idli-Sambhar', 'Vada', 'Paratha', 'Chai & Drinks', 'Combos'];


  return (
    <footer className="bg-espresso text-warm-200">
      {/* Top section */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-saffron-gradient rounded-xl flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-display font-bold text-xl text-white">Annada</p>
                <p className="text-xs text-gold-400 font-semibold tracking-widest">PURE VEG</p>
              </div>
            </div>
            <p className="text-warm-300 text-sm leading-relaxed mb-5">
              Bringing the warmth of homestyle vegetarian cooking to your mornings.
              <span className="italic text-gold-400"> Ghar Jaisi Subah, Har Subah.</span>
            </p>
            {/* Veg indicator */}
            <div className="flex items-center gap-2 bg-leaf/20 text-leaf-light text-sm font-semibold px-3 py-2 rounded-xl w-fit border border-leaf/30">
              🌿 100% Pure Vegetarian
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-display font-semibold text-white text-base mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-warm-300 hover:text-gold-400 transition-colors flex items-center gap-2">
                    <span className="w-1 h-1 bg-saffron-900 rounded-full" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Menu categories */}
          <div>
            <h3 className="font-display font-semibold text-white text-base mb-4">On the Menu</h3>
            <ul className="space-y-2.5">
              {categories.map((cat) => (
                <li key={cat}>
                  <Link href={`/menu?category=${encodeURIComponent(cat)}`}
                    className="text-sm text-warm-300 hover:text-gold-400 transition-colors flex items-center gap-2">
                    <span className="w-1 h-1 bg-gold-800 rounded-full" />
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Location */}
          <div>
            <h3 className="font-display font-semibold text-white text-base mb-4">Find Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-saffron-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-warm-300 leading-relaxed">
                  Anand Park Bus Stop, near Sancheti Classes,<br />
                  Wadgaon Sheri, Pune — 411014
                </p>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-saffron-400 flex-shrink-0" />
                <a href="tel:+919876543210" className="text-sm text-warm-300 hover:text-gold-400 transition-colors">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-saffron-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-warm-300">
                  <p>Mon – Sat: 7:00 AM – 10:00 PM</p>
                  <p>Sunday: 7:00 AM – 9:00 PM</p>
                </div>
              </li>
            </ul>

            {/* Delivery zones */}
            <div className="mt-5">
              <p className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-2">Delivery Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {['Kharadi', 'Viman Nagar', 'Sainath Nagar', 'Wadgaon Sheri'].map((area) => (
                  <span key={area} className="text-xs bg-white/10 text-warm-300 px-2 py-1 rounded-lg border border-white/10">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-custom py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-warm-400 text-center sm:text-left">
            © {currentYear} Annada Pure Veg. All rights reserved. Made with ❤️ in Pune.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-warm-400 hover:text-gold-400 transition-colors" aria-label="Instagram">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="text-warm-400 hover:text-gold-400 transition-colors" aria-label="Facebook">
              <Facebook className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
