'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User, LogOut, ChevronDown } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { cn, formatCurrency } from '@/lib/utils';

interface MenuSidebarProps {
  specials: any[];
}

export default function MenuSidebar({ specials }: MenuSidebarProps) {
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);

  const totalItems = useCartStore((s) => s.getTotalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const clearCart = useCartStore((s) => s.clearCart);
  const { user, isAuthenticated, clearUser } = useAuthStore();
  const { items: cartItems, addItem, updateQuantity, removeItem } = useCartStore();

  useEffect(() => {
    if (totalItems > 0) {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 500);
    }
  }, [totalItems]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearCart();
      clearUser();
      setUserMenuOpen(false);
      toast.success('Logged out. See you tomorrow! 🌿');
      router.push('/');
    }
  };

  const handleAddSpecial = (item: any) => {
    if (!item.isAvailable) return;
    addItem({
      _id: item._id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      category: item.category,
    });
    toast.success(`${item.name} added to cart! 🛒`, { duration: 1500 });
  };

  return (
    <div className="hidden lg:flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] sticky top-16 md:top-20 bg-[#E65100] text-white overflow-y-auto overflow-x-hidden relative shadow-[-10px_0_30px_rgba(0,0,0,0.1)] pt-6">

      {/* ── Today's Specials ── */}
      {specials.length > 0 && (
        <div className="px-6 pb-8 flex-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFD700] text-[#3D1000] text-xs font-bold rounded-full mb-4 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Our Special Dishes! 🌟
          </div>

          <div className="flex flex-col gap-4">
            {specials.map((item) => (
              <div key={item._id} className="relative group rounded-3xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-sm p-4 flex flex-col items-center hover:bg-white/10 transition-colors cursor-pointer" onClick={() => handleAddSpecial(item)}>
                {/* Decorative corners */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-white/30 rounded-tl-lg" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-white/30 rounded-tr-lg" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-white/30 rounded-bl-lg" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-white/30 rounded-br-lg" />
                
                <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg border-2 border-white/20 mb-3 bg-white/10">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} width={96} height={96} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
                  )}
                </div>
                
                <h4 className="font-display font-semibold text-sm text-center mb-1">{item.name}</h4>
                <p className="text-[#FFD700] font-bold text-sm">{formatCurrency(item.price)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
