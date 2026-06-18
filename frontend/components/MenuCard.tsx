'use client';

import Image from 'next/image';
import { useState } from 'react';
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
  const { items, addItem, updateQuantity, removeItem } = useCartStore();

  const cartItem = items.find((i) => i._id === item._id);
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

  // Grid layout — thali-style card
  return (
    <div className={cn(
      'card-hover group overflow-hidden flex flex-col',
      item.isTodaySpecial && 'ring-2 ring-gold-800 ring-offset-2 ring-offset-cream',
      !item.isAvailable && 'opacity-60'
    )}>
      {/* Image — thali-style circular crop */}
      <div className="relative p-4 pb-0">
        <div className={cn(
          'relative w-36 h-36 mx-auto rounded-full overflow-hidden bg-warm-200',
          'thali-ring shadow-warm',
          item.isAvailable && 'group-hover:ring-gold-800 group-hover:ring-offset-2 group-hover:ring-offset-ivory'
        )}>
          {!imgError && item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-warm-200 to-warm-300">
              🍽️
            </div>
          )}

          {/* Sold out overlay */}
          {!item.isAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-wide">SOLD OUT</span>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-1">
          <span className="badge-veg">🌿 Pure Veg</span>
          {item.isTodaySpecial && (
            <span className="badge-special">
              <Star className="w-3 h-3 fill-current" /> Today's Special
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 pt-3">
        <h3 className="font-display font-semibold text-espresso text-base text-center mb-1 line-clamp-1">
          {item.name}
        </h3>
        <p className="text-xs text-espresso/60 text-center line-clamp-2 mb-3 flex-1">
          {item.description}
        </p>

        {/* Price + Add button */}
        <div className="flex items-center justify-between mt-auto">
          <p className="font-display font-bold text-saffron-900 text-lg">
            {formatCurrency(item.price)}
          </p>

          {item.isAvailable ? (
            quantity === 0 ? (
              <button
                onClick={handleAdd}
                className="flex items-center gap-1.5 px-3 py-2 bg-saffron-900 text-white text-sm font-bold rounded-xl hover:bg-saffron-800 active:scale-95 transition-all shadow-warm-sm hover:shadow-warm"
              >
                <ShoppingCart className="w-4 h-4" />
                Add
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleDecrement}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-warm-200 hover:bg-warm-300 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5 text-espresso" />
                </button>
                <span className="font-bold text-espresso w-5 text-center">{quantity}</span>
                <button
                  onClick={handleIncrement}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-saffron-900 text-white hover:bg-saffron-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          ) : (
            <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
              Sold Out
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
