'use client';

import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery } from 'react-query';
import { menuApi } from '@/lib/api';

// Fallback images per category in case the DB item has no imageUrl
const CATEGORY_IMAGES: Record<string, string> = {
  'Morning Booster': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=200&h=200',
  'Healthy Tummy': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=200&h=200',
  'Yummy Bites': 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&q=80&w=200&h=200',
  'Pizza': 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=200&h=200',
  'Wrap': 'https://images.unsplash.com/photo-1626700051175-6518c4793fde?auto=format&fit=crop&q=80&w=200&h=200',
  'Maggi': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=200&h=200',
  'Others': 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?auto=format&fit=crop&q=80&w=200&h=200',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=200&h=200';

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  isTodaySpecial?: boolean;
}

export default function HeroFoodCards() {
  const router = useRouter();
  const { items: cartItems, addItem, updateQuantity } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  // Fetch real menu items directly from the database
  const { data: menuData } = useQuery('menu-items-hero', () =>
    menuApi.getItems().then((r) => r.data)
  );

  // Pick today's special items to showcase in the hero
  let items: MenuItem[] = (menuData?.items ?? [])
    .filter((i: MenuItem) => i.isAvailable && i.isTodaySpecial);

  if (items.length === 0) {
    items = (menuData?.items ?? [])
      .filter((i: MenuItem) => i.isAvailable)
      .slice(0, 6);
  } else {
    items = items.slice(0, 6);
  }

  const handleUpdateCart = (e: React.MouseEvent, item: MenuItem, delta: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to order.');
      router.push('/auth/login');
      return;
    }

    const existing = cartItems.find((i) => i._id === item._id);
    const currentQty = existing ? existing.quantity : 0;
    const newQty = currentQty + delta;

    if (newQty > 0) {
      if (existing) {
        updateQuantity(item._id, newQty);
      } else {
        addItem({
          _id: item._id,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl || CATEGORY_IMAGES[item.category] || DEFAULT_IMAGE,
          category: item.category,
        });
        toast.success(`Added ${item.name} to cart!`);
      }
    } else if (newQty === 0 && existing) {
      updateQuantity(item._id, 0);
    }
  };

  // Show skeleton cards while loading
  if (items.length === 0) {
    return (
      <div className="hidden lg:grid grid-cols-2 gap-4 relative">
        <div className="absolute -top-4 -left-4 z-20 bg-yellow-400 text-espresso text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce flex items-center gap-1.5">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Special Dishes ✨
        </div>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex items-center gap-3 animate-pulse"
          >
            <div className="w-14 h-14 rounded-xl bg-white/20 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-white/20 rounded w-3/4" />
              <div className="h-2 bg-white/15 rounded w-1/2" />
              <div className="h-3 bg-white/20 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="hidden lg:grid grid-cols-2 gap-4 relative">
      {/* Floating badge */}
      <div className="absolute -top-4 -left-4 z-20 bg-yellow-400 text-espresso text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce flex items-center gap-1.5">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        Special Dishes ✨
      </div>

      {items.map((item) => {
        const cartItem = cartItems.find((i) => i._id === item._id);
        const qty = cartItem ? cartItem.quantity : 0;
        const imgSrc = item.imageUrl || CATEGORY_IMAGES[item.category] || DEFAULT_IMAGE;

        return (
          <div
            key={item._id}
            className="group relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex items-center justify-between hover:bg-white/20 transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden relative shadow-md flex-shrink-0 bg-warm-200">
                <Image
                  src={imgSrc}
                  alt={item.name}
                  fill
                  sizes="56px"
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div>
                <p className="font-display font-bold text-white text-sm">{item.name}</p>
                <p className="text-white/60 text-[10px] uppercase tracking-wide">{item.category}</p>
                <p className="font-bold text-[#FFD700] text-sm mt-0.5">₹{item.price}</p>
              </div>
            </div>

            {/* Quantity Controller */}
            <div className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-full p-1 text-white text-xs font-semibold mr-1">
              <button
                onClick={(e) => handleUpdateCart(e, item, -1)}
                className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-4 text-center">{qty > 0 ? qty : 1}</span>
              <button
                onClick={(e) => handleUpdateCart(e, item, 1)}
                className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Bottom CTA card */}
      <button
        onClick={() => router.push('/menu')}
        className="col-span-2 mt-2 bg-gradient-to-r from-white/10 to-transparent border border-white/20 rounded-2xl p-4 text-center hover:bg-white/10 transition-all group relative overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform" />
        <p className="text-white font-bold text-sm">
          View Full Menu — 40+ Items ▸
        </p>
      </button>
    </div>
  );
}
