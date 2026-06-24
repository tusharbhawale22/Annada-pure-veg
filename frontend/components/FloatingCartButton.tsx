'use client';

import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export default function FloatingCartButton() {
  const pathname = usePathname();
  const { getTotalItems, toggleCart, isOpen } = useCartStore();
  const totalItems = getTotalItems();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !pathname) return null;

  const normalizedPath = pathname.toLowerCase();

  // Hide on admin, auth, checkout pages
  if (
    normalizedPath.includes('/admin') ||
    normalizedPath.includes('/auth') ||
    normalizedPath.startsWith('/checkout') ||
    totalItems === 0 ||
    isOpen
  ) return null;

  return (
    <button
      onClick={toggleCart}
      className={cn(
        'fixed bottom-24 right-4 z-30',
        'w-14 h-14 rounded-2xl bg-saffron-gradient text-white',
        'flex items-center justify-center shadow-warm-xl',
        'transition-all duration-200 hover:scale-110 active:scale-95',
        'md:hidden' // Only show on mobile; desktop has navbar cart
      )}
      aria-label={`View cart — ${totalItems} items`}
    >
      <ShoppingCart className="w-6 h-6" />
      <span className="absolute -top-2 -right-2 w-6 h-6 bg-gold-800 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-cream">
        {totalItems > 9 ? '9+' : totalItems}
      </span>
    </button>
  );
}
