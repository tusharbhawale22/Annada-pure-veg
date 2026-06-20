'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingCart, Star } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface MenuCardProps {
  item: {
    _id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl: string;
    isAvailable: boolean;
    isTodaySpecial: boolean;
  };
  layout?: 'grid' | 'list';
}

export default function MenuCard({ item, layout = 'grid' }: MenuCardProps) {
  const [imgError, setImgError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { items, addItem, updateQuantity, removeItem } = useCartStore();

  useEffect(() => { setMounted(true); }, []);

  const cartItem = mounted ? items.find((i) => i._id === item._id) : undefined;
  const quantity = cartItem?.quantity ?? 0;

  const handleAdd = () => {
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

  const handleIncrement = () => updateQuantity(item._id, quantity + 1);
  const handleDecrement = () => {
    if (quantity === 1) {
      removeItem(item._id);
      toast(`${item.name} removed from cart`, { icon: '🗑️', duration: 1500 });
    } else {
      updateQuantity(item._id, quantity - 1);
    }
  };

  if (layout === 'list') {
    return (
      <div className={cn('card flex gap-4 p-4', !item.isAvailable && 'opacity-60')}>
        {/* Image */}
        <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-warm-200">
          {!imgError && item.imageUrl ? (
            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
          )}
          {item.isTodaySpecial && (
            <div className="absolute top-1 left-1 bg-gold-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              ⭐ Special
            </div>
          )}
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-leaf text-xs">🌿</span>
                <h3 className="font-semibold text-espresso text-sm">{item.name}</h3>
              </div>
              <p className="text-xs text-espresso/60 line-clamp-2">{item.description}</p>
            </div>
            <p className="font-bold text-saffron-900 text-sm whitespace-nowrap">{formatCurrency(item.price)}</p>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-espresso/50 font-medium">{item.category}</span>
            {item.isAvailable ? (
              quantity === 0 ? (
                <button onClick={handleAdd} className="flex items-center gap-1 px-3 py-1.5 bg-saffron-900 text-white text-xs font-bold rounded-lg hover:bg-saffron-800 active:scale-95 transition-all">
                  <Plus className="w-3 h-3" /> Add
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={handleDecrement} className="w-7 h-7 flex items-center justify-center rounded-lg bg-warm-200 hover:bg-warm-300 transition-colors">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bold text-sm text-espresso w-4 text-center">{quantity}</span>
                  <button onClick={handleIncrement} className="w-7 h-7 flex items-center justify-center rounded-lg bg-saffron-900 text-white hover:bg-saffron-800 transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              )
            ) : (
              <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-lg">Sold Out</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid layout — UI Revamp
  return (
    <div className={cn(
      'group relative bg-white border-2 rounded-2xl p-4 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
      item.isAvailable ? 'border-[#E65100]/20 hover:border-[#E65100]' : 'border-gray-200 opacity-60'
    )}>
      
      {/* Pure Veg Badge */}
      <div className="absolute top-3 left-3 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 z-10 shadow-sm">
        <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span> Pure Veg
      </div>

      {/* Image */}
      <div className="relative w-full aspect-[4/3] mb-4 rounded-xl overflow-hidden bg-warm-50/50 border border-warm-100 flex items-center justify-center">
        {!imgError && item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            unoptimized={item.imageUrl.includes('.gif')}
            className="object-contain p-2 transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="relative w-20 h-20 opacity-80 animate-float-slow">
            <Image 
              src="https://media.giphy.com/media/VekyF6K0pXm3fIT6aW/giphy.gif" 
              alt="Delicious food" 
              fill 
              unoptimized
              className="object-contain" 
            />
          </div>
        )}
        
        {/* Sold out overlay */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-red-600 font-bold tracking-widest uppercase text-sm border-2 border-red-600 px-3 py-1 rounded-md rotate-[-10deg]">SOLD OUT</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1">
        <h3 className="font-display font-bold text-espresso text-base text-center mb-1 line-clamp-1">
          {item.name}
        </h3>
        
        {/* We hide description in this new card style to keep it clean like the mockup, or make it very small */}
        <div className="flex-1" />

        {/* Price + Add button */}
        <div className="flex items-center justify-between mt-4">
          <p className="font-display font-bold text-[#C84B00] text-lg">
            {formatCurrency(item.price)}
          </p>

          {item.isAvailable && (
            quantity === 0 ? (
              <button
                onClick={handleAdd}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#E65100] text-white text-sm font-bold rounded-xl hover:bg-[#C84B00] active:scale-95 transition-all shadow-md hover:shadow-lg"
              >
                <ShoppingCart className="w-4 h-4" /> Add
              </button>
            ) : (
              <div className="flex items-center gap-1 border-2 border-[#E65100] rounded-xl p-0.5 bg-white">
                <button
                  onClick={handleDecrement}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-warm-100 transition-colors text-[#E65100]"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-[#E65100] w-6 text-center">{quantity}</span>
                <button
                  onClick={handleIncrement}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#E65100] text-white transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
